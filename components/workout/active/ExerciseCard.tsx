import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Set } from "@/types";

interface ExerciseCardProps {
  exerciseName: string;
  exerciseNumber: number;
  totalExercises: number;
  targets: {
    sets: number;
    reps: string;
    restSeconds: number;
    notes?: string;
    progressionNotes?: string;
  };
  completedSets: number;
  sets: Set[];
  isCardio: boolean;
  isBodyweightExercise: boolean;
  suggestedWeight?: number;
  onSetCompleted: (setIndex: number, weight: number, reps: number) => void;
  onSetDataChange: (
    setIndex: number,
    field: "weight" | "reps" | "duration_seconds" | "distance_km",
    value: number
  ) => void;
  onRemoveSet?: (setIndex: number) => void;
  onAddSet?: () => void;
  isProgramMode?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exerciseName,
  exerciseNumber,
  totalExercises,
  targets,
  completedSets,
  sets,
  isBodyweightExercise,
  isCardio,
  suggestedWeight,
  onSetCompleted,
  onSetDataChange,
  onRemoveSet,
  onAddSet,
  isProgramMode = false,
}) => {
  const isSetReady = (set: Set) => {
    if (isCardio) {
      if (exerciseName.toLowerCase().includes("corde")) {
        return (set.duration_seconds || 0) > 0;
      } else {
        return (set.duration_seconds || 0) > 0 && (set.distance_km || 0) > 0;
      }
    }
    return (set.weight || 0) >= 0 && (set.reps || 0) > 0;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{exerciseName}</Text>
          <Text style={styles.target}>
            {targets.sets} séries {!isCardio && `× ${targets.reps} reps`}
          </Text>
          <Text style={styles.progress}>
            {completedSets}/{targets.sets} séries terminées
          </Text>
          {targets.notes && (
            <Text style={styles.notes}>💡 {targets.notes}</Text>
          )}
        </View>
        <View style={styles.number}>
          <Text style={styles.numberText}>
            {exerciseNumber}/{totalExercises}
          </Text>
        </View>
      </View>

      {suggestedWeight !== undefined && !isCardio && (
        <View style={styles.weightSuggestion}>
          <Ionicons name="trending-up" size={16} color="#34C759" />
          <Text style={styles.weightSuggestionText}>
            {isProgramMode ? "Poids suggéré" : "Dernier poids"}:{" "}
            {isBodyweightExercise ? "Poids du corps" : `${suggestedWeight}kg`}
          </Text>
        </View>
      )}

      {targets.progressionNotes && (
        <View style={styles.progressionTip}>
          <Ionicons name="bulb" size={16} color="#FF9500" />
          <Text style={styles.progressionText}>{targets.progressionNotes}</Text>
        </View>
      )}

      <View style={styles.setsContainer}>
        {sets.map((set, setIndex) => (
          <View
            key={setIndex}
            style={[styles.setRow, set.completed && styles.setRowCompleted]}
          >
            <Text style={styles.setNumber}>{setIndex + 1}</Text>

            <View style={styles.setInputs}>
              {isCardio ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Temps</Text>
                    <TextInput
                      style={[
                        styles.input,
                        set.completed && styles.inputCompleted,
                      ]}
                      value={
                        set.duration_seconds
                          ? formatDuration(set.duration_seconds)
                          : ""
                      }
                      onChangeText={(text) => {
                        const [minutes, seconds] = text.split(":").map(Number);
                        const totalSeconds = minutes * 60 + (seconds || 0);
                        onSetDataChange(
                          setIndex,
                          "duration_seconds",
                          totalSeconds
                        );
                      }}
                      placeholder="0:00"
                      placeholderTextColor="#9CA3AF"
                      editable={!set.completed}
                    />
                  </View>

                  {!exerciseName.toLowerCase().includes("corde") && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Distance (km)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                        ]}
                        value={set.distance_km?.toString() || ""}
                        onChangeText={(text) => {
                          const distance =
                            text === "" ? undefined : parseFloat(text);
                          onSetDataChange(
                            setIndex,
                            "distance_km",
                            distance || 0
                          );
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0.0"
                        placeholderTextColor="#9CA3AF"
                        editable={!set.completed}
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  {!isBodyweightExercise && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Poids (kg)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                        ]}
                        value={set.weight?.toString() || ""}
                        onChangeText={(text) => {
                          const weight =
                            text === "" ? undefined : parseFloat(text);
                          onSetDataChange(setIndex, "weight", weight || 0);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        editable={!set.completed}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={[
                        styles.input,
                        set.completed && styles.inputCompleted,
                      ]}
                      value={set.reps?.toString() || ""}
                      onChangeText={(text) => {
                        const reps = text === "" ? undefined : parseInt(text);
                        onSetDataChange(setIndex, "reps", reps || 0);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      editable={!set.completed}
                    />
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.completeSetButton,
                set.completed && styles.completeSetButtonCompleted,
                !isSetReady(set) && styles.completeSetButtonDisabled,
              ]}
              onPress={() => {
                if (isCardio) {
                  onSetCompleted(
                    setIndex,
                    set.distance_km || 0,
                    set.duration_seconds || 0
                  );
                } else {
                  onSetCompleted(setIndex, set.weight || 0, set.reps || 0);
                }
              }}
              disabled={!isSetReady(set) || set.completed}
            >
              <Ionicons
                name={
                  set.completed ? "checkmark-circle" : "play-circle-outline"
                }
                size={28}
                color={
                  set.completed
                    ? "#34C759"
                    : isSetReady(set)
                    ? "#007AFF"
                    : "#9CA3AF"
                }
              />
            </TouchableOpacity>

            {!isProgramMode && onRemoveSet && sets.length > 1 && (
              <TouchableOpacity
                style={styles.removeSetButton}
                onPress={() => onRemoveSet(setIndex)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!isProgramMode && onAddSet && (
          <TouchableOpacity style={styles.addSetButton} onPress={onAddSet}>
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.addSetButtonText}>Ajouter une série</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  target: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 8,
  },
  notes: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  number: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  weightSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
  },
  weightSuggestionText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "500",
  },
  progressionTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginBottom: 16,
  },
  progressionText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 16,
  },
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  setRowCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    width: 20,
  },
  setInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  inputCompleted: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  completeSetButton: {
    padding: 4,
  },
  completeSetButtonCompleted: {},
  completeSetButtonDisabled: {
    opacity: 0.5,
  },
  removeSetButton: {
    padding: 4,
    marginLeft: 8,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 8,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    borderStyle: "dashed",
  },
  addSetButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
});
