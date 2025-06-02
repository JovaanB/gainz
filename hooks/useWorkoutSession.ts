import { useState, useEffect } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { useTemplateStore } from '@/store/templateStore';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useProgressStore } from '@/store/progressStore';
import { ProgressCalculator } from '@/utils/progressCalculations';

export const useWorkoutSession = (id: string) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, any>>({});
  const [completedExercises] = useState<Record<string, boolean>>({});

  const {
    currentWorkout,
    currentWorkoutExercise,
    updateSet,
    completeSet,
    finishWorkout,
  } = useWorkoutStore();

  const { getCurrentSession, completeSession } = useTemplateStore();

  const isTemplateMode = id ? id.startsWith('template_') : false;
  const currentSession = isTemplateMode ? getCurrentSession() : null;

  useEffect(() => {
    if (isTemplateMode && currentSession && Object.keys(sessionData).length === 0) {
      const initialData: Record<string, any> = {};
      currentSession.exercises.forEach((exercise) => {
        initialData[exercise.exercise_id] = {
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
  }, [isTemplateMode, currentSession]);

  const handlePreviousExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextExercise = () => {
    if (currentWorkout && currentIndex < currentWorkout.exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleExercisePress = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSetCompleted = (setIndex: number) => {
    if (!currentWorkoutExercise) return;

    if (isTemplateMode) {
      setSessionData((prev) => ({
        ...prev,
        [currentWorkoutExercise.id]: {
          ...prev[currentWorkoutExercise.id],
          sets: prev[currentWorkoutExercise.id].sets.map((set: any, index: number) =>
            index === setIndex ? { ...set, completed: true } : set
          ),
        },
      }));
    } else {
      completeSet(currentWorkoutExercise.id, setIndex);
    }
  };

  const handleSessionCompleted = () => {
    const actionText = isTemplateMode ? 'Enregistrer' : 'Terminer';

    Alert.alert(
      'Session terminée ! 🎉',
      'Félicitations ! Voulez-vous enregistrer cette session ?',
      [
        { text: 'Modifier', style: 'cancel' },
        {
          text: actionText,
          onPress: async () => {
            try {
              await finishWorkout();

              if (isTemplateMode && currentSession) {
                const progressData = {
                  sessionId: currentSession.id,
                  date: Date.now(),
                  exercises: Object.entries(sessionData).map(([exerciseId, data]: [string, any]) => ({
                    exerciseId,
                    sets: data.sets,
                  })),
                };
                completeSession(progressData);
              }

              const { workoutHistory } = useWorkoutStore.getState();
              const completedWorkout = workoutHistory[0];
              const previousWorkouts = workoutHistory.slice(1);
              const newPRs = ProgressCalculator.detectNewPRs(completedWorkout, previousWorkouts);

              if (newPRs.length > 0) {
                useProgressStore.setState({ newPRs });
              } else {
                router.replace('/');
              }
            } catch (error) {
              console.error('Erreur lors de la sauvegarde:', error);
              Alert.alert('Erreur', 'Impossible d\'enregistrer la session');
            }
          },
        },
      ]
    );
  };

  const updateSetData = (setIndex: number, setData: any) => {
    if (!currentWorkoutExercise) return;

    if (isTemplateMode) {
      setSessionData((prev) => ({
        ...prev,
        [currentWorkoutExercise.id]: {
          ...prev[currentWorkoutExercise.id],
          sets: prev[currentWorkoutExercise.id].sets.map((set: any, index: number) =>
            index === setIndex ? { ...set, ...setData } : set
          ),
        },
      }));
    } else {
      updateSet(currentWorkoutExercise.id, setIndex, setData);
    }
  };

  return {
    currentIndex,
    isTemplateMode,
    sessionData,
    completedExercises,
    handlePreviousExercise,
    handleNextExercise,
    handleExercisePress,
    handleSetCompleted,
    handleSessionCompleted,
    updateSetData,
  };
}; 