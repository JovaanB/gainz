// app/programs/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProgramStore } from "@/store/programStore";
import {
  programService,
  SupabaseWorkoutProgram,
  ProgramSessionDetail,
} from "@/services/programService";
import { useAuthStore } from "@/store/authStore";

export default function ProgramDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const {
    activeProgram,
    addToFavorites,
    removeFromFavorites,
    startProgram,
    stopProgram,
    duplicateProgram,
  } = useProgramStore();

  const [program, setProgram] = useState<SupabaseWorkoutProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProgramDetails();
    }
  }, [id]);

  const loadProgramDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const programDetails = await programService.getProgramById(id);
      if (programDetails) {
        setProgram(programDetails);
      } else {
        setError("Programme non trouvé");
      }
    } catch (error) {
      console.error("Error loading program details:", error);
      setError("Erreur lors du chargement du programme");
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "#34C759";
      case "intermediate":
        return "#FF9500";
      case "advanced":
        return "#FF3B30";
      default:
        return "#007AFF";
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
    };
    return labels[level] || level;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strength: "Force",
      muscle_building: "Masse",
      general_fitness: "Fitness",
      powerlifting: "Powerlifting",
      bodybuilding: "Bodybuilding",
    };
    return labels[category] || category;
  };

  const handleToggleFavorite = async () => {
    if (!program || !isAuthenticated) return;

    try {
      if (program.is_favorite) {
        await removeFromFavorites(program.id);
        setProgram({ ...program, is_favorite: false });
      } else {
        await addToFavorites(program.id);
        setProgram({ ...program, is_favorite: true });
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier les favoris");
    }
  };

  const handleStartProgram = async () => {
    if (!program || !isAuthenticated) return;

    try {
      const isActive = activeProgram?.program_id === program.id;

      if (isActive) {
        // Programme déjà actif, aller à la session actuelle
        router.push("/");
        return;
      }

      if (activeProgram) {
        Alert.alert(
          "Programme en cours",
          "Vous avez déjà un programme actif. Voulez-vous l'arrêter et démarrer ce nouveau programme ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Changer de programme",
              style: "destructive",
              onPress: async () => {
                await stopProgram();
                await startProgram(program.id);
                Alert.alert("Succès", "Programme démarré !", [
                  { text: "OK", onPress: () => router.push("/") },
                ]);
              },
            },
          ]
        );
      } else {
        await startProgram(program.id);
        Alert.alert("Succès", "Programme démarré !", [
          { text: "OK", onPress: () => router.push("/") },
        ]);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de démarrer le programme");
    }
  };

  const handleDuplicate = async () => {
    if (!program || !isAuthenticated) return;

    try {
      await duplicateProgram(program.id, `${program.name} (Copie)`);
      Alert.alert("Succès", "Programme dupliqué avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de dupliquer le programme");
    }
  };

  const renderSessionCard = (session: ProgramSessionDetail) => {
    return (
      <View key={session.id} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <Text style={styles.sessionDuration}>
              {session.estimated_duration} min • {session.exercise_count}{" "}
              exercices
            </Text>
            {session.week_pattern.length > 0 && (
              <Text style={styles.sessionPattern}>
                Recommandé: {session.week_pattern.join(", ")}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.sessionArrow}
            onPress={() =>
              router.push({
                pathname: "/workout/active",
                params: {
                  mode: "program",
                  sessionId: session.id,
                  programId: program?.id!,
                },
              })
            }
          >
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {session.description && (
          <Text style={styles.sessionDescription}>{session.description}</Text>
        )}

        {/* Aperçu des exercices */}
        {session.exercises.length > 0 && (
          <View style={styles.exercisePreview}>
            <Text style={styles.exercisePreviewTitle}>Exercices :</Text>
            {session.exercises.slice(0, 3).map((exercise, index) => (
              <Text key={exercise.id} style={styles.exercisePreviewItem}>
                • {exercise.exercise_name} - {exercise.sets} séries
              </Text>
            ))}
            {session.exercises.length > 3 && (
              <Text style={styles.exercisePreviewMore}>
                +{session.exercises.length - 3} autres exercices
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Programme</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du programme...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Programme</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadProgramDetails}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = activeProgram?.program_id === program.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programme</Text>

        <View style={styles.headerActions}>
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={program.is_favorite ? "heart" : "heart-outline"}
                size={24}
                color={program.is_favorite ? "#FF3B30" : "#007AFF"}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleDuplicate}
          >
            <Ionicons name="copy-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Program Hero */}
        <View style={styles.programHero}>
          <View style={styles.programIconContainer}>
            <View
              style={[
                styles.programIcon,
                { backgroundColor: getDifficultyColor(program.level) },
              ]}
            >
              <Ionicons name={program.icon as any} size={32} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.programTitle}>{program.name}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>

          {/* Badges */}
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: `${getDifficultyColor(program.level)}20` },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(program.level) },
                ]}
              >
                {getLevelLabel(program.level)}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {getCategoryLabel(program.category)}
              </Text>
            </View>
            {!program.is_global && (
              <View style={styles.personalBadge}>
                <Text style={styles.personalBadgeText}>Personnel</Text>
              </View>
            )}
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>En cours</Text>
              </View>
            )}
          </View>
        </View>

        {/* Program Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{program.duration_weeks}</Text>
            <Text style={styles.statLabel}>Semaines</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{program.frequency_per_week}</Text>
            <Text style={styles.statLabel}>Sessions/sem.</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {program.sessions?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Sessions types</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{program.popularity}</Text>
            <Text style={styles.statLabel}>Popularité</Text>
          </View>
        </View>

        {/* Résultats attendus */}
        {program.estimated_results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Résultats attendus</Text>
            <Text style={styles.resultsText}>{program.estimated_results}</Text>
          </View>
        )}

        {/* Équipement nécessaire */}
        {program.equipment.length > 0 && (
          <View style={styles.equipmentContainer}>
            <Text style={styles.sectionTitle}>Équipement nécessaire</Text>
            <View style={styles.equipmentList}>
              {program.equipment.map((equipment, index) => (
                <View key={index} style={styles.equipmentItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.equipmentText}>{equipment}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {program.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsList}>
              {program.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sessions du programme */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Sessions du programme</Text>
          {program.sessions && program.sessions.length > 0 ? (
            program.sessions
              .sort((a, b) => a.order_index - b.order_index)
              .map(renderSessionCard)
          ) : (
            <View style={styles.noSessionsContainer}>
              <Text style={styles.noSessionsText}>
                Aucune session configurée
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isActive && styles.activeActionButton]}
          onPress={handleStartProgram}
        >
          <Text
            style={[
              styles.actionButtonText,
              isActive && styles.activeActionButtonText,
            ]}
          >
            {isActive ? "Continuer le programme" : "Démarrer le programme"}
          </Text>
          <Ionicons
            name={isActive ? "play" : "rocket"}
            size={20}
            color={isActive ? "#007AFF" : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>
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
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  favoriteButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  programHero: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  programIconContainer: {
    marginBottom: 16,
  },
  programIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  programTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  personalBadge: {
    backgroundColor: "#8E44AD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  personalBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activeBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  resultsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  resultsText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  equipmentContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  equipmentList: {
    gap: 8,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  equipmentText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  tagsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  sessionsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  sessionCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  sessionPattern: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  sessionArrow: {
    padding: 8,
  },
  sessionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  exercisePreview: {
    marginTop: 8,
  },
  exercisePreviewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 4,
  },
  exercisePreviewItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  exercisePreviewMore: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  noSessionsContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noSessionsText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeActionButton: {
    backgroundColor: "#F0F8FF",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activeActionButtonText: {
    color: "#007AFF",
  },
});
