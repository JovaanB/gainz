import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export const WelcomeFlow: React.FC = () => {
  const { user, isAnonymous, showWelcome, setShowWelcome } = useAuthStore();

  useEffect(() => {
    checkFirstLaunch();
  }, [user]);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome && user) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error("Error checking first launch:", error);
    }
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      setShowWelcome(false);
    } catch (error) {
      console.error("Error setting welcome flag:", error);
    }
  };

  if (!showWelcome || !user) return null;

  return (
    <Modal
      visible={showWelcome}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <Ionicons
              name="fitness"
              size={height > 700 ? 64 : 48}
              color="#007AFF"
            />
            <Text style={[styles.title, { fontSize: height > 700 ? 28 : 24 }]}>
              Bienvenue dans Gainz !
            </Text>
            <Text style={styles.subtitle}>
              {isAnonymous
                ? "Vous êtes en mode anonyme. Vos données sont stockées localement sur cet appareil."
                : `Bienvenue ${
                    user?.email?.split("@")[0]
                  } ! Vos données sont synchronisées dans le cloud.`}
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons
                name="timer"
                size={height > 700 ? 32 : 28}
                color="#34C759"
              />
              <Text style={styles.featureTitle}>Suivi en temps réel</Text>
              <Text style={styles.featureDescription}>
                Enregistrez vos séries avec un temps de repos contrôlé
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons
                name="analytics"
                size={height > 700 ? 32 : 28}
                color="#FF6B35"
              />
              <Text style={styles.featureTitle}>Progression détaillée</Text>
              <Text style={styles.featureDescription}>
                Visualisez vos performances avec des graphiques avancés
              </Text>
            </View>

            <View style={styles.feature}>
              <Ionicons
                name="library"
                size={height > 700 ? 32 : 28}
                color="#AF52DE"
              />
              <Text style={styles.featureTitle}>Programmes personnalisés</Text>
              <Text style={styles.featureDescription}>
                Suivez des programmes d'entraînement adaptés à vos objectifs
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Button fixé en bas */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Commencer l'aventure</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: height > 700 ? 40 : 30,
    paddingHorizontal: 10,
  },
  title: {
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: height > 700 ? 20 : 15,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: height > 700 ? 16 : 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: height > 700 ? 22 : 20,
    maxWidth: width - 80,
  },
  features: {
    gap: height > 700 ? 30 : 20,
    paddingBottom: 20,
  },
  feature: {
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: height > 700 ? 24 : 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: height > 700 ? 18 : 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: height > 700 ? 14 : 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: height > 700 ? 20 : 18,
    maxWidth: width - 100,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  continueButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
