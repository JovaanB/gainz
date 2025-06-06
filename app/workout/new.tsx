import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { useExerciseStore } from "@/store/exerciseStore";
import { WORKOUT_TEMPLATES, WorkoutTemplate } from "@/data/workoutTemplates";
import { AddExerciseModal } from "@/components/exercises/AddExerciseModal";
import { ExerciseWithSource } from "@/services/exerciseService";
import { useAuthStore } from "@/store/authStore";

type Step = "name" | "template" | "exercises";

const SUGGESTIONS = ["Push Day", "Pull Day", "Jambes", "Full Body", "Cardio"];

export default function NewWorkoutScreen() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState("");
  const [step, setStep] = useState<Step>("name");
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { startWorkout } = useWorkoutStore();

  const { isAnonymous } = useAuthStore();

  const {
    exercises,
    selectedExercises,
    searchQuery,
    selectedMuscleGroup,
    loadExercises,
    searchExercises,
    filterByMuscleGroup,
    toggleExerciseSelection,
    clearSelection,
    getFilteredExercises,
  } = useExerciseStore();

  useEffect(() => {
    loadExercises();
    return () => {
      clearSelection();
    };
  }, []);

  const handleStartWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour votre séance");
      return;
    }
    setStep("template");
  };

  const handleCreateWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert("Erreur", "Veuillez sélectionner au moins un exercice");
      return;
    }

    // Démarre la séance
    startWorkout(workoutName, selectedExercises);

    // Vérifie que la séance a bien été démarrée
    const { currentWorkout } = useWorkoutStore.getState();
    if (!currentWorkout) {
      console.error("Erreur lors du démarrage de la séance");
      Alert.alert(
        "Erreur",
        "Impossible de démarrer la séance. Veuillez réessayer.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/workout/new"),
          },
        ]
      );
      return;
    }

    // Navigation vers l'écran de workout actif
    router.replace("/workout/active");
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);

    // Auto-sélectionne les exercices du template
    const templateExercises = exercises.filter((ex) =>
      template.exercises.includes(ex.id)
    );
    templateExercises.forEach((exercise) => {
      if (!selectedExercises.some((selected) => selected.id === exercise.id)) {
        toggleExerciseSelection(exercise);
      }
    });

    setStep("exercises");
  };

  const handleSkipTemplate = () => {
    setStep("exercises");
  };

  const getMuscleGroups = () => {
    const allGroups = exercises.flatMap((ex) => ex.muscle_groups);
    const uniqueGroups = [...new Set(allGroups)].sort();
    return uniqueGroups;
  };

  const renderExerciseItem = ({ item }: { item: ExerciseWithSource }) => {
    const isSelected = selectedExercises.some((ex) => ex.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciseItem, isSelected && styles.exerciseItemSelected]}
        onPress={() => toggleExerciseSelection(item)}
      >
        <View style={styles.exerciseInfo}>
          <Text
            style={[
              styles.exerciseName,
              isSelected && styles.exerciseNameSelected,
            ]}
          >
            {item.name}
          </Text>
          <View style={styles.muscleGroups}>
            {item.muscle_groups.slice(0, 2).map((group, index) => (
              <View key={index} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{group}</Text>
              </View>
            ))}
            {item.is_bodyweight && (
              <View style={[styles.muscleTag, styles.bodyweightTag]}>
                <Text style={[styles.muscleTagText, styles.bodyweightTagText]}>
                  Poids de corps
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMuscleGroupFilter = ({ item }: { item: string }) => {
    const isSelected = selectedMuscleGroup === item;

    return (
      <TouchableOpacity
        style={[styles.filterChip, isSelected && styles.filterChipSelected]}
        onPress={() => filterByMuscleGroup(isSelected ? "" : item)}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.filterChipTextSelected,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  if (step === "name") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle séance</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.nameSection}>
                <Text style={styles.sectionTitle}>
                  Comment s'appelle ta séance ?
                </Text>
                <TextInput
                  style={styles.nameInput}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Ex: Push Day, Jambes, Full Body..."
                  placeholderTextColor="#C7C7CC"
                  autoFocus
                  maxLength={20}
                />
                <Text style={styles.charCount}>{workoutName.length}/20</Text>
              </View>

              <View style={styles.quickOptions}>
                <Text style={styles.quickOptionsTitle}>Suggestions :</Text>
                {SUGGESTIONS.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={styles.quickOption}
                    onPress={() => {
                      setWorkoutName(name);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={styles.quickOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !workoutName.trim() && styles.continueButtonDisabled,
          ]}
          onPress={handleStartWorkout}
          disabled={!workoutName.trim()}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === "template") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("name")}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choisir un template</Text>
          <TouchableOpacity onPress={handleSkipTemplate}>
            <Text style={styles.skipButton}>Passer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.templateContent}
          contentContainerStyle={styles.templateScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.templateTitle}>
            Commence avec un template ou crée ta séance personnalisée
          </Text>

          <View style={styles.templatesGrid}>
            {WORKOUT_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleUseTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <View
                    style={[
                      styles.templateIcon,
                      styles[`difficulty${template.difficulty}`],
                    ]}
                  >
                    <Ionicons
                      name={template.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.templateMeta}>
                    <Text style={styles.templateDuration}>
                      {template.estimatedDuration}min
                    </Text>
                    <View
                      style={[
                        styles.difficultyBadge,
                        styles[`difficulty${template.difficulty}Badge`],
                      ]}
                    >
                      <Text style={styles.difficultyText}>
                        {template.difficulty === "beginner"
                          ? "Débutant"
                          : template.difficulty === "intermediate"
                          ? "Intermédiaire"
                          : "Avancé"}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>
                  {template.description}
                </Text>

                <View style={styles.templateMuscles}>
                  {template.muscleGroups.slice(0, 3).map((muscle, index) => (
                    <View key={index} style={styles.templateMuscleTag}>
                      <Text style={styles.templateMuscleText}>{muscle}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.templateExerciseCount}>
                  {template.exercises.length} exercices
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.customButton}
            onPress={handleSkipTemplate}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.customButtonText}>
              Créer une séance personnalisée
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep("name")}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutName}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {selectedTemplate && (
        <View style={styles.templateInfoBar}>
          <Ionicons
            name={selectedTemplate.icon as any}
            size={16}
            color="#007AFF"
          />
          <Text style={styles.templateInfoText}>
            Template {selectedTemplate.name} •{" "}
            {selectedTemplate.estimatedDuration}min
          </Text>
          <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={searchExercises}
            placeholder="Rechercher un exercice..."
            placeholderTextColor="#C7C7CC"
          />
        </View>
      </View>

      {/* Muscle Group Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={getMuscleGroups()}
          renderItem={renderMuscleGroupFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {isAnonymous ? (
        <View style={styles.primaryButton}>
          <Ionicons
            name="information-circle"
            size={20}
            color="#FFFFFF"
            style={styles.icon}
          />
          <Text style={styles.primaryButtonText}>
            Connectez-vous pour ajouter des exercices
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.primaryButtonText}>Ajouter un exercice</Text>
        </TouchableOpacity>
      )}

      {/* Selected Count */}
      {selectedExercises.length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedExercises.length} exercice
            {selectedExercises.length > 1 ? "s" : ""} sélectionné
            {selectedExercises.length > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Exercise List */}
      <FlatList
        data={getFilteredExercises()}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        style={styles.exerciseList}
        contentContainerStyle={styles.exerciseListContent}
      />

      {/* Create Workout Button */}
      {selectedExercises.length > 0 && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateWorkout}
        >
          <Text style={styles.createButtonText}>
            Commencer la séance ({selectedExercises.length})
          </Text>
        </TouchableOpacity>
      )}

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: Platform.OS === "android" ? 25 : 0,
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
    padding: 20,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  icon: {
    marginRight: 0,
  },
  nameSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
    textAlign: "center",
  },
  nameInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    marginBottom: 8,
  },
  charCount: {
    textAlign: "right",
    color: "#8E8E93",
    fontSize: 12,
  },
  quickOptions: {
    marginTop: 24,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 12,
  },
  quickOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  quickOptionText: {
    fontSize: 15,
    color: "#007AFF",
  },
  continueButton: {
    backgroundColor: "#007AFF",
    margin: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  filtersList: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
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
  selectedCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
  },
  selectedCountText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    padding: 20,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
  },
  exerciseItemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  exerciseNameSelected: {
    color: "#007AFF",
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
  bodyweightTag: {
    backgroundColor: "#E8F5E8",
  },
  muscleTagText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  bodyweightTagText: {
    color: "#2E7D32",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  createButton: {
    backgroundColor: "#007AFF",
    margin: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  templateContent: {
    flex: 1,
  },
  templateScrollContent: {
    padding: 20,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  templatesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  templateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  difficultybeginner: {
    backgroundColor: "#34C759",
  },
  difficultyintermediate: {
    backgroundColor: "#FF9500",
  },
  difficultyadvanced: {
    backgroundColor: "#FF3B30",
  },
  templateMeta: {
    alignItems: "flex-end",
  },
  templateDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultybeginnerBadge: {
    backgroundColor: "#E8F5E8",
  },
  difficultyintermediateBadge: {
    backgroundColor: "#FFF3E0",
  },
  difficultyadvancedBadge: {
    backgroundColor: "#FFEBEE",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666",
  },
  templateName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMuscles: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  templateMuscleTag: {
    backgroundColor: "#F0F8FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  templateMuscleText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  templateExerciseCount: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
    marginLeft: 8,
  },
  skipButton: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
  templateInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  templateInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 8,
    marginRight: 8,
  },
});
