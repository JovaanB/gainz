// services/hybridStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { Workout, WorkoutExercise } from "@/types";
import NetInfo from "@react-native-community/netinfo";
import { generateUUID, isValidUUID } from "@/utils/uuid";

interface SyncStatus {
  workout_id: string;
  synced: boolean;
  last_sync_attempt: number;
  retry_count: number;
}

class HybridStorageService {
  private syncQueue: string[] = [];
  private isOnline = true;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Si on revient online, traiter la queue
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  // === WORKOUTS ===

  async saveWorkout(workout: Workout): Promise<void> {
    try {
      // 1. Toujours sauvegarder en local d'abord (priorité à la UX)
      await this.saveWorkoutLocal(workout);

      // 2. Essayer de sync avec Supabase si online
      if (this.isOnline) {
        await this.syncWorkoutToCloudWithRetry(workout);
      } else {
        // Ajouter à la queue de sync
        await this.addToSyncQueue(workout.id);
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      // En cas d'erreur, au moins on a la sauvegarde locale
    }
  }

  private async saveWorkoutLocal(workout: Workout): Promise<void> {
    await AsyncStorage.setItem(
      `workout_${workout.id}`,
      JSON.stringify(workout)
    );

    // Maintenir un index des workouts
    const workoutIds = await this.getWorkoutIds();
    if (!workoutIds.includes(workout.id)) {
      workoutIds.push(workout.id);
      await AsyncStorage.setItem("workout_ids", JSON.stringify(workoutIds));
    }
  }

  private async syncWorkoutToCloud(workout: Workout): Promise<void> {
    try {
      // Vérifier qu'on a une session Supabase valide
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        await this.markWorkoutAsSynced(workout.id, false);
        return;
      }

      // Récupérer l'utilisateur depuis la session Supabase
      const user = session.user;
      if (!user) {
        await this.markWorkoutAsSynced(workout.id, false);
        return;
      }

      // Vérifier que les IDs sont des UUIDs valides
      if (!isValidUUID(workout.id)) {
        throw new Error("Workout ID must be a valid UUID");
      }

      // 1. Sauvegarder le workout principal
      const { error: workoutError } = await supabase.from("workouts").upsert({
        id: workout.id,
        name: workout.name,
        date: workout.date,
        started_at: workout.started_at,
        finished_at: workout.finished_at,
        completed: workout.completed,
        user_id: user.id, // Utiliser l'ID de la session Supabase
        is_template: workout.is_template,
        template_id: workout.template_id,
        template_session_id: workout.template_session_id,
        updated_at: new Date().toISOString(),
      });

      if (workoutError) throw workoutError;

      // 2. Sauvegarder les exercices et sets
      for (const workoutExercise of workout.exercises) {
        await this.syncWorkoutExerciseToCloud(workout.id, workoutExercise);
      }

      // 3. Marquer comme synced
      await this.markWorkoutAsSynced(workout.id, true);
    } catch (error) {
      console.error("Error syncing workout to cloud:", error);
      await this.markWorkoutAsSynced(workout.id, false);
      await this.addToSyncQueue(workout.id);
    }
  }

