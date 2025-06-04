import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "@/store/workoutStore";
import { useAuthStore } from "@/store/authStore";

interface SyncStatusProps {
  variant?: "default" | "card" | "inline";
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  variant = "default",
}) => {
  const { syncStatus, getSyncStatus, forceSyncAll } = useWorkoutStore();
  const { user, isAnonymous } = useAuthStore();

  useEffect(() => {
    getSyncStatus();
    const interval = setInterval(getSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleForcSync = async () => {
    if (isAnonymous) {
      return;
    }
    try {
      await forceSyncAll();
    } catch (error) {
      console.error("Force sync failed:", error);
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case "card":
        return [styles.container, styles.cardVariant];
      case "inline":
        return [styles.container, styles.inlineVariant];
      default:
        return styles.container;
    }
  };

  if (isAnonymous) {
    return (
      <View style={getContainerStyle()}>
        <Ionicons name="person" size={16} color="#FFFFFF" />
        <Text style={styles.anonymousText}>Mode hors ligne</Text>
      </View>
    );
  }

  if (syncStatus.pending === 0) {
    return (
      <View style={getContainerStyle()}>
        <Ionicons name="cloud-done" size={16} color="#34C759" />
        <Text style={styles.syncedText}>
          {syncStatus.synced} séances synchronisées
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={getContainerStyle()} onPress={handleForcSync}>
      <Ionicons
        name={syncStatus.isOnline ? "cloud-upload" : "cloud-offline"}
        size={16}
        color={syncStatus.isOnline ? "#FF9500" : "#8E8E93"}
      />
      <Text style={styles.pendingText}>
        {syncStatus.pending} en attente de sync
      </Text>
      <Ionicons name="refresh" size={14} color="#007AFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    gap: 6,
  },
  syncedText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "500",
  },
  anonymousText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  cardVariant: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 0,
  },
  inlineVariant: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
