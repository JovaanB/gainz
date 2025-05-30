import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutSet } from "@/types";

interface SetRowProps {
  setIndex: number;
  set: WorkoutSet;
  isBodyweight: boolean;
  isCardio: boolean; // ✅ Nouveau prop
  onUpdateSet: (setData: Partial<WorkoutSet>) => void;
  onCompleteSet: () => void;
  onRemoveSet: () => void;
  canRemove: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  setIndex,
  set,
  isBodyweight,
  isCardio, // ✅ Nouveau prop
  onUpdateSet,
  onCompleteSet,
  onRemoveSet,
  canRemove,
}) => {
  const [localReps, setLocalReps] = useState(set.reps?.toString() || "");
  const [localWeight, setLocalWeight] = useState(set.weight?.toString() || "");
  const [localDuration, setLocalDuration] = useState(
    set.duration_seconds ? Math.floor(set.duration_seconds / 60).toString() : ""
  );
  const [localDistance, setLocalDistance] = useState(
    set.distance_km?.toString() || ""
  );

  useEffect(() => {
    setLocalReps(set.reps?.toString() || "");
    setLocalWeight(set.weight?.toString() || "");
    setLocalDuration(
      set.duration_seconds
        ? Math.floor(set.duration_seconds / 60).toString()
        : ""
    );
    setLocalDistance(set.distance_km?.toString() || "");
  }, [set.reps, set.weight, set.duration_seconds, set.distance_km]);

  const handleRepsChange = (text: string) => {
    setLocalReps(text);
    const reps = parseInt(text);
    if (!isNaN(reps) || text === "") {
      onUpdateSet({ reps: text === "" ? undefined : reps });
    }
  };

  const handleWeightChange = (text: string) => {
    setLocalWeight(text);
    const weight = parseFloat(text);
    if (!isNaN(weight) || text === "") {
      onUpdateSet({ weight: text === "" ? undefined : weight });
    }
  };

  const handleDurationChange = (text: string) => {
    setLocalDuration(text);
    const minutes = parseInt(text);
    if (!isNaN(minutes) || text === "") {
      onUpdateSet({ duration_seconds: text === "" ? undefined : minutes * 60 });
    }
  };

  const handleDistanceChange = (text: string) => {
    setLocalDistance(text);
    const distance = parseFloat(text);
    if (!isNaN(distance) || text === "") {
      onUpdateSet({ distance_km: text === "" ? undefined : distance });
    }
  };

  const handleComplete = () => {
    if (set.completed) {
      onUpdateSet({ completed: false });
    } else {
      // Validation différente selon le type d'exercice
      let isValid = false;

      if (isCardio) {
        // Pour cardio : soit durée soit distance requise
        isValid = !!(set.duration_seconds || set.distance_km);
      } else {
        // Pour musculation : reps requis, poids requis si pas bodyweight
        isValid = !!(set.reps && (isBodyweight || set.weight));
      }

      if (!isValid) return;

      onCompleteSet();
    }
  };

  const isValid = isCardio
    ? !!(set.duration_seconds || set.distance_km)
    : !!(set.reps && (isBodyweight || set.weight));

  return (
    <View
      style={[styles.container, set.completed && styles.completedContainer]}
    >
      <View style={styles.setNumber}>
        <Text
          style={[styles.setNumberText, set.completed && styles.completedText]}
        >
          {setIndex + 1}
        </Text>
      </View>

      <View style={styles.inputs}>
        {isCardio ? (
          // ✅ Interface CARDIO
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Temps (min)</Text>
              <TextInput
                style={[styles.input, set.completed && styles.completedInput]}
                value={localDuration}
                onChangeText={handleDurationChange}
                placeholder="0"
                keyboardType="numeric"
                maxLength={4}
                editable={!set.completed}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Distance (km)</Text>
              <TextInput
                style={[styles.input, set.completed && styles.completedInput]}
                value={localDistance}
                onChangeText={handleDistanceChange}
                placeholder="0"
                keyboardType="decimal-pad"
                maxLength={6}
                editable={!set.completed}
              />
            </View>
          </>
        ) : (
          // ✅ Interface MUSCULATION (existante)
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={[styles.input, set.completed && styles.completedInput]}
                value={localReps}
                onChangeText={handleRepsChange}
                placeholder="0"
                keyboardType="numeric"
                maxLength={3}
                editable={!set.completed}
              />
            </View>

            {!isBodyweight && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Poids (kg)</Text>
                <TextInput
                  style={[styles.input, set.completed && styles.completedInput]}
                  value={localWeight}
                  onChangeText={handleWeightChange}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  editable={!set.completed}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.checkButton,
            set.completed && styles.checkButtonCompleted,
            !isValid && styles.checkButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!set.completed && !isValid}
        >
          <Ionicons
            name={set.completed ? "checkmark" : "checkmark-outline"}
            size={20}
            color={set.completed ? "#FFFFFF" : isValid ? "#007AFF" : "#C7C7CC"}
          />
        </TouchableOpacity>

        {canRemove && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemoveSet}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  completedContainer: {
    backgroundColor: "#F0F8FF",
    borderColor: "#007AFF",
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  completedText: {
    color: "#007AFF",
  },
  inputs: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 6,
    padding: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  completedInput: {
    backgroundColor: "#E3F2FD",
    color: "#007AFF",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C7C7CC",
  },
  checkButtonCompleted: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
});