  private async syncWorkoutExerciseToCloud(
    workoutId: string,
    workoutExercise: WorkoutExercise
  ): Promise<void> {
    // Vérifier et corriger les IDs non-UUID
    if (!isValidUUID(workoutExercise.id)) {
      workoutExercise.id = generateUUID();
    }

    let finalExerciseId: string;

    try {
      console.log(
        "Looking for exercise by name:",
        workoutExercise.exercise.name
      );

      // Utiliser la fonction SQL pour trouver ou créer l'exercice
      const { data, error } = await supabase.rpc("get_or_create_exercise", {
        exercise_name: workoutExercise.exercise.name.trim(),
        exercise_category: workoutExercise.exercise.category || "strength",
        exercise_is_bodyweight: workoutExercise.exercise.is_bodyweight || false,
        exercise_muscle_groups: workoutExercise.exercise.muscle_groups || [],
        exercise_suggested_weight: workoutExercise.exercise.suggested_weight,
        exercise_rest_seconds: workoutExercise.exercise.rest_seconds,
        exercise_notes: workoutExercise.exercise.notes,
        exercise_progression_notes: workoutExercise.exercise.progression_notes,
      });

      if (error) {
        console.error("Error in get_or_create_exercise:", error);
        throw error;
      }

      finalExerciseId = data;
      console.log("Exercise resolved with ID:", finalExerciseId);
    } catch (error) {
      console.error("Error in exercise lookup/creation:", error);
      throw error;
    }

    // Créer la liaison workout-exercise
    try {
      console.log("Creating workout-exercise relation");

      const { error: workoutExerciseError } = await supabase
        .from("workout_exercises")
        .upsert({
          id: workoutExercise.id,
          workout_id: workoutId,
          exercise_id: finalExerciseId,
          completed: workoutExercise.completed,
          order_index: workoutExercise.order_index,
          notes: workoutExercise.notes,
          updated_at: new Date().toISOString(),
        });

      if (workoutExerciseError) {
        console.error(
          "Error creating workout-exercise relation:",
          workoutExerciseError
        );
        throw workoutExerciseError;
      }

      console.log("Workout-exercise relation created successfully");
    } catch (error) {
      console.error("Failed to create workout-exercise relation:", error);
      throw error;
    }

    // Créer les sets
    console.log("Creating sets for workout-exercise:", workoutExercise.id);

    for (let i = 0; i < workoutExercise.sets.length; i++) {
      const set = workoutExercise.sets[i];
      const setId = generateUUID();

      try {
        const { error: setError } = await supabase.from("workout_sets").upsert({
          id: setId,
          workout_exercise_id: workoutExercise.id,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
          duration_seconds: set.duration_seconds,
          distance_km: set.distance_km,
          rest_seconds: set.rest_seconds,
          set_order: i,
          updated_at: new Date().toISOString(),
        });

        if (setError) {
          console.error(`Error creating set ${i}:`, setError);
          throw setError;
        }
      } catch (error) {
        console.error(`Failed to create set ${i}:`, error);
        throw error;
      }
    }

    console.log("All sets created successfully");
  }

