import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AIRecommendation } from "@/types/ai";

interface RecommendationsModalProps {
  visible: boolean;
  recommendations: AIRecommendation[];
  onClose: () => void;
  onDismiss: (id: string) => void;
}

export function RecommendationsModal({
  visible,
  recommendations,
  onClose,
  onDismiss,
}: RecommendationsModalProps) {
  const activeRecommendations = recommendations.filter((r) => !r.dismissed);

  const getTypeIcon = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "weight_increase":
        return "trending-up";
      case "rep_increase":
        return "add-circle";
      case "rest_adjustment":
        return "time";
      case "exercise_swap":
        return "swap-horizontal";
      case "deload":
        return "trending-down";
      default:
        return "bulb";
    }
  };

  const getTypeColor = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "weight_increase":
        return "#34C759";
      case "rep_increase":
        return "#007AFF";
      case "rest_adjustment":
        return "#FF9500";
      case "exercise_swap":
        return "#5856D6";
      case "deload":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const getTypeLabel = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "weight_increase":
        return "Augmentation charge";
      case "rep_increase":
        return "Augmentation répétitions";
      case "rest_adjustment":
        return "Ajustement repos";
      case "exercise_swap":
        return "Changement exercice";
      case "deload":
        return "Décharge";
      default:
        return "Recommandation";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#5856D6", "#007AFF"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
              <View>
                <Text style={styles.headerTitle}>IA Coach</Text>
                <Text style={styles.headerSubtitle}>
                  {activeRecommendations.length} recommandation
                  {activeRecommendations.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeRecommendations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              <Text style={styles.emptyTitle}>Tout va bien !</Text>
              <Text style={styles.emptyDescription}>
                Aucune recommandation pour le moment. Continuez vos
                entraînements !
              </Text>
            </View>
          ) : (
            <View style={styles.recommendationsList}>
              {activeRecommendations.map((rec, index) => (
                <View key={rec.id} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <View style={styles.recommendationHeaderLeft}>
                      <View
                        style={[
                          styles.typeIcon,
                          { backgroundColor: getTypeColor(rec.type) + "20" },
                        ]}
                      >
                        <Ionicons
                          name={getTypeIcon(rec.type) as any}
                          size={20}
                          color={getTypeColor(rec.type)}
                        />
                      </View>
                      <View>
                        <Text style={styles.typeLabel}>
                          {getTypeLabel(rec.type)}
                        </Text>
                        <Text style={styles.recommendationCardTitle}>
                          {rec.exerciseId
                            ? `${rec.exerciseId} - ${rec.title}`
                            : rec.title}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.cardDismissButton}
                      onPress={() => onDismiss(rec.id)}
                    >
                      <Ionicons name="close" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.recommendationCardDescription}>
                    {rec.description}
                  </Text>

                  {rec.suggestedValue && (
                    <View style={styles.suggestedValue}>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#007AFF"
                      />
                      <Text style={styles.suggestedValueText}>
                        Valeur suggérée: {rec.suggestedValue}
                        {rec.type.includes("weight") ? "kg" : ""}
                      </Text>
                    </View>
                  )}

                  <View style={styles.recommendationFooter}>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceLabel}>Confiance:</Text>
                      <View style={styles.confidenceBarLarge}>
                        <View
                          style={[
                            styles.confidenceFillLarge,
                            {
                              width: `${rec.confidence * 100}%`,
                              backgroundColor: getTypeColor(rec.type),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.confidencePercentage}>
                        {Math.round(rec.confidence * 100)}%
                      </Text>
                    </View>

                    <View style={styles.reasoning}>
                      <Ionicons
                        name="information-circle"
                        size={14}
                        color="#8E8E93"
                      />
                      <Text style={styles.reasoningText}>{rec.reasoning}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  recommendationsList: {
    padding: 20,
    gap: 16,
  },
  recommendationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recommendationHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recommendationCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  cardDismissButton: {
    padding: 4,
  },
  recommendationCardDescription: {
    fontSize: 14,
    color: "#1C1C1E",
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestedValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestedValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  recommendationFooter: {
    gap: 12,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
  },
  confidenceBarLarge: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    overflow: "hidden",
  },
  confidenceFillLarge: {
    height: "100%",
    borderRadius: 3,
  },
  confidencePercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1C1E",
    minWidth: 30,
  },
  reasoning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  reasoningText: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
    fontStyle: "italic",
    flex: 1,
  },
});
