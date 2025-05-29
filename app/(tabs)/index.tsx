import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workoutStore";

export default function HomeScreen() {
  const router = useRouter();
  const { workoutHistory, isLoading, loadWorkoutHistory } = useWorkoutStore();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "En cours...";

    const duration = Math.floor((endTime - startTime) / 1000 / 60);
    return `${duration}min`;
  };

  const startNewWorkout = () => {
    router.push("/workout/new");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{workoutHistory.length}</Text>
            <Text style={styles.statLabel}>SÉANCES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {
                workoutHistory.filter((w) => {
                  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  return w.started_at > weekAgo;
                }).length
              }
            </Text>
            <Text style={styles.statLabel}>CETTE SEMAINE</Text>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récentes</Text>

          {isLoading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : workoutHistory.length > 0 ? (
            workoutHistory.slice(0, 5).map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDate}>
                    {formatDate(workout.started_at)}
                  </Text>
                </View>
                <Text style={styles.workoutMeta}>
                  {formatDuration(workout.started_at, workout.finished_at)} •{" "}
                  {workout.exercises.length} exercices
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune séance pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Commence ton premier entraînement !
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={startNewWorkout}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  workoutDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  workoutMeta: {
    fontSize: 13,
    color: "#666",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#C7C7CC",
  },
  loadingText: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 16,
    padding: 20,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
