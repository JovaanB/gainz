import { Workout, WorkoutHistory, Set } from '@/types';

export const isBodyweightExercise = (exerciseId: string): boolean => {
  const bodyweightExercises = [
    'pull-up',
    'push-up',
    'dip',
    'chin-up',
    'muscle-up',
    'handstand-push-up',
    'pistol-squat',
    'l-sit',
    'plank',
    'hollow-hold',
  ];
  return bodyweightExercises.includes(exerciseId);
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