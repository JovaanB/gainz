import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
}

interface ExerciseNavigationProps {
  currentExerciseIndex: number;
  totalExercises: number;
  onPrevious: () => void;
  onNext: () => void;
  nextExercise?: Exercise;
}

export const ExerciseNavigation: React.FC<ExerciseNavigationProps> = ({
  currentExerciseIndex,
  totalExercises,
  onPrevious,
  onNext,
  nextExercise,
}) => {
  return (
    <View style={styles.container}>
      {nextExercise && (
        <View style={styles.nextExerciseContainer}>
          <View style={styles.nextExerciseHeader}>
            <Ionicons
              name="barbell"
              size={22}
              color="#007AFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.nextExerciseLabel}>Prochain exercice</Text>
          </View>
          <Text style={styles.nextExerciseName}>{nextExercise.name}</Text>
          <Text style={styles.nextExerciseDetails}>
            {nextExercise.sets} séries × {nextExercise.reps || "8-12"} reps
          </Text>
        </View>
      )}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.secondaryButton,
            currentExerciseIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={onPrevious}
          disabled={currentExerciseIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.navButtonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.primaryButton]}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>
            {currentExerciseIndex === totalExercises - 1
              ? "Terminer la session"
              : "Exercice suivant"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextExerciseContainer: {
    width: "100%",
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
    marginBottom: 18,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "flex-start",
  },
  nextExerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nextExerciseLabel: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "700",
  },
  nextExerciseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
    marginTop: 2,
  },
  nextExerciseDetails: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 6,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    marginLeft: 6,
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
});
