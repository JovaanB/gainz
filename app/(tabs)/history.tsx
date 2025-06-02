import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { useProgressStore } from "@/store/progressStore";
import { ProgressChart } from "@/components/ui/ProgressChart";
import { ExerciseProgress } from "@/components/workout/ExerciseProgress";
import { PersonalRecord } from "@/utils/progressCalculations";

export default function HistoryScreen() {
  const router = useRouter();
  const { workoutHistory, isLoading, loadWorkoutHistory } = useWorkoutStore();
  const { personalRecords, updateProgress } = useProgressStore();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const onRefresh = () => {
    loadWorkoutHistory();
  };

  const getWeeklyStats = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeekWorkouts = workoutHistory.filter(
      (w) => w.finished_at && w.started_at > weekAgo
    );

    const totalTime = thisWeekWorkouts.reduce((total, workout) => {
      if (workout.finished_at) {
        return total + (workout.finished_at - workout.started_at);
      }
      return total;
    }, 0);

    const totalVolume = thisWeekWorkouts.reduce((total, workout) => {
      return (
        total +
        workout.exercises.reduce((exerciseTotal, exercise) => {
          return (
            exerciseTotal +
            exercise.sets.reduce((setTotal, set) => {
              if (set.completed && set.reps && set.weight) {
                return setTotal + set.reps * set.weight;
              }
              return setTotal;
            }, 0)
          );
        }, 0)
      );
    }, 0);

    return {
      workoutCount: thisWeekWorkouts.length,
      totalTime: Math.floor(totalTime / 1000 / 60), // en minutes
      totalVolume: Math.round(totalVolume / 1000), // en tonnes
      avgDuration:
        thisWeekWorkouts.length > 0
          ? Math.floor(totalTime / thisWeekWorkouts.length / 1000 / 60)
          : 0,
    };
  };

  const formatPRValue = (pr: PersonalRecord) => {
    switch (pr.type) {
      case "weight":
        return `${pr.value}kg (${pr.reps} reps)`;
      case "reps":
        return `${pr.value} reps${pr.weight ? ` @ ${pr.weight}kg` : ""}`;
      case "1rm":
        return `${pr.value.toFixed(1)}kg (1RM estimé)`;
      case "volume":
        return `${pr.value}kg de volume`;
      case "duration":
        const minutes = Math.floor(pr.value / 60);
        const seconds = pr.value % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      case "distance":
        return `${pr.value}km`;
      case "speed":
        return `${pr.value.toFixed(1)}km/h`;
      default:
        return `${pr.value}`;
    }
  };

  const getPRTypeLabel = (type: string) => {
    switch (type) {
      case "weight":
        return "Poids Max";
      case "reps":
        return "Reps Max";
      case "1rm":
        return "1RM";
      case "volume":
        return "Volume";
      case "duration":
        return "Temps Max";
      case "distance":
        return "Distance Max";
      case "speed":
        return "Vitesse Max";
      default:
        return type;
    }
  };

  const getPRColor = (type: string) => {
    switch (type) {
      case "weight":
        return "#FF6B35";
      case "reps":
        return "#34C759";
      case "1rm":
        return "#FFD60A";
      case "volume":
        return "#007AFF";
      case "duration":
        return "#5856D6";
      case "distance":
        return "#32D74B";
      case "speed":
        return "#FF9F0A";
      default:
        return "#8E8E93";
    }
  };

  const getPRIcon = (type: string) => {
    switch (type) {
      case "weight":
        return "barbell";
      case "reps":
        return "refresh-circle";
      case "1rm":
        return "trophy";
      case "volume":
        return "trending-up";
      case "duration":
        return "time";
      case "distance":
        return "map";
      case "speed":
        return "flash";
      default:
        return "star";
    }
  };

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
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "Incomplète";

    const duration = Math.floor((endTime - startTime) / 1000 / 60);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const weeklyStats = getWeeklyStats();
  const completedWorkouts = workoutHistory.filter((w) => w.finished_at);

  useEffect(() => {
    if (completedWorkouts.length > 0) {
      updateProgress(completedWorkouts);
    }
  }, [completedWorkouts.length]);

  const getSortedPRs = () => {
    return personalRecords
      .sort((a, b) => {
        // Priorité aux PRs récents (derniers 30 jours)
        const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const aIsRecent = a.date > recentCutoff;
        const bIsRecent = b.date > recentCutoff;

        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;

        // Sinon par date
        return b.date - a.date;
      })
      .slice(0, 5);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Weekly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.workoutCount}</Text>
              <Text style={styles.statLabel}>Séances</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalTime} min</Text>
              <Text style={styles.statLabel}>Temps total</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalVolume}t</Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {weeklyStats.avgDuration} min
              </Text>
              <Text style={styles.statLabel}>Durée moy.</Text>
            </View>
          </View>
        </View>

        {/* Recent PRs */}
        {getSortedPRs().length > 0 && (
          <View style={styles.prsSection}>
            <Text style={styles.sectionTitle}>Records Personnels 🏆</Text>

            {getSortedPRs().map((pr, index) => {
              const prColor = getPRColor(pr.type);

              return (
                <View
                  key={`${pr.exerciseId}-${pr.type}-${index}`}
                  style={[styles.prCard, { borderLeftColor: prColor }]}
                >
                  <View style={styles.prHeader}>
                    <View style={styles.prTitleContainer}>
                      <View
                        style={[styles.prIcon, { backgroundColor: prColor }]}
                      >
                        <Ionicons
                          name={getPRIcon(pr.type) as any}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.prTitleInfo}>
                        <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                        <Text style={styles.prTypeLabel}>
                          {getPRTypeLabel(pr.type)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.prDate}>
                      {new Date(pr.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>

                  <Text style={[styles.prValue, { color: prColor }]}>
                    {formatPRValue(pr)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Progress Chart */}
        {completedWorkouts.length > 0 && (
          <ProgressChart workouts={completedWorkouts} />
        )}

        {/* Exercise Progress */}
        <ExerciseProgress workouts={completedWorkouts} />

        {/* Recent Workouts */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique complet</Text>
            <Text style={styles.workoutCount}>
              {completedWorkouts.length} séance
              {completedWorkouts.length > 1 ? "s" : ""}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : completedWorkouts.length > 0 ? (
            completedWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <View style={styles.workoutTitleContainer}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                    </View>
                    <Text style={styles.workoutMeta}>
                      {formatDuration(workout.started_at, workout.finished_at)}{" "}
                      • {workout.exercises.length} exercices •{" "}
                      {workout.exercises.reduce(
                        (total, ex) =>
                          total + ex.sets.filter((s) => s.completed).length,
                        0
                      )}{" "}
                      séries
                    </Text>
                  </View>

                  <View style={styles.workoutDate}>
                    <Text style={styles.workoutDateText}>
                      {formatDate(workout.started_at)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#C7C7CC"
                    />
                  </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  {workout.is_template && (
                    <View style={styles.templateBadge}>
                      <Ionicons name="book" size={12} color="#007AFF" />
                      <Text style={styles.templateBadgeText}>Programme</Text>
                    </View>
                  )}
                  {workout.exercises.slice(0, 3).map((exercise, index) => (
                    <View key={index} style={styles.exerciseTag}>
                      <Text style={styles.exerciseTagText}>
                        {exercise.exercise.name}
                      </Text>
                    </View>
                  ))}
                  {workout.exercises.length > 3 && (
                    <View style={styles.exerciseTag}>
                      <Text style={styles.exerciseTagText}>
                        +{workout.exercises.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Aucune séance terminée</Text>
              <Text style={styles.emptySubtitle}>
                Vos entraînements terminés apparaîtront ici
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push("/workout/new")}
              >
                <Text style={styles.startButtonText}>
                  Commencer un entraînement
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
    padding: 16,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  workoutCount: {
    fontSize: 14,
    color: "#8E8E93",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  recentSection: {
    marginTop: 8,
  },
  workoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    color: "#666",
  },
  workoutDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutDateText: {
    fontSize: 13,
    color: "#8E8E93",
    marginRight: 4,
  },
  quickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  exerciseTag: {
    backgroundColor: "#F2F2F7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exerciseTagText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  prsSection: {
    marginBottom: 20,
  },
  prHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prExercise: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  prDate: {
    fontSize: 12,
    color: "#8E8E93",
  },
  prValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFD60A",
    marginBottom: 8,
  },
  prTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prTypeweight: {
    backgroundColor: "#FFE5E5",
  },
  prTypereps: {
    backgroundColor: "#E8F5E8",
  },
  prType1rm: {
    backgroundColor: "#FFF8E1",
  },
  prTypevolume: {
    backgroundColor: "#E3F2FD",
  },
  prTypeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666",
  },
  prTypeduration: {
    backgroundColor: "#EDE7F6",
  },
  prTypedistance: {
    backgroundColor: "#E8F5E8",
  },
  prTypespeed: {
    backgroundColor: "#FFF3E0",
  },
  prTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prTitleInfo: {
    flex: 1,
  },
  prTypeLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
    marginTop: 2,
  },
  prCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  templateBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E6F3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  templateBadgeText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
});
