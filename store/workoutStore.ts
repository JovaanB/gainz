//store/workoutStore.ts
import { create } from "zustand";
import { Workout, WorkoutExercise, Set, Exercise } from "@/types";
import {
  TemplateExercise,
  ProgramProgress,
  TemplateSession,
} from "@/types/templates";
import { hybridStorage } from "@/services/hybridStorage";
import { useTemplateStore } from "@/store/templateStore";
import { isBodyweightExercise } from "@/utils/exerciseUtils";
import { useAuthStore } from "./authStore";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import { TemplateExerciseDetail } from "@/services/templateService";

interface ProgramSet {
  weight: number;
  reps: number;
  completed: boolean;
  duration_seconds?: number;
  rest_seconds?: number;
}

interface WorkoutStore {
  currentWorkout: Workout | null;
  currentWorkoutExercise: Exercise | null;
  workoutHistory: Workout[];
  isRecording: boolean;
  isLoading: boolean;
  currentExerciseIndex: number;
  restTimer: {
    isActive: boolean;
    timeLeft: number;
    duration: number;
  };
  workoutType: "free" | "template";
  templateSessionId?: string;
  syncStatus: {
    pending: number;
    synced: number;
    isOnline: boolean;
    lastSync: number | null;
  };

  startWorkout: (name: string, selectedExercises: Exercise[]) => void;
  finishWorkout: () => Promise<Workout>;
  cancelWorkout: () => void;
  clearCurrentWorkout: () => void;
  addExerciseToWorkout: (exercise: WorkoutExercise) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    setData: Partial<Set>
  ) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;
  completeExercise: (exerciseId: string) => void;
  completeWorkout: () => void;
  goToNextExercise: () => void;
  goToExercise: (index: number) => void;
  goToPreviousExercise: () => void;
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  updateRestTimer: () => void;
  addTimeToTimer: (seconds: number) => void;
  loadWorkoutHistory: () => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  startTemplateWorkout: (
    sessionId: string,
    exercises: TemplateExercise[]
  ) => void;
  convertTemplateToWorkout: (
    templateExercises: TemplateExercise[]
  ) => WorkoutExercise[];
  updateTemplateProgress: (
    exerciseId: string,
    setIndex: number,
    data: any
  ) => void;
  saveAndFinalizeWorkout: () => Promise<Workout>;
  addWorkoutToHistory: (workout: Workout) => void;
  getSyncStatus: () => Promise<void>;
  forceSyncAll: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: null,
  currentWorkoutExercise: null,
  workoutHistory: [],
  isRecording: false,
  isLoading: false,
  currentExerciseIndex: 0,
  restTimer: {
    isActive: false,
    timeLeft: 0,
    duration: 90,
  },
  workoutType: "free",
  templateSessionId: undefined,
  syncStatus: {
    pending: 0,
    synced: 0,
    isOnline: true,
    lastSync: null,
  },

  startWorkout: (name: string, selectedExercises: Exercise[]) => {
    if (!selectedExercises || selectedExercises.length === 0) {
      console.error("Aucun exercice sélectionné pour démarrer la séance");
      return;
    }

    const { user } = useAuthStore.getState();
    const userId = user?.id || "temp-user";

    const workoutExercises: WorkoutExercise[] = selectedExercises.map(
      (exercise, index) => ({
        id: generateUUID(),
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
        completed: false,
        order_index: index,
        notes: "",
      })
    );

    const workout: Workout = {
      id: generateUUID(),
      name,
      date: Date.now(),
      started_at: Date.now(),
      exercises: workoutExercises,
      completed: false,
      user_id: userId,
    };

    set({
      currentWorkout: workout,
      isRecording: true,
      currentExerciseIndex: 0,
      currentWorkoutExercise: workoutExercises[0].exercise,
      workoutType: "free" as const,
    });

    // Vérification après la mise à jour
    const { currentWorkout } = get();
    if (!currentWorkout) {
      console.error(
        "Erreur: currentWorkout n'a pas été correctement initialisé"
      );
    }
  },

  saveAndFinalizeWorkout: async (): Promise<Workout> => {
    const { currentWorkout, workoutHistory } = get();
    if (!currentWorkout) {
      throw new Error("Aucune séance en cours à finaliser");
    }
    try {
      const finishedWorkout = {
        ...currentWorkout,
        finished_at: Date.now(),
        completed: true,
      };
      await hybridStorage.saveWorkout(finishedWorkout);
      const updatedHistory = [finishedWorkout, ...workoutHistory];
      set({
        workoutHistory: updatedHistory,
      });

      get().getSyncStatus();

      return finishedWorkout;
    } catch (error) {
      console.error("Error saving and finalizing workout:", error);
      throw error;
    }
  },

  finishWorkout: async (): Promise<Workout> => {
    // Cette fonction est principalement appelée par handleSessionCompleted
    // Elle déclenchera la sauvegarde et la détection de PRs
    const finalizedWorkout = await get().saveAndFinalizeWorkout();
    return finalizedWorkout; // Retourner le workout finalisé
    // Le nettoyage de l'état (currentWorkout = null) se fera plus tard via handleSessionFinalCleanup
  },

  cancelWorkout: () => {
    // Cette fonction sera utilisée par handleSessionFinalCleanup pour nettoyer l'état de la séance en cours
    set({
      currentWorkout: null,
      isRecording: false,
      currentExerciseIndex: 0,
      restTimer: { isActive: false, timeLeft: 0, duration: 90 },
      // Ne pas toucher à workoutHistory ici
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

  updateSet: (exerciseId: string, setIndex: number, setData: Partial<Set>) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const isCardioEx = isCardio(ex.exercise);
        const updatedSets = [...ex.sets];
        if (isCardioEx) {
          updatedSets[setIndex] = {
            ...updatedSets[setIndex],
            ...setData,
            duration_seconds: setData.duration_seconds,
            distance_km: setData.distance_km,
          };
        } else {
          updatedSets[setIndex] = { ...updatedSets[setIndex], ...setData };
        }
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
        const isCardioEx = isCardio(ex.exercise);
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = isCardioEx
          ? {
              duration_seconds: lastSet?.duration_seconds,
              distance_km: lastSet?.distance_km,
              completed: false,
              rest_seconds: 90,
            }
          : {
              reps: lastSet?.reps,
              weight: lastSet?.weight,
              completed: false,
              rest_seconds: 90,
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

  completeExercise: (exerciseId) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout!,
        exercises: state.currentWorkout!.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? { ...exercise, completed: true }
            : exercise
        ),
      },
    }));
  },

  completeWorkout: () => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    set((state) => ({
      currentWorkout: {
        ...state.currentWorkout!,
        completed: true,
      },
    }));
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
      currentWorkoutExercise: currentWorkout.exercises[nextIndex].exercise,
    });
  },

  goToExercise: (nextIndex: number) => {
    const { currentWorkout, workoutType } = get();

    if (!currentWorkout) {
      return;
    }

    if (nextIndex < 0 || nextIndex >= currentWorkout.exercises.length) {
      return;
    }

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
      currentWorkoutExercise: currentWorkout.exercises[nextIndex].exercise,
    });

    // Vérification après la mise à jour
    const { currentWorkout: updatedWorkout } = get();
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
      currentWorkoutExercise: currentWorkout.exercises[prevIndex].exercise,
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

  addTimeToTimer: (seconds) => {
    const { restTimer } = get();
    if (restTimer.isActive) {
      set({
        restTimer: {
          ...restTimer,
          timeLeft: restTimer.timeLeft + seconds,
          duration: restTimer.duration + seconds,
        },
      });
    }
  },

  loadWorkoutHistory: async () => {
    try {
      set({ isLoading: true });
      const freeWorkouts = await hybridStorage.getWorkouts();

      // Récupérer les séances de programme depuis le templateStore
      const { currentProgram, selectedTemplate } = useTemplateStore.getState();
      let programWorkouts: Workout[] = [];

      if (currentProgram && selectedTemplate) {
        programWorkouts = currentProgram.progressHistory
          .map((session: ProgramProgress) => {
            const templateSession =
              selectedTemplate.exercises?.find(
                (s: TemplateExerciseDetail) => s.id === session.sessionId
              ) || [];

            if (!templateSession) {
              console.warn(
                `Session template not found for sessionId: ${session.sessionId}`
              );
              return null;
            }

            return {
              id: generateUUID(),
              name: (templateSession as TemplateExerciseDetail).exercise_name,
              date: session.date,
              started_at: session.date,
              finished_at: session.date + (session.duration || 0) * 1000,
              exercises: session.exercises.map((ex) => {
                const muscleGroups = getMuscleGroupsFromExerciseId(
                  ex.exerciseId
                );
                const exercise: Exercise = {
                  id: ex.exerciseId,
                  name: ex.exerciseId
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  muscle_groups: muscleGroups,
                  category: "strength",
                  is_bodyweight: isBodyweightExercise(
                    ex as unknown as Exercise
                  ),
                  sets: ex.sets.length,
                  reps: "0",
                  rest_seconds: 90,
                  order_index: 0,
                };
                return {
                  id: ex.exerciseId,
                  exercise,
                  sets: ex.sets.map((set: ProgramSet) => ({
                    ...set,
                    rest_seconds: set.rest_seconds || 90,
                  })),
                  completed: true,
                  order_index: 0,
                  notes: "",
                };
              }),
              completed: true,
              user_id: "temp-user",
              is_template: true,
              template_id: currentProgram.templateId,
              template_session_id: session.sessionId,
            };
          })
          .filter((w): w is NonNullable<typeof w> => w !== null);
      }

      // Combiner les séances libres et les séances de programme
      const allWorkouts = [...freeWorkouts, ...programWorkouts].sort(
        (a, b) => b.started_at - a.started_at
      );

      set({ workoutHistory: allWorkouts });

      get().getSyncStatus();
    } catch (error) {
      console.error("Error loading workout history:", error);
      const freeWorkouts = await hybridStorage.getWorkouts();
      set({ workoutHistory: freeWorkouts });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkout: async (workoutId: string) => {
    try {
      await hybridStorage.deleteWorkout(workoutId);
      const updatedHistory = get().workoutHistory.filter(
        (w) => w.id !== workoutId
      );
      set({ workoutHistory: updatedHistory });

      get().getSyncStatus();
    } catch (error) {
      console.error("Error deleting workout:", error);
      throw error;
    }
  },

  startTemplateWorkout: (sessionId, templateExercises) => {
    const convertedExercises =
      get().convertTemplateToWorkout(templateExercises);

    const workout = {
      id: generateUUID(),
      name: `Session ${sessionId}`,
      date: Date.now(),
      started_at: Date.now(),
      exercises: convertedExercises,
      completed: false,
      user_id: "temp-user",
    };

    set({
      workoutType: "template",
      templateSessionId: sessionId,
      currentWorkout: workout,
      currentWorkoutExercise: convertedExercises[0].exercise,
      currentExerciseIndex: 0,
      isRecording: true,
    });

    // Vérification après la mise à jour
    const { currentWorkout } = get();
    if (!currentWorkout) {
      console.error(
        "Erreur: currentWorkout n'a pas été correctement initialisé"
      );
    }
  },

  convertTemplateToWorkout: (
    templateExercises: TemplateExercise[]
  ): WorkoutExercise[] => {
    return templateExercises.map((templateExercise, index) => {
      const exerciseId = isValidUUID(templateExercise.exercise_id)
        ? templateExercise.exercise_id
        : generateUUID();

      return {
        id: generateUUID(),
        exercise: {
          id: exerciseId,
          name:
            templateExercise.name ||
            templateExercise.exercise_id
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          muscle_groups: [],
          category: "strength" as const,
          is_bodyweight: templateExercise.is_bodyweight || false,
          sets: templateExercise.sets,
          reps: "0",
          rest_seconds: 90,
          order_index: 0,
        },
        sets: Array(templateExercise.sets)
          .fill(null)
          .map(() => ({
            reps: undefined,
            weight: undefined,
            completed: false,
            rest_seconds: templateExercise.rest_seconds,
          })),
        completed: false,
        order_index: index,
        notes: templateExercise.notes || "",
        template_data: templateExercise,
      };
    });
  },

  updateTemplateProgress: (exerciseId, setIndex, data) => {
    const { currentWorkout } = get();
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.exercise.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], ...data };
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

  addWorkoutToHistory: (workout: Workout) => {
    set((state) => ({
      workoutHistory: [workout, ...state.workoutHistory],
    }));
  },

  getSyncStatus: async () => {
    try {
      const status = await hybridStorage.getSyncStatus();
      set({
        syncStatus: {
          ...get().syncStatus,
          pending: status.pending,
          synced: status.synced,
          lastSync: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
    }
  },

  forceSyncAll: async () => {
    try {
      await hybridStorage.forceSyncAll();
      // Actualiser le statut après la sync
      get().getSyncStatus();
    } catch (error) {
      console.error("Error forcing sync:", error);
      throw error;
    }
  },
}));

// À ajouter dans votre workoutStore.ts (avant la fonction create)

const getMuscleGroupsFromExerciseId = (exerciseId: string): string[] => {
  // Mapping simple basé sur le nom de l'exercice
  if (
    exerciseId.includes("bench") ||
    exerciseId.includes("push") ||
    exerciseId.includes("chest")
  ) {
    return ["chest"];
  }
  if (
    exerciseId.includes("squat") ||
    exerciseId.includes("leg") ||
    exerciseId.includes("calf")
  ) {
    return ["legs"];
  }
  if (
    exerciseId.includes("pull") ||
    exerciseId.includes("row") ||
    exerciseId.includes("deadlift") ||
    exerciseId.includes("lat")
  ) {
    return ["back"];
  }
  if (exerciseId.includes("curl") || exerciseId.includes("bicep")) {
    return ["biceps"];
  }
  if (exerciseId.includes("tricep") || exerciseId.includes("dips")) {
    return ["triceps"];
  }
  if (
    exerciseId.includes("shoulder") ||
    exerciseId.includes("overhead") ||
    exerciseId.includes("lateral") ||
    exerciseId.includes("press")
  ) {
    return ["shoulders"];
  }
  if (exerciseId.includes("romanian")) {
    return ["legs", "glutes"];
  }
  return ["full_body"]; // Valeur par défaut
};

const isCardio = (ex: Exercise) => ex.category === "cardio";
