import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AICoachService } from "../services/aiCoachService";
import { AIRecommendation, UserProfile } from "../types/ai";
import { useWorkoutStore } from "./workoutStore";

interface AICoachState {
  // User Profile
  userProfile: UserProfile | null;

  // AI Recommendations
  recommendations: AIRecommendation[];
  isAnalyzing: boolean;
  lastAnalysis: number | null;

  // Actions
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // AI Analysis
  analyzePerformance: () => Promise<void>;
  dismissRecommendation: (id: string) => void;
  clearRecommendations: () => void;

  // Initialization
  initializeProfile: () => void;
}

export const useAICoachStore = create<AICoachState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      recommendations: [],
      isAnalyzing: false,
      lastAnalysis: null,

      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      updateUserProfile: (updates) => {
        const current = get().userProfile;
        if (!current) return;

        const updated = {
          ...current,
          ...updates,
          updatedAt: Date.now(),
        };

        set({ userProfile: updated });
      },

      initializeProfile: () => {
        const profile = get().userProfile;
        if (!profile) {
          // Créer un profil par défaut
          const defaultProfile: UserProfile = {
            fitnessLevel: "beginner",
            goals: ["muscle"],
            preferences: {
              workoutDuration: 60,
              difficulty: "moderate",
              focusAreas: ["chest", "back", "legs"],
            },
            limitations: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set({ userProfile: defaultProfile });
        }
      },

      analyzePerformance: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isAnalyzing: true });

        try {
          const { workoutHistory } = useWorkoutStore.getState();

          // Convertir l'historique au format attendu par l'IA
          const recentWorkouts = workoutHistory
            .slice(-10) // Les 10 dernières séances
            .map((workout) => ({
              id: workout.id,
              name: workout.name,
              started_at: new Date(workout.date).getTime(),
              finished_at: workout.finished_at,
              exercises: workout.exercises.map((exercise, index) => ({
                id: `${workout.id}_${index}`,
                exercise: {
                  id: exercise.exercise.name,
                  name: exercise.exercise.name,
                  muscle_groups: [],
                  instructions: [],
                  equipment: null,
                },
                sets: exercise.sets.map((set) => ({
                  reps: set.reps,
                  weight: set.weight,
                  completed: true,
                  rest_seconds: set.rest_seconds,
                })),
                order_index: index,
              })),
            }));

          const aiService = AICoachService.getInstance();
          const newRecommendations = await aiService.analyzePerformance(
            recentWorkouts,
            userProfile
          );

          set({
            recommendations: newRecommendations,
            lastAnalysis: Date.now(),
            isAnalyzing: false,
          });
        } catch (error) {
          console.error("AI Analysis error:", error);
          set({ isAnalyzing: false });
        }
      },

      dismissRecommendation: (id) => {
        set((state) => ({
          recommendations: state.recommendations.map((rec) =>
            rec.id === id ? { ...rec, dismissed: true } : rec
          ),
        }));
      },

      clearRecommendations: () => {
        set({ recommendations: [] });
      },
    }),
    {
      name: "ai-coach-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        recommendations: state.recommendations.filter((r) => !r.dismissed),
        lastAnalysis: state.lastAnalysis,
      }),
    }
  )
);