  async getWorkouts(): Promise<Workout[]> {
    try {
      try {
        await this.migrateOldWorkoutIds();
        await this.migrateExerciseIds();
      } catch (error) {
        console.error("Error getting workouts:", error);
        return [];
      }

      if (this.isOnline) {
        try {
          const cloudWorkouts = await this.getCloudWorkouts();
          return cloudWorkouts;
        } catch (error) {
          console.error("Error fetching cloud workouts:", error);
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error("Error getting workouts:", error);
      return [];
    }
  }

  private async getCloudWorkouts(): Promise<Workout[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        return [];
      }

      const { data: workouts, error } = await supabase
        .from("workouts")
        .select(
          `
          *,
          workout_exercises (
            *,
            exercises (*),
            workout_sets (*)
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      return workouts.map(this.transformSupabaseToWorkout);
    } catch (error) {
      console.error("Error fetching cloud workouts:", error);
      return [];
    }
  }

  private async getLocalWorkouts(): Promise<Workout[]> {
    const workoutIds = await this.getWorkoutIds();
    const workouts: Workout[] = [];

    for (const id of workoutIds) {
      const workoutData = await AsyncStorage.getItem(`workout_${id}`);
      if (workoutData) {
        workouts.push(JSON.parse(workoutData));
      }
    }

    return workouts.sort((a, b) => b.date - a.date);
  }

  private transformSupabaseToWorkout(supabaseWorkout: any): Workout {
    return {
      id: supabaseWorkout.id,
      name: supabaseWorkout.name,
      date: supabaseWorkout.date,
      started_at: supabaseWorkout.started_at,
      finished_at: supabaseWorkout.finished_at,
      completed: supabaseWorkout.completed,
      user_id: supabaseWorkout.user_id,
      is_template: supabaseWorkout.is_template,
      template_id: supabaseWorkout.template_id,
      template_session_id: supabaseWorkout.template_session_id,
      exercises: supabaseWorkout.workout_exercises.map((we: any) => ({
        id: we.id,
        exercise: we.exercises,
        sets: we.workout_sets
          .sort((a: any, b: any) => a.set_order - b.set_order)
          .map((set: any) => ({
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
            duration_seconds: set.duration_seconds,
            distance_km: set.distance_km,
            rest_seconds: set.rest_seconds,
          })),
        completed: we.completed,
        order_index: we.order_index,
        notes: we.notes,
      })),
    };
  }

  private mergeWorkouts(local: Workout[], cloud: Workout[]): Workout[] {
    const merged = new Map<string, Workout>();

    local.forEach((workout) => merged.set(workout.id, workout));

    cloud.forEach((cloudWorkout) => {
      const localWorkout = merged.get(cloudWorkout.id);

      if (!localWorkout) {
        merged.set(cloudWorkout.id, cloudWorkout);
        this.saveWorkoutLocal(cloudWorkout);
      } else {
        const cloudUpdated = new Date(cloudWorkout.finished_at || 0).getTime();
        const localUpdated =
          localWorkout.finished_at || localWorkout.started_at;

        if (cloudUpdated > localUpdated) {
          merged.set(cloudWorkout.id, cloudWorkout);
          this.saveWorkoutLocal(cloudWorkout);
        }
      }
    });

    return Array.from(merged.values()).sort((a, b) => b.date - a.date);
  }
  // === SYNC QUEUE MANAGEMENT ===

  private async addToSyncQueue(workoutId: string): Promise<void> {
    if (!this.syncQueue.includes(workoutId)) {
      this.syncQueue.push(workoutId);
      await AsyncStorage.setItem("sync_queue", JSON.stringify(this.syncQueue));
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;

    try {
      const queueData = await AsyncStorage.getItem("sync_queue");
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }

      // Traiter seulement 3 workouts à la fois pour éviter la surcharge
      const batchSize = 3;
      let successCount = 0;
      let failureCount = 0;

      while (
        this.syncQueue.length > 0 &&
        this.isOnline &&
        successCount < batchSize
      ) {
        const workoutId = this.syncQueue[0];

        try {
          const workoutData = await AsyncStorage.getItem(
            `workout_${workoutId}`
          );
          if (workoutData) {
            const workout: Workout = JSON.parse(workoutData);
            await this.syncWorkoutToCloudWithRetry(workout);
            successCount++;
          }

          // Supprimer de la queue après succès
          this.syncQueue.shift();
          await AsyncStorage.setItem(
            "sync_queue",
            JSON.stringify(this.syncQueue)
          );
        } catch (error) {
          console.error(`Error syncing workout ${workoutId}:`, error);
          failureCount++;

          // Déplacer le workout échoué à la fin de la queue
          const failedWorkout = this.syncQueue.shift();
          if (failedWorkout) {
            this.syncQueue.push(failedWorkout);
          }

          // Arrêter après 3 échecs consécutifs
          if (failureCount >= 3) {
            console.log("Too many sync failures, stopping batch");
            break;
          }
        }
      }

      console.log(
        `Sync batch completed: ${successCount} synced, ${failureCount} failed`
      );
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncWorkoutToCloudWithRetry(
    workout: Workout,
    retryCount = 0
  ): Promise<void> {
    try {
      await this.syncWorkoutToCloud(workout);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(
          `Retrying sync for workout ${workout.id}, attempt ${retryCount + 1}`
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.syncWorkoutToCloudWithRetry(workout, retryCount + 1);
      }
      throw error;
    }
  }

  private async markWorkoutAsSynced(
    workoutId: string,
    synced: boolean = true
  ): Promise<void> {
    const syncStatus: SyncStatus = {
      workout_id: workoutId,
      synced,
      last_sync_attempt: Date.now(),
      retry_count: 0,
    };
    await AsyncStorage.setItem(
      `sync_status_${workoutId}`,
      JSON.stringify(syncStatus)
    );
  }

  private async getWorkoutIds(): Promise<string[]> {
    const idsData = await AsyncStorage.getItem("workout_ids");
    return idsData ? JSON.parse(idsData) : [];
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      // 1. Supprimer en local
      await AsyncStorage.removeItem(`workout_${workoutId}`);

      // Mettre à jour l'index
      const workoutIds = await this.getWorkoutIds();
      const updatedIds = workoutIds.filter((id) => id !== workoutId);
      await AsyncStorage.setItem("workout_ids", JSON.stringify(updatedIds));

      // 2. Supprimer du cloud si on a une session valide
      if (this.isOnline) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && session.user) {
          const { error } = await supabase
            .from("workouts")
            .delete()
            .eq("id", workoutId)
            .eq("user_id", session.user.id);

          if (error) {
            console.error("Error deleting workout from cloud:", error);
          }
        }
      }

      // 3. Nettoyer le statut de sync
      await AsyncStorage.removeItem(`sync_status_${workoutId}`);
    } catch (error) {
      console.error("Error deleting workout:", error);
      throw error;
    }
  }

  private async migrateExerciseIds(): Promise<void> {
    try {
      const workoutIds = await this.getWorkoutIds();

      for (const workoutId of workoutIds) {
        const workoutData = await AsyncStorage.getItem(`workout_${workoutId}`);
        if (workoutData) {
          const workout = JSON.parse(workoutData);
          let hasChanges = false;

          // Corriger les IDs des exercices
          workout.exercises = workout.exercises.map((workoutExercise: any) => {
            if (!isValidUUID(workoutExercise.exercise.id)) {
              // Générer un UUID pour l'exercice
              const newExerciseId = generateUUID();

              workoutExercise.exercise.id = newExerciseId;
              hasChanges = true;
            }

            if (!isValidUUID(workoutExercise.id)) {
              workoutExercise.id = generateUUID();
              hasChanges = true;
            }

            return workoutExercise;
          });

          // Sauvegarder si des changements ont été faits
          if (hasChanges) {
            await AsyncStorage.setItem(
              `workout_${workoutId}`,
              JSON.stringify(workout)
            );
            // Marquer pour re-sync
            await AsyncStorage.removeItem(`sync_status_${workoutId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error migrating exercise IDs:", error);
    }
  }

  private async migrateOldWorkoutIds(): Promise<void> {
    try {
      const workoutIds = await this.getWorkoutIds();
      const migratedIds: string[] = [];

      for (const oldId of workoutIds) {
        if (!isValidUUID(oldId)) {
          const workoutData = await AsyncStorage.getItem(`workout_${oldId}`);
          if (workoutData) {
            const workout = JSON.parse(workoutData);
            const newId = generateUUID();

            // Créer le workout avec le nouvel ID
            const migratedWorkout = {
              ...workout,
              id: newId,
              exercises: workout.exercises.map((ex: any) => ({
                ...ex,
                id: isValidUUID(ex.id) ? ex.id : generateUUID(),
              })),
            };

            // Sauvegarder avec le nouvel ID
            await AsyncStorage.setItem(
              `workout_${newId}`,
              JSON.stringify(migratedWorkout)
            );
            migratedIds.push(newId);

            // Supprimer l'ancien
            await AsyncStorage.removeItem(`workout_${oldId}`);
            await AsyncStorage.removeItem(`sync_status_${oldId}`);
          }
        } else {
          migratedIds.push(oldId);
        }
      }

      // Mettre à jour l'index des IDs
      await AsyncStorage.setItem("workout_ids", JSON.stringify(migratedIds));
    } catch (error) {
      console.error("Error migrating old workout IDs:", error);
    }
  }

  // === UTILITY METHODS ===

  async getSyncStatus(): Promise<{ pending: number; synced: number }> {
    const workoutIds = await this.getWorkoutIds();
    let synced = 0;
    let pending = 0;

    for (const id of workoutIds) {
      const statusData = await AsyncStorage.getItem(`sync_status_${id}`);
      if (statusData) {
        const status: SyncStatus = JSON.parse(statusData);
        if (status.synced) {
          synced++;
        } else {
          pending++;
        }
      } else {
        pending++;
      }
    }

    return { pending, synced };
  }

  async forceSyncAll(): Promise<void> {
    const workoutIds = await this.getWorkoutIds();
    for (const id of workoutIds) {
      await this.addToSyncQueue(id);
    }
    await this.processSyncQueue();
  }
}

export const hybridStorage = new HybridStorageService();
