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
import { useTemplateStore } from "../../store/templateStore";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const { workoutHistory, isLoading, loadWorkoutHistory } = useWorkoutStore();
  const { currentProgram, selectedTemplate, loadTemplates, getProgramStats } =
    useTemplateStore();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const programStats = getProgramStats();

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

    // Calcul hours minutes and seconds
    const duration = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
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
                  return w.date > weekAgo;
                }).length
              }
            </Text>
            <Text style={styles.statLabel}>CETTE SEMAINE</Text>
          </View>
        </View>

        {currentProgram && selectedTemplate && (
          <View style={styles.currentProgramCard}>
            <View style={styles.programHeader}>
              <View style={styles.programInfo}>
                <Text style={styles.programTitle}>{selectedTemplate.name}</Text>
                <Text style={styles.programWeek}>
                  Semaine {programStats.currentWeek} / {programStats.totalWeeks}
                </Text>
                <Text style={styles.programSessions}>
                  {programStats.completedSessions} /{" "}
                  {programStats.totalSessions} sessions
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>
                  {programStats.progressPercent}%
                </Text>
              </View>
            </View>

            {/* Barre de progression détaillée */}
            <View style={styles.detailedProgress}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${programStats.progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressDetails}>
                {programStats.remainingSessions} sessions restantes
              </Text>
              {programStats.estimatedCompletion && (
                <Text style={styles.estimatedCompletion}>
                  Fin estimée :{" "}
                  {programStats.estimatedCompletion.toLocaleDateString()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.push("/workout/active?mode=template")}
            >
              <Text style={styles.continueButtonText}>
                Continuer le programme
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

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
                    {formatDate(workout.date)}
                  </Text>
                </View>
                <Text style={styles.workoutMeta}>
                  {workout.finished_at
                    ? formatDuration(workout.started_at, workout.finished_at)
                    : "en cours"}{" "}
                  • {workout.exercises.length} exercices
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

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.freeWorkoutCard]}
            onPress={() => router.push("/workout/new")}
          >
            <Ionicons name="barbell" size={32} color="#007AFF" />
            <Text style={styles.actionTitle}>Séance Libre</Text>
            <Text style={styles.actionSubtitle}>Créer ma propre séance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.templateCard]}
            onPress={() => router.push("/templates/")}
          >
            <Ionicons name="library" size={32} color="#34C759" />
            <Text style={styles.actionTitle}>Programmes</Text>
            <Text style={styles.actionSubtitle}>Suivre un programme</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  // sectionTitle: {
  //   fontSize: 18,
  //   fontWeight: "600",
  //   color: "#1C1C1E",
  //   marginBottom: 12,
  // },
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
  currentProgramCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  programWeek: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E6F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#007AFF",
  },
  nextSession: {
    marginBottom: 16,
  },
  nextSessionLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  nextSessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // NOUVEAUX STYLES pour les actions rapides
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  freeWorkoutCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  templateCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 8,
    marginBottom: 2,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  programSessions: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  detailedProgress: {
    marginTop: 12,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  progressDetails: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  estimatedCompletion: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
});
