// store/programStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  programService,
  SupabaseWorkoutProgram,
  CreateProgramRequest,
  UserActiveProgram,
  ProgramSessionDetail,
} from "@/services/programService";
import { useAuthStore } from "@/store/authStore";
import { hybridStorage } from "@/services/hybridStorage";
import { generateUUID } from "@/utils/uuid";
import { Workout } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProgramStore {
  // États des programmes
  availablePrograms: SupabaseWorkoutProgram[];
  favoritePrograms: string[];
  activeProgram: UserActiveProgram | null;
  isLoading: boolean;
  error: string | null;

  // États temporaires
  selectedProgram?: SupabaseWorkoutProgram;
  currentSession?: ProgramSessionDetail;

  // Actions pour les programmes
  loadPrograms: () => Promise<void>;
  refreshPrograms: () => Promise<void>;
  selectProgram: (programId: string) => void;

  // Actions CRUD pour programmes personnels
  createPersonalProgram: (
    programData: CreateProgramRequest
  ) => Promise<SupabaseWorkoutProgram>;
  updatePersonalProgram: (
    programId: string,
    updates: Partial<CreateProgramRequest>
  ) => Promise<void>;
  deletePersonalProgram: (programId: string) => Promise<void>;
  duplicateProgram: (
    programId: string,
    newName?: string
  ) => Promise<SupabaseWorkoutProgram>;

  // Actions pour les favoris
  addToFavorites: (programId: string) => Promise<void>;
  removeFromFavorites: (programId: string) => Promise<void>;

  // Actions pour les programmes actifs
  startProgram: (programId: string, customizations?: any) => Promise<void>;
  stopProgram: () => Promise<void>;
  loadActiveProgram: () => Promise<void>;

  // Actions pour les sessions
  getCurrentSession: () => ProgramSessionDetail | null;
  getNextSession: () => ProgramSessionDetail | null;
  completeSession: (sessionData: any) => Promise<void>;
  skipSession: () => Promise<void>;

  // Recherche et filtres
  searchPrograms: (query: string) => Promise<SupabaseWorkoutProgram[]>;
  getProgramsByCategory: (category: string) => SupabaseWorkoutProgram[];
  getProgramsByLevel: (level: string) => SupabaseWorkoutProgram[];
  getFavoritePrograms: () => SupabaseWorkoutProgram[];

  // Statistiques et progression
  getProgramProgress: () => number;
  getProgramStats: () => {
    totalWeeks: number;
    currentWeek: number;
    totalSessions: number;
    completedSessions: number;
    remainingSessions: number;
    progressPercent: number;
    estimatedCompletion: Date | null;
  };

  // Utilitaires
  clearError: () => void;
}

const STORAGE_KEY = "program-storage";

