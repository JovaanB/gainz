import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { FinalLogo } from "./FinalLogo";

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FinalLogo size="large" showText={false} />
        <Text style={styles.title}>Gainz</Text>
        <Text style={styles.subtitle}>Chargement de vos données...</Text>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});
