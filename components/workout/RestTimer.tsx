import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface RestTimerProps {
  isActive: boolean;
  timeLeft: number;
  duration: number;
  onSkip: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  isActive,
  timeLeft,
  duration,
  onSkip,
}) => {
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // Vibration quand le timer se termine
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [timeLeft, isActive]);

  if (!isActive && timeLeft === 0) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContent}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.timerInfo}>
          <Ionicons name="timer-outline" size={20} color="#FF6B6B" />
          <Text style={styles.timerText}>Repos: {formatTime(timeLeft)}</Text>
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    margin: 16,
    overflow: "hidden",
  },
  timerContent: {
    padding: 16,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#FFE5E5",
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF6B6B",
    borderRadius: 2,
  },
  timerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 8,
  },
  skipButton: {
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "500",
  },
});
