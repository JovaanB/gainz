import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseStore } from "@/store/exerciseStore";

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "chest", label: "Pectoraux" },
  { value: "back", label: "Dos" },
  { value: "shoulders", label: "Épaules" },
  { value: "arms", label: "Bras" },
  { value: "legs", label: "Jambes" },
  { value: "core", label: "Abdominaux" },
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Force" },
];

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "core",
  "traps",
  "forearms",
];

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  visible,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>(
    []
  );
  const [notes, setNotes] = useState("");

  const { addPersonalExercise, isLoading } = useExerciseStore();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom de l'exercice est requis");
      return;
    }

    if (selectedMuscleGroups.length === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins un groupe musculaire");
      return;
    }

    try {
      await addPersonalExercise({
        name: name.trim(),
        category,
        is_bodyweight: isBodyweight,
        muscle_groups: selectedMuscleGroups,
        notes: notes.trim() || undefined,
      });

      Alert.alert("Succès", "Exercice personnel créé !");
      handleClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de créer l'exercice");
    }
  };

  const handleClose = () => {
    setName("");
    setCategory("strength");
    setIsBodyweight(false);
    setSelectedMuscleGroups([]);
    setNotes("");
    onClose();
  };

  const toggleMuscleGroup = (muscleGroup: string) => {
    if (selectedMuscleGroups.includes(muscleGroup)) {
      setSelectedMuscleGroups((prev) =>
        prev.filter((mg) => mg !== muscleGroup)
      );
    } else {
      setSelectedMuscleGroups((prev) => [...prev, muscleGroup]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.title}>Nouvel exercice</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Nom */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom de l'exercice</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Mon exercice personnalisé"
              autoFocus
            />
          </View>

          {/* Catégorie */}
          <View style={styles.section}>
            <Text style={styles.label}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      category === cat.value && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat.value && styles.categoryTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Poids du corps */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Exercice au poids du corps</Text>
              <Switch
                value={isBodyweight}
                onValueChange={setIsBodyweight}
                trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Groupes musculaires */}
          <View style={styles.section}>
            <Text style={styles.label}>Groupes musculaires ciblés</Text>
            <View style={styles.muscleGroupContainer}>
              {MUSCLE_GROUPS.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.muscleGroupButton,
                    selectedMuscleGroups.includes(muscle) &&
                      styles.muscleGroupButtonActive,
                  ]}
                  onPress={() => toggleMuscleGroup(muscle)}
                >
                  <Text
                    style={[
                      styles.muscleGroupText,
                      selectedMuscleGroups.includes(muscle) &&
                        styles.muscleGroupTextActive,
                    ]}
                  >
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Instructions, conseils..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? "Création..." : "Créer l'exercice"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E5EA",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  muscleGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  muscleGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
  },
  muscleGroupButtonActive: {
    backgroundColor: "#34C759",
  },
  muscleGroupText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
  },
  muscleGroupTextActive: {
    color: "#FFFFFF",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
