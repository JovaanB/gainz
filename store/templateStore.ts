// store/templateStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TemplateSession,
  UserProgram,
  ProgramProgress,
  TemplateStats,
} from "../types/templates";
import { Workout, Set } from "@/types";
import { StorageService } from "@/services/storageService";
import { generateUUID } from "@/utils/uuid";
import {
  templateService,
  SupabaseWorkoutTemplate,
  CreateTemplateRequest,
} from "@/services/templateService";
import { useAuthStore } from "@/store/authStore";

interface ProgramSet extends Set {
  weight: number;
  reps: number;
  completed: boolean;
  duration_seconds?: number;
  rest_seconds?: number;
}

interface TemplateState {
  // Templates disponibles depuis Supabase
  availableTemplates: SupabaseWorkoutTemplate[];
  favoriteTemplates: string[];
  isLoading: boolean;
  error: string | null;

  // Programme actuel de l'utilisateur
  currentProgram?: UserProgram;

  // États temporaires
  selectedTemplate?: SupabaseWorkoutTemplate;
  previewSession?: TemplateSession;

  // Actions pour les templates
  loadTemplates: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  selectTemplate: (templateId: string) => void;

  // Actions pour les favoris
  addToFavorites: (templateId: string) => Promise<void>;
  removeFromFavorites: (templateId: string) => Promise<void>;

  // Actions CRUD pour templates personnels
  createPersonalTemplate: (
    templateData: CreateTemplateRequest
  ) => Promise<SupabaseWorkoutTemplate>;
  updatePersonalTemplate: (
    templateId: string,
    updates: Partial<CreateTemplateRequest>
  ) => Promise<void>;
  deletePersonalTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (
    templateId: string,
    newName?: string
  ) => Promise<SupabaseWorkoutTemplate>;

  // Actions pour la progression
  completeSession: (sessionData: ProgramProgress) => void;
  skipSession: () => void;
  getCurrentSession: () => TemplateSession | null;
  getNextSession: () => TemplateSession | null;
  getProgramProgress: () => number;
  getProgramDuration: () => number;
  getTotalSessions: () => number;
  getProgramStats: () => TemplateStats;

  // Recherche et filtres
  searchTemplates: (query: string) => Promise<SupabaseWorkoutTemplate[]>;
  getTemplatesByDifficulty: (
    difficulty: "beginner" | "intermediate" | "advanced"
  ) => SupabaseWorkoutTemplate[];
  getFavoriteTemplates: () => SupabaseWorkoutTemplate[];

  // Personnalisation
  customizeTemplate: (modifications: Partial<SupabaseWorkoutTemplate>) => void;
  updateSessionWeights: (
    sessionId: string,
    weights: Record<string, number>
  ) => void;

  // Utilitaires
  clearError: () => void;
}

