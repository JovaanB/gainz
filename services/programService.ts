// services/programService.ts
import { supabase } from "@/config/supabase";
import { generateUUID } from "@/utils/uuid";

export interface SupabaseWorkoutProgram {
  id: string;
  name: string;
  description: string;
  category:
    | "strength"
    | "muscle_building"
    | "general_fitness"
    | "powerlifting"
    | "bodybuilding";
  level: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  frequency_per_week: number;
  equipment: string[];
  tags: string[];
  estimated_results?: string;
  popularity: number;
  icon: string;
  is_global: boolean;
  created_by?: string;
  visibility: "global" | "personal";
  is_favorite?: boolean;
  session_count?: number;
  sessions?: ProgramSessionDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface ProgramSessionDetail {
  id: string;
  session_key: string; // "push", "pull", "legs"
  name: string;
  description?: string;
  estimated_duration: number;
  rest_between_exercises: number;
  order_index: number;
  week_pattern: string[]; // ["monday", "wednesday", "friday"]
  exercise_count: number;
  exercises: ProgramSessionExercise[];
}

export interface ProgramSessionExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  progression_notes?: string;
  is_bodyweight: boolean;
  weight_percentage?: number;
}

export interface CreateProgramRequest {
  name: string;
  description: string;
  category:
    | "strength"
    | "muscle_building"
    | "general_fitness"
    | "powerlifting"
    | "bodybuilding";
  level: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  frequency_per_week: number;
  equipment: string[];
  tags: string[];
  estimated_results?: string;
  popularity?: number;
  icon: string;
  sessions: {
    session_key: string;
    name: string;
    description?: string;
    estimated_duration: number;
    rest_between_exercises?: number;
    order_index: number;
    week_pattern?: string[];
    exercises: {
      exercise_id: string;
      order_index: number;
      sets: number;
      reps: string;
      rest_seconds?: number;
      notes?: string;
      progression_notes?: string;
      is_bodyweight?: boolean;
      weight_percentage?: number;
    }[];
  }[];
}

export interface UserActiveProgram {
  id: string;
  user_id: string;
  program_id: string;
  program: SupabaseWorkoutProgram;
  started_at: string;
  current_week: number;
  current_session_index: number;
  completed_sessions: string[];
  customizations: any;
  is_active: boolean;
  completed_at?: string;
}

