import { create } from "zustand";
import { Workout, WorkoutExercise, WorkoutSet, Exercise } from "@/types";
import { StorageService } from "@/services/storage";
import { useToastStore } from "./toastStore";

interface WorkoutStore {
  currentWorkout: Workout | null;
  workoutHistory: Workout[];
  isRecording: boolean;
  isLoading: boolean;
  currentExerciseIndex: number;
  restTimer: {
    isActive: boolean;
    timeLeft: number;
    duration: number;
  };

  startWorkout: (name: string, selectedExercises: Exercise[]) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  clearCurrentWorkout: () => void;
  addExerciseToWorkout: (exercise: WorkoutExercise) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    setData: Partial<WorkoutSet>
  ) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;
  goToNextExercise: () => void;
  goToPreviousExercise: () => void;
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  updateRestTimer: () => void;
  loadWorkoutHistory: () => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  isRecording: false,
  isLoading: false,
  currentExerciseIndex: 0,
  restTimer: {
    isActive: false,
    timeLeft: 0,
    duration: 90, // 90 secondes par défaut
  },

  startWorkout: (name: string, selectedExercises: Exercise[]) => {
    const workoutExercises: WorkoutExercise[] = selectedExercises.map(
      (exercise, index) => ({
        id: `${exercise.id}_${Date.now()}_${index}`,
        exercise,
        sets: [
          {
            reps: undefined,
            weight: undefined,
            duration_seconds: undefined,
            distance_km: undefined,
            rest_seconds: 90,
            completed: false,
          },
        ],
        order_index: index,
        notes: "",
      })
    );

    const workout: Workout = {
      id: `workout_${Date.now()}`,
      user_id: "temp-user",
      name,
      started_at: Date.now(),
      exercises: workoutExercises,
    };

    set({
      currentWorkout: workout,
      isRecording: true,
      currentExerciseIndex: 0,
    });
  },

  finishWorkout: async () => {
    const { currentWorkout, workoutHistory } = get();
    if (!currentWorkout) return;

    try {
      const finishedWorkout = {
        ...currentWorkout,
        finished_at: Date.now(),
      };

      await StorageService.saveWorkout(finishedWorkout);

      const updatedHistory = [finishedWorkout, ...workoutHistory];

      set({
        currentWorkout: finishedWorkout,
        isRecording: false,
        currentExerciseIndex: 0,
        workoutHistory: updatedHistory,
        restTimer: { isActive: false, timeLeft: 0, duration: 90 },
      });
    } catch (error) {
      console.error("Error finishing workout:", error);
    }
  },

  cancelWorkout: () => {
    set({
      currentWorkout: null,
      isRecording: false,
      currentExerciseIndex: 0,
      restTimer: { isActive: false, timeLeft: 0, duration: 90 },
    });
  },

  clearCurrentWorkout: () => {
    set({ currentWorkout: null });
  },

  addExerciseToWorkout: (exercise: WorkoutExercise) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, exercise],
    };

    set({ currentWorkout: updatedWorkout });
  },

  updateSet: (
    exerciseId: string,
    setIndex: number,
    setData: Partial<WorkoutSet>
  ) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], ...setData };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });
  },

  addSet: (exerciseId: string) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          reps: lastSet?.reps,
          weight: lastSet?.weight,
          duration_seconds: lastSet?.duration_seconds,
          distance_km: lastSet?.distance_km,
          rest_seconds: 90,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    });

    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });
  },

  removeSet: (exerciseId: string, setIndex: number) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId && ex.sets.length > 1) {
        const updatedSets = ex.sets.filter((_, index) => index !== setIndex);
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });
  },

  completeSet: (exerciseId: string, setIndex: number) => {
    const { currentWorkout, startRestTimer } = get();
    if (!currentWorkout) return;

    // Marque la série comme terminée
    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], completed: true };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });

    const currentExercise = updatedExercises.find((ex) => ex.id === exerciseId);
    const restDuration = currentExercise?.sets[setIndex]?.rest_seconds || 90;
    startRestTimer(restDuration);
  },

  goToNextExercise: () => {
    const { currentWorkout, currentExerciseIndex } = get();
    if (!currentWorkout) return;

    const nextIndex = Math.min(
      currentExerciseIndex + 1,
      currentWorkout.exercises.length - 1
    );

    const updatedExercises = currentWorkout.exercises.map((exercise, index) => {
      if (index === nextIndex) {
        const updatedSets = exercise.sets.map((set) => {
          if (!set.completed) {
            return {
              ...set,
              reps: undefined,
              weight: undefined,
            };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });

    set({
      currentExerciseIndex: nextIndex,
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });
  },

  goToPreviousExercise: () => {
    const { currentWorkout, currentExerciseIndex } = get();
    if (!currentWorkout) return;

    const prevIndex = Math.max(currentExerciseIndex - 1, 0);

    const updatedExercises = currentWorkout.exercises.map((exercise, index) => {
      if (index === prevIndex) {
        const updatedSets = exercise.sets.map((set) => {
          if (!set.completed) {
            return {
              ...set,
              reps: undefined,
              weight: undefined,
            };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });

    set({
      currentExerciseIndex: prevIndex,
      currentWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    });
  },

  startRestTimer: (duration: number) => {
    set({
      restTimer: {
        isActive: true,
        timeLeft: duration,
        duration,
      },
    });
  },

  stopRestTimer: () => {
    set({
      restTimer: {
        ...get().restTimer,
        isActive: false,
        timeLeft: 0,
      },
    });
  },

  updateRestTimer: () => {
    const { restTimer } = get();
    if (restTimer.isActive && restTimer.timeLeft > 0) {
      set({
        restTimer: {
          ...restTimer,
          timeLeft: restTimer.timeLeft - 1,
        },
      });
    } else if (restTimer.timeLeft <= 0) {
      set({
        restTimer: {
          ...restTimer,
          isActive: false,
        },
      });
    }
  },

  loadWorkoutHistory: async () => {
    try {
      set({ isLoading: true });
      const workouts = await StorageService.getWorkouts();
      set({ workoutHistory: workouts });
    } catch (error) {
      console.error("Error loading workout history:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkout: async (workoutId: string) => {
    try {
      await StorageService.deleteWorkout(workoutId);
      const updatedHistory = get().workoutHistory.filter(
        (w) => w.id !== workoutId
      );
      set({ workoutHistory: updatedHistory });
    } catch (error) {
      console.error("Error deleting workout:", error);
      throw error;
    }
  },
}));
