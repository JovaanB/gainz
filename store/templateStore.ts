// src/store/templateStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  WorkoutTemplate,
  TemplateSession,
  UserProgram,
  ProgramProgress,
  TemplateStats,
} from "../types/templates";
import { Workout, Set } from "@/types";
import { POPULAR_TEMPLATES } from "@/data/templates";
import { StorageService } from "@/services/storage";
import { generateUUID } from "@/utils/uuid";

interface ProgramSet extends Set {
  weight: number;
  reps: number;
  completed: boolean;
  duration_seconds?: number;
  rest_seconds?: number;
}

interface TemplateState {
  // Templates disponibles
  availableTemplates: WorkoutTemplate[];
  favoriteTemplates: string[];

  // Programme actuel de l'utilisateur
  currentProgram?: UserProgram;

  // États temporaires
  selectedTemplate?: WorkoutTemplate;
  previewSession?: TemplateSession;

  // Actions pour les templates
  loadTemplates: () => void;
  selectTemplate: (templateId: string) => void;
  startProgram: (templateId: string, customizations?: any) => void;
  stopProgram: () => void;

  // Actions pour les favoris
  addToFavorites: (templateId: string) => void;
  removeFromFavorites: (templateId: string) => void;

  // Actions pour la progression
  completeSession: (sessionData: ProgramProgress) => void;
  skipSession: () => void;
  getCurrentSession: () => TemplateSession | null;
  getNextSession: () => TemplateSession | null;
  getProgramProgress: () => number;
  getProgramDuration: () => number;
  getTotalSessions: () => number;
  getProgramStats: () => TemplateStats;

  // Personnalisation
  customizeTemplate: (modifications: Partial<WorkoutTemplate>) => void;
  updateSessionWeights: (
    sessionId: string,
    weights: Record<string, number>
  ) => void;
}

