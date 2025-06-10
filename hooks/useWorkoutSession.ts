import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useWorkoutStore } from "@/store/workoutStore";
import { useProgressStore } from "@/store/progressStore";
import { useProgramStore } from "@/store/programStore";
import { ProgramSessionDetail } from "@/services/programService";
import { Workout, Exercise } from "@/types";
import { normalizeExercise, formatReps } from "@/utils/workoutUtils";
import { isBodyweightExercise } from "@/utils/exerciseUtils";
import { generateUUID } from "@/utils/uuid";

// Interface pour les données de session de programme
interface ProgramSessionData {
  sessionId: string;
  programId: string;
  sessionData: ProgramSessionDetail;
}

type WorkoutMode = "free" | "program";

interface SupersetGroup {
  exercises: Exercise[];
  currentExerciseIndex: number;
  completed: boolean;
}

export const useWorkoutSession = (
  mode: WorkoutMode,
  programSession?: ProgramSessionData
) => {
  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, any>>({});
  const [programExerciseIndex, setProgramExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [programExercises, setProgramExercises] = useState<Exercise[]>([]);
  const [supersetGroups, setSupersetGroups] = useState<
    Record<string, SupersetGroup>
  >({});
  const timerRef = useRef<NodeJS.Timeout>();

  // Stores
  const {
    currentWorkout,
    restTimer,
    startRestTimer,
    stopRestTimer,
    updateRestTimer,
    addTimeToTimer,
    currentExerciseIndex,
    addSet,
    updateSet,
    removeSet,
    goToExercise,
    goToNextExercise,
    goToPreviousExercise,
    workoutHistory,
    addWorkoutToHistory,
  } = useWorkoutStore();

  const {
    getProgressionSuggestion,
    newPRs,
    markPRsSeen,
    detectNewPRs,
    updateProgress,
  } = useProgressStore();

  const { selectedProgram, completeSession: completeProgramSession } =
    useProgramStore();

  const isProgramMode = mode === "program";

  useEffect(() => {
    markPRsSeen();

    if (isProgramMode && programSession) {
      initializeProgramSession();
    } else if (!isProgramMode && !currentWorkout) {
      router.replace("/workout/new");
    }
  }, [isProgramMode, programSession, markPRsSeen]);

  const organizeSupersets = (exercises: Exercise[]) => {
    const groups: Record<string, SupersetGroup> = {};

    exercises.forEach((exercise) => {
      if (exercise.superset_group) {
        if (!groups[exercise.superset_group]) {
          groups[exercise.superset_group] = {
            exercises: [],
            currentExerciseIndex: 0,
            completed: false,
          };
        }
        groups[exercise.superset_group].exercises.push(exercise);
      }
    });

    Object.values(groups).forEach((group) => {
      group.exercises.sort(
        (a, b) => (a.superset_order || 0) - (b.superset_order || 0)
      );
    });

    return groups;
  };

  const initializeProgramSession = async () => {
    if (!programSession) return;

    try {
      setIsLoading(true);
      const { sessionData } = programSession;

      const convertedExercises: Exercise[] = sessionData.exercises.map(
        (exercise, index) => ({
          id: exercise.exercise_id,
          name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
          progression_notes: exercise.progression_notes,
          muscle_groups: [],
          category: "strength",
          is_bodyweight: exercise.is_bodyweight || false,
          order_index: index,
          superset_group: exercise.superset_group || undefined,
          superset_order: exercise.superset_order || undefined,
        })
      );

      setProgramExercises(convertedExercises);
      setSupersetGroups(organizeSupersets(convertedExercises));

      const initialData: Record<string, any> = {};
      convertedExercises.forEach((exercise) => {
        initialData[exercise.id] = {
          sets: Array(exercise.sets)
            .fill(null)
            .map(() => initialSet(exercise)),
          completed: false,
        };
      });
      setSessionData(initialData);
    } catch (error) {
      console.error("Error initializing program session:", error);
      Alert.alert("Erreur", "Impossible de charger la session du programme");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const rawExercises = isProgramMode
    ? programExercises
    : currentWorkout?.exercises || [];

  const exercises: Exercise[] = isProgramMode
    ? programExercises
    : rawExercises.map((exercise) => normalizeExercise(exercise, mode));

  const effectiveExerciseIndex = isProgramMode
    ? programExerciseIndex
    : currentExerciseIndex;

  const currentExerciseData = exercises[effectiveExerciseIndex];
  const currentExerciseId = currentExerciseData?.id;

  const currentWorkoutExercise = !isProgramMode
    ? currentWorkout?.exercises.find(
        (ex) => ex.exercise.id === currentExerciseData?.id
      )
    : undefined;

  const exerciseData = isProgramMode
    ? sessionData[currentExerciseId]
    : currentWorkoutExercise;

  const sessionTitle = isProgramMode
    ? programSession?.sessionData.name || "Session Programme"
    : currentWorkout?.name || "Séance Libre";

  const programTitle = isProgramMode
    ? selectedProgram?.name || "Programme"
    : undefined;

  // Effets
  useEffect(() => {
    if (workoutHistory.length > 0) {
      updateProgress(workoutHistory);
    }
  }, [workoutHistory, updateProgress]);

  useEffect(() => {
    if (
      isProgramMode &&
      exercises.length > 0 &&
      Object.keys(sessionData).length === 0 &&
      !isLoading
    ) {
      const initialData: Record<string, any> = {};
      exercises.forEach((exercise) => {
        initialData[exercise.id] = {
          sets: Array(exercise.sets)
            .fill(null)
            .map(() => initialSet(exercise)),
          completed: false,
        };
      });
      setSessionData(initialData);
    }
  }, [isProgramMode, exercises, isLoading]);

  useEffect(() => {
    if (restTimer.isActive) {
      timerRef.current = setInterval(() => {
        updateRestTimer();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [restTimer.isActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const getSuggestedWeight = (exercise: Exercise): number => {
    if (isBodyweightExercise(exercise)) return 0;

    if (isProgramMode) return 0;

    const suggestionWeight = getProgressionSuggestion(exercise.id)?.currentBest
      .weight;

    return suggestionWeight || 0;
  };

  const getCurrentExerciseTargets = () => {
    if (!currentExerciseData) {
      return {
        sets: 3,
        reps: "8-12",
        restSeconds: 90,
        notes: undefined,
        progressionNotes: undefined,
      };
    }

    return {
      sets: currentExerciseData.sets,
      reps: formatReps(currentExerciseData.reps || "8-12"),
      restSeconds: currentExerciseData.rest_seconds || 90,
      notes: currentExerciseData.notes,
      progressionNotes: currentExerciseData.progression_notes,
    };
  };

  const bodyWeightExercise = currentExerciseData
    ? isBodyweightExercise(currentExerciseData)
    : currentWorkoutExercise?.exercise.is_bodyweight === true;

  const getSessionProgress = () => {
    if (isProgramMode) {
      const completedCount = Object.values(sessionData).filter(
        (data: any) => data.completed
      ).length;
      return exercises.length > 0
        ? (completedCount / exercises.length) * 100
        : 0;
    } else {
      const completedCount =
        currentWorkout?.exercises?.filter((ex) => ex.completed).length || 0;
      const totalExercises = currentWorkout?.exercises?.length || 0;
      return totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
    }
  };

  // Handlers
  const updateSetData = (
    setIndex: number,
    field: "weight" | "reps" | "duration_seconds" | "distance_km",
    value: number,
    exerciseId?: string
  ) => {
    const targetExerciseId = exerciseId || currentExerciseId;
    if (!targetExerciseId) return;

    if (isProgramMode) {
      setSessionData((prev) => {
        const updatedSets = prev[targetExerciseId].sets.map(
          (set: any, index: number) =>
            index === setIndex
              ? {
                  ...set,
                  [field]: value,
                }
              : set
        );

        return {
          ...prev,
          [targetExerciseId]: {
            ...prev[targetExerciseId],
            sets: updatedSets,
          },
        };
      });
    } else if (currentWorkoutExercise) {
      updateSet(currentWorkoutExercise.id, setIndex, { [field]: value });
    }
  };

  const targets = getCurrentExerciseTargets();

  const handleSetCompleted = (
    setIndex: number,
    weight: number,
    reps: number,
    exerciseId?: string
  ) => {
    const targetExerciseId = exerciseId || currentExerciseId;
    if (!targetExerciseId) return;

    const isCardio = currentExerciseData?.category === "cardio";
    const currentExercise = exercises[effectiveExerciseIndex];
    const supersetGroup = currentExercise?.superset_group
      ? supersetGroups[currentExercise.superset_group]
      : null;

    if (isProgramMode) {
      setSessionData((prev) => {
        const updatedSets = prev[targetExerciseId].sets.map(
          (set: any, index: number) =>
            index === setIndex
              ? {
                  ...set,
                  ...(isCardio
                    ? {
                        duration_seconds: reps,
                        distance_km: weight,
                        completed: true,
                      }
                    : { weight, reps, completed: true }),
                }
              : set
        );

        const allSetsCompleted = updatedSets.every((set: any) => set.completed);

        if (supersetGroup && allSetsCompleted) {
          const allExercisesCompleted = supersetGroup.exercises.every(
            (ex) => prev[ex.id]?.completed
          );

          if (allExercisesCompleted) {
            setSupersetGroups((prev) => ({
              ...prev,
              [currentExercise.superset_group!]: {
                ...prev[currentExercise.superset_group!],
                completed: true,
              },
            }));
          }
        }

        return {
          ...prev,
          [targetExerciseId]: {
            ...prev[targetExerciseId],
            sets: updatedSets,
            completed: allSetsCompleted,
          },
        };
      });
    }

    const isLastSet = setIndex === targets.sets - 1;
    if (!isLastSet || !supersetGroup) {
      startRestTimer(targets.restSeconds);
    }
  };

  const handleExerciseCompleted = () => {
    if (effectiveExerciseIndex < exercises.length - 1) {
      if (currentExerciseId) {
        setSessionData((prev) => ({
          ...prev,
          [currentExerciseId]: {
            ...prev[currentExerciseId],
            completed: true,
          },
        }));
      }

      if (isProgramMode) {
        setProgramExerciseIndex(programExerciseIndex + 1);
      } else {
        goToNextExercise();
      }

      startRestTimer(60);
    } else {
      handleSessionCompleted();
    }
  };

  const handleSessionFinalCleanup = () => {
    markPRsSeen();
    if (!isProgramMode) {
      useWorkoutStore.getState().cancelWorkout();
    }
    router.replace("/(tabs)");
  };

  const handleSessionCompleted = async () => {
    try {
      let completedWorkoutData: Workout | null = null;
      let detectedNewPRs: any[] = [];

      if (isProgramMode) {
        const workoutToSave: Workout = {
          id: generateUUID(),
          name: sessionTitle,
          date: Date.now(),
          started_at: sessionStartTime,
          finished_at: Date.now(),
          exercises: exercises.map((exercise) => ({
            id: `${exercise.id}_${Date.now()}`,
            exercise: exercise,
            sets:
              sessionData[exercise.id]?.sets.map((set: any) => ({
                weight: set.weight,
                reps: set.reps,
                completed: set.completed,
                rest_seconds: exercise.rest_seconds,
              })) || [],
            completed: sessionData[exercise.id]?.completed || false,
            order_index: exercises.indexOf(exercise),
            notes: exercise.notes || "",
          })),
          completed: true,
          user_id: "current_user",
        };

        addWorkoutToHistory(workoutToSave);
        completedWorkoutData = workoutToSave;

        if (programSession) {
          const progressData = {
            sessionId: programSession.sessionId,
            date: Date.now(),
            duration: sessionDuration,
            exercises: Object.entries(sessionData).map(
              ([exerciseId, data]: [string, any]) => ({
                exerciseId,
                sets: data.sets,
              })
            ),
          };
          await completeProgramSession(progressData);
        }
      } else {
        completedWorkoutData = await useWorkoutStore
          .getState()
          .saveAndFinalizeWorkout();
      }

      if (completedWorkoutData) {
        const { workoutHistory: globalWorkoutHistory } =
          useWorkoutStore.getState();
        const previousWorkouts = globalWorkoutHistory.filter(
          (wh) => wh.id !== completedWorkoutData?.id
        );
        detectedNewPRs = detectNewPRs(completedWorkoutData, previousWorkouts);
      }

      useProgressStore.setState({ newPRs: detectedNewPRs });

      if (detectedNewPRs.length === 0) {
        handleSessionFinalCleanup();
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation de la séance:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la finalisation de la séance. Veuillez réessayer."
      );
      handleSessionFinalCleanup();
    }
  };

  const handleAddSet = () => {
    if (!currentExerciseId) return;

    const isCardio =
      currentExerciseData?.name.toLowerCase().includes("course") ||
      currentExerciseData?.name.toLowerCase().includes("vélo") ||
      currentExerciseData?.name.toLowerCase().includes("corde");

    if (isProgramMode) {
      setSessionData((prev) => {
        const lastSet =
          prev[currentExerciseId].sets[prev[currentExerciseId].sets.length - 1];
        const newSet = {
          ...(isCardio
            ? {
                duration_seconds: lastSet?.duration_seconds,
                distance_km: lastSet?.distance_km,
              }
            : {
                weight: lastSet?.weight,
                reps: lastSet?.reps,
              }),
          completed: false,
          rest_seconds: currentExerciseData?.rest_seconds || 90,
        };

        return {
          ...prev,
          [currentExerciseId]: {
            ...prev[currentExerciseId],
            sets: [...prev[currentExerciseId].sets, newSet],
          },
        };
      });
    } else if (currentWorkoutExercise) {
      addSet(currentWorkoutExercise.id);
    }
  };

  const handleRemoveSet = (setIndex: number) => {
    if (!currentExerciseId) return;

    if (isProgramMode) {
      if (sessionData[currentExerciseId].sets.length <= 1) return;

      setSessionData((prev) => ({
        ...prev,
        [currentExerciseId]: {
          ...prev[currentExerciseId],
          sets: prev[currentExerciseId].sets.filter(
            (_: any, index: number) => index !== setIndex
          ),
        },
      }));
    } else if (currentWorkoutExercise) {
      Alert.alert(
        "Supprimer la série ?",
        "Cette action ne peut pas être annulée.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => removeSet(currentWorkoutExercise.id, setIndex),
          },
        ]
      );
    }
  };

  const handlePreviousExercise = () => {
    const currentExercise = exercises[effectiveExerciseIndex];
    const isInSuperset = !!currentExercise?.superset_group;

    if (isInSuperset) {
      // Si on est dans un superset, on trouve l'exercice précédant le superset
      const supersetGroup = supersetGroups[currentExercise.superset_group!];
      const firstExerciseInSuperset = supersetGroup.exercises.reduce(
        (first, current) =>
          (current.superset_order || 0) < (first.superset_order || 0)
            ? current
            : first
      );
      const firstSupersetIndex = exercises.findIndex(
        (ex) => ex.id === firstExerciseInSuperset.id
      );

      // On va à l'exercice précédant le superset
      const prevIndex = firstSupersetIndex - 1;
      if (prevIndex >= 0) {
        if (isProgramMode) {
          setProgramExerciseIndex(prevIndex);
        } else {
          goToExercise(prevIndex);
        }
      }
    } else {
      // Navigation normale pour les exercices non-superset
      if (isProgramMode) {
        if (programExerciseIndex > 0) {
          setProgramExerciseIndex(programExerciseIndex - 1);
        }
      } else {
        goToPreviousExercise();
      }
    }
  };

  const handleNextExercise = () => {
    const currentExercise = exercises[effectiveExerciseIndex];
    const isInSuperset = !!currentExercise?.superset_group;

    if (isInSuperset) {
      const supersetGroup = supersetGroups[currentExercise.superset_group!];
      const lastExerciseInSuperset = supersetGroup.exercises.reduce(
        (last, current) =>
          (current.superset_order || 0) < (last.superset_order || 0)
            ? current
            : last
      );

      const lastSupersetIndex = exercises.findIndex(
        (ex) => ex.id === lastExerciseInSuperset.id
      );

      // On va à l'exercice après le superset
      const nextIndex = lastSupersetIndex + 1;
      if (nextIndex < exercises.length) {
        if (isProgramMode) {
          setProgramExerciseIndex(nextIndex);
        } else {
          goToExercise(nextIndex);
        }
        startRestTimer(60);
      } else {
        handleSessionCompleted();
      }
    } else {
      // Navigation normale pour les exercices non-superset
      const nextIndex = effectiveExerciseIndex + 1;
      if (nextIndex < exercises.length) {
        if (isProgramMode) {
          setProgramExerciseIndex(nextIndex);
        } else {
          goToExercise(nextIndex);
        }
        startRestTimer(60);
      } else {
        handleSessionCompleted();
      }
    }
  };

  const isCardio = (ex: Exercise) => ex.category === "cardio";

  const initialSet = (exercise: Exercise) => {
    if (isCardio(exercise)) {
      return {
        duration_seconds: undefined,
        distance_km: undefined,
        completed: false,
        rest_seconds: exercise.rest_seconds,
      };
    }
    return {
      weight: undefined,
      reps: undefined,
      completed: false,
      rest_seconds: exercise.rest_seconds,
    };
  };

  // Fonction pour obtenir les exercices du superset actuel
  const getCurrentSupersetExercises = () => {
    const currentExercise = exercises[effectiveExerciseIndex];
    if (!currentExercise?.superset_group) return [currentExercise];

    const supersetGroup = supersetGroups[currentExercise.superset_group];
    return supersetGroup?.exercises || [currentExercise];
  };

  const getExerciseData = (exerciseId: string) => {
    if (isProgramMode) {
      const exerciseData = sessionData[exerciseId];
      const exercise = exercises.find((ex) => ex.id === exerciseId);
      return {
        ...exerciseData,
        progression_notes: exercise?.progression_notes,
      };
    } else {
      return currentWorkout?.exercises.find(
        (ex) => ex.exercise.id === exerciseId
      );
    }
  };

  return {
    sessionDuration,
    sessionTitle,
    programTitle,
    exercises,
    effectiveExerciseIndex,
    currentExerciseData,
    exerciseData,
    restTimer,
    newPRs,
    isProgramMode,
    isLoading,
    targets,
    currentWorkout,
    getSuggestedWeight,
    bodyWeightExercise,
    getCurrentExerciseTargets,
    sessionProgress: getSessionProgress(),
    getProgressionSuggestion: isProgramMode
      ? () => null
      : getProgressionSuggestion,
    updateSetData,
    handleSetCompleted,
    handleAddSet,
    handleRemoveSet,
    handleExerciseCompleted,
    handleSessionCompleted,
    handlePreviousExercise,
    handleNextExercise,
    startRestTimer,
    stopRestTimer,
    addTimeToTimer,
    addSet,
    removeSet,
    markPRsSeen,
    completedExercises: isProgramMode
      ? Object.fromEntries(
          Object.entries(sessionData).map(([id, data]) => [id, data.completed])
        )
      : Object.fromEntries(
          exercises.map((ex) => {
            const workoutExercise = currentWorkout?.exercises.find(
              (e) => e.exercise.id === ex.id
            );
            const allSetsCompleted =
              workoutExercise?.sets.every((set) => set.completed) || false;
            return [ex.id, allSetsCompleted];
          })
        ),
    handleSessionFinalCleanup,
    getCurrentSupersetExercises,
    getExerciseData,
    isSuperset: !!currentExerciseData?.superset_group,
  };
};
