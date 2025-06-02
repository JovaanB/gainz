// src/app/workout/active.tsx - Écran Unifié
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { SafeAreaView } from "react-native-safe-area-context";
import { RestTimer } from "../../components/workout/active/RestTimer";
import { PRNotification } from "../../components/workout/active/PRNotification";
import { ProgressionSuggestionCard } from "@/components/workout/active/ProgressionSuggestion";
import { WorkoutHeader } from "@/components/workout/active/WorkoutHeader";
import { ExerciseCard } from "@/components/workout/active/ExerciseCard";
import { ExerciseList } from "@/components/workout/active/ExerciseList";
import { ExerciseNavigation } from "@/components/workout/active/ExerciseNavigation";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

export default function WorkoutScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const paramMode = (params?.mode as "template" | "free") || "free";

  useKeepAwake();

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
    isTemplateMode,
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
    goToExercise,
    completedExercises,
  } = useWorkoutSession(paramMode);

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

  if (!exercises || exercises.length === 0) {
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

        {!isTemplateMode &&
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
                        if (!isTemplateMode && exerciseData) {
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
            suggestedWeight={getSuggestedWeight(currentExerciseData?.id || "")}
            onSetCompleted={handleSetCompleted}
            onSetDataChange={updateSetData}
            onRemoveSet={handleRemoveSet}
            onAddSet={handleAddSet}
            isTemplateMode={isTemplateMode}
          />

          <ExerciseNavigation
            currentExerciseIndex={effectiveExerciseIndex}
            totalExercises={exercises.length}
            onPrevious={handlePreviousExercise}
            onNext={handleNextExercise}
          />

          <ExerciseList
            exercises={exercises}
            currentExerciseIndex={effectiveExerciseIndex}
            completedExercises={completedExercises}
            onExercisePress={goToExercise}
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
});