const STORAGE_KEY = "template-storage";

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // États initiaux
      availableTemplates: [],
      favoriteTemplates: [],

      loadTemplates: async () => {
        try {
          // Charger les données depuis AsyncStorage
          const savedData = await StorageService.getUserSettings();
          const templateData = savedData?.[STORAGE_KEY];

          if (templateData) {
            set({
              currentProgram: templateData.currentProgram,
              selectedTemplate: templateData.selectedTemplate,
              favoriteTemplates: templateData.favoriteTemplates || [],
            });
          }

          // Charger les templates disponibles
          set({ availableTemplates: POPULAR_TEMPLATES });
        } catch (error) {
          console.error("Error loading templates:", error);
          set({ availableTemplates: POPULAR_TEMPLATES });
        }
      },

      // Sélectionner un template pour prévisualisation
      selectTemplate: (templateId) => {
        const { availableTemplates } = get();
        const template = availableTemplates.find((t) => t.id === templateId);
        set({ selectedTemplate: template });
      },

      // Démarrer un programme
      startProgram: async (templateId, customizations = {}) => {
        const { availableTemplates } = get();
        const template = availableTemplates.find((t) => t.id === templateId);

        if (template) {
          const newProgram: UserProgram = {
            templateId,
            startDate: Date.now(),
            currentWeek: 1,
            currentSession: 0,
            completedSessions: [],
            customizations,
            progressHistory: [],
          };

          const newState = {
            currentProgram: newProgram,
            selectedTemplate: template,
          };

          set(newState);

          // Sauvegarder dans AsyncStorage
          try {
            const savedData = (await StorageService.getUserSettings()) || {};
            await StorageService.saveUserSettings({
              ...savedData,
              [STORAGE_KEY]: {
                ...savedData[STORAGE_KEY],
                ...newState,
              },
            });
          } catch (error) {
            console.error("Error saving program:", error);
          }
        }
      },

      // Arrêter le programme actuel
      stopProgram: () => {
        set({
          currentProgram: undefined,
          selectedTemplate: undefined,
        });
      },

      // Gestion des favoris
      addToFavorites: (templateId) => {
        const { favoriteTemplates } = get();
        if (!favoriteTemplates.includes(templateId)) {
          set({
            favoriteTemplates: [...favoriteTemplates, templateId],
          });
        }
      },

      removeFromFavorites: (templateId) => {
        const { favoriteTemplates } = get();
        set({
          favoriteTemplates: favoriteTemplates.filter(
            (id) => id !== templateId
          ),
        });
      },

      // Compléter une session
      completeSession: async (sessionData) => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const sessionId = `${currentProgram.templateId}_${currentProgram.currentSession}`;
          const sessionIndex =
            currentProgram.currentSession % selectedTemplate.sessions.length;
          const templateSession = selectedTemplate.sessions[sessionIndex];

          if (!templateSession) {
            console.error("Session template not found");
            return;
          }

          // Calculer la durée de la séance en secondes
          const duration = Math.floor((Date.now() - sessionData.date) / 1000);

          // Créer un workout à partir de la session
          const workout: Workout = {
            id: generateUUID(),
            name: templateSession.name,
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

      // Passer une session
      skipSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const updatedProgram = {
            ...currentProgram,
            currentSession: currentProgram.currentSession + 1,
          };

          const totalSessionsInWeek = selectedTemplate.sessions.length;
          if (updatedProgram.currentSession >= totalSessionsInWeek) {
            updatedProgram.currentWeek += 1;
            updatedProgram.currentSession = 0;
          }

          set({ currentProgram: updatedProgram });
        }
      },

      // Obtenir la session actuelle
      getCurrentSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const sessionIndex =
            currentProgram.currentSession % selectedTemplate.sessions.length;
          return selectedTemplate.sessions[sessionIndex] || null;
        }

        return null;
      },

      // Obtenir la prochaine session
      getNextSession: () => {
        const { currentProgram, selectedTemplate } = get();

        if (currentProgram && selectedTemplate) {
          const nextSessionIndex =
            (currentProgram.currentSession + 1) %
            selectedTemplate.sessions.length;
          return selectedTemplate.sessions[nextSessionIndex] || null;
        }

        return null;
      },

      getProgramProgress: () => {
        const { currentProgram, selectedTemplate } = get();

        if (!currentProgram || !selectedTemplate) return 0;

        // 1. Calculer la durée totale du programme selon son type
        const getTotalDuration = () => {
          // Programmes de force : progression linéaire
          if (selectedTemplate.category === "strength") {
            return 12; // 12 semaines pour StrongLifts etc.
          }

          // Programmes de masse : cycles plus longs
          if (selectedTemplate.category === "muscle_building") {
            return 16; // 16 semaines pour PPL etc.
          }

          // Programmes fitness/débutant
          if (selectedTemplate.category === "general_fitness") {
            return 8; // 8 semaines pour Full Body
          }

          // Par défaut
          return 12;
        };

        // 2. Calculer le progrès basé sur les sessions terminées
        const getSessionProgress = () => {
          const totalSessionsPerWeek = selectedTemplate.sessions.length;
          const totalWeeks = getTotalDuration();
          const totalSessions = totalSessionsPerWeek * totalWeeks;

          const completedSessions = currentProgram.completedSessions.length;

          return (completedSessions / totalSessions) * 100;
        };

        // 3. Calculer le progrès basé sur les semaines
        const getWeekProgress = () => {
          const totalWeeks = getTotalDuration();
          const currentWeek = currentProgram.currentWeek;

          return (currentWeek / totalWeeks) * 100;
        };

        // 4. Prendre le maximum entre les deux approches
        const sessionProgress = getSessionProgress();
        const weekProgress = getWeekProgress();

        // Utiliser le plus élevé des deux, plafonné à 100%
        return Math.min(sessionProgress, weekProgress, 100);
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

      // Mettre à jour les poids pour une session
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

        if (selectedTemplate.category === "strength") return 12;
        if (selectedTemplate.category === "muscle_building") return 16;
        if (selectedTemplate.category === "general_fitness") return 8;
        return 12;
      },

      // Obtenir le nombre total de sessions du programme
      getTotalSessions: () => {
        const { selectedTemplate } = get();
        if (!selectedTemplate) return 0;

        const duration = get().getProgramDuration();
        const sessionsPerWeek = selectedTemplate.sessions.length;
        return duration * sessionsPerWeek;
      },

      // Obtenir les stats détaillées
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

        const averageSessionsPerWeek = selectedTemplate.frequency;
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
