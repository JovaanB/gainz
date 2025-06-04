import { Workout, WorkoutHistory, Set, Exercise } from "@/types";

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s]/g, "") // Supprimer caractères spéciaux
    .replace(/\s+/g, " "); // Normaliser les espaces
}

export function exerciseNamesMatch(name1: string, name2: string): boolean {
  return normalizeExerciseName(name1) === normalizeExerciseName(name2);
}

export const isBodyweightExercise = (exercise: Exercise): boolean => {
  return exercise.is_bodyweight || false;
};

export const getSuggestedWeight = (exerciseId: string): number => {
  return 0;
};

export const detectNewPRs = (
  completedWorkout: Workout,
  previousWorkouts: WorkoutHistory[]
): any[] => {
  const newPRs: any[] = [];

  completedWorkout.exercises.forEach((exercise) => {
    const exerciseHistory = previousWorkouts
      .flatMap((workout) => workout.exercises)
      .filter((ex) => ex.exercise.id === exercise.exercise.id);

    exercise.sets.forEach((set) => {
      if (!set.weight || !set.reps) return;

      const isNewPR = !exerciseHistory.some((ex) =>
        ex.sets.some(
          (s: Set) =>
            s.weight && s.reps && s.weight >= set.weight! && s.reps >= set.reps!
        )
      );

      if (isNewPR) {
        newPRs.push({
          exerciseId: exercise.exercise.id,
          exerciseName: exercise.exercise.name,
          weight: set.weight,
          reps: set.reps,
        });
      }
    });
  });

  return newPRs;
};