const STORAGE_KEY = "template-storage";

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // États initiaux
      availableTemplates: [],
      favoriteTemplates: [],
      isLoading: false,
      error: null,

      loadTemplates: async () => {
        try {
          set({ isLoading: true, error: null });

          const { isAuthenticated } = useAuthStore.getState();

          if (!isAuthenticated) {
            // Utilisateur non connecté, charger templates de base
            set({
              availableTemplates: [],
              isLoading: false,
            });
            return;
          }

          // Charger tous les templates accessibles depuis Supabase
          const templates = await templateService.getAccessibleTemplates();

          // Extraire les IDs des favoris pour la compatibilité avec l'état local
          const favoriteIds = templates
            .filter((t: SupabaseWorkoutTemplate) => t.is_favorite)
            .map((t: SupabaseWorkoutTemplate) => t.id);

          set({
            availableTemplates: templates,
            favoriteTemplates: favoriteIds,
          });
        } catch (error) {
          console.error("Error loading templates:", error);
          set({
            error: "Impossible de charger les templates",
            availableTemplates: [],
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshTemplates: async () => {
        await get().loadTemplates();
      },

      // Sélectionner un template pour prévisualisation
      selectTemplate: (templateId) => {
        const { availableTemplates } = get();
        const template = availableTemplates.find((t) => t.id === templateId);
        set({ selectedTemplate: template });
      },

      // Gestion des favoris
      addToFavorites: async (templateId) => {
        try {
          set({ error: null });
          await templateService.addToFavorites(templateId);

          // Mettre à jour l'état local
          const { favoriteTemplates, availableTemplates } = get();
          if (!favoriteTemplates.includes(templateId)) {
            set({
              favoriteTemplates: [...favoriteTemplates, templateId],
              availableTemplates: availableTemplates.map((t) =>
                t.id === templateId ? { ...t, is_favorite: true } : t
              ),
            });
          }
        } catch (error) {
          console.error("Error adding to favorites:", error);
          set({ error: "Impossible d'ajouter aux favoris" });
        }
      },

      removeFromFavorites: async (templateId) => {
        try {
          set({ error: null });
          await templateService.removeFromFavorites(templateId);

          // Mettre à jour l'état local
          const { favoriteTemplates, availableTemplates } = get();
          set({
            favoriteTemplates: favoriteTemplates.filter(
              (id) => id !== templateId
            ),
            availableTemplates: availableTemplates.map((t) =>
              t.id === templateId ? { ...t, is_favorite: false } : t
            ),
          });
        } catch (error) {
          console.error("Error removing from favorites:", error);
          set({ error: "Impossible de supprimer des favoris" });
        }
      },

      // CRUD pour templates personnels
      createPersonalTemplate: async (templateData) => {
        try {
          set({ isLoading: true, error: null });
          const newTemplate = await templateService.createPersonalTemplate(
            templateData
          );

          // Ajouter à la liste locale
          const { availableTemplates } = get();
          set({
            availableTemplates: [newTemplate, ...availableTemplates],
          });

          return newTemplate;
        } catch (error) {
          console.error("Error creating personal template:", error);
          set({ error: "Impossible de créer le template personnel" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePersonalTemplate: async (templateId, updates) => {
        try {
          set({ isLoading: true, error: null });
          await templateService.updatePersonalTemplate(templateId, updates);

          // Recharger les templates pour avoir les données à jour
          await get().loadTemplates();
        } catch (error) {
          console.error("Error updating personal template:", error);
          set({ error: "Impossible de modifier le template" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deletePersonalTemplate: async (templateId) => {
        try {
          set({ isLoading: true, error: null });
          await templateService.deletePersonalTemplate(templateId);

          // Supprimer de la liste locale
          const { availableTemplates, favoriteTemplates } = get();
          set({
            availableTemplates: availableTemplates.filter(
              (t) => t.id !== templateId
            ),
            favoriteTemplates: favoriteTemplates.filter(
              (id) => id !== templateId
            ),
          });
        } catch (error) {
          console.error("Error deleting personal template:", error);
          set({ error: "Impossible de supprimer le template" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      duplicateTemplate: async (templateId, newName) => {
        try {
          set({ isLoading: true, error: null });
          const duplicatedTemplate = await templateService.duplicateTemplate(
            templateId,
            newName
          );

          // Ajouter à la liste locale
          const { availableTemplates } = get();
          set({
            availableTemplates: [duplicatedTemplate, ...availableTemplates],
          });

          return duplicatedTemplate;
        } catch (error) {
          console.error("Error duplicating template:", error);
          set({ error: "Impossible de dupliquer le template" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Recherche et filtres
      searchTemplates: async (query) => {
        try {
          return await templateService.searchTemplates(query);
        } catch (error) {
          console.error("Error searching templates:", error);
          return [];
        }
      },

      getTemplatesByDifficulty: (difficulty) => {
        const { availableTemplates } = get();
        return availableTemplates.filter(
          (template) => template.difficulty === difficulty
        );
      },

      getFavoriteTemplates: () => {
        const { availableTemplates } = get();
        return availableTemplates.filter((template) => template.is_favorite);
      },

      // Compléter une session (logique existante)
      completeSession: async (sessionData) => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const sessionId = `${currentProgram.templateId}_${currentProgram.currentSession}`;

          // Convertir le template Supabase en format legacy pour la compatibilité
          const legacySession = convertSupabaseTemplateToLegacySession(
            selectedTemplate,
            currentProgram.currentSession
          );

          if (!legacySession) {
            console.error("Session template not found");
            return;
          }

          // Calculer la durée de la séance en secondes
          const duration = Math.floor((Date.now() - sessionData.date) / 1000);

          // Créer un workout à partir de la session
          const workout: Workout = {
            id: generateUUID(),
            name: legacySession.name,
            date: sessionData.date,
            started_at: sessionData.date,
            finished_at: Date.now(),
            exercises: sessionData.exercises.map((ex) => ({
              id: ex.exerciseId,
              exercise: {
                id: ex.exerciseId,
                name: ex.exerciseId
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
                muscle_groups: [],
                category: "strength",
                is_bodyweight: false,
                sets: ex.sets.length,
              },
              sets: ex.sets.map((set) => ({
                ...set,
                rest_seconds: 90,
              })),
              completed: true,
              order_index: 0,
              notes: "",
            })),
            completed: true,
            user_id: "temp-user",
            is_template: true,
            template_id: currentProgram.templateId,
            template_session_id: sessionId,
          };

          // Sauvegarder le workout
          await StorageService.saveWorkout(workout);

          // Mettre à jour le programme
          const updatedProgram = {
            ...currentProgram,
            completedSessions: [...currentProgram.completedSessions, sessionId],
            progressHistory: [
              ...currentProgram.progressHistory,
              {
                ...sessionData,
                duration,
              },
            ],
            currentSession: currentProgram.currentSession + 1,
          };

          set({ currentProgram: updatedProgram });

          // Sauvegarder dans AsyncStorage
          try {
            const savedData = (await StorageService.getUserSettings()) || {};
            await StorageService.saveUserSettings({
              ...savedData,
              [STORAGE_KEY]: {
                ...savedData[STORAGE_KEY],
                currentProgram: updatedProgram,
              },
            });
          } catch (error) {
            console.error("Error saving program:", error);
          }
        }
      },

      // Autres méthodes existantes (skipSession, getCurrentSession, etc.)
      skipSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const updatedProgram = {
            ...currentProgram,
            currentSession: currentProgram.currentSession + 1,
          };

          // Logique de semaine basée sur les exercises du template
          const sessionsPerWeek = selectedTemplate.exercises?.length || 3;
          if (updatedProgram.currentSession >= sessionsPerWeek) {
            updatedProgram.currentWeek += 1;
            updatedProgram.currentSession = 0;
          }

          set({ currentProgram: updatedProgram });
        }
      },

      getCurrentSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          return convertSupabaseTemplateToLegacySession(
            selectedTemplate,
            currentProgram.currentSession
          );
        }

        return null;
      },

      getNextSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const nextSessionIndex = currentProgram.currentSession + 1;
          return convertSupabaseTemplateToLegacySession(
            selectedTemplate,
            nextSessionIndex
          );
        }

        return null;
      },

      getProgramProgress: () => {
        const { currentProgram, selectedTemplate } = get();

        if (!currentProgram || !selectedTemplate) return 0;

        const getTotalDuration = () => {
          if (selectedTemplate.difficulty === "advanced") return 16;
          if (selectedTemplate.difficulty === "intermediate") return 12;
          return 8; // beginner
        };

        const getSessionProgress = () => {
          const totalSessionsPerWeek = selectedTemplate.exercises?.length || 3;
          const totalWeeks = getTotalDuration();
          const totalSessions = totalSessionsPerWeek * totalWeeks;
          const completedSessions = currentProgram.completedSessions.length;
          return (completedSessions / totalSessions) * 100;
        };

        const getWeekProgress = () => {
          const totalWeeks = getTotalDuration();
          const currentWeek = currentProgram.currentWeek;
          return (currentWeek / totalWeeks) * 100;
        };

        const sessionProgress = getSessionProgress();
        const weekProgress = getWeekProgress();
        return Math.min(Math.max(sessionProgress, weekProgress), 100);
      },

      customizeTemplate: (modifications) => {
        const { selectedTemplate } = get();

        if (selectedTemplate) {
          set({
            selectedTemplate: {
              ...selectedTemplate,
              ...modifications,
            },
          });
        }
      },

      updateSessionWeights: (sessionId, weights) => {
        const { currentProgram } = get();

        if (currentProgram) {
          const updatedCustomizations = {
            ...currentProgram.customizations,
            sessionWeights: {
              ...currentProgram.customizations.sessionWeights,
              [sessionId]: weights,
            },
          };

          set({
            currentProgram: {
              ...currentProgram,
              customizations: updatedCustomizations,
            },
          });
        }
      },

      getProgramDuration: () => {
        const { selectedTemplate } = get();
        if (!selectedTemplate) return 0;

        if (selectedTemplate.difficulty === "advanced") return 16;
        if (selectedTemplate.difficulty === "intermediate") return 12;
        return 8;
      },

      getTotalSessions: () => {
        const { selectedTemplate } = get();
        if (!selectedTemplate) return 0;

        const duration = get().getProgramDuration();
        const sessionsPerWeek = selectedTemplate.exercises?.length || 3;
        return duration * sessionsPerWeek;
      },

      getProgramStats: () => {
        const { currentProgram, selectedTemplate } = get();

        if (!currentProgram || !selectedTemplate) {
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

        const totalWeeks = get().getProgramDuration();
        const totalSessions = get().getTotalSessions();
        const completedSessions = currentProgram.completedSessions.length;
        const remainingSessions = totalSessions - completedSessions;
        const progressPercent = get().getProgramProgress();

        const averageSessionsPerWeek = selectedTemplate.exercises?.length || 3;
        const weeksRemaining = remainingSessions / averageSessionsPerWeek;
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(
          estimatedCompletion.getDate() + weeksRemaining * 7
        );

        return {
          totalWeeks,
          currentWeek: currentProgram.currentWeek,
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
      partialize: (state) => ({
        favoriteTemplates: state.favoriteTemplates,
        currentProgram: state.currentProgram,
        selectedTemplate: state.selectedTemplate,
      }),
    }
  )
);

// Fonction helper pour convertir les templates Supabase en format legacy
function convertSupabaseTemplateToLegacySession(
  template: SupabaseWorkoutTemplate,
  sessionIndex: number
): TemplateSession | null {
  if (!template.exercises || template.exercises.length === 0) {
    return null;
  }

  // Créer une session basée sur les exercices du template
  const sessionName = `${template.name} - Session ${sessionIndex + 1}`;

  return {
    id: `${template.id}_${sessionIndex}`,
    name: sessionName,
    exercises: template.exercises.map(
      (ex: {
        exercise_id: string;
        exercise_name: string;
        suggested_sets: number;
        suggested_reps?: string;
        rest_seconds: number;
        notes?: string;
      }) => ({
        exercise_id: ex.exercise_id,
        name: ex.exercise_name,
        sets: ex.suggested_sets,
        reps: ex.suggested_reps || "8-12",
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        is_bodyweight: false,
      })
    ),
    estimated_duration: template.estimated_duration,
    difficulty: template.difficulty,
    rest_between_exercises: 90, // Valeur par défaut
  };
}
