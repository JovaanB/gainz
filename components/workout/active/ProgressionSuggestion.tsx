import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressionSuggestion } from "@/utils/progressCalculations";

interface ProgressionSuggestionProps {
  suggestion: ProgressionSuggestion;
  onApply?: () => void;
  onDismiss?: () => void;
}

export const ProgressionSuggestionCard: React.FC<
  ProgressionSuggestionProps
> = ({ suggestion, onApply, onDismiss }) => {
  const [isShow, setIsShow] = useState(true);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = () => {
    if (onApply) {
      onApply();
      setIsApplied(true);

      // Reset après 2 secondes
      setTimeout(() => {
        setIsApplied(false);
        setIsShow(false);
      }, 2000);
    }
  };

  const formatPerformance = (perf: any) => {
    if (perf.weight) {
      return `${perf.sets}x${perf.reps} @ ${perf.weight}kg`;
    }
    return `${perf.sets}x${perf.reps}`;
  };

  return (
    isShow && (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up" size={20} color="#007AFF" />
          </View>
          <Text style={styles.title}>Suggestion de progression</Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Ionicons name="close" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Dernière fois</Text>
              <Text style={styles.currentValue}>
                {formatPerformance(suggestion.currentBest)}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FF6B35"
              style={styles.arrow}
            />

            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Objectif suggéré</Text>
              <Text style={styles.suggestedValue}>
                {formatPerformance(suggestion.suggested)}
              </Text>
            </View>
          </View>

          <Text style={styles.reasoning}>{suggestion.reasoning}</Text>

          {onApply && (
            <TouchableOpacity
              style={[
                styles.applyButton,
                isApplied && styles.applyButtonSuccess,
              ]}
              onPress={handleApply}
              disabled={isApplied}
            >
              <Text
                style={[
                  styles.applyButtonText,
                  isApplied && styles.applyButtonTextSuccess,
                ]}
              >
                {isApplied
                  ? "✅ Suggestion appliquée"
                  : "Utiliser cette suggestion"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dismissButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  comparisonItem: {
    flex: 1,
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  suggestedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  arrow: {
    marginHorizontal: 12,
  },
  reasoning: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  applyButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  applyButtonSuccess: {
    backgroundColor: "#34C759",
  },
  applyButtonTextSuccess: {
    color: "#FFFFFF",
  },
});
