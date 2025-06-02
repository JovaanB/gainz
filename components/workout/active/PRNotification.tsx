import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PersonalRecord } from "@/utils/progressCalculations";

interface PRNotificationProps {
  prs: PersonalRecord[];
  visible: boolean;
  onDismiss: () => void;
}

const MAX_PRS = 5;

export const PRNotification: React.FC<PRNotificationProps> = ({
  prs,
  visible,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && prs.length > 0) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 50,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]),
        Animated.delay(5000),
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible, prs.length]);

  const formatPR = (pr: PersonalRecord) => {
    switch (pr.type) {
      case "weight":
        return `${pr.value}kg (${pr.reps} reps)`;
      case "reps":
        return `${pr.value} reps${pr.weight ? ` @ ${pr.weight}kg` : ""}`;
      case "1rm":
        return `${pr.value.toFixed(1)}kg (1RM estimé)`;
      case "volume":
        return `${pr.value}kg de volume`;
      case "duration":
        return `${Math.floor(pr.value / 60)}:${(pr.value % 60)
          .toString()
          .padStart(2, "0")} de temps`;
      case "distance":
        return `${pr.value}km de distance`;
      case "speed":
        return `${pr.value.toFixed(1)}km/h de vitesse`;
      default:
        return `${pr.value}`;
    }
  };

  const getPRIcon = (type: string) => {
    switch (type) {
      case "weight":
        return "barbell";
      case "reps":
        return "refresh-circle";
      case "1rm":
        return "trophy";
      case "volume":
        return "trending-up";
      case "duration":
        return "time";
      case "distance":
        return "map";
      case "speed":
        return "flash";
      default:
        return "star";
    }
  };

  const getPRColor = (type: string) => {
    switch (type) {
      case "weight":
        return "#FF6B35";
      case "reps":
        return "#34C759";
      case "1rm":
        return "#FFD60A";
      case "volume":
        return "#007AFF";
      case "duration":
        return "#5856D6";
      case "distance":
        return "#32D74B";
      case "speed":
        return "#FF9F0A";
      default:
        return "#8E8E93";
    }
  };

  if (!visible || prs.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.notification}>
        <View style={styles.header}>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={24} color="#FFD60A" />
          </View>
          <Text style={styles.title}>
            🎉 Nouveau{prs.length > 1 ? "x" : ""} PR !
          </Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {prs.slice(0, MAX_PRS).map((pr, index) => {
            const color = getPRColor(pr.type);
            return (
              <View key={`${pr.exerciseId}-${pr.type}`} style={styles.prItem}>
                <View style={[styles.prIcon, { backgroundColor: color }]}>
                  <Ionicons
                    name={getPRIcon(pr.type) as any}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.prInfo}>
                  <Text style={styles.exerciseName}>{pr.exerciseName}</Text>
                  <Text style={styles.prValue}>{formatPR(pr)}</Text>
                </View>
              </View>
            );
          })}

          {prs.length > MAX_PRS && (
            <Text style={styles.moreText}>
              +{prs.length - MAX_PRS} autre{prs.length - MAX_PRS > 1 ? "s" : ""}{" "}
              PR !
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.congratsText}>
            Félicitations ! Continue comme ça ! 💪
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  trophyContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  prItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  prIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  prValue: {
    fontSize: 13,
    color: "#666",
  },
  moreText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  congratsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
});
