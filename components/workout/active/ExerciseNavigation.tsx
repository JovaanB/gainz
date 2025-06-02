import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ExerciseNavigationProps {
  currentExerciseIndex: number;
  totalExercises: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ExerciseNavigation: React.FC<ExerciseNavigationProps> = ({
  currentExerciseIndex,
  totalExercises,
  onPrevious,
  onNext,
}) => {
  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
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
});
