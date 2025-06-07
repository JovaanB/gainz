// src/app/workout/active.tsx - Écran Unifié avec support programmes
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { SafeAreaView } from "react-native-safe-area-context";
import { RestTimer } from "../../components/workout/active/RestTimer";
import { PRNotification } from "../../components/workout/active/PRNotification";
import { ProgressionSuggestionCard } from "@/components/workout/active/ProgressionSuggestion";
import { WorkoutHeader } from "@/components/workout/active/WorkoutHeader";
import { ExerciseCard } from "@/components/workout/active/ExerciseCard";
import { ExerciseNavigation } from "@/components/workout/active/ExerciseNavigation";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { programService } from "@/services/programService";

// Interface pour les données de programme
interface ProgramSessionData {
  sessionId: string;
  programId: string;
  sessionData: any; // ProgramSessionDetail
}

export default function WorkoutScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    sessionId?: string;
    programId?: string;
  }>();

  const mode = (params?.mode as "free" | "program") || "free";
  const [programSession, setProgramSession] =
    useState<ProgramSessionData | null>(null);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [programLoadError, setProgramLoadError] = useState<string | null>(null);

  useKeepAwake();

  useEffect(() => {
    if (mode === "program" && params.sessionId && params.programId) {
      loadProgramSession();
    }
  }, [mode, params.sessionId, params.programId]);

  const loadProgramSession = async () => {
    try {
      setIsLoadingProgram(true);
      setProgramLoadError(null);

      const programDetails = await programService.getProgramById(
        params.programId!
      );

      if (programDetails?.sessions) {
        const sessionDetail = programDetails.sessions.find(
          (s) => s.id === params.sessionId
        );

        if (sessionDetail) {
          setProgramSession({
            sessionId: params.sessionId!,
            programId: params.programId!,
            sessionData: sessionDetail,
          });
        } else {
          setProgramLoadError("Session non trouvée dans ce programme");
        }
      } else {
        setProgramLoadError("Programme non trouvé");
      }
    } catch (error) {
      console.error("Error loading program session:", error);
      setProgramLoadError("Erreur lors du chargement de la session");
    } finally {
      setIsLoadingProgram(false);
    }
  };

  const {
    sessionDuration,
    effectiveExerciseIndex,
    currentExerciseData,
    exerciseData,
    sessionTitle,
    programTitle,
    exercises,
    targets,
    bodyWeightExercise,
    sessionProgress,
    isProgramMode,
    isLoading: isSessionLoading,
    getSuggestedWeight,
    handleSetCompleted,
    updateSetData,
    handleRemoveSet,
    handleAddSet,
    handlePreviousExercise,
    handleNextExercise,
    handleSessionCompleted,
    restTimer,
    stopRestTimer,
    addTimeToTimer,
    newPRs,
    markPRsSeen,
    getProgressionSuggestion,
  } = useWorkoutSession(mode, programSession || undefined);

  // Affichage des PRs
  if (newPRs.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <PRNotification
          prs={newPRs}
          visible={true}
          onDismiss={() => {
            markPRsSeen();
            router.replace("/(tabs)/");
          }}
        />
      </SafeAreaView>
    );
  }

  // Chargement du programme
  if (mode === "program" && (isLoadingProgram || isSessionLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Chargement de la session du programme...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Erreur de chargement du programme
  if (mode === "program" && programLoadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{programLoadError}</Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToHomeText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Aucun exercice trouvé
  if (!exercises || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isProgramMode
              ? "Session de programme non trouvée..."
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

  return (
    <SafeAreaView style={styles.container}>
      <>
        <WorkoutHeader
          sessionTitle={sessionTitle}
          programTitle={programTitle}
          sessionDuration={sessionDuration}
          progress={sessionProgress}
          onMenuPress={() => {
            Alert.alert("Menu", "Actions disponibles", [
              { text: "Annuler", style: "cancel" },
              {
                text: "Terminer la session",
                onPress: handleSessionCompleted,
              },
            ]);
          }}
        />

        <RestTimer
          isActive={restTimer.isActive}
          timeLeft={restTimer.timeLeft}
          duration={restTimer.duration}
          onSkip={stopRestTimer}
          onAddTime={addTimeToTimer}
        />

        {/* Suggestions de progression - seulement pour les séances libres */}
        {!isProgramMode &&
          currentExerciseData &&
          (() => {
            const suggestion = getProgressionSuggestion(currentExerciseData.id);
            return (
              suggestion && (
                <ProgressionSuggestionCard
                  suggestion={suggestion}
                  onApply={() => {
                    if (currentExerciseData && suggestion) {
                      const nextSetIndex = exerciseData?.sets?.findIndex(
                        (set: any) => !set.completed
                      );

                      if (nextSetIndex === -1) {
                        if (!isProgramMode && exerciseData) {
                          handleAddSet();
                          setTimeout(() => {
                            updateSetData(
                              exerciseData.sets.length - 1,
                              "weight",
                              suggestion.suggested.weight || 0
                            );
                            updateSetData(
                              exerciseData.sets.length - 1,
                              "reps",
                              suggestion.suggested.reps
                            );
                          }, 100);
                        }
                      } else {
                        updateSetData(
                          nextSetIndex,
                          "weight",
                          suggestion.suggested.weight || 0
                        );
                        updateSetData(
                          nextSetIndex,
                          "reps",
                          suggestion.suggested.reps
                        );
                      }
                    }
                  }}
                />
              )
            );
          })()}

        {/* Badge pour indiquer le mode programme */}
        {isProgramMode && (
          <View style={styles.programBadgeContainer}>
            <View style={styles.programBadge}>
              <Text style={styles.programBadgeText}>
                📋 Session de programme
              </Text>
            </View>
          </View>
        )}

        {/* Notes de progression pour les programmes */}
        {isProgramMode && currentExerciseData?.progression_notes && (
          <View style={styles.progressionNotesContainer}>
            <Text style={styles.progressionNotesTitle}>
              💡 Conseil de progression
            </Text>
            <Text style={styles.progressionNotesText}>
              {currentExerciseData.progression_notes}
            </Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ExerciseCard
            exerciseName={currentExerciseData?.name || ""}
            exerciseNumber={effectiveExerciseIndex + 1}
            totalExercises={exercises.length}
            targets={targets}
            completedSets={
              exerciseData?.sets?.filter((set: any) => set.completed).length ||
              0
            }
            sets={exerciseData?.sets || []}
            isBodyweightExercise={bodyWeightExercise}
            isCardio={currentExerciseData?.category === "cardio"}
            isJumpRope={
              currentExerciseData?.category === "cardio" &&
              currentExerciseData?.name.toLowerCase().includes("corde")
            }
            suggestedWeight={getSuggestedWeight(currentExerciseData)}
            onSetCompleted={handleSetCompleted}
            onSetDataChange={updateSetData}
            onRemoveSet={handleRemoveSet}
            onAddSet={handleAddSet}
            isProgramMode={isProgramMode}
          />

          <ExerciseNavigation
            currentExerciseIndex={effectiveExerciseIndex}
            totalExercises={exercises.length}
            onPrevious={handlePreviousExercise}
            onNext={handleNextExercise}
            nextExercise={exercises[effectiveExerciseIndex + 1]}
          />
        </ScrollView>
      </>
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
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
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
  content: {
    flex: 1,
  },
  programBadgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  programBadge: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  programBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  progressionNotesContainer: {
    margin: 16,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  progressionNotesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  progressionNotesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
