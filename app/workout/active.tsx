// src/app/workout/active.tsx - Écran Unifié
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTemplateStore } from "../../store/templateStore";
import { useWorkoutStore } from "../../store/workoutStore";
import { useProgressStore } from "../../store/progressStore";
import { RestTimer } from "../../components/workout/RestTimer";
import { PRNotification } from "../../components/workout/PRNotification";
import { Set } from "@/types";
import { useKeepAwake } from "expo-keep-awake";
import { ProgressionSuggestionCard } from "@/components/workout/ProgressionSuggestion";
import { SafeAreaView } from "react-native-safe-area-context";

interface UnifiedExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
  rest_seconds?: number;
  notes?: string;
  progression_notes?: string;
}

// Fonction pour normaliser les exercices
const normalizeExercise = (
  exercise: any,
  mode: WorkoutMode
): UnifiedExercise => {
  if (mode === "template") {
    return {
      id: exercise.exercise_id,
      name: exercise.exercise_id.replace("_", " "),
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes,
      progression_notes: exercise.progression_notes,
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
    };
  }
};

type WorkoutMode = "template" | "free";

export default function WorkoutScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: WorkoutMode = (params?.mode as WorkoutMode) || "free";
  const timerRef = useRef<NodeJS.Timeout>();

  useKeepAwake();

  // Stores
  const { selectedTemplate, getCurrentSession, completeSession } =
    useTemplateStore();

  const {
    currentWorkout,
    restTimer,
    startRestTimer,
    stopRestTimer,
    updateRestTimer,
    addTimeToTimer,
    finishWorkout,
    currentExerciseIndex,
    addSet,
    updateSet,
    removeSet,
    completeSet,
    goToExercise,
    goToNextExercise,
    goToPreviousExercise,
    workoutHistory,
  } = useWorkoutStore();

  const {
    getProgressionSuggestion,
    newPRs,
    markPRsSeen,
    detectNewPRs,
    updateProgress,
  } = useProgressStore();

  const [sessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, any>>({});
  const [templateExerciseIndex, setTemplateExerciseIndex] = useState(0);

  // Données selon le mode
  const isTemplateMode = mode === "template";
  const currentSession = isTemplateMode ? getCurrentSession() : null;

  const rawExercises = isTemplateMode
    ? currentSession?.exercises || []
    : currentWorkout?.exercises || [];

  const exercises: UnifiedExercise[] = rawExercises.map((exercise) =>
    normalizeExercise(exercise, mode)
  );

  const effectiveExerciseIndex = isTemplateMode
    ? templateExerciseIndex
    : currentExerciseIndex;
  const currentExerciseData = exercises[effectiveExerciseIndex];
  const currentExerciseId = currentExerciseData?.id;
  const exerciseDisplayName = currentExerciseData?.name;
  const currentExercise = exercises[effectiveExerciseIndex];
  const currentWorkoutExercise = currentWorkout?.exercises.find(
    (ex) => ex.exercise.id === currentExercise?.id
  );
  const exerciseData = isTemplateMode
    ? sessionData[currentExerciseId]
    : currentWorkoutExercise;

  const sessionTitle = isTemplateMode
    ? currentSession?.name || "Session Template"
    : currentWorkout?.name || "Séance Libre";

  const programTitle = isTemplateMode ? selectedTemplate?.name : undefined;

  useEffect(() => {
    if (workoutHistory.length > 0) {
      updateProgress(workoutHistory);
    }
  }, [workoutHistory, updateProgress]);

  // Initialiser sessionData une seule fois au début de la session
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

  const formatDuration = (seconds: number) => {
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

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isTemplateMode
              ? "Session template non trouvée..."
              : "Aucun exercice sélectionné..."}
          </Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.backToHomeText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fonctions utilitaires
  const getSuggestedWeight = (exerciseId: string): number => {
    if (bodyWeightExercise) return 0;

    const suggestionWeight =
      getProgressionSuggestion(exerciseId)?.currentBest.weight;

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

  const getLastUsedWeight = (exerciseId: string): number => {
    // Logique pour récupérer le dernier poids utilisé depuis l'historique
    // Vous pouvez implémenter cette logique selon votre historique
    return getSuggestedWeight(exerciseId);
  };

  const isBodyweightExercise = (exerciseId: string): boolean => {
    const bodyweightExercises = [
      "push_ups",
      "pull_ups",
      "bodyweight_squats",
      "lunges",
      "plank",
      "burpees",
      "pike_push_ups",
      "tricep_dips",
    ];

    return bodyweightExercises.some((bwExercise) =>
      exerciseId?.includes(bwExercise)
    );
  };

  const formatReps = (reps: number | string) => {
    return typeof reps === "string" ? reps : reps.toString();
  };

  const isSetReady = (set: Set) => {
    return (set.weight || 0) >= 0 && (set.reps || 0) > 0;
  };

  const applyProgressionSuggestion = (exerciseId: string) => {
    const suggestion = getProgressionSuggestion(exerciseId);
    if (!suggestion) {
      return;
    }

    const nextSetIndex = currentWorkoutExercise!.sets.findIndex(
      (set) => !set.completed
    );

    if (nextSetIndex === -1) {
      addSet(exerciseId);

      const newSetIndex = currentExerciseIndex + 1;

      setTimeout(() => {
        updateSet(currentExercise.id, newSetIndex, {
          reps: suggestion.suggested.reps,
          weight: suggestion.suggested.weight,
        });
      }, 100);
    } else {
      // Applique la suggestion au prochain set
      updateSetData(nextSetIndex, "weight", suggestion.suggested.weight || 0);
      updateSetData(nextSetIndex, "reps", suggestion.suggested.reps);
    }
  };

  const getCompletedSetsCount = () => {
    if (isTemplateMode) {
      return (
        sessionData[currentExerciseId]?.sets?.filter(
          (set: any) => set.completed
        ).length || 0
      );
    }
    return (
      currentWorkoutExercise?.sets?.filter((set: any) => set.completed)
        .length || 0
    );
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

  // Handlers
  const updateSetData = (
    setIndex: number,
    field: "weight" | "reps",
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

  const handleSetCompleted = (
    setIndex: number,
    weight: number,
    reps: number
  ) => {
    if (!currentExerciseId) return;

    if (isTemplateMode) {
      // Mode template : mise à jour de sessionData
      setSessionData((prev) => ({
        ...prev,
        [currentExerciseId]: {
          ...prev[currentExerciseId],
          sets: prev[currentExerciseId].sets.map((set: any, index: number) =>
            index === setIndex ? { ...set, weight, reps, completed: true } : set
          ),
        },
      }));
    } else if (currentWorkoutExercise) {
      // Mode libre : mise à jour du store
      updateSet(currentWorkoutExercise.id, setIndex, { weight, reps });
      completeSet(currentWorkoutExercise.id, setIndex);
    }

    // Timer de repos
    const targets = getCurrentExerciseTargets();
    const isLastSet = setIndex === targets.sets - 1;

    if (!isLastSet) {
      startRestTimer(targets.restSeconds);
    }
  };

  const handleAddSet = () => {
    if (!currentExerciseId) return;
    addSet(currentExerciseId);
  };

  const handleRemoveSet = (setIndex: number) => {
    if (!currentExerciseId) return;

    Alert.alert(
      "Supprimer la série ?",
      "Cette action ne peut pas être annulée.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => removeSet(currentWorkoutExercise?.id!, setIndex),
        },
      ]
    );
  };

  const handleExerciseCompleted = () => {
    if (effectiveExerciseIndex < exercises.length - 1) {
      // Marquer l'exercice comme terminé dans sessionData
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
        // Mode template : passer à l'exercice suivant
        setTemplateExerciseIndex(templateExerciseIndex + 1);
      } else {
        // Mode libre : utiliser la fonction du store
        goToNextExercise();
      }

      // Timer entre exercices
      startRestTimer(60);
    } else {
      handleSessionCompleted();
    }
  };

  const handleSessionCompleted = () => {
    const actionText = isTemplateMode ? "Enregistrer" : "Terminer";

    Alert.alert(
      "Session terminée ! 🎉",
      "Félicitations ! Voulez-vous enregistrer cette session ?",
      [
        { text: "Modifier", style: "cancel" },
        {
          text: actionText,
          onPress: async () => {
            try {
              await finishWorkout();

              if (isTemplateMode) {
                const progressData = {
                  sessionId: currentSession?.id || "",
                  date: Date.now(),
                  exercises: Object.entries(sessionData).map(
                    ([exerciseId, data]: [string, any]) => ({
                      exerciseId,
                      sets: data.sets,
                    })
                  ),
                };
                completeSession(progressData);
              }

              const { workoutHistory } = useWorkoutStore.getState();
              const completedWorkout = workoutHistory[0]; // Le workout vient d'être ajouté
              const previousWorkouts = workoutHistory.slice(1);
              const newPRs = detectNewPRs(completedWorkout, previousWorkouts);

              if (newPRs.length > 0) {
                useProgressStore.setState({ newPRs });
              } else {
                router.replace("/");
              }
            } catch (error) {
              console.error("Erreur lors de la sauvegarde:", error);
              Alert.alert("Erreur", "Impossible d'enregistrer la session");
            }
          },
        },
      ]
    );
  };

  const getSessionProgress = () => {
    const completedExercises = Object.values(sessionData).filter(
      (data: any) => data.completed
    ).length;
    return (completedExercises / exercises.length) * 100;
  };

  const targets = getCurrentExerciseTargets();

  const bodyWeightExercise =
    isBodyweightExercise(currentExerciseData?.id) ||
    currentWorkoutExercise?.exercise.is_bodyweight === true;

  const handlePreviousExercise = () => {
    if (isTemplateMode) {
      if (templateExerciseIndex > 0) {
        setTemplateExerciseIndex(templateExerciseIndex - 1);
      }
    } else {
      goToPreviousExercise();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {newPRs.length <= 0 ? (
        <>
          {/* Header avec progression */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Alert.alert(
                  "Quitter la session ?",
                  "Votre progression sera perdue.",
                  [
                    { text: "Continuer", style: "cancel" },
                    {
                      text: "Quitter",
                      style: "destructive",
                      onPress: () => router.back(),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.sessionTitle}>{sessionTitle}</Text>
              {programTitle && (
                <Text style={styles.programTitle}>{programTitle}</Text>
              )}
              <Text style={styles.sessionDuration}>
                {formatDuration(sessionDuration)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getSessionProgress()}%` },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Alert.alert("Menu", "Actions disponibles", [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Terminer la session",
                    onPress: handleSessionCompleted,
                  },
                ]);
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Timer de repos */}
          <RestTimer
            isActive={restTimer.isActive}
            timeLeft={restTimer.timeLeft}
            duration={restTimer.duration}
            onSkip={stopRestTimer}
            onAddTime={addTimeToTimer}
          />

          {!isTemplateMode &&
            currentExerciseData &&
            (() => {
              const suggestion = getProgressionSuggestion(
                currentExerciseData.id
              );
              return suggestion ? (
                <ProgressionSuggestionCard
                  suggestion={suggestion}
                  onApply={() =>
                    applyProgressionSuggestion(currentExerciseData.id)
                  }
                />
              ) : null;
            })()}

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Exercice actuel */}
            <View style={styles.currentExerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exerciseDisplayName}</Text>
                  <Text style={styles.exerciseTarget}>
                    {targets.sets} séries × {targets.reps} reps
                  </Text>
                  <Text style={styles.exerciseProgress}>
                    {getCompletedSetsCount()}/{targets.sets} séries terminées
                  </Text>
                  {targets.notes && (
                    <Text style={styles.exerciseNotes}>💡 {targets.notes}</Text>
                  )}
                </View>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>
                    {effectiveExerciseIndex + 1}/{exercises.length}
                  </Text>
                </View>
              </View>

              {/* Suggestions */}
              {currentExerciseData && (
                <View style={styles.weightSuggestion}>
                  <Ionicons name="trending-up" size={16} color="#34C759" />
                  <Text style={styles.weightSuggestionText}>
                    {isTemplateMode ? "Poids suggéré" : "Dernier poids"}:{" "}
                    {bodyWeightExercise
                      ? "Poids du corps"
                      : `${getSuggestedWeight(currentExerciseData.id)}kg`}
                  </Text>
                </View>
              )}

              {/* Conseils de progression (mode template uniquement) */}
              {isTemplateMode && currentExerciseData?.progression_notes && (
                <View style={styles.progressionTip}>
                  <Ionicons name="bulb" size={16} color="#FF9500" />
                  <Text style={styles.progressionText}>
                    {currentExerciseData.progression_notes}
                  </Text>
                </View>
              )}

              {/* Séries */}
              {exerciseData?.sets && (
                <View style={styles.setsContainer}>
                  {exerciseData.sets.map((set: any, setIndex: number) => (
                    <View
                      key={setIndex}
                      style={[
                        styles.setRow,
                        set.completed && styles.setRowCompleted,
                      ]}
                    >
                      <Text style={styles.setNumber}>{setIndex + 1}</Text>

                      <View style={styles.setInputs}>
                        {!bodyWeightExercise && (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Poids (kg)</Text>
                            <TextInput
                              style={[
                                styles.input,
                                set.completed && styles.inputCompleted,
                              ]}
                              value={set.weight?.toString() || ""}
                              onChangeText={(text) => {
                                const weight =
                                  text === "" ? undefined : parseFloat(text);
                                updateSetData(setIndex, "weight", weight || 0);
                              }}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor="#9CA3AF"
                              editable={!set.completed}
                            />
                          </View>
                        )}

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={[
                              styles.input,
                              set.completed && styles.inputCompleted,
                            ]}
                            value={set.reps?.toString() || ""}
                            onChangeText={(text) => {
                              const reps =
                                text === "" ? undefined : parseInt(text);
                              updateSetData(setIndex, "reps", reps || 0);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            editable={!set.completed}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.completeSetButton,
                          set.completed && styles.completeSetButtonCompleted,
                          !isSetReady(set) && styles.completeSetButtonDisabled,
                        ]}
                        onPress={() =>
                          handleSetCompleted(setIndex, set.weight, set.reps)
                        }
                        disabled={!isSetReady(set) || set.completed}
                      >
                        <Ionicons
                          name={
                            set.completed
                              ? "checkmark-circle"
                              : "play-circle-outline"
                          }
                          size={28}
                          color={
                            set.completed
                              ? "#34C759"
                              : isSetReady(set)
                              ? "#007AFF"
                              : "#9CA3AF"
                          }
                        />
                      </TouchableOpacity>

                      {/* Bouton de suppression en mode séance libre */}
                      {!isTemplateMode && exerciseData?.sets.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeSetButton}
                          onPress={() => {
                            if (currentExerciseId && currentWorkoutExercise) {
                              removeSet(currentWorkoutExercise.id, setIndex);
                            }
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#FF3B30"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* Bouton pour ajouter une série en mode séance libre */}
                  {!isTemplateMode && (
                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => {
                        if (currentExerciseId && currentWorkoutExercise) {
                          addSet(currentWorkoutExercise.id);
                        }
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#007AFF"
                      />
                      <Text style={styles.addSetButtonText}>
                        Ajouter une série
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Navigation exercices */}
            <View style={styles.exerciseNavigation}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.secondaryButton,
                  effectiveExerciseIndex === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePreviousExercise}
                disabled={effectiveExerciseIndex === 0}
              >
                <Ionicons name="chevron-back" size={20} color="#007AFF" />
                <Text style={styles.navButtonText}>Précédent</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.primaryButton]}
                onPress={handleExerciseCompleted}
              >
                <Text style={styles.primaryButtonText}>
                  {effectiveExerciseIndex === exercises.length - 1
                    ? "Terminer la session"
                    : "Exercice suivant"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Liste des exercices */}
            <View style={styles.exercisesList}>
              <Text style={styles.exercisesListTitle}>
                Exercices de la session
              </Text>
              {exercises.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    index === effectiveExerciseIndex &&
                      styles.exerciseItemActive,
                    sessionData[exercise.id]?.completed &&
                      styles.exerciseItemCompleted,
                  ]}
                  onPress={() => {
                    if (isTemplateMode) {
                      setTemplateExerciseIndex(index);
                    } else {
                      goToExercise(index);
                    }
                  }}
                >
                  <View style={styles.exerciseItemLeft}>
                    <View
                      style={[
                        styles.exerciseItemIndicator,
                        index === effectiveExerciseIndex &&
                          styles.exerciseItemIndicatorActive,
                        sessionData[exercise.id]?.completed &&
                          styles.exerciseItemIndicatorCompleted,
                      ]}
                    >
                      {sessionData[exercise.id]?.completed ? (
                        <Ionicons name="checkmark" size={12} color="white" />
                      ) : (
                        <Text style={styles.exerciseItemNumber}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.exerciseItemName}>
                        {exercise.name}
                      </Text>
                      <Text style={styles.exerciseItemSets}>
                        {exercise.sets} × {formatReps(exercise.reps || "8-12")}
                      </Text>
                    </View>
                  </View>

                  {index === effectiveExerciseIndex && (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <PRNotification
          prs={newPRs}
          visible={newPRs.length > 0}
          onDismiss={() => {
            markPRsSeen();
            router.replace("/(tabs)");
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: Platform.OS === "android" ? 32 : 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  backToHomeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  backToHomeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  programTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  progressBar: {
    width: "100%",
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  menuButton: {
    padding: 8,
  },

  content: {
    flex: 1,
  },

  // Exercice actuel
  currentExerciseCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  exerciseTarget: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  exerciseProgress: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 8,
  },
  exerciseNotes: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  exerciseNumber: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  weightSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
  },
  weightSuggestionText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "500",
  },

  progressionTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginBottom: 16,
  },
  progressionText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 16,
  },

  // Séries
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  setRowCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    width: 20,
  },
  setInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  inputCompleted: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  completeSetButton: {
    padding: 4,
  },
  completeSetButtonCompleted: {
    // Styles pour série terminée
  },
  completeSetButtonDisabled: {
    opacity: 0.5,
  },

  // Navigation
  exerciseNavigation: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Liste des exercices
  exercisesList: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  exercisesListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    padding: 16,
    paddingBottom: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  exerciseItemActive: {
    backgroundColor: "#F0F9FF",
  },
  exerciseItemCompleted: {
    backgroundColor: "#F0FDF4",
  },
  exerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseItemIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseItemIndicatorActive: {
    backgroundColor: "#007AFF",
  },
  exerciseItemIndicatorCompleted: {
    backgroundColor: "#22C55E",
  },
  exerciseItemNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exerciseItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    textTransform: "capitalize",
  },
  exerciseItemSets: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 8,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    borderStyle: "dashed",
  },
  addSetButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  removeSetButton: {
    padding: 4,
    marginLeft: 8,
  },
});
