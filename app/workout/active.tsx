import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { RestTimer } from "@/components/workout/RestTimer";
import { SetRow } from "@/components/workout/SetRow";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout>();

  const {
    currentWorkout,
    currentExerciseIndex,
    restTimer,
    finishWorkout,
    cancelWorkout,
    updateSet,
    addSet,
    removeSet,
    completeSet,
    goToNextExercise,
    goToPreviousExercise,
    stopRestTimer,
    updateRestTimer,
  } = useWorkoutStore();

  useKeepAwake();

  // Timer de repos
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
    if (!currentWorkout) {
      router.replace("/(tabs)");
    }
  }, [currentWorkout]);

  if (!currentWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = currentWorkout.exercises[currentExerciseIndex];
  const isFirstExercise = currentExerciseIndex === 0;
  const isLastExercise =
    currentExerciseIndex === currentWorkout.exercises.length - 1;

  const formatWorkoutTime = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - currentWorkout.started_at) / 1000 / 60);
    return `${elapsed}min`;
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      "Terminer la séance",
      "Êtes-vous sûr de vouloir terminer cette séance ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          style: "destructive",
          onPress: async () => {
            await finishWorkout();
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      "Annuler la séance",
      "Êtes-vous sûr de vouloir annuler cette séance ? Toutes les données seront perdues.",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            cancelWorkout();
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  const getCompletedSetsCount = () => {
    return currentWorkout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.filter((set) => set.completed).length;
    }, 0);
  };

  const getTotalSetsCount = () => {
    return currentWorkout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.length;
    }, 0);
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelWorkout}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.workoutName}>{currentWorkout.name}</Text>
            <Text style={styles.workoutTime}>
              {formatWorkoutTime()} • {getCompletedSetsCount()}/
              {getTotalSetsCount()} séries
            </Text>
          </View>

          <TouchableOpacity onPress={handleFinishWorkout}>
            <Text style={styles.finishButton}>Terminer</Text>
          </TouchableOpacity>
        </View>

        {/* Rest Timer */}
        <RestTimer
          isActive={restTimer.isActive}
          timeLeft={restTimer.timeLeft}
          duration={restTimer.duration}
          onSkip={stopRestTimer}
        />

        <ScrollView style={styles.content}>
          {/* Exercise Navigation */}
          <View style={styles.exerciseNavigation}>
            <TouchableOpacity
              style={[
                styles.navButton,
                isFirstExercise && styles.navButtonDisabled,
              ]}
              onPress={goToPreviousExercise}
              disabled={isFirstExercise}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={isFirstExercise ? "#C7C7CC" : "#007AFF"}
              />
            </TouchableOpacity>

            <View style={styles.exerciseIndicator}>
              <Text style={styles.exerciseCounter}>
                {currentExerciseIndex + 1} / {currentWorkout.exercises.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                isLastExercise && styles.navButtonDisabled,
              ]}
              onPress={goToNextExercise}
              disabled={isLastExercise}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isLastExercise ? "#C7C7CC" : "#007AFF"}
              />
            </TouchableOpacity>
          </View>

          {/* Current Exercise */}
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {currentExercise.exercise.name}
              </Text>
              <View style={styles.muscleGroups}>
                {currentExercise.exercise.muscle_groups
                  .slice(0, 2)
                  .map((group, index) => (
                    <View key={index} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{group}</Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Sets */}
            <View style={styles.setsContainer}>
              <Text style={styles.setsTitle}>Séries</Text>

              {currentExercise.sets.map((set, index) => (
                <SetRow
                  key={index}
                  setIndex={index}
                  set={set}
                  isBodyweight={currentExercise.exercise.is_bodyweight}
                  onUpdateSet={(setData) =>
                    updateSet(currentExercise.id, index, setData)
                  }
                  onCompleteSet={() => completeSet(currentExercise.id, index)}
                  onRemoveSet={() => removeSet(currentExercise.id, index)}
                  canRemove={currentExercise.sets.length > 1}
                />
              ))}

              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addSet(currentExercise.id)}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addSetText}>Ajouter une série</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Exercise Instructions */}
          {currentExercise.exercise.instructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>
                {currentExercise.exercise.instructions}
              </Text>
            </View>
          )}

          {/* Next Exercise Preview */}
          {!isLastExercise && (
            <View style={styles.nextExerciseCard}>
              <Text style={styles.nextExerciseTitle}>Exercice suivant</Text>
              <Text style={styles.nextExerciseName}>
                {
                  currentWorkout.exercises[currentExerciseIndex + 1].exercise
                    .name
                }
              </Text>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#007AFF",
  },
  headerInfo: {
    alignItems: "center",
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  workoutTime: {
    fontSize: 14,
    color: "#B3D7FF",
    marginTop: 2,
  },
  finishButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  exerciseNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  exerciseIndicator: {
    alignItems: "center",
  },
  exerciseCounter: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  exerciseCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  muscleGroups: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  muscleTag: {
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  muscleTagText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  setsContainer: {
    marginTop: 8,
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  addSetText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  instructionsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  nextExerciseCard: {
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  nextExerciseTitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  nextExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
});
