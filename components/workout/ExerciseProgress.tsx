import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Workout, Exercise } from "@/types";

interface ExerciseProgressProps {
  workouts: Workout[];
}

export const ExerciseProgress: React.FC<ExerciseProgressProps> = ({
  workouts,
}) => {
  const getExerciseStats = () => {
    const exerciseMap = new Map();

    workouts.forEach((workout) => {
      if (!workout.finished_at) return;

      workout.exercises.forEach((workoutExercise) => {
        const exerciseId = workoutExercise.exercise.id;
        const exerciseName = workoutExercise.exercise.name;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exercise: workoutExercise.exercise,
            sessions: [],
            bestSet: null,
            totalVolume: 0,
            lastPerformed: 0,
          });
        }

        const stats = exerciseMap.get(exerciseId);

        // Calcul du meilleur set et volume total
        workoutExercise.sets.forEach((set) => {
          if (set.completed && set.reps) {
            const volume = set.weight ? set.reps * set.weight : set.reps;
            stats.totalVolume += volume;

            // Meilleur set (1RM estimé ou max reps si bodyweight)
            const currentBest = set.weight
              ? set.weight * (1 + set.reps / 30) // Formule Epley simplifiée
              : set.reps;

            if (!stats.bestSet || currentBest > stats.bestSet.value) {
              stats.bestSet = {
                value: currentBest,
                reps: set.reps,
                weight: set.weight,
                date: workout.started_at,
              };
            }
          }
        });

        stats.lastPerformed = Math.max(stats.lastPerformed, workout.started_at);
        stats.sessions.push(workout.started_at);
      });
    });

    return Array.from(exerciseMap.values())
      .sort((a, b) => b.sessions.length - a.sessions.length)
      .slice(0, 5);
  };

  const exerciseStats = getExerciseStats();

  const formatProgress = (exercise: any) => {
    if (!exercise.bestSet) return "Aucune donnée";

    if (exercise.exercise.category === "cardio") {
      const parts = [];

      if (exercise.bestSet.duration_seconds) {
        const minutes = Math.floor(exercise.bestSet.duration_seconds / 60);
        parts.push(`${minutes}min`);
      }

      if (exercise.bestSet.distance_km) {
        parts.push(`${exercise.bestSet.distance_km}km`);
      }

      return parts.join(" • ");
    } else {
      if (exercise.exercise.is_bodyweight) {
        return `${exercise.bestSet.reps} reps max`;
      } else {
        return `${exercise.bestSet.reps} × ${exercise.bestSet.weight}kg`;
      }
    }
  };

  const getProgressChange = (exercise: any) => {
    // Logique simplifiée pour la démo
    // Dans une vraie app, on comparerait avec les performances précédentes
    const sessions = exercise.sessions.length;
    if (sessions > 2) {
      return Math.floor(Math.random() * 10) + 1; // Simulation d'amélioration
    }
    return 0;
  };

  if (exerciseStats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Commencez à vous entraîner pour voir vos progrès !
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercices favoris</Text>

      {exerciseStats.map((exerciseStat, index) => {
        const progress = getProgressChange(exerciseStat);

        return (
          <View key={exerciseStat.exercise.id} style={styles.exerciseItem}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>
                {exerciseStat.exercise.name}
              </Text>
              <Text style={styles.exerciseStats}>
                {formatProgress(exerciseStat)} • {exerciseStat.sessions.length}{" "}
                séances
              </Text>
            </View>

            {progress > 0 && (
              <View style={styles.progressBadge}>
                <Ionicons name="trending-up" size={14} color="#34C759" />
                <Text style={styles.progressText}>+{progress}%</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  exerciseStats: {
    fontSize: 13,
    color: "#666",
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: "#34C759",
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
  },
});
