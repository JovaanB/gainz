import { Workout, WorkoutHistory, Set, Exercise } from '@/types';

export const isBodyweightExercise = (exercise: Exercise): boolean => {
  console.log({ exercise})
  return exercise.is_bodyweight || false;
};

export const getSuggestedWeight = (exerciseId: string): number => {
  return 0;
};

export const detectNewPRs = (completedWorkout: Workout, previousWorkouts: WorkoutHistory[]): any[] => {
  const newPRs: any[] = [];

  completedWorkout.exercises.forEach((exercise) => {
    const exerciseHistory = previousWorkouts
      .flatMap((workout) => workout.exercises)
      .filter((ex) => ex.exercise.id === exercise.exercise.id);

    exercise.sets.forEach((set) => {
      if (!set.weight || !set.reps) return;

      const isNewPR = !exerciseHistory.some(
        (ex) =>
          ex.sets.some(
            (s: Set) => s.weight && s.reps && s.weight >= set.weight! && s.reps >= set.reps!
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