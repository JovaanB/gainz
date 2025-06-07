// services/exerciseService.ts
import { supabase } from "@/config/supabase";
import { Exercise } from "@/types";
import { generateUUID } from "@/utils/uuid";

export interface ExerciseWithSource extends Exercise {
  created_by?: string;
  is_global: boolean;
  visibility: "global" | "personal";
  source_type?: string;
}

class ExerciseService {
  // Récupérer tous les exercices accessibles à l'utilisateur
  async getAccessibleExercises(): Promise<ExerciseWithSource[]> {
    try {
      const { data, error } = await supabase
        .from("user_accessible_exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching accessible exercises:", error);
      return [];
    }
  }

  // Créer un exercice personnel
  async createPersonalExercise(
    exercise: Omit<Exercise, "id">
  ): Promise<ExerciseWithSource> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const newExercise = {
        id: generateUUID(),
        ...exercise,
        created_by: session.user.id,
        is_global: false,
        visibility: "personal" as const,
      };

      const { data, error } = await supabase
        .from("exercises")
        .insert(newExercise)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating personal exercise:", error);
      throw error;
    }
  }

  // Modifier un exercice personnel
  async updatePersonalExercise(
    exerciseId: string,
    updates: Partial<Exercise>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("exercises")
        .update(updates)
        .eq("id", exerciseId)
        .eq(
          "created_by",
          (
            await supabase.auth.getSession()
          ).data.session?.user?.id
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error updating personal exercise:", error);
      throw error;
    }
  }

  // Supprimer un exercice personnel
  async deletePersonalExercise(exerciseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId)
        .eq(
          "created_by",
          (
            await supabase.auth.getSession()
          ).data.session?.user?.id
        );

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting personal exercise:", error);
      throw error;
    }
  }

  // Rechercher des exercices
  async searchExercises(query: string): Promise<ExerciseWithSource[]> {
    try {
      const { data, error } = await supabase
        .from("user_accessible_exercises")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("is_global", { ascending: false }) // Exercices globaux en premier
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching exercises:", error);
      return [];
    }
  }

  // Trouver ou créer un exercice par nom
  // Trouver ou créer un exercice par nom
  async findOrCreateExercise(
    exercise: Omit<Exercise, "id">
  ): Promise<ExerciseWithSource> {
    try {
      // Utiliser la fonction SQL
      const { data: exerciseId, error } = await supabase.rpc(
        "get_or_create_exercise",
        {
          exercise_name: exercise.name.trim(),
          exercise_category: exercise.category || "strength",
          exercise_is_bodyweight: exercise.is_bodyweight || false,
          exercise_muscle_groups: exercise.muscle_groups || [],
          exercise_suggested_weight: exercise.suggested_weight,
          exercise_rest_seconds: exercise.rest_seconds,
          exercise_notes: exercise.notes,
          exercise_progression_notes: exercise.progression_notes,
        }
      );

      if (error) throw error;

      // Récupérer l'exercice complet
      const fullExercise = await this.getExerciseById(exerciseId);
      if (!fullExercise) {
        throw new Error("Exercise not found after creation");
      }

      return fullExercise;
    } catch (error) {
      console.error("Error finding or creating exercise:", error);
      throw error;
    }
  }

  // Nouvelle méthode helper
  private async getExerciseById(
    id: string
  ): Promise<ExerciseWithSource | null> {
    try {
      const { data, error } = await supabase
        .from("user_accessible_exercises")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  // Recherche exacte par nom
  async findExerciseByExactName(
    id: string
  ): Promise<ExerciseWithSource | null> {
    try {
      const { data, error } = await supabase
        .from("user_accessible_exercises")
        .select("*")
        .eq("id", id) // Correspondance exacte
        .order("is_global", { ascending: false }) // Priorité aux globaux
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }
}

export const exerciseService = new ExerciseService();
