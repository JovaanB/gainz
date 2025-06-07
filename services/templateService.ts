// services/templateService.ts
import { supabase } from "@/config/supabase";
import { generateUUID } from "@/utils/uuid";

export interface SupabaseWorkoutTemplate {
  id: string;
  name: string;
  description: string;
  estimated_duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscle_groups: string[];
  icon: string;
  is_global: boolean;
  created_by?: string;
  visibility: "global" | "personal";
  is_favorite?: boolean;
  exercise_count?: number;
  exercises?: TemplateExerciseDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface TemplateExerciseDetail {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  suggested_sets: number;
  suggested_reps?: string;
  suggested_weight_percentage?: number;
  rest_seconds: number;
  notes?: string;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  estimated_duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscle_groups: string[];
  icon: string;
  exercises: {
    exercise_id: string;
    order_index: number;
    suggested_sets: number;
    suggested_reps?: string;
    suggested_weight_percentage?: number;
    rest_seconds?: number;
    notes?: string;
  }[];
}

class TemplateService {
  // Récupérer tous les templates accessibles à l'utilisateur
  async getAccessibleTemplates(): Promise<SupabaseWorkoutTemplate[]> {
    try {
      const { data, error } = await supabase.rpc(
        "get_user_accessible_templates_v2"
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching accessible templates:", error);
      return [];
    }
  }

  // Récupérer un template spécifique avec ses exercices
  async getTemplateById(
    templateId: string
  ): Promise<SupabaseWorkoutTemplate | null> {
    try {
      const { data, error } = await supabase
        .from("workout_templates")
        .select(
          `
          *,
          template_exercises (
            *,
            exercises (
              id,
              name
            )
          )
        `
        )
        .eq("id", templateId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Transformer les données pour correspondre à notre interface
      return {
        ...data,
        exercises:
          data.template_exercises?.map((te: any) => ({
            id: te.id,
            exercise_id: te.exercise_id,
            exercise_name: te.exercises.name,
            order_index: te.order_index,
            suggested_sets: te.suggested_sets,
            suggested_reps: te.suggested_reps,
            suggested_weight_percentage: te.suggested_weight_percentage,
            rest_seconds: te.rest_seconds,
            notes: te.notes,
          })) || [],
      };
    } catch (error) {
      console.error("Error fetching template by ID:", error);
      return null;
    }
  }

  // Créer un template personnel
  async createPersonalTemplate(
    templateData: CreateTemplateRequest
  ): Promise<SupabaseWorkoutTemplate> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const templateId = generateUUID();

      // 1. Créer le template principal
      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          id: templateId,
          name: templateData.name,
          description: templateData.description,
          estimated_duration: templateData.estimated_duration,
          difficulty: templateData.difficulty,
          muscle_groups: templateData.muscle_groups,
          icon: templateData.icon,
          is_global: false,
          created_by: session.user.id,
          visibility: "personal",
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 2. Ajouter les exercices du template
      if (templateData.exercises.length > 0) {
        const exerciseInserts = templateData.exercises.map((exercise) => ({
          id: generateUUID(),
          template_id: templateId,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index,
          suggested_sets: exercise.suggested_sets,
          suggested_reps: exercise.suggested_reps,
          suggested_weight_percentage: exercise.suggested_weight_percentage,
          rest_seconds: exercise.rest_seconds || 90,
          notes: exercise.notes,
        }));

        const { error: exercisesError } = await supabase
          .from("template_exercises")
          .insert(exerciseInserts);

        if (exercisesError) throw exercisesError;
      }

      // 3. Récupérer le template complet
      const completeTemplate = await this.getTemplateById(templateId);
      if (!completeTemplate) {
        throw new Error("Failed to retrieve created template");
      }

      return completeTemplate;
    } catch (error) {
      console.error("Error creating personal template:", error);
      throw error;
    }
  }

  // Mettre à jour un template personnel
  async updatePersonalTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>
  ): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // 1. Mettre à jour le template principal
      const { error: templateError } = await supabase
        .from("workout_templates")
        .update({
          name: updates.name,
          description: updates.description,
          estimated_duration: updates.estimated_duration,
          difficulty: updates.difficulty,
          muscle_groups: updates.muscle_groups,
          icon: updates.icon,
        })
        .eq("id", templateId)
        .eq("created_by", session.user.id);

