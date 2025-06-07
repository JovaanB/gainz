// app/programs/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProgramStore } from "@/store/programStore";
import { SupabaseWorkoutProgram } from "@/services/programService";
import { useAuthStore } from "@/store/authStore";

type CategoryFilter =
  | "all"
  | "strength"
  | "muscle_building"
  | "general_fitness"
  | "powerlifting"
  | "bodybuilding";
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

export default function ProgramsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const {
    availablePrograms,
    activeProgram,
    selectedProgram,
    isLoading,
    error,
    loadPrograms,
    addToFavorites,
    removeFromFavorites,
    startProgram,
    stopProgram,
    duplicateProgram,
  } = useProgramStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

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

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
    };
    return labels[level] || level;
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

  const getFilteredPrograms = () => {
    let filtered = availablePrograms;

    // Filtre de recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (program) =>
          program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          program.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filtre de catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (program) => program.category === categoryFilter
      );
    }

    // Filtre de niveau
    if (levelFilter !== "all") {
      filtered = filtered.filter((program) => program.level === levelFilter);
    }

    // Filtre favoris
    if (showFavoritesOnly) {
      filtered = filtered.filter((program) => program.is_favorite);
    }

    // Trier par popularité puis par nom
    return filtered.sort((a, b) => {
      if (a.popularity !== b.popularity) {
        return b.popularity - a.popularity;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const handleToggleFavorite = async (program: SupabaseWorkoutProgram) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour ajouter des favoris"
      );
      return;
    }

    try {
      if (program.is_favorite) {
        await removeFromFavorites(program.id);
      } else {
        await addToFavorites(program.id);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier les favoris");
    }
  };

  const handleStartProgram = async (program: SupabaseWorkoutProgram) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour démarrer un programme"
      );
      return;
    }

    try {
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
                router.push("/");
              },
            },
          ]
        );
      } else {
        await startProgram(program.id);
        Alert.alert(
          "Programme démarré !",
          `Vous avez démarré le programme "${program.name}". Vous pouvez maintenant commencer votre première session.`,
          [{ text: "OK", onPress: () => router.push("/") }]
        );
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de démarrer le programme");
    }
  };

  const handleDuplicateProgram = async (program: SupabaseWorkoutProgram) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour dupliquer un programme"
      );
      return;
    }

    try {
      await duplicateProgram(program.id, `${program.name} (Copie)`);
      Alert.alert("Succès", "Programme dupliqué avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de dupliquer le programme");
    }
  };

  const renderProgramCard = (program: SupabaseWorkoutProgram) => {
    const isActive = activeProgram?.program_id === program.id;

    return (
      <TouchableOpacity
        key={program.id}
        style={[styles.programCard, isActive && styles.activeProgramCard]}
        onPress={() => router.push(`/programs/${program.id}`)}
      >
        {/* Header avec icône et favoris */}
        <View style={styles.programHeader}>
          <View
            style={[
              styles.programIcon,
              { backgroundColor: getDifficultyColor(program.level) },
            ]}
          >
            <Ionicons name={program.icon as any} size={24} color="#FFFFFF" />
          </View>

          <View style={styles.programMeta}>
            <Text style={styles.programDuration}>
              {program.duration_weeks} semaines
            </Text>
            <Text style={styles.programFrequency}>
              {program.frequency_per_week}x/semaine
            </Text>
          </View>

          {isAuthenticated && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(program)}
            >
              <Ionicons
                name={program.is_favorite ? "heart" : "heart-outline"}
                size={20}
                color={program.is_favorite ? "#FF3B30" : "#8E8E93"}
              />
            </TouchableOpacity>
          )}
        </View>

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

        {/* Titre et description */}
        <Text style={styles.programName}>{program.name}</Text>
        <Text style={styles.programDescription} numberOfLines={2}>
          {program.description}
        </Text>

        {/* Informations supplémentaires */}
        <View style={styles.programInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>{program.estimated_results}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="list-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>
              {program.session_count || 0} sessions
            </Text>
          </View>
        </View>

        {/* Équipement */}
        <View style={styles.equipmentContainer}>
          {program.equipment.slice(0, 3).map((eq, index) => (
            <View key={index} style={styles.equipmentTag}>
              <Text style={styles.equipmentText}>{eq}</Text>
            </View>
          ))}
          {program.equipment.length > 3 && (
            <Text style={styles.equipmentMore}>
              +{program.equipment.length - 3}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleStartProgram(program)}
            disabled={program.id === selectedProgram?.id}
          >
            <Text style={styles.startButtonText}>
              {isActive ? "Continuer" : "Démarrer"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleDuplicateProgram(program)}
          >
            <Ionicons name="copy-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Programmes</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.unauthenticatedContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#C7C7CC" />
          <Text style={styles.unauthenticatedTitle}>Connexion requise</Text>
          <Text style={styles.unauthenticatedText}>
            Connectez-vous pour accéder aux programmes d'entraînement
            personnalisés
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programmes</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un programme..."
            placeholderTextColor="#C7C7CC"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {/* Favoris */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              showFavoritesOnly && styles.filterChipSelected,
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons
              name={showFavoritesOnly ? "heart" : "heart-outline"}
              size={16}
              color={showFavoritesOnly ? "#FFFFFF" : "#007AFF"}
            />
            <Text
              style={[
                styles.filterChipText,
                showFavoritesOnly && styles.filterChipTextSelected,
              ]}
            >
              Favoris
            </Text>
          </TouchableOpacity>

          {/* Catégories */}
          {[
            { key: "all", label: "Tous" },
            { key: "strength", label: "Force" },
            { key: "muscle_building", label: "Masse" },
            { key: "general_fitness", label: "Fitness" },
          ].map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterChip,
                categoryFilter === category.key && styles.filterChipSelected,
              ]}
              onPress={() => setCategoryFilter(category.key as CategoryFilter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === category.key &&
                    styles.filterChipTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Niveaux */}
          {[
            { key: "beginner", label: "Débutant" },
            { key: "intermediate", label: "Intermédiaire" },
            { key: "advanced", label: "Avancé" },
          ].map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.filterChip,
                levelFilter === level.key && styles.filterChipSelected,
              ]}
              onPress={() => setLevelFilter(level.key as LevelFilter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  levelFilter === level.key && styles.filterChipTextSelected,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des programmes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPrograms}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Programme actif en haut */}
            {activeProgram && (
              <View style={styles.activeProgramSection}>
                <Text style={styles.sectionTitle}>Programme en cours</Text>
                {availablePrograms.find(
                  (p) => p.id === activeProgram.program_id
                ) &&
                  renderProgramCard(
                    availablePrograms.find(
                      (p) => p.id === activeProgram.program_id
                    )!
                  )}
              </View>
            )}

            {/* Tous les programmes */}
            <View style={styles.allProgramsSection}>
              <Text style={styles.sectionTitle}>
                {getFilteredPrograms().length} programme
                {getFilteredPrograms().length > 1 ? "s" : ""} disponible
                {getFilteredPrograms().length > 1 ? "s" : ""}
              </Text>

              {getFilteredPrograms().length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color="#C7C7CC" />
                  <Text style={styles.emptyText}>Aucun programme trouvé</Text>
                  <Text style={styles.emptySubtext}>
                    Modifiez vos filtres ou créez un nouveau programme
                  </Text>
                </View>
              ) : (
                getFilteredPrograms().map(renderProgramCard)
              )}
            </View>
          </>
        )}
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
    marginLeft: 24,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1C1C1E",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 14,
    color: "#1C1C1E",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activeProgramSection: {
    marginBottom: 24,
  },
  allProgramsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  programCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeProgramCard: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  programMeta: {
    alignItems: "flex-end",
    flex: 1,
    paddingHorizontal: 12,
  },
  programDuration: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  programFrequency: {
    fontSize: 11,
    color: "#8E8E93",
  },
  favoriteButton: {
    padding: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  personalBadge: {
    backgroundColor: "#8E44AD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activeBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  programName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  programInfo: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 6,
  },
  equipmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  equipmentTag: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equipmentText: {
    fontSize: 11,
    color: "#666",
  },
  equipmentMore: {
    fontSize: 11,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    flex: 1,
    backgroundColor: "#007AFF",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unauthenticatedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 12,
  },
  unauthenticatedText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
