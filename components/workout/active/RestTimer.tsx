import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface RestTimerProps {
  isActive: boolean;
  timeLeft: number;
  duration: number;
  onSkip: () => void;
  onAddTime?: (seconds: number) => void;
  exerciseName?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  isActive,
  timeLeft,
  duration,
  onSkip,
  onAddTime,
  exerciseName,
}) => {
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;

  // Animations
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current; // 0 to 1 for linear progress
  const buttonPulseAnim = React.useRef(new Animated.Value(1)).current;

  const { width } = Dimensions.get("window");
  const calculatedFontSize = width * 0.45;

  // Animation de progression (linear bar)
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress, // 0 (start) to 1 (end)
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Effets visuels pour countdown
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && isActive) {
      // Animation de pulsation
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      pulse.start();

      // Vibration pour les 3 dernières secondes
      if (timeLeft <= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [timeLeft, isActive]);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // Vibration de fin
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
    }
  }, [timeLeft, isActive]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleAddTime = (seconds: number) => {
    if (onAddTime) {
      onAddTime(seconds);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getTimerColor = () => {
    if (timeLeft === 0) return "#34C759"; // Vert quand terminé
    if (timeLeft <= 10) return "#FF3B30"; // Rouge countdown
    return "#FF6B6B"; // Orange normal
  };

  if (!isActive && timeLeft === 0) return null;

  return (
    <Modal
      visible={isActive}
      animationType="fade"
      statusBarTranslucent
      transparent
    >
      <View
        style={[
          styles.fullscreenContainer,
          { backgroundColor: getTimerColor() },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor={getTimerColor()} />

        <View style={styles.fullscreenHeader}>
          <View style={styles.headerCenter}>
            <Text style={styles.fullscreenTitle}>Temps de repos</Text>
            {exerciseName && (
              <Text style={styles.exerciseName}>{exerciseName}</Text>
            )}
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Timer principal - Texte et statut */}
        <View style={styles.fullscreenTimerTextContainer}>
          <Animated.View
            style={[
              styles.timerTextContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text
              style={[styles.fullscreenTime, { fontSize: calculatedFontSize }]}
            >
              {formatTime(timeLeft)}
            </Text>

            {timeLeft === 0 ? (
              <Text style={styles.finishedText}>Terminé !</Text>
            ) : timeLeft <= 10 ? (
              <Text style={styles.countdownText}>Presque fini...</Text>
            ) : (
              <Text style={styles.statusText}>En cours</Text>
            )}
          </Animated.View>
        </View>

        {/* Barre de progression linéaire */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Contrôles principaux améliorés */}
        <View style={styles.fullscreenControls}>
          {onAddTime && (
            <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
              <TouchableOpacity
                disabled={timeLeft <= 10}
                style={[styles.controlButton, styles.addTimeControlButton]}
                onPress={() => handleAddTime(-10)}
              >
                <Ionicons name="add-circle" size={28} color="white" />
                <Text style={styles.controlButtonTextWhite}>-10s</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
            <TouchableOpacity
              style={[styles.controlButton, styles.primaryControl]}
              onPress={handleSkip}
            >
              <Ionicons
                name="checkmark-circle"
                size={36}
                color={getTimerColor()}
              />
              <Text
                style={[
                  styles.controlButtonTextPrimary,
                  { color: getTimerColor() },
                ]}
              >
                Terminer
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {onAddTime && (
            <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
              <TouchableOpacity
                style={[styles.controlButton, styles.addTimeControlButton]}
                onPress={() => handleAddTime(10)}
              >
                <Ionicons name="time" size={28} color="white" />
                <Text style={styles.controlButtonTextWhite}>+10s</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 40,
  },
  fullscreenTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
  setInfo: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  fullscreenTimerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  timerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  fullscreenTime: {
    fontWeight: "300",
    color: "white",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  finishedText: {
    fontSize: 40,
    fontWeight: "600",
    color: "white",
    marginTop: 16,
    textAlign: "center",
  },
  countdownText: {
    fontSize: 32,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 16,
    textAlign: "center",
  },
  statusText: {
    fontSize: 28,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 16,
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  quickActionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  quickActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  fullscreenControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
    minWidth: 90,
    minHeight: 90,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addTimeControlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    width: 85,
    height: 85,
  },
  primaryControl: {
    backgroundColor: "white",
    borderColor: "white",
    width: 100,
    height: 100,
    shadowOpacity: 0.4,
  },
  controlButtonTextWhite: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    color: "white",
    textAlign: "center",
  },
  controlButtonTextPrimary: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  tapIndicator: {
    alignItems: "center",
    paddingBottom: 20,
  },
  tapIndicatorText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontStyle: "italic",
  },
  progressBarContainer: {
    height: 16,
    width: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    marginTop: 20,
    overflow: "hidden",
    alignSelf: "center",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 10,
  },
});