      if (templateError) throw templateError;

      // 2. Si des exercices sont fournis, les remplacer
      if (updates.exercises) {
        // Supprimer les anciens exercices
        const { error: deleteError } = await supabase
          .from("template_exercises")
          .delete()
          .eq("template_id", templateId);

        if (deleteError) throw deleteError;

        // Ajouter les nouveaux exercices
        if (updates.exercises.length > 0) {
          const exerciseInserts = updates.exercises.map((exercise) => ({
            id: generateUUID(),
            template_id: templateId,
            exercise_id: exercise.exercise_id,
            order_index: exercise.order_index,
            suggested_sets: exercise.suggested_sets,
            suggested_reps: exercise.suggested_reps,
            suggested_weight_percentage: exercise.suggested_weight_percentage,
            rest_seconds: exercise.rest_seconds || 90,
            notes: exercise.notes,
          }));

          const { error: exercisesError } = await supabase
            .from("template_exercises")
            .insert(exerciseInserts);

          if (exercisesError) throw exercisesError;
        }
      }
    } catch (error) {
      console.error("Error updating personal template:", error);
      throw error;
    }
  }

  // Supprimer un template personnel
  async deletePersonalTemplate(templateId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("workout_templates")
        .delete()
        .eq("id", templateId)
        .eq("created_by", session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting personal template:", error);
      throw error;
    }
  }

  // Ajouter un template aux favoris
  async addToFavorites(templateId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("user_favorite_templates").insert({
        user_id: session.user.id,
        template_id: templateId,
      });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  }

  // Retirer un template des favoris
  async removeFromFavorites(templateId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("user_favorite_templates")
        .delete()
        .eq("user_id", session.user.id)
        .eq("template_id", templateId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  }

  // Rechercher des templates
  async searchTemplates(query: string): Promise<SupabaseWorkoutTemplate[]> {
    try {
      const { data, error } = await supabase.rpc(
        "get_user_accessible_templates"
      );

      if (error) throw error;

      // Filtrer côté client pour plus de flexibilité
      return (data || []).filter(
        (template: SupabaseWorkoutTemplate) =>
          template.name.toLowerCase().includes(query.toLowerCase()) ||
          template.description?.toLowerCase().includes(query.toLowerCase()) ||
          template.muscle_groups.some((mg) =>
            mg.toLowerCase().includes(query.toLowerCase())
          )
      );
    } catch (error) {
      console.error("Error searching templates:", error);
      return [];
    }
  }

  // Récupérer les templates par difficulté
  async getTemplatesByDifficulty(
    difficulty: "beginner" | "intermediate" | "advanced"
  ): Promise<SupabaseWorkoutTemplate[]> {
    try {
      const templates = await this.getAccessibleTemplates();
      return templates.filter((template) => template.difficulty === difficulty);
    } catch (error) {
      console.error("Error fetching templates by difficulty:", error);
      return [];
    }
  }

  // Récupérer les templates favoris de l'utilisateur
  async getFavoriteTemplates(): Promise<SupabaseWorkoutTemplate[]> {
    try {
      const templates = await this.getAccessibleTemplates();
      return templates.filter((template) => template.is_favorite);
    } catch (error) {
      console.error("Error fetching favorite templates:", error);
      return [];
    }
  }

  // Dupliquer un template global en template personnel
  async duplicateTemplate(
    templateId: string,
    newName?: string
  ): Promise<SupabaseWorkoutTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(templateId);
      if (!originalTemplate) {
        throw new Error("Template not found");
      }

      const duplicatedTemplate: CreateTemplateRequest = {
        name: newName || `${originalTemplate.name} (Copie)`,
        description: originalTemplate.description || "",
        estimated_duration: originalTemplate.estimated_duration,
        difficulty: originalTemplate.difficulty,
        muscle_groups: [...originalTemplate.muscle_groups],
        icon: originalTemplate.icon,
        exercises:
          originalTemplate.exercises?.map((ex) => ({
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
            suggested_sets: ex.suggested_sets,
            suggested_reps: ex.suggested_reps,
            suggested_weight_percentage: ex.suggested_weight_percentage,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
          })) || [],
      };

      return await this.createPersonalTemplate(duplicatedTemplate);
    } catch (error) {
      console.error("Error duplicating template:", error);
      throw error;
    }
  }
}

export const templateService = new TemplateService();
