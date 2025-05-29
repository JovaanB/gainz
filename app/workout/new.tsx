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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { useExerciseStore } from "@/store/exerciseStore";
import { Exercise } from "@/types";

export default function NewWorkoutScreen() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState("");
  const [step, setStep] = useState<"name" | "exercises">("name");

  const { startWorkout } = useWorkoutStore();
  const {
    exercises,
    selectedExercises,
    searchQuery,
    selectedMuscleGroup,
    isLoading,
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
    setStep("exercises");
  };

  const handleCreateWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert("Erreur", "Veuillez sélectionner au moins un exercice");
      return;
    }

    // Démarre la séance
    startWorkout(workoutName, selectedExercises);

    // Navigation vers l'écran de workout actif
    router.replace("/workout/active");
  };

  const getMuscleGroups = () => {
    const allGroups = exercises.flatMap((ex) => ex.muscle_groups);
    const uniqueGroups = [...new Set(allGroups)].sort();
    return uniqueGroups;
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle séance</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
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
              maxLength={50}
            />
            <Text style={styles.charCount}>{workoutName.length}/50</Text>
          </View>

          <View style={styles.quickOptions}>
            <Text style={styles.quickOptionsTitle}>Suggestions :</Text>
            {["Push Day", "Pull Day", "Jambes", "Full Body", "Cardio"].map(
              (name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.quickOption}
                  onPress={() => setWorkoutName(name)}
                >
                  <Text style={styles.quickOptionText}>{name}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep("name")}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutName}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

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
    </View>
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
});
