import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
}

interface ExerciseListProps {
  exercises: Exercise[];
  currentExerciseIndex: number;
  completedExercises: Record<string, boolean>;
  onExercisePress: (index: number) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  currentExerciseIndex,
  completedExercises,
  onExercisePress,
}) => {
  const formatReps = (reps: number | string) => {
    return typeof reps === "string" ? reps : reps.toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercices de la session</Text>
      {exercises.map((exercise, index) => (
        <TouchableOpacity
          key={exercise.id}
          style={[
            styles.exerciseItem,
            index === currentExerciseIndex && styles.exerciseItemActive,
            completedExercises[exercise.id] && styles.exerciseItemCompleted,
          ]}
          onPress={() => onExercisePress(index)}
        >
          <View style={styles.exerciseItemLeft}>
            <View
              style={[
                styles.exerciseItemIndicator,
                index === currentExerciseIndex &&
                  styles.exerciseItemIndicatorActive,
                completedExercises[exercise.id] &&
                  styles.exerciseItemIndicatorCompleted,
              ]}
            >
              {completedExercises[exercise.id] ? (
                <Ionicons name="checkmark" size={12} color="white" />
              ) : (
                <Text style={styles.exerciseItemNumber}>{index + 1}</Text>
              )}
            </View>
            <View>
              <Text style={styles.exerciseItemName}>{exercise.name}</Text>
              <Text style={styles.exerciseItemSets}>
                {exercise.sets} × {formatReps(exercise.reps || "8-12")}
              </Text>
            </View>
          </View>

          {index === currentExerciseIndex && (
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  title: {
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
});
