// src/app/templates/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTemplateStore } from "../../store/templateStore";
import { WorkoutTemplate } from "../../types/templates";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    availableTemplates,
    favoriteTemplates,
    addToFavorites,
    removeFromFavorites,
    startProgram,
  } = useTemplateStore();

  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    const foundTemplate = availableTemplates.find((t) => t.id === id);
    if (foundTemplate) {
      setTemplate(foundTemplate);
    } else {
      router.back();
    }
  }, [id, availableTemplates]);

  if (!template) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const isFavorite = favoriteTemplates.includes(template.id);
  const selectedSession = template.sessions[selectedSessionIndex];

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(template.id);
    } else {
      addToFavorites(template.id);
    }
  };

  const handleStartProgram = () => {
    Alert.alert(
      "Démarrer le programme ?",
      `Vous allez commencer "${template.name}". Votre progression sera suivie automatiquement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Démarrer",
          onPress: () => {
            startProgram(template.id);
            router.push("/workout/active?mode=template");
          },
        },
      ]
    );
  };

  const getLevelColor = () => {
    switch (template.level) {
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

  const getLevelText = () => {
    switch (template.level) {
      case "beginner":
        return "Débutant";
      case "intermediate":
        return "Intermédiaire";
      case "advanced":
        return "Avancé";
      default:
        return "";
    }
  };

  const formatReps = (reps: number | string) => {
    return typeof reps === "string" ? reps : reps.toString();
  };

  const getTotalExercises = () => {
    return template.sessions.reduce(
      (total, session) => total + session.exercises.length,
      0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Détail du programme</Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#FF3B30" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card principale du template */}
        <View style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <View style={styles.templateInfo}>
              <View style={styles.templateTitleRow}>
                <Text style={styles.templateTitle}>{template.name}</Text>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: getLevelColor() },
                  ]}
                >
                  <Text style={styles.levelText}>{getLevelText()}</Text>
                </View>
              </View>
              <Text style={styles.templateDescription}>
                {template.description}
              </Text>
            </View>

            <View style={styles.popularityContainer}>
              <Ionicons name="star" size={16} color="#FF9500" />
              <Text style={styles.popularityText}>{template.popularity}%</Text>
            </View>
          </View>

          {/* Métadonnées */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.metadataLabel}>Durée</Text>
                <Text style={styles.metadataValue}>{template.duration}min</Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                <Text style={styles.metadataLabel}>Fréquence</Text>
                <Text style={styles.metadataValue}>
                  {template.frequency}x/sem
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons name="barbell-outline" size={20} color="#007AFF" />
                <Text style={styles.metadataLabel}>Séances</Text>
                <Text style={styles.metadataValue}>
                  {template.sessions.length}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons name="fitness-outline" size={20} color="#007AFF" />
                <Text style={styles.metadataLabel}>Exercices</Text>
                <Text style={styles.metadataValue}>{getTotalExercises()}</Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {template.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Résultats estimés */}
          <View style={styles.resultsContainer}>
            <Ionicons name="trophy-outline" size={16} color="#34C759" />
            <Text style={styles.resultsText}>{template.estimated_results}</Text>
          </View>
        </View>

        {/* Sélecteur de séances */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Séances du programme</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sessionTabs}
          >
            {template.sessions.map((session, index) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionTab,
                  selectedSessionIndex === index && styles.sessionTabActive,
                ]}
                onPress={() => setSelectedSessionIndex(index)}
              >
                <Text
                  style={[
                    styles.sessionTabText,
                    selectedSessionIndex === index &&
                      styles.sessionTabTextActive,
                  ]}
                >
                  {session.name}
                </Text>
                <Text
                  style={[
                    styles.sessionTabDuration,
                    selectedSessionIndex === index &&
                      styles.sessionTabDurationActive,
                  ]}
                >
                  {session.estimated_duration}min
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Détail de la séance sélectionnée */}
        {selectedSession && (
          <View style={styles.sessionDetail}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{selectedSession.name}</Text>
              <View style={styles.sessionMeta}>
                <View style={styles.sessionMetaItem}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.sessionMetaText}>
                    {selectedSession.estimated_duration}min
                  </Text>
                </View>
                <View style={styles.sessionMetaItem}>
                  <Ionicons name="barbell-outline" size={14} color="#6B7280" />
                  <Text style={styles.sessionMetaText}>
                    {selectedSession.exercises.length} exercices
                  </Text>
                </View>
              </View>
            </View>

            {/* Liste des exercices */}
            <View style={styles.exercisesList}>
              {selectedSession.exercises.map((exercise, index) => (
                <View
                  key={`${exercise.exercise_id}_${index}`}
                  style={styles.exerciseItem}
                >
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>
                      {exercise.exercise_id.replace("_", " ")}
                    </Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} séries × {formatReps(exercise.reps)} reps
                    </Text>
                    <Text style={styles.exerciseRest}>
                      Repos: {Math.floor(exercise.rest_seconds / 60)}:
                      {(exercise.rest_seconds % 60).toString().padStart(2, "0")}
                    </Text>
                    {exercise.notes && (
                      <Text style={styles.exerciseNotes}>
                        💡 {exercise.notes}
                      </Text>
                    )}
                    {exercise.progression_notes && (
                      <Text style={styles.exerciseProgression}>
                        📈 {exercise.progression_notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Équipement requis */}
        <View style={styles.equipmentContainer}>
          <Text style={styles.sectionTitle}>Équipement requis</Text>
          <View style={styles.equipmentList}>
            {template.equipment.map((equipment, index) => (
              <View key={index} style={styles.equipmentItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.equipmentText}>
                  {equipment === "bodyweight"
                    ? "Poids du corps"
                    : equipment === "dumbbells"
                    ? "Haltères"
                    : equipment === "barbell"
                    ? "Barre"
                    : equipment === "machines"
                    ? "Machines"
                    : equipment === "cables"
                    ? "Poulies"
                    : equipment === "bands"
                    ? "Élastiques"
                    : equipment}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bouton d'action fixe */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartProgram}
        >
          <Text style={styles.startButtonText}>Démarrer ce programme</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  favoriteButton: {
    padding: 8,
  },

  content: {
    flex: 1,
  },

  // Template Card
  templateCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    flex: 1,
    marginRight: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
  },
  templateDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  popularityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Métadonnées
  metadataContainer: {
    marginBottom: 16,
  },
  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metadataItem: {
    alignItems: "center",
    minWidth: 70,
  },
  metadataLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 2,
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Résultats
  resultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
  },
  resultsText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "500",
    flex: 1,
  },

  // Séances
  sessionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  sessionTabs: {
    paddingRight: 16,
    gap: 8,
  },
  sessionTab: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionTabActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sessionTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  sessionTabTextActive: {
    color: "white",
  },
  sessionTabDuration: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  sessionTabDurationActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Détail séance
  sessionDetail: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: "row",
    gap: 16,
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Exercices
  exercisesList: {
    padding: 16,
    gap: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    gap: 12,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  exerciseDetails: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  exerciseRest: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  exerciseNotes: {
    fontSize: 11,
    color: "#007AFF",
    marginBottom: 2,
    fontStyle: "italic",
  },
  exerciseProgression: {
    fontSize: 11,
    color: "#22C55E",
    fontStyle: "italic",
  },

  // Équipement
  equipmentContainer: {
    marginHorizontal: 16,
    marginBottom: 100, // Espace pour le bouton fixe
  },
  equipmentList: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  equipmentText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  // Action
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
