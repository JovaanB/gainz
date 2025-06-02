import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTemplateStore } from '@/store/templateStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useProgressStore } from '@/store/progressStore';
import { Workout, Exercise,  } from '@/types';
import {
  normalizeExercise,
  formatReps,
  isBodyweightExercise,
} from '@/utils/workoutUtils';

interface UnifiedExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
  rest_seconds?: number;
  notes?: string;
  progression_notes?: string;
  muscle_groups: string[];
  category: string;
  is_bodyweight: boolean;
}

type WorkoutMode = 'template' | 'free';

export const useWorkoutSession = (mode: WorkoutMode) => {
  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, any>>({});
  const [templateExerciseIndex, setTemplateExerciseIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Stores
  const { selectedTemplate, getCurrentSession, completeSession } = useTemplateStore();
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
    startTemplateWorkout,
    addWorkoutToHistory,
  } = useWorkoutStore();

  const {
    getProgressionSuggestion,
    newPRs,
    markPRsSeen,
    detectNewPRs,
    updateProgress,
  } = useProgressStore();

  // Données selon le mode
  const isTemplateMode = mode === 'template';
  const currentSession = isTemplateMode ? getCurrentSession() : null;

  // Vérification de l'état initial
  useEffect(() => {
    // Réinitialiser l'état des nouveaux PRs au chargement de la session pour éviter l'affichage persistant.
    markPRsSeen();

    if (isTemplateMode) {
      const currentSession = getCurrentSession();
      
      if (!currentSession) {
        console.error("Aucune session template trouvée");
        router.replace("/");
        return;
      }

      // Vérifier si la séance est déjà initialisée
      if (!currentWorkout) {
        startTemplateWorkout(currentSession.id, currentSession.exercises);
      }
    } else if (!currentWorkout) {
      router.replace("/workout/new");
    }
  }, [isTemplateMode, markPRsSeen]);

  const rawExercises = isTemplateMode
    ? currentSession?.exercises || []
    : currentWorkout?.exercises || [];

  const exercises: Exercise[] = rawExercises.map((exercise) =>
    normalizeExercise(exercise, mode)
  );

  const effectiveExerciseIndex = isTemplateMode
    ? templateExerciseIndex
    : currentExerciseIndex;

  const currentExerciseData = exercises[effectiveExerciseIndex];
  const currentExerciseId = currentExerciseData?.id;

  const currentWorkoutExercise = !isTemplateMode
    ? currentWorkout?.exercises.find((ex) => ex.exercise.id === currentExerciseData?.id)
    : undefined;

  const exerciseData = isTemplateMode
    ? sessionData[currentExerciseId]
    : currentWorkoutExercise;

  const sessionTitle = isTemplateMode
    ? currentSession?.name || 'Session Template'
    : currentWorkout?.name || 'Séance Libre';

  const programTitle = isTemplateMode ? selectedTemplate?.name : undefined;

  // Effets
  useEffect(() => {
    if (workoutHistory.length > 0) {
      updateProgress(workoutHistory);
    }
  }, [workoutHistory, updateProgress]);

  useEffect(() => {
    if (
      isTemplateMode &&
      exercises.length > 0 &&
      Object.keys(sessionData).length === 0
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
            })),
          completed: false,
        };
      });
      setSessionData(initialData);
    }
  }, [isTemplateMode, exercises]);

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
  const getSuggestedWeight = (exerciseId: string): number => {
    if (isBodyweightExercise(exerciseId)) return 0;

    const suggestionWeight = getProgressionSuggestion(exerciseId)?.currentBest.weight;

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

    return suggestionWeight || weightMap[exerciseId] || 20;
  };

  const getCurrentExerciseTargets = () => {
    if (!currentExerciseData) {
      return {
        sets: 3,
        reps: '8-12',
        restSeconds: 90,
        notes: undefined,
        progressionNotes: undefined,
      };
    }

    return {
      sets: currentExerciseData.sets,
      reps: formatReps(currentExerciseData.reps || '8-12'),
      restSeconds: currentExerciseData.rest_seconds || 90,
      notes: currentExerciseData.notes,
      progressionNotes: currentExerciseData.progression_notes,
    };
  };

  const bodyWeightExercise =
  isBodyweightExercise(currentExerciseData?.id || '') ||
  currentWorkoutExercise?.exercise.is_bodyweight === true;

  const getSessionProgress = () => {
    if (isTemplateMode) {
      const completedCount = Object.values(sessionData).filter((data: any) => data.completed).length;
      return exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;
    } else {
      const completedCount = currentWorkout?.exercises?.filter(ex => ex.completed).length || 0;
      const totalExercises = currentWorkout?.exercises?.length || 0;
      return totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
    }
  };

  // Handlers
  const updateSetData = (
    setIndex: number,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!currentExerciseId) return;

    if (isTemplateMode) {
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

    if (isTemplateMode) {
      setSessionData((prev) => {
        const updatedSets = prev[currentExerciseId].sets.map((set: any, index: number) =>
          index === setIndex ? { ...set, weight, reps, completed: true } : set
        );
        
        const allSetsCompleted = updatedSets.every((set: any) => set.completed);
        
        return {
          ...prev,
          [currentExerciseId]: {
            ...prev[currentExerciseId],
            sets: updatedSets,
            completed: allSetsCompleted
          },
        };
      });
    } else if (currentWorkoutExercise) {
      updateSet(currentWorkoutExercise.id, setIndex, { weight, reps });
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

      if (isTemplateMode) {
        setTemplateExerciseIndex(templateExerciseIndex + 1);
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

    useWorkoutStore.getState().cancelWorkout(); 

    router.replace("/(tabs)");
  };

  const handleSessionCompleted = async () => {
    try {
      let completedWorkoutData: Workout | null = null;
      let workoutIdForRedirect: string | undefined;
      let detectedNewPRs: any[] = [];

      // Étape 1: Préparer les données de l'objet completedWorkout et déclencher la sauvegarde
      if (isTemplateMode) {
        // Créer l'objet workout pour la sauvegarde et la détection de PRs
        const workoutToSave: Workout = {
          id: `template_${Date.now()}`,
          name: sessionTitle,
          date: Date.now(),
          started_at: sessionStartTime,
          finished_at: Date.now(),
          exercises: exercises.map((exercise) => ({
            id: `${exercise.id}_${Date.now()}`,
            exercise: exercise,
            sets: sessionData[exercise.id]?.sets.map((set: any) => ({
              weight: set.weight,
              reps: set.reps,
              completed: set.completed,
              rest_seconds: exercise.rest_seconds
            })) || [],
            completed: sessionData[exercise.id]?.completed || false,
            order_index: exercises.indexOf(exercise),
            notes: exercise.notes || "",
            template_data: currentSession?.exercises.find(e => e.exercise_id === exercise.id)
          })),
          completed: true,
          user_id: "current_user"
        };
        
        addWorkoutToHistory(workoutToSave);

        completedWorkoutData = workoutToSave;
        workoutIdForRedirect = completedWorkoutData.id;
        
        if (currentSession) {
          const progressData = {
            sessionId: currentSession.id,
            date: Date.now(),
            duration: sessionDuration,
            exercises: Object.entries(sessionData).map(
              ([exerciseId, data]: [string, any]) => ({
                exerciseId,
                sets: data.sets,
              })
            ),
          };
          await completeSession(progressData);
        }

      } else {
        completedWorkoutData = await useWorkoutStore.getState().saveAndFinalizeWorkout();
        workoutIdForRedirect = completedWorkoutData?.id;
      }

      if (completedWorkoutData) {
         const { workoutHistory: globalWorkoutHistory } = useWorkoutStore.getState();
         const previousWorkouts = globalWorkoutHistory.filter(wh => wh.id !== completedWorkoutData?.id);
         detectedNewPRs = detectNewPRs(completedWorkoutData, previousWorkouts);
      }
      
      useProgressStore.setState({ newPRs: detectedNewPRs });

      if (detectedNewPRs.length === 0) {
            router.replace(`/(tabs)/`);
            useWorkoutStore.getState().cancelWorkout(); 
            markPRsSeen(); 
           handleSessionFinalCleanup();
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation de la séance:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la finalisation de la séance. Veuillez réessayer."
      );
       // En cas d'erreur, nettoyer l'état et rediriger vers l'accueil
       handleSessionFinalCleanup(); 
    }
  };

  const handleAddSet = () => {
    if (!currentWorkoutExercise?.id) return;
    addSet(currentWorkoutExercise.id);
  };

  const handleRemoveSet = (setIndex: number) => {
    if (!currentExerciseId) return;
    if (!currentWorkoutExercise) return;

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
  };

  const handlePreviousExercise = () => {
    if (isTemplateMode) {
      if (templateExerciseIndex > 0) {
        setTemplateExerciseIndex(templateExerciseIndex - 1);
      }
    } else {
      goToPreviousExercise();
    }
  };

  const handleNextExercise = () => {
    const isCurrentExerciseCompleted = isTemplateMode 
      ? sessionData[currentExerciseId]?.completed 
      : currentWorkoutExercise?.completed;

    if (effectiveExerciseIndex < exercises.length - 1) {
       if (isCurrentExerciseCompleted || !isTemplateMode) {
        if (isTemplateMode) {
          setTemplateExerciseIndex(effectiveExerciseIndex + 1);
        } else {
           goToNextExercise();
        }
         startRestTimer(60);
       } else {
         Alert.alert("Exercice non terminé", "Veuillez compléter l'exercice actuel avant de passer au suivant.");
       }
    } else {
       if (isCurrentExerciseCompleted || !isTemplateMode) {
         handleSessionCompleted();
       } else {
          Alert.alert("Exercice non terminé", "Veuillez compléter le dernier exercice avant de terminer la séance.");
       }
    }
  };

  const handleGoToExercise = (index: number) => {
    if (isTemplateMode) {
      setTemplateExerciseIndex(index);
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
    isTemplateMode,
    targets,
    currentWorkout,
    currentSession,
    getSuggestedWeight,
    bodyWeightExercise,
    getCurrentExerciseTargets,
    sessionProgress: getSessionProgress(),
    getProgressionSuggestion,
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
    completedExercises: isTemplateMode 
      ? Object.fromEntries(
          Object.entries(sessionData).map(([id, data]) => [id, data.completed])
        )
      : Object.fromEntries(
          exercises.map((ex) => {
            const workoutExercise = currentWorkout?.exercises.find(e => e.exercise.id === ex.id);
            const allSetsCompleted = workoutExercise?.sets.every(set => set.completed) || false;
            return [ex.id, allSetsCompleted];
          })
        ),
    handleSessionFinalCleanup,
  };
}; 