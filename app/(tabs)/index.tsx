import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workoutStore";
import { useProgramStore } from "@/store/programStore"; // Nouveau store des programmes
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const { workoutHistory, isLoading, loadWorkoutHistory } = useWorkoutStore();

  // Nouveau : utiliser le store des programmes
  const {
    activeProgram,
    selectedProgram,
    isLoading: programsLoading,
    error: programsError,
    loadPrograms,
    loadActiveProgram,
    getCurrentSession,
    getNextSession,
    getProgramStats,
  } = useProgramStore();

  useEffect(() => {
    loadWorkoutHistory();
    loadPrograms();
    loadActiveProgram();
  }, []);

  const programStats = getProgramStats();
  const currentSession = getCurrentSession();
  const nextSession = getNextSession();

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

  const continueProgram = () => {
    if (currentSession) {
      // Naviguer vers l'écran de session de programme
      router.push({
        pathname: "/workout/active",
        params: {
          mode: "program",
          sessionId: currentSession.id,
          programId: selectedProgram?.id!,
        },
      });
    } else {
      // Fallback vers le système de workout normal
      router.push("/workout/active");
    }
  };

  const renderProgramCard = () => {
    if (!activeProgram || !selectedProgram) return null;

    return (
      <View style={styles.currentProgramCard}>
        <View style={styles.programHeader}>
          <View style={styles.programInfo}>
            <Text style={styles.programTitle}>{selectedProgram.name}</Text>
            <Text style={styles.programCategory}>
              {selectedProgram.category.replace("_", " ")} •{" "}
              {selectedProgram.level}
            </Text>
            <Text style={styles.programWeek}>
              Semaine {programStats.currentWeek} / {programStats.totalWeeks}
            </Text>
            <Text style={styles.programSessions}>
              {programStats.completedSessions} / {programStats.totalSessions}{" "}
              sessions
            </Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>
              {programStats.progressPercent}%
            </Text>
          </View>
        </View>

        {/* Session actuelle ou suivante */}
        {currentSession && (
          <View style={styles.nextSession}>
            <Text style={styles.nextSessionLabel}>Session actuelle</Text>
            <Text style={styles.nextSessionName}>{currentSession.name}</Text>
            <Text style={styles.sessionDetails}>
              {currentSession.estimated_duration} min •{" "}
              {currentSession.exercise_count} exercices
            </Text>
          </View>
        )}

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
              {programStats.estimatedCompletion.toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={continueProgram}
        >
          <Text style={styles.continueButtonText}>
            {currentSession ? `Commencer` : "Continuer le programme"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderStats = () => {
    const thisWeekWorkouts = workoutHistory.filter((w) => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return w.date > weekAgo;
    }).length;

    const thisMonthWorkouts = workoutHistory.filter((w) => {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return w.date > monthAgo;
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{workoutHistory.length}</Text>
          <Text style={styles.statLabel}>SÉANCES TOTAL</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{thisWeekWorkouts}</Text>
          <Text style={styles.statLabel}>CETTE SEMAINE</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{thisMonthWorkouts}</Text>
          <Text style={styles.statLabel}>CE MOIS</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        {renderStats()}

        {/* Programme actif */}
        {programsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement du programme...</Text>
          </View>
        ) : programsError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>Erreur lors du chargement</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                loadPrograms();
                loadActiveProgram();
              }}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderProgramCard()
        )}

        {/* Séances récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Récentes</Text>
            {workoutHistory.length > 5 && (
              <TouchableOpacity onPress={() => router.push("/history")}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : workoutHistory.length > 0 ? (
            workoutHistory.slice(0, 5).map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[
                  styles.workoutCard,
                  workout.is_template && styles.programWorkoutCard,
                ]}
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutTitleContainer}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                  </View>
                  <Text style={styles.workoutDate}>
                    {formatDate(workout.date)}
                  </Text>
                </View>
                {workout.is_template && (
                  <View style={styles.programBadge}>
                    <Text style={styles.programBadgeText}>Programme</Text>
                  </View>
                )}
                <Text style={styles.workoutMeta}>
                  {workout.finished_at
                    ? formatDuration(workout.started_at, workout.finished_at)
                    : "en cours"}{" "}
                  • {workout.exercises.length} exercices
                </Text>
                {workout.template_id && (
                  <Text style={styles.workoutTemplate}>
                    Partie du programme {selectedProgram?.name || "Programme"}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>Aucune séance pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Commence ton premier entraînement !
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions rapides */}
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
            style={[styles.actionCard, styles.programCard]}
            onPress={() => router.push("/programs/")}
          >
            <Ionicons name="library" size={32} color="#34C759" />
            <Text style={styles.actionTitle}>Programmes</Text>
            <Text style={styles.actionSubtitle}>
              {activeProgram ? "Gérer mon programme" : "Suivre un programme"}
            </Text>
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
    gap: 8,
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
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
  programWorkoutCard: {
    borderLeftColor: "#34C759",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  workoutTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  programBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    paddingVertical: 2,
    marginBottom: 6,
    borderRadius: 4,
  },
  programBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  workoutDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  workoutMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  workoutTemplate: {
    fontSize: 12,
    color: "#34C759",
    fontStyle: "italic",
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
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#C7C7CC",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingText: {
    marginLeft: 12,
    color: "#8E8E93",
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  currentProgramCard: {
    backgroundColor: "white",
    marginBottom: 24,
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
    alignItems: "flex-start",
    marginBottom: 16,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  programCategory: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  programWeek: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  programSessions: {
    fontSize: 12,
    color: "#9CA3AF",
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
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
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
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: 12,
    color: "#8E8E93",
  },
  detailedProgress: {
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
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
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
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  freeWorkoutCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  programCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  templateCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  historyCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#8E44AD",
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
});