export const useProgramStore = create<ProgramStore>()(
  persist(
    (set, get) => ({
      // États initiaux
      availablePrograms: [],
      favoritePrograms: [],
      activeProgram: null,
      isLoading: false,
      error: null,

      loadPrograms: async () => {
        try {
          set({ isLoading: true, error: null });

          const { isAuthenticated } = useAuthStore.getState();

          if (!isAuthenticated) {
            // Utilisateur non connecté, charger programmes de base
            set({
              availablePrograms: [],
              isLoading: false,
            });
            return;
          }

          // Charger tous les programmes accessibles depuis Supabase
          const programs = await programService.getAccessiblePrograms();

          // Extraire les IDs des favoris
          const favoriteIds = programs
            .filter((p: SupabaseWorkoutProgram) => p.is_favorite)
            .map((p: SupabaseWorkoutProgram) => p.id);

          set({
            availablePrograms: programs,
            favoritePrograms: favoriteIds,
          });
        } catch (error) {
          console.error("Error loading programs:", error);
          set({
            error: "Impossible de charger les programmes",
            availablePrograms: [],
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshPrograms: async () => {
        await get().loadPrograms();
      },

      selectProgram: (programId) => {
        const { availablePrograms } = get();
        const program = availablePrograms.find((p) => p.id === programId);
        set({ selectedProgram: program });
      },

      createPersonalProgram: async (programData) => {
        try {
          set({ isLoading: true, error: null });
          const newProgram = await programService.createPersonalProgram(
            programData
          );

          // Ajouter à la liste locale
          const { availablePrograms } = get();
          set({
            availablePrograms: [newProgram, ...availablePrograms],
          });

          return newProgram;
        } catch (error) {
          console.error("Error creating personal program:", error);
          set({ error: "Impossible de créer le programme personnel" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePersonalProgram: async (programId, updates) => {
        try {
          set({ isLoading: true, error: null });
          await programService.updatePersonalProgram(programId, updates);

          // Recharger les programmes pour avoir les données à jour
          await get().loadPrograms();
        } catch (error) {
          console.error("Error updating personal program:", error);
          set({ error: "Impossible de modifier le programme" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deletePersonalProgram: async (programId) => {
        try {
          set({ isLoading: true, error: null });
          await programService.deletePersonalProgram(programId);

          // Supprimer de la liste locale
          const { availablePrograms, favoritePrograms } = get();
          set({
            availablePrograms: availablePrograms.filter(
              (p) => p.id !== programId
            ),
            favoritePrograms: favoritePrograms.filter((id) => id !== programId),
          });
        } catch (error) {
          console.error("Error deleting personal program:", error);
          set({ error: "Impossible de supprimer le programme" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      duplicateProgram: async (programId, newName) => {
        try {
          set({ isLoading: true, error: null });
          const duplicatedProgram = await programService.duplicateProgram(
            programId,
            newName
          );

          // Ajouter à la liste locale
          const { availablePrograms } = get();
          set({
            availablePrograms: [duplicatedProgram, ...availablePrograms],
          });

          return duplicatedProgram;
        } catch (error) {
          console.error("Error duplicating program:", error);
          set({ error: "Impossible de dupliquer le programme" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      addToFavorites: async (programId) => {
        try {
          set({ error: null });
          await programService.addToFavorites(programId);

          // Mettre à jour l'état local
          const { favoritePrograms, availablePrograms } = get();
          if (!favoritePrograms.includes(programId)) {
            set({
              favoritePrograms: [...favoritePrograms, programId],
              availablePrograms: availablePrograms.map((p) =>
                p.id === programId ? { ...p, is_favorite: true } : p
              ),
            });
          }
        } catch (error) {
          console.error("Error adding to favorites:", error);
          set({ error: "Impossible d'ajouter aux favoris" });
        }
      },

      removeFromFavorites: async (programId) => {
        try {
          set({ error: null });
          await programService.removeFromFavorites(programId);

          // Mettre à jour l'état local
          const { favoritePrograms, availablePrograms } = get();
          set({
            favoritePrograms: favoritePrograms.filter((id) => id !== programId),
            availablePrograms: availablePrograms.map((p) =>
              p.id === programId ? { ...p, is_favorite: false } : p
            ),
          });
        } catch (error) {
          console.error("Error removing from favorites:", error);
          set({ error: "Impossible de supprimer des favoris" });
        }
      },

      startProgram: async (programId, customizations = {}) => {
        try {
          const { availablePrograms } = get();
          set({ isLoading: true, error: null });

          // Arrêter le programme actuel s'il y en a un
          const currentActive = await programService.getActiveProgram();
          if (currentActive) {
            await programService.stopProgram();
          }

          // Démarrer le nouveau programme
          const activeProgram = await programService.startProgram(
            programId,
            customizations
          );

          set({
            activeProgram,
            selectedProgram: availablePrograms.find((p) => p.id === programId),
          });
        } catch (error) {
          console.error("Error starting program:", error);
          set({ error: "Impossible de démarrer le programme" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      stopProgram: async () => {
        try {
          set({ isLoading: true, error: null });
          await programService.stopProgram();

          set({
            activeProgram: null,
            selectedProgram: undefined,
            currentSession: undefined,
          });
        } catch (error) {
          console.error("Error stopping program:", error);
          set({ error: "Impossible d'arrêter le programme" });
        } finally {
          set({ isLoading: false });
        }
      },

      loadActiveProgram: async () => {
        try {
          const activeProgram = await programService.getActiveProgram();

          if (activeProgram) {
            // Charger aussi les détails du programme
            const programDetails = await programService.getProgramById(
              activeProgram.program_id
            );

            set({
              activeProgram,
              selectedProgram: programDetails || undefined,
            });
          } else {
            set({
              activeProgram: null,
              selectedProgram: undefined,
            });
          }
        } catch (error) {
          console.error("Error loading active program:", error);
        }
      },

      getCurrentSession: () => {
        const { activeProgram, selectedProgram } = get();

        if (!activeProgram || !selectedProgram?.sessions) {
          return null;
        }

        const sessionIndex =
          activeProgram.current_session_index % selectedProgram.sessions.length;
        return selectedProgram.sessions[sessionIndex] || null;
      },

      getNextSession: () => {
        const { activeProgram, selectedProgram } = get();

        if (!activeProgram || !selectedProgram?.sessions) {
          return null;
        }

        const nextSessionIndex =
          (activeProgram.current_session_index + 1) %
          selectedProgram.sessions.length;
        return selectedProgram.sessions[nextSessionIndex] || null;
      },

      completeSession: async (sessionData) => {
        const { activeProgram } = get();
        if (!activeProgram) {
          throw new Error("No active program");
        }

        try {
          const currentSession = get().getCurrentSession();
          if (!currentSession) {
            throw new Error("No current session");
          }

          // Créer un workout à partir de la session
          const workout: Workout = {
            id: generateUUID(),
            name: currentSession.name,
            date: sessionData.date || Date.now(),
            started_at: sessionData.started_at || Date.now(),
            finished_at: Date.now(),
            exercises:
              sessionData.exercises?.map((ex: any, index: number) => ({
                id: generateUUID(),
                exercise: {
                  id: ex.exerciseId || ex.exercise_id,
                  name: ex.exerciseName || ex.name || "Exercise",
                  muscle_groups: [],
                  category: "strength",
                  is_bodyweight: ex.is_bodyweight || false,
                  sets: ex.sets?.length || 0,
                },
                sets:
                  ex.sets?.map((set: any) => ({
                    weight: set.weight,
                    reps: set.reps,
                    completed: set.completed,
                    duration_seconds: set.duration_seconds,
                    distance_km: set.distance_km,
                    rest_seconds: set.rest_seconds || 90,
                  })) || [],
                completed: true,
                order_index: index,
                notes: ex.notes || "",
              })) || [],
            completed: true,
            user_id: activeProgram.user_id,
            is_template: true,
            template_id: activeProgram.program_id,
            template_session_id: currentSession.id,
          };

          // Sauvegarder le workout
          await hybridStorage.saveWorkout(workout);

          // Marquer la session comme terminée
          await programService.completeSession(
            activeProgram.id,
            currentSession.id,
            workout.id,
            {
              duration_seconds: sessionData.duration_seconds,
              notes: sessionData.notes,
              ...sessionData,
            }
          );

          // Recharger le programme actif pour mettre à jour les données
          await get().loadActiveProgram();
        } catch (error) {
          console.error("Error completing session:", error);
          set({ error: "Impossible de terminer la session" });
          throw error;
        }
      },

      skipSession: async () => {
        const { activeProgram } = get();
        if (!activeProgram) return;

        try {
          // Simplement incrémenter l'index de session
          const newSessionIndex = activeProgram.current_session_index + 1;

          // Mettre à jour dans Supabase
          // Pour simplifier, on peut reload le programme actif
          await get().loadActiveProgram();
        } catch (error) {
          console.error("Error skipping session:", error);
          set({ error: "Impossible de passer la session" });
        }
      },

      searchPrograms: async (query) => {
        try {
          return await programService.searchPrograms(query);
        } catch (error) {
          console.error("Error searching programs:", error);
          return [];
        }
      },

      getProgramsByCategory: (category) => {
        const { availablePrograms } = get();
        return availablePrograms.filter(
          (program) => program.category === category
        );
      },

      getProgramsByLevel: (level) => {
        const { availablePrograms } = get();
        return availablePrograms.filter((program) => program.level === level);
      },

      getFavoritePrograms: () => {
        const { availablePrograms } = get();
        return availablePrograms.filter((program) => program.is_favorite);
      },

      getProgramProgress: () => {
        const { activeProgram, selectedProgram } = get();

        if (!activeProgram || !selectedProgram) return 0;

        const totalSessions =
          selectedProgram.duration_weeks * selectedProgram.frequency_per_week;
        const completedSessions = activeProgram.completed_sessions.length;

        return Math.min((completedSessions / totalSessions) * 100, 100);
      },

      getProgramStats: () => {
        const { activeProgram, selectedProgram } = get();

        if (!activeProgram || !selectedProgram) {
          return {
            totalWeeks: 0,
            currentWeek: 0,
            totalSessions: 0,
            completedSessions: 0,
            remainingSessions: 0,
            progressPercent: 0,
            estimatedCompletion: null,
          };
        }

        const totalWeeks = selectedProgram.duration_weeks;
        const totalSessions = totalWeeks * selectedProgram.frequency_per_week;
        const completedSessions = activeProgram.completed_sessions.length;
        const remainingSessions = totalSessions - completedSessions;
        const progressPercent = get().getProgramProgress();

        // Estimer la date de fin basée sur la fréquence
        const weeksRemaining =
          remainingSessions / selectedProgram.frequency_per_week;
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(
          estimatedCompletion.getDate() + weeksRemaining * 7
        );

        return {
          totalWeeks,
          currentWeek: activeProgram.current_week,
          totalSessions,
          completedSessions,
          remainingSessions,
          progressPercent: Math.round(progressPercent),
          estimatedCompletion,
        };
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoritePrograms: state.favoritePrograms,
        activeProgram: state.activeProgram,
        selectedProgram: state.selectedProgram,
      }),
    }
  )
);
