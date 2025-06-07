// src/utils/workoutUtils.ts
import { Set, Exercise } from "@/types";

type WorkoutMode = "template" | "free";

// Fonction pour normaliser les exercices
export const normalizeExercise = (
  exercise: any,
  mode: WorkoutMode
): Exercise => {
  if (mode === "template") {
    return {
      id: exercise.exercise_id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes,
      progression_notes: exercise.progression_notes,
      muscle_groups: exercise.muscle_groups,
      category: exercise.category,
      is_bodyweight: exercise.is_bodyweight || false,
    };
  } else {
    return {
      id: exercise.exercise.id,
      name: exercise.exercise.name,
      sets: exercise.sets.length,
      reps: undefined,
      rest_seconds: 90,
      notes: undefined,
      progression_notes: undefined,
      muscle_groups: exercise.exercise.muscle_groups || [],
      category: exercise.exercise.category || "strength",
      is_bodyweight: exercise.exercise.is_bodyweight || false,
    };
  }
};

export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

export const formatReps = (reps: number | string) => {
  return typeof reps === "string" ? reps : reps.toString();
};

export const isSetReady = (set: Set) => {
  return (set.weight || 0) >= 0 && (set.reps || 0) > 0;
};
