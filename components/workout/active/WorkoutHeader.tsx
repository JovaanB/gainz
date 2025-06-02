import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface WorkoutHeaderProps {
  sessionTitle: string;
  programTitle?: string;
  sessionDuration: number;
  progress: number;
  onMenuPress: () => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  sessionTitle,
  programTitle,
  sessionDuration,
  progress,
  onMenuPress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Alert.alert(
            "Quitter la session ?",
            "Votre progression sera perdue.",
            [
              { text: "Continuer", style: "cancel" },
              {
                text: "Quitter",
                style: "destructive",
                onPress: () => router.back(),
              },
            ]
          );
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.sessionTitle}>{sessionTitle}</Text>
        {programTitle && (
          <Text style={styles.programTitle}>{programTitle}</Text>
        )}
        <Text style={styles.sessionDuration}>
          {formatDuration(sessionDuration)}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  programTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  progressBar: {
    width: "100%",
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  menuButton: {
    padding: 8,
  },
});
