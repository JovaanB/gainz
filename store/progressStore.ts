// store/progressStore.ts
import { create } from "zustand";
import {
  PersonalRecord,
  ProgressionSuggestion,
  ProgressCalculator,
} from "@/utils/progressCalculations";
import { Workout } from "@/types";

interface ProgressStore {
  personalRecords: PersonalRecord[];
  progressionSuggestions: Map<string, ProgressionSuggestion>;
  newPRs: PersonalRecord[];
  progressStats: {
    recentWorkouts: number;
    volumeChange: number;
    avgDuration: number;
  };

  updateProgress: (workouts: Workout[]) => void;
  getProgressionSuggestion: (
    exerciseId: string
  ) => ProgressionSuggestion | null;
  markPRsSeen: () => void;
  detectNewPRs: (
    completedWorkout: Workout,
    previousWorkouts: Workout[]
  ) => PersonalRecord[];
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  personalRecords: [],
  progressionSuggestions: new Map(),
  newPRs: [],
  progressStats: {
    recentWorkouts: 0,
    volumeChange: 0,
    avgDuration: 0,
  },

  updateProgress: (workouts: Workout[]) => {
    const records = ProgressCalculator.findPersonalRecords(workouts);
    const stats = ProgressCalculator.calculateProgressStats(workouts);

    // Génère les suggestions pour les exercices récents
    const suggestions = new Map<string, ProgressionSuggestion>();

    // Trouve les exercices des 3 dernières séances
    const recentExercises = new Set<string>();
    workouts
      .filter((w) => w.finished_at)
      .sort((a, b) => b.started_at - a.started_at)
      .slice(0, 3)
      .forEach((workout) => {
        workout.exercises.forEach((ex) => {
          recentExercises.add(ex.exercise.id);
        });
      });

    // Génère les suggestions
    recentExercises.forEach((exerciseId) => {
      const suggestion = ProgressCalculator.generateProgressionSuggestions(
        workouts,
        exerciseId
      );
      if (suggestion) {
        suggestions.set(exerciseId, suggestion);
      }
    });

    set({
      personalRecords: records,
      progressionSuggestions: suggestions,
      progressStats: stats,
    });
  },

  getProgressionSuggestion: (exerciseId: string) => {
    return get().progressionSuggestions.get(exerciseId) || null;
  },

  markPRsSeen: () => {
    set({ newPRs: [] });
  },

  detectNewPRs: (completedWorkout: Workout, previousWorkouts: Workout[]) => {
    const newPRs = ProgressCalculator.detectNewPRs(
      completedWorkout,
      previousWorkouts
    );

    set({ newPRs });

    return newPRs;
  },
}));
