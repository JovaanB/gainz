import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { Workout, WorkoutExercise } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workoutHistory, deleteWorkout } = useWorkoutStore();
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    const foundWorkout = workoutHistory.find((w) => w.id === id);
    setWorkout(foundWorkout || null);
  }, [id, workoutHistory]);

  if (!workout) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Séance introuvable</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cette séance n'existe plus.</Text>
        </View>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "Séance incomplète";

    const duration = Math.floor((endTime - startTime) / 1000 / 60);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const calculateTotalVolume = () => {
    return workout.exercises.reduce((total, exercise) => {
      if (exercise.exercise.category === "cardio") return total;

      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          if (set.completed && set.reps && set.weight) {
            return setTotal + set.reps * set.weight;
          }
          return setTotal;
        }, 0)
      );
    }, 0);
  };

  const getTotalCardioTime = () => {
    return workout.exercises.reduce((total, exercise) => {
      // Seulement le cardio
      if (exercise.exercise.category !== "cardio") return total;

      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          if (set.completed && set.duration_seconds) {
            return setTotal + set.duration_seconds;
          }
          return setTotal;
        }, 0)
      );
    }, 0);
  };

  const getTotalDistance = () => {
    return workout.exercises.reduce((total, exercise) => {
      if (exercise.exercise.category !== "cardio") return total;

      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          if (set.completed && set.distance_km) {
            return setTotal + set.distance_km;
          }
          return setTotal;
        }, 0)
      );
    }, 0);
  };

  const getTotalSets = () => {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.filter((set) => set.completed).length;
    }, 0);
  };

  const getBestSet = (
    workoutExercise: WorkoutExercise
  ): {
    reps?: number;
    weight?: number;
  } | null => {
    let bestSet: {
      completed: boolean;
      reps?: number;
      weight?: number;
    } | null = null;
    let bestValue = 0;
    const isCardio = workoutExercise.exercise.category === "cardio";

    workoutExercise.sets.forEach(
      (set: {
        completed: boolean;
        reps?: number;
        weight?: number;
        duration_seconds?: number;
        distance_km?: number;
      }) => {
        if (!set.completed) return;
        let currentValue = 0;

        if (isCardio) {
          if (set.distance_km && set.duration_seconds) {
            currentValue = set.distance_km / (set.duration_seconds / 3600);
          } else if (set.distance_km) {
            currentValue = set.distance_km * 1000;
          } else if (set.duration_seconds) {
            currentValue = set.duration_seconds;
          }
        } else {
          if (set.reps) {
            currentValue = set.weight
              ? set.weight * (1 + set.reps / 30)
              : set.reps;
          }
        }

        if (currentValue > bestValue) {
          bestValue = currentValue;
          bestSet = set;
        }
      }
    );

    return bestSet;
  };

  const formatCardioSet = (set: any) => {
    const parts = [];

    if (set.duration_seconds) {
      const minutes = Math.floor(set.duration_seconds / 60);
      const seconds = set.duration_seconds % 60;
      parts.push(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }

    if (set.distance_km) {
      parts.push(`${set.distance_km}km`);
    }

    if (set.duration_seconds && set.distance_km) {
      const speed = set.distance_km / (set.duration_seconds / 3600);
      parts.push(`(${speed.toFixed(1)}km/h)`);
    }

    return parts.join(" • ");
  };

  const formatBestSet = (bestSet: any, isCardio: boolean) => {
    if (!bestSet) return "Aucune donnée";

    if (isCardio) {
      return formatCardioSet(bestSet);
    } else {
      // Musculation (code existant)
      if (bestSet.weight) {
        return `${bestSet.reps} reps × ${bestSet.weight}kg`;
      } else {
        return `${bestSet.reps} reps (poids de corps)`;
      }
    }
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      "Supprimer la séance",
      "Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkout(workout.id);
              router.back();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la séance.");
            }
          },
        },
      ]
    );
  };

  const handleShareWorkout = async () => {
    const totalVolume = calculateTotalVolume();
    const duration = formatDuration(workout.started_at, workout.finished_at);

    const shareText = `🏋️ ${workout.name}
    
📅 ${formatDate(workout.started_at)}
⏱️ Durée: ${duration}
🏋️ Volume total: ${Math.round(totalVolume / 1000)}t
📊 ${getTotalSets()} séries terminées

Exercices:
${workout.exercises
  .map((ex) => {
    const completedSets = ex.sets.filter((set) => set.completed);
    return `• ${ex.exercise.name}: ${completedSets.length} série${
      completedSets.length > 1 ? "s" : ""
    }`;
  })
  .join("\n")}

Généré avec Gainz 💪`;

    try {
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error("Error sharing workout:", error);
    }
  };

  const totalVolume = calculateTotalVolume();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <TouchableOpacity onPress={handleShareWorkout}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Workout Header */}
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.workoutDate}>
            {formatDate(workout.started_at)}
          </Text>

          {!workout.finished_at && (
            <View style={styles.incompleteWarning}>
              <Ionicons name="warning-outline" size={16} color="#FF9500" />
              <Text style={styles.incompleteText}>Séance incomplète</Text>
            </View>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatDuration(workout.started_at, workout.finished_at)}
            </Text>
            <Text style={styles.statLabel}>Durée</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTotalSets()}</Text>
            <Text style={styles.statLabel}>Séries</Text>
          </View>

          {/* Volume ou temps cardio selon le type d'entraînement */}
          {calculateTotalVolume() > 0 ? (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.round(calculateTotalVolume() / 1000)}t
              </Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
          ) : getTotalCardioTime() > 0 ? (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.floor(getTotalCardioTime() / 60)}min
              </Text>
              <Text style={styles.statLabel}>Cardio</Text>
            </View>
          ) : (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
          )}

          {/* Distance si pertinent */}
          {getTotalDistance() > 0 ? (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {getTotalDistance().toFixed(1)}km
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          ) : (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercices</Text>
            </View>
          )}
        </View>

        {/* Exercises Detail */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercices</Text>

          {workout.exercises.map((workoutExercise, index) => {
            const completedSets = workoutExercise.sets.filter(
              (set) => set.completed
            );

            const bestSet = getBestSet(workoutExercise);

            return (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>
                    {workoutExercise.exercise.name}
                  </Text>
                  <View style={styles.muscleGroups}>
                    {workoutExercise.exercise.muscle_groups
                      .slice(0, 2)
                      .map((group, idx) => (
                        <View key={idx} style={styles.muscleTag}>
                          <Text style={styles.muscleTagText}>{group}</Text>
                        </View>
                      ))}
                  </View>
                </View>

                {/* Sets Summary */}
                <View style={styles.setsSummary}>
                  <Text style={styles.setsTitle}>
                    {completedSets.length} série
                    {completedSets.length > 1 ? "s" : ""} terminée
                    {completedSets.length > 1 ? "s" : ""}
                  </Text>

                  {bestSet && (
                    <Text style={styles.bestSetText}>
                      Meilleur:{" "}
                      {formatBestSet(
                        bestSet,
                        workoutExercise.exercise.category === "cardio"
                      )}
                    </Text>
                  )}
                </View>

                {/* Sets Detail */}
                <View style={styles.setsDetail}>
                  {workoutExercise.sets.map((set, setIndex) => {
                    const isCardio =
                      workoutExercise.exercise.category === "cardio";

                    return (
                      <View
                        key={setIndex}
                        style={[
                          styles.setRow,
                          set.completed && styles.setRowCompleted,
                        ]}
                      >
                        <Text style={styles.setNumber}>{setIndex + 1}</Text>

                        <View style={styles.setData}>
                          {set.completed ? (
                            <>
                              {isCardio ? (
                                <Text style={styles.setValue}>
                                  {formatCardioSet(set)}
                                </Text>
                              ) : (
                                <>
                                  <Text style={styles.setValue}>
                                    {set.reps} reps
                                  </Text>
                                  {set.weight && (
                                    <Text style={styles.setWeight}>
                                      {set.weight}kg
                                    </Text>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <Text style={styles.setIncomplete}>
                              Non terminée
                            </Text>
                          )}
                        </View>

                        {set.completed && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#34C759"
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Notes */}
                {workoutExercise.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesTitle}>Notes:</Text>
                    <Text style={styles.notesText}>
                      {workoutExercise.notes}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.repeatButton}
            onPress={() => {
              // TODO: Implémenter la fonctionnalité "Répéter la séance"
              Alert.alert(
                "À venir",
                "Cette fonctionnalité sera bientôt disponible !"
              );
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#007AFF" />
            <Text style={styles.repeatButtonText}>Répéter cette séance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteWorkout}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workoutHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
  },
  incompleteWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  incompleteText: {
    fontSize: 13,
    color: "#FF9500",
    fontWeight: "500",
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  exercisesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  exerciseCard: {
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
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
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
  setsSummary: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  setsTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  bestSetText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  setsDetail: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  setRowCompleted: {
    backgroundColor: "#F0F8FF",
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    width: 20,
  },
  setData: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  setValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  setWeight: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  setIncomplete: {
    fontSize: 14,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#1C1C1E",
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  repeatButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
});
