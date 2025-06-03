// src/utils/workoutUtils.ts
import { Set, Exercise } from "@/types";
import { TemplateExercise } from "@/types/templates";
import { isBodyweightExercise as checkIsBodyweightExercise } from "./exerciseUtils";

const getMuscleGroupsFromExerciseId = (exerciseId: string): string[] => {
  // Mapping simple basé sur le nom de l'exercice
  if (
    exerciseId.includes("bench") ||
    exerciseId.includes("push") ||
    exerciseId.includes("chest")
  ) {
    return ["Pectoraux"];
  }
  if (
    exerciseId.includes("squat") ||
    exerciseId.includes("leg") ||
    exerciseId.includes("calf")
  ) {
    return ["Quadriceps", "Fessiers"];
  }
  if (
    exerciseId.includes("pull") ||
    exerciseId.includes("row") ||
    exerciseId.includes("deadlift") ||
    exerciseId.includes("lat")
  ) {
    return ["Dos", "Biceps"];
  }
  if (exerciseId.includes("curl") || exerciseId.includes("bicep")) {
    return ["Biceps"];
  }
  if (exerciseId.includes("tricep") || exerciseId.includes("dips")) {
    return ["Triceps", "Pectoraux"];
  }
  if (
    exerciseId.includes("shoulder") ||
    exerciseId.includes("overhead") ||
    exerciseId.includes("lateral") ||
    exerciseId.includes("press")
  ) {
    return ["Épaules", "Triceps"];
  }
  if (exerciseId.includes("romanian")) {
    return ["Ischio-jambiers", "Fessiers"];
  }
  return ["Corps entier"]; // Valeur par défaut
};

interface UnifiedExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
  rest_seconds?: number;
  notes?: string;
  progression_notes?: string;
}

type WorkoutMode = "template" | "free";

// Fonction pour normaliser les exercices
export const normalizeExercise = (
  exercise: any,
  mode: WorkoutMode
): Exercise => {
  if (mode === "template") {
    return {
      id: exercise.exercise_id,
      name: exercise.exercise_id.replace("_", " "),
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes,
      progression_notes: exercise.progression_notes,
      muscle_groups: getMuscleGroupsFromExerciseId(exercise.exercise_id),
      category: "strength",
      is_bodyweight: checkIsBodyweightExercise(exercise.exercise_id)
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
      is_bodyweight: exercise.exercise.is_bodyweight || false
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