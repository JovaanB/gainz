// src/app/templates/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTemplateStore } from "../../store/templateStore";
import { WorkoutTemplate } from "../../types/templates";
import { SafeAreaView } from "react-native-safe-area-context";

interface TemplateCardProps {
  template: WorkoutTemplate;
  onSelect: (template: WorkoutTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const { favoriteTemplates, addToFavorites, removeFromFavorites } =
    useTemplateStore();
  const isFavorite = favoriteTemplates.includes(template.id);

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

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(template.id);
    } else {
      addToFavorites(template.id);
    }
  };

  return (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => onSelect(template)}
      activeOpacity={0.8}
    >
      {/* Header avec popularité et favori */}
      <View style={styles.cardHeader}>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
          <Text style={styles.levelText}>{getLevelText()}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={styles.popularityContainer}>
            <Ionicons name="star" size={12} color="#FF9500" />
            <Text style={styles.popularityText}>{template.popularity}%</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isFavorite ? "#FF3B30" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Titre et description */}
      <View style={styles.cardContent}>
        <Text style={styles.templateTitle}>{template.name}</Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {template.description}
        </Text>

        {/* Métadonnées */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metadataText}>{template.duration}min</Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metadataText}>{template.frequency}x/sem</Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="barbell-outline" size={14} color="#6B7280" />
            <Text style={styles.metadataText}>
              {template.sessions.length} séances
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {template.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {template.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{template.tags.length - 2}</Text>
          )}
        </View>

        {/* Résultats estimés */}
        <Text style={styles.resultsText}>{template.estimated_results}</Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => router.push(`/templates/${template.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color="#007AFF" />
          <Text style={styles.previewButtonText}>Aperçu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            useTemplateStore.getState().startProgram(template.id);
            router.push("/workout/active?mode=template");
          }}
        >
          <Text style={styles.selectButtonText}>Choisir</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function TemplatesScreen() {
  const { availableTemplates, loadTemplates } = useTemplateStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = [
    { id: "all", name: "Tous", icon: "grid-outline" },
    { id: "muscle_building", name: "Masse", icon: "barbell-outline" },
    { id: "strength", name: "Force", icon: "trophy-outline" },
    { id: "fat_loss", name: "Sèche", icon: "flame-outline" },
    { id: "general_fitness", name: "Fitness", icon: "heart-outline" },
  ];

  const levels = [
    { id: "all", name: "Tous niveaux" },
    { id: "beginner", name: "Débutant" },
    { id: "intermediate", name: "Intermédiaire" },
    { id: "advanced", name: "Avancé" },
  ];

  const filteredTemplates = availableTemplates.filter((template) => {
    const categoryMatch =
      selectedCategory === "all" || template.category === selectedCategory;
    const levelMatch =
      selectedLevel === "all" || template.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    router.push(`/templates/${template.id}`);
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
          <Text style={styles.title}>Programmes</Text>
          <Text style={styles.subtitle}>
            {filteredTemplates.length} programme
            {filteredTemplates.length > 1 ? "s" : ""} disponible
            {filteredTemplates.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                selectedCategory === category.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? "white" : "#6B7280"}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category.id &&
                    styles.filterChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          style={styles.levelFilterRow}
        >
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelChip,
                selectedLevel === level.id && styles.levelChipActive,
              ]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <Text
                style={[
                  styles.levelChipText,
                  selectedLevel === level.id && styles.levelChipTextActive,
                ]}
              >
                {level.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={({ item }) => (
          <TemplateCard template={item} onSelect={handleTemplateSelect} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.templatesList}
        showsVerticalScrollIndicator={false}
      />
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
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // Filtres
  categoryFilter: {
    backgroundColor: "white",
    paddingVertical: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryButtonTextActive: {
    color: "white",
  },

  levelFilter: {
    marginBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  levelFilterContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  levelButtonActive: {
    backgroundColor: "#007AFF",
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  levelButtonTextActive: {
    color: "white",
  },

  // Templates
  templatesList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  templateCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
  },
  popularityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularityText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  favoriteButton: {
    padding: 4,
  },

  cardContent: {
    padding: 16,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },

  metadataRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
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
  moreTagsText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  resultsText: {
    fontSize: 13,
    color: "#34C759",
    fontWeight: "500",
    fontStyle: "italic",
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 0,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  previewButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  selectButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  levelFilterRow: {
    marginTop: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "white",
  },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  levelChipActive: {
    backgroundColor: "#007AFF",
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  levelChipTextActive: {
    color: "white",
  },
});
