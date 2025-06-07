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
    completeSet,
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

  // Données selon le mode
  const isProgramMode = mode === "program";

  // Initialisation des exercices selon le mode
  useEffect(() => {
    markPRsSeen();

    if (isProgramMode && programSession) {
      initializeProgramSession();
    } else if (!isProgramMode && !currentWorkout) {
      router.replace("/workout/new");
    }
  }, [isProgramMode, programSession, markPRsSeen]);

  const initializeProgramSession = async () => {
    if (!programSession) return;

    try {
      setIsLoading(true);
      const { sessionData } = programSession;

      // Convertir les exercices du programme vers le format unifié
      const convertedExercises: Exercise[] = sessionData.exercises.map(
        (exercise, index) => ({
          id: exercise.exercise_id,
          name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
          progression_notes: exercise.progression_notes,
          muscle_groups: [], // À remplir si nécessaire
          category: "strength", // Valeur par défaut
          is_bodyweight: exercise.is_bodyweight || false,
          order_index: index,
        })
      );

      setProgramExercises(convertedExercises);

      // Initialiser les données de session pour le mode programme
      const initialData: Record<string, any> = {};
      convertedExercises.forEach((exercise) => {
        initialData[exercise.id] = {
          sets: Array(exercise.sets)
            .fill(null)
            .map(() => ({
              weight: undefined,
              reps: undefined,
              completed: false,
              rest_seconds: exercise.rest_seconds,
            })),
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

  // Sélection des exercices selon le mode
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
            .map(() => ({
              weight: undefined,
              reps: undefined,
              completed: false,
              rest_seconds: exercise.rest_seconds,
            })),
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

  // Fonctions utilitaires
  const getSuggestedWeight = (exercise: Exercise): number => {
    if (isBodyweightExercise(exercise)) return 0;

    // Pas de suggestions pour les programmes (ils ont leurs propres objectifs)
    if (isProgramMode) return 0;

    const suggestionWeight = getProgressionSuggestion(exercise.id)?.currentBest
      .weight;

    const weightMap: { [key: string]: number } = {
      bench_press: 60,
      squat: 80,
      deadlift: 100,
      overhead_press: 40,
      barbell_row: 50,
      incline_dumbbell_press: 25,
      lateral_raises: 10,
      barbell_curls: 20,
    };

    return suggestionWeight || weightMap[exercise.id] || 20;
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
    value: number
  ) => {
    if (!currentExerciseId) return;

    if (isProgramMode) {
      setSessionData((prev) => ({
        ...prev,
        [currentExerciseId]: {
          ...prev[currentExerciseId],
          sets: prev[currentExerciseId].sets.map((set: any, index: number) =>
            index === setIndex ? { ...set, [field]: value } : set
          ),
        },
      }));
    } else if (currentWorkoutExercise) {
      updateSet(currentWorkoutExercise.id, setIndex, { [field]: value });
    }
  };

  const targets = getCurrentExerciseTargets();

  const handleSetCompleted = (
    setIndex: number,
    weight: number,
    reps: number
  ) => {
    if (!currentExerciseId) return;

    const isCardio =
      currentExerciseData?.name.toLowerCase().includes("course") ||
      currentExerciseData?.name.toLowerCase().includes("vélo") ||
      currentExerciseData?.name.toLowerCase().includes("corde");

    if (isProgramMode) {
      setSessionData((prev) => {
        const updatedSets = prev[currentExerciseId].sets.map(
          (set: any, index: number) =>
            index === setIndex
              ? {
                  ...set,
                  ...(isCardio
                    ? {
                        distance_km: weight,
                        duration_seconds: reps,
                        completed: true,
                      }
                    : { weight, reps, completed: true }),
                }
              : set
        );

        const allSetsCompleted = updatedSets.every((set: any) => set.completed);

        return {
          ...prev,
          [currentExerciseId]: {
            ...prev[currentExerciseId],
            sets: updatedSets,
            completed: allSetsCompleted,
          },
        };
      });
    } else if (currentWorkoutExercise) {
      if (isCardio) {
        updateSet(currentWorkoutExercise.id, setIndex, {
          distance_km: weight,
          duration_seconds: reps,
          completed: true,
        });
      } else {
        updateSet(currentWorkoutExercise.id, setIndex, {
          weight,
          reps,
          completed: true,
        });
      }
      completeSet(currentWorkoutExercise.id, setIndex);
    }

    const isLastSet = setIndex === targets.sets - 1;

    if (!isLastSet) {
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
        // Créer l'objet workout pour la détection de PRs et la sauvegarde
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

        // Compléter la session dans le store des programmes
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
        // Séance libre - utiliser la logique existante
        completedWorkoutData = await useWorkoutStore
          .getState()
          .saveAndFinalizeWorkout();
      }

      // Détection des PRs
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
    if (isProgramMode) {
      if (programExerciseIndex > 0) {
        setProgramExerciseIndex(programExerciseIndex - 1);
      }
    } else {
      goToPreviousExercise();
    }
  };

  const handleNextExercise = () => {
    const isCurrentExerciseCompleted = isProgramMode
      ? sessionData[currentExerciseId]?.completed
      : currentWorkoutExercise?.completed;

    if (effectiveExerciseIndex < exercises.length - 1) {
      if (isCurrentExerciseCompleted || !isProgramMode) {
        if (isProgramMode) {
          setProgramExerciseIndex(effectiveExerciseIndex + 1);
        } else {
          goToNextExercise();
        }
        startRestTimer(60);
      } else {
        Alert.alert(
          "Exercice non terminé",
          "Veuillez compléter l'exercice actuel avant de passer au suivant."
        );
      }
    } else {
      if (isCurrentExerciseCompleted || !isProgramMode) {
        handleSessionCompleted();
      } else {
        Alert.alert(
          "Exercice non terminé",
          "Veuillez compléter le dernier exercice avant de terminer la séance."
        );
      }
    }
  };

  const handleGoToExercise = (index: number) => {
    if (isProgramMode) {
      setProgramExerciseIndex(index);
    } else {
      if (!currentWorkout) {
        Alert.alert(
          "Erreur",
          "Aucune séance en cours. Veuillez commencer une nouvelle séance.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
        return;
      }
      goToExercise(index);
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
    goToExercise: handleGoToExercise,
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
  };
};