class ProgramService {
  // Récupérer tous les programmes accessibles à l'utilisateur
  async getAccessiblePrograms(): Promise<SupabaseWorkoutProgram[]> {
    try {
      const { data, error } = await supabase.rpc(
        "get_user_accessible_programs"
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching accessible programs:", error);
      return [];
    }
  }

  // Récupérer un programme spécifique avec ses sessions
  async getProgramById(
    programId: string
  ): Promise<SupabaseWorkoutProgram | null> {
    try {
      const { data, error } = await supabase
        .from("workout_programs")
        .select(
          `
          *,
          program_sessions (
            *,
            program_session_exercises (
              *,
              exercises (
                id,
                name
              )
            )
          )
        `
        )
        .eq("id", programId)
        .single();

      if (error) {
        throw error;
      }
      if (!data) {
        return null;
      }

      // Transformer les données pour correspondre à notre interface
      const transformedData = {
        ...data,
        sessions:
          data.program_sessions?.map((session: any) => ({
            id: session.id,
            session_key: session.session_key,
            name: session.name,
            description: session.description,
            estimated_duration: session.estimated_duration,
            rest_between_exercises: session.rest_between_exercises,
            order_index: session.order_index,
            week_pattern: session.week_pattern || [],
            exercise_count: session.program_session_exercises?.length || 0,
            exercises:
              session.program_session_exercises?.map((pse: any) => ({
                id: pse.id,
                exercise_id: pse.exercise_id,
                exercise_name: pse.exercises?.name || "Exercise non trouvé",
                order_index: pse.order_index,
                sets: pse.sets,
                reps: pse.reps,
                rest_seconds: pse.rest_seconds,
                notes: pse.notes,
                progression_notes: pse.progression_notes,
                is_bodyweight: pse.is_bodyweight,
                weight_percentage: pse.weight_percentage,
              })) || [],
          })) || [],
      };

      return transformedData;
    } catch (error) {
      console.error("getProgramById - Erreur:", error);
      return null;
    }
  }

  // Créer un programme personnel
  async createPersonalProgram(
    programData: CreateProgramRequest
  ): Promise<SupabaseWorkoutProgram> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const programId = generateUUID();

      // 1. Créer le programme principal
      const { data: program, error: programError } = await supabase
        .from("workout_programs")
        .insert({
          id: programId,
          name: programData.name,
          description: programData.description,
          category: programData.category,
          level: programData.level,
          duration_weeks: programData.duration_weeks,
          frequency_per_week: programData.frequency_per_week,
          equipment: programData.equipment,
          tags: programData.tags,
          estimated_results: programData.estimated_results,
          popularity: programData.popularity || 0,
          icon: programData.icon,
          is_global: false,
          created_by: session.user.id,
          visibility: "personal",
        })
        .select()
        .single();

      if (programError) throw programError;

      // 2. Créer les sessions
      for (const sessionData of programData.sessions) {
        const sessionId = generateUUID();

        const { error: sessionError } = await supabase
          .from("program_sessions")
          .insert({
            id: sessionId,
            program_id: programId,
            session_key: sessionData.session_key,
            name: sessionData.name,
            description: sessionData.description,
            estimated_duration: sessionData.estimated_duration,
            rest_between_exercises: sessionData.rest_between_exercises || 90,
            order_index: sessionData.order_index,
            week_pattern: sessionData.week_pattern || [],
          });

        if (sessionError) throw sessionError;

        // 3. Créer les exercices de la session
        if (sessionData.exercises.length > 0) {
          const exerciseInserts = sessionData.exercises.map((exercise) => ({
            id: generateUUID(),
            session_id: sessionId,
            exercise_id: exercise.exercise_id,
            order_index: exercise.order_index,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.rest_seconds || 90,
            notes: exercise.notes,
            progression_notes: exercise.progression_notes,
            is_bodyweight: exercise.is_bodyweight || false,
            weight_percentage: exercise.weight_percentage,
          }));

          const { error: exercisesError } = await supabase
            .from("program_session_exercises")
            .insert(exerciseInserts);

          if (exercisesError) throw exercisesError;
        }
      }

      // 4. Récupérer le programme complet
      const completeProgram = await this.getProgramById(programId);
      if (!completeProgram) {
        throw new Error("Failed to retrieve created program");
      }

      return completeProgram;
    } catch (error) {
      console.error("Error creating personal program:", error);
      throw error;
    }
  }

  // Ajouter un programme aux favoris
  async addToFavorites(programId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("user_favorite_programs").insert({
        user_id: session.user.id,
        program_id: programId,
      });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  }

  // Retirer un programme des favoris
  async removeFromFavorites(programId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("user_favorite_programs")
        .delete()
        .eq("user_id", session.user.id)
        .eq("program_id", programId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  }

  // Démarrer un programme (créer une instance active)
  async startProgram(
    programId: string,
    customizations: any = {}
  ): Promise<UserActiveProgram> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // Vérifier qu'il n'y a pas déjà un programme actif
      const { data: existingActive } = await supabase
        .from("user_active_programs")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .single();

      if (existingActive) {
        throw new Error(
          "User already has an active program. Stop the current program first."
        );
      }

      // Créer le programme actif
      const { data: activeProgram, error } = await supabase
        .from("user_active_programs")
        .insert({
          user_id: session.user.id,
          program_id: programId,
          current_week: 1,
          current_session_index: 0,
          completed_sessions: [],
          customizations,
          is_active: true,
        })
        .select(
          `
          *,
          workout_programs (*)
        `
        )
        .single();

      if (error) throw error;
      return activeProgram;
    } catch (error) {
      console.error("Error starting program:", error);
      throw error;
    }
  }

  // Arrêter un programme actif
  async stopProgram(): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("user_active_programs")
        .update({
          is_active: false,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)
        .eq("is_active", true);

      if (error) throw error;
    } catch (error) {
      console.error("Error stopping program:", error);
      throw error;
    }
  }

  // Récupérer le programme actif de l'utilisateur
  async getActiveProgram(): Promise<UserActiveProgram | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from("user_active_programs")
        .select(
          `
          *,
          workout_programs (*)
        `
        )
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error fetching active program:", error);
      return null;
    }
  }

  // Marquer une session comme terminée
  async completeSession(
    userProgramId: string,
    sessionId: string,
    workoutId: string,
    sessionData: any
  ): Promise<void> {
    try {
      // Enregistrer l'historique
      const { error: historyError } = await supabase
        .from("user_program_history")
        .insert({
          user_program_id: userProgramId,
          session_id: sessionId,
          workout_id: workoutId,
          duration_seconds: sessionData.duration_seconds,
          notes: sessionData.notes,
          session_data: sessionData,
        });

      if (historyError) throw historyError;

      // Mettre à jour le programme actif
      const { data: currentProgram } = await supabase
        .from("user_active_programs")
        .select("completed_sessions, current_session_index")
        .eq("id", userProgramId)
        .single();

      if (currentProgram) {
        const updatedCompletedSessions = [
          ...currentProgram.completed_sessions,
          sessionId,
        ];

        const { error: updateError } = await supabase
          .from("user_active_programs")
          .update({
            completed_sessions: updatedCompletedSessions,
            current_session_index: currentProgram.current_session_index + 1,
          })
          .eq("id", userProgramId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error completing session:", error);
      throw error;
    }
  }

  // Rechercher des programmes
  async searchPrograms(query: string): Promise<SupabaseWorkoutProgram[]> {
    try {
      const programs = await this.getAccessiblePrograms();

      // Filtrer côté client pour plus de flexibilité
      return programs.filter(
        (program) =>
          program.name.toLowerCase().includes(query.toLowerCase()) ||
          program.description?.toLowerCase().includes(query.toLowerCase()) ||
          program.tags.some((tag) =>
            tag.toLowerCase().includes(query.toLowerCase())
          ) ||
          program.category.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching programs:", error);
      return [];
    }
  }

  // Récupérer les programmes par catégorie
  async getProgramsByCategory(
    category:
      | "strength"
      | "muscle_building"
      | "general_fitness"
      | "powerlifting"
      | "bodybuilding"
  ): Promise<SupabaseWorkoutProgram[]> {
    try {
      const programs = await this.getAccessiblePrograms();
      return programs.filter((program) => program.category === category);
    } catch (error) {
      console.error("Error fetching programs by category:", error);
      return [];
    }
  }

  // Récupérer les programmes par niveau
  async getProgramsByLevel(
    level: "beginner" | "intermediate" | "advanced"
  ): Promise<SupabaseWorkoutProgram[]> {
    try {
      const programs = await this.getAccessiblePrograms();
      return programs.filter((program) => program.level === level);
    } catch (error) {
      console.error("Error fetching programs by level:", error);
      return [];
    }
  }

  // Récupérer les programmes favoris de l'utilisateur
  async getFavoritePrograms(): Promise<SupabaseWorkoutProgram[]> {
    try {
      const programs = await this.getAccessiblePrograms();
      return programs.filter((program) => program.is_favorite);
    } catch (error) {
      console.error("Error fetching favorite programs:", error);
      return [];
    }
  }

  // Dupliquer un programme global en programme personnel
  async duplicateProgram(
    programId: string,
    newName?: string
  ): Promise<SupabaseWorkoutProgram> {
    try {
      const originalProgram = await this.getProgramById(programId);
      if (!originalProgram) {
        throw new Error("Program not found");
      }

      const duplicatedProgram: CreateProgramRequest = {
        name: newName || `${originalProgram.name} (Copie)`,
        description: originalProgram.description || "",
        category: originalProgram.category,
        level: originalProgram.level,
        duration_weeks: originalProgram.duration_weeks,
        frequency_per_week: originalProgram.frequency_per_week,
        equipment: [...originalProgram.equipment],
        tags: [...originalProgram.tags],
        estimated_results: originalProgram.estimated_results,
        popularity: 0, // Les copies n'héritent pas de la popularité
        icon: originalProgram.icon,
        sessions:
          originalProgram.sessions?.map((session) => ({
            session_key: session.session_key,
            name: session.name,
            description: session.description,
            estimated_duration: session.estimated_duration,
            rest_between_exercises: session.rest_between_exercises,
            order_index: session.order_index,
            week_pattern: [...session.week_pattern],
            exercises: session.exercises.map((exercise) => ({
              exercise_id: exercise.exercise_id,
              order_index: exercise.order_index,
              sets: exercise.sets,
              reps: exercise.reps,
              rest_seconds: exercise.rest_seconds,
              notes: exercise.notes,
              progression_notes: exercise.progression_notes,
              is_bodyweight: exercise.is_bodyweight,
              weight_percentage: exercise.weight_percentage,
            })),
          })) || [],
      };

      return await this.createPersonalProgram(duplicatedProgram);
    } catch (error) {
      console.error("Error duplicating program:", error);
      throw error;
    }
  }

  // Supprimer un programme personnel
  async deletePersonalProgram(programId: string): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("workout_programs")
        .delete()
        .eq("id", programId)
        .eq("created_by", session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting personal program:", error);
      throw error;
    }
  }

  // Mettre à jour un programme personnel
  async updatePersonalProgram(
    programId: string,
    updates: Partial<CreateProgramRequest>
  ): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // 1. Mettre à jour le programme principal
      const { error: programError } = await supabase
        .from("workout_programs")
        .update({
          name: updates.name,
          description: updates.description,
          category: updates.category,
          level: updates.level,
          duration_weeks: updates.duration_weeks,
          frequency_per_week: updates.frequency_per_week,
          equipment: updates.equipment,
          tags: updates.tags,
          estimated_results: updates.estimated_results,
          icon: updates.icon,
        })
        .eq("id", programId)
        .eq("created_by", session.user.id);

      if (programError) throw programError;

      // 2. Si des sessions sont fournies, les remplacer complètement
      if (updates.sessions) {
        // Supprimer les anciennes sessions (cascade supprimera les exercices)
        const { error: deleteError } = await supabase
          .from("program_sessions")
          .delete()
          .eq("program_id", programId);

        if (deleteError) throw deleteError;

        // Recréer les sessions
        for (const sessionData of updates.sessions) {
          const sessionId = generateUUID();

          const { error: sessionError } = await supabase
            .from("program_sessions")
            .insert({
              id: sessionId,
              program_id: programId,
              session_key: sessionData.session_key,
              name: sessionData.name,
              description: sessionData.description,
              estimated_duration: sessionData.estimated_duration,
              rest_between_exercises: sessionData.rest_between_exercises || 90,
              order_index: sessionData.order_index,
              week_pattern: sessionData.week_pattern || [],
            });

          if (sessionError) throw sessionError;

          // Créer les exercices de la session
          if (sessionData.exercises.length > 0) {
            const exerciseInserts = sessionData.exercises.map((exercise) => ({
              id: generateUUID(),
              session_id: sessionId,
              exercise_id: exercise.exercise_id,
              order_index: exercise.order_index,
              sets: exercise.sets,
              reps: exercise.reps,
              rest_seconds: exercise.rest_seconds || 90,
              notes: exercise.notes,
              progression_notes: exercise.progression_notes,
              is_bodyweight: exercise.is_bodyweight || false,
              weight_percentage: exercise.weight_percentage,
            }));

            const { error: exercisesError } = await supabase
              .from("program_session_exercises")
              .insert(exerciseInserts);

            if (exercisesError) throw exercisesError;
          }
        }
      }
    } catch (error) {
      console.error("Error updating personal program:", error);
      throw error;
    }
  }

  // Obtenir les statistiques d'un programme
  async getProgramStats(programId: string): Promise<{
    totalUsers: number;
    avgCompletionRate: number;
    avgDuration: number;
    totalCompletions: number;
  }> {
    try {
      // Cette fonction nécessiterait des requêtes plus complexes
      // Pour l'instant, retourner des valeurs par défaut
      return {
        totalUsers: 0,
        avgCompletionRate: 0,
        avgDuration: 0,
        totalCompletions: 0,
      };
    } catch (error) {
      console.error("Error fetching program stats:", error);
      return {
        totalUsers: 0,
        avgCompletionRate: 0,
        avgDuration: 0,
        totalCompletions: 0,
      };
    }
  }
}

export const programService = new ProgramService();
