import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAICoachStore } from "@/store/aiCoachStore";
import { UserProfile } from "@/types/ai";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { setUserProfile } = useAICoachStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    fitnessLevel: "beginner",
    goals: [],
    preferences: {
      workoutDuration: 60,
      difficulty: "moderate",
      focusAreas: [],
    },
    limitations: [],
  });

  const steps = [
    {
      title: "Niveau de fitness",
      subtitle: "Quel est votre niveau actuel ?",
      key: "fitnessLevel",
    },
    {
      title: "Objectifs",
      subtitle: "Que souhaitez-vous accomplir ?",
      key: "goals",
    },
    {
      title: "Préférences",
      subtitle: "Personnalisez votre expérience",
      key: "preferences",
    },
  ];

  const fitnessLevels = [
    {
      id: "beginner",
      title: "Débutant",
      description: "Moins de 6 mois d'expérience",
      icon: "leaf",
    },
    {
      id: "intermediate",
      title: "Intermédiaire",
      description: "6 mois à 2 ans d'expérience",
      icon: "fitness",
    },
    {
      id: "advanced",
      title: "Avancé",
      description: "Plus de 2 ans d'expérience",
      icon: "trophy",
    },
  ];

  const goals = [
    { id: "strength", title: "Force", icon: "barbell" },
    { id: "muscle", title: "Muscle", icon: "body" },
    { id: "endurance", title: "Endurance", icon: "heart" },
    { id: "weight_loss", title: "Perte de poids", icon: "trending-down" },
  ];

  const focusAreas = [
    { id: "chest", title: "Pectoraux", icon: "body" },
    { id: "back", title: "Dos", icon: "body" },
    { id: "legs", title: "Jambes", icon: "walk" },
    { id: "shoulders", title: "Épaules", icon: "body" },
    { id: "arms", title: "Bras", icon: "body" },
    { id: "core", title: "Abdos", icon: "body" },
  ];

  const difficulties = [
    { id: "easy", title: "Facile", description: "Progression douce" },
    { id: "moderate", title: "Modéré", description: "Équilibre optimal" },
    { id: "hard", title: "Difficile", description: "Défi intense" },
  ];

  const updateProfile = (key: string, value: any) => {
    if (key === "focusAreas") {
      setProfile((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences!,
          focusAreas: value,
        },
      }));
    } else if (key === "difficulty" || key === "workoutDuration") {
      setProfile((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences!,
          [key]: value,
        },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finaliser le profil
      const finalProfile: UserProfile = {
        fitnessLevel: profile.fitnessLevel!,
        goals: profile.goals!,
        preferences: profile.preferences!,
        limitations: profile.limitations!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setUserProfile(finalProfile);
      onComplete();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return profile.fitnessLevel;
      case 1:
        return profile.goals && profile.goals.length > 0;
      case 2:
        return (
          profile.preferences?.focusAreas &&
          profile.preferences.focusAreas.length > 0
        );
      default:
        return false;
    }
  };

  const renderFitnessLevel = () => (
    <View style={styles.stepContent}>
      {fitnessLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.optionCard,
            profile.fitnessLevel === level.id && styles.optionCardSelected,
          ]}
          onPress={() => updateProfile("fitnessLevel", level.id)}
        >
          <Ionicons
            name={level.icon as any}
            size={24}
            color={profile.fitnessLevel === level.id ? "#007AFF" : "#8E8E93"}
          />
          <View style={styles.optionText}>
            <Text
              style={[
                styles.optionTitle,
                profile.fitnessLevel === level.id && styles.optionTitleSelected,
              ]}
            >
              {level.title}
            </Text>
            <Text style={styles.optionDescription}>{level.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGoals = () => (
    <View style={styles.stepContent}>
      <View style={styles.multiSelectGrid}>
        {goals.map((goal) => {
          const isSelected = profile.goals?.includes(goal.id as any);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.multiSelectCard,
                isSelected && styles.multiSelectCardSelected,
              ]}
              onPress={() => {
                const current = profile.goals || [];
                const updated = isSelected
                  ? current.filter((g) => g !== goal.id)
                  : [...current, goal.id as any];
                updateProfile("goals", updated);
              }}
            >
              <Ionicons
                name={goal.icon as any}
                size={24}
                color={isSelected ? "#007AFF" : "#8E8E93"}
              />
              <Text
                style={[
                  styles.multiSelectTitle,
                  isSelected && styles.multiSelectTitleSelected,
                ]}
              >
                {goal.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPreferences = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Durée d'entraînement */}
      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Durée d'entraînement</Text>
        <View style={styles.durationSelector}>
          {[30, 45, 60, 90].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationOption,
                profile.preferences?.workoutDuration === duration &&
                  styles.durationOptionSelected,
              ]}
              onPress={() => updateProfile("workoutDuration", duration)}
            >
              <Text
                style={[
                  styles.durationText,
                  profile.preferences?.workoutDuration === duration &&
                    styles.durationTextSelected,
                ]}
              >
                {duration}min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulté */}
      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Difficulté</Text>
        {difficulties.map((diff) => (
          <TouchableOpacity
            key={diff.id}
            style={[
              styles.difficultyOption,
              profile.preferences?.difficulty === diff.id &&
                styles.difficultyOptionSelected,
            ]}
            onPress={() => updateProfile("difficulty", diff.id)}
          >
            <View style={styles.difficultyContent}>
              <Text
                style={[
                  styles.difficultyTitle,
                  profile.preferences?.difficulty === diff.id &&
                    styles.difficultyTitleSelected,
                ]}
              >
                {diff.title}
              </Text>
              <Text style={styles.difficultyDescription}>
                {diff.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Zones de focus */}
      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Zones de focus</Text>
        <View style={styles.focusGrid}>
          {focusAreas.map((area) => {
            const isSelected = profile.preferences?.focusAreas?.includes(
              area.id as any
            );
            return (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.focusCard,
                  isSelected && styles.focusCardSelected,
                ]}
                onPress={() => {
                  const current = profile.preferences?.focusAreas || [];
                  const updated = isSelected
                    ? current.filter((a) => a !== area.id)
                    : [...current, area.id as any];
                  updateProfile("focusAreas", updated);
                }}
              >
                <Text
                  style={[
                    styles.focusTitle,
                    isSelected && styles.focusTitleSelected,
                  ]}
                >
                  {area.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderFitnessLevel();
      case 1:
        return renderGoals();
      case 2:
        return renderPreferences();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#007AFF", "#5856D6"]} style={styles.header}>
        <Text style={styles.headerTitle}>Configuration IA Coach</Text>
        <Text style={styles.headerSubtitle}>{steps[currentStep].title}</Text>
        <Text style={styles.headerDescription}>
          {steps[currentStep].subtitle}
        </Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>{renderStepContent()}</View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !isStepValid() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!isStepValid()}
        >
          <Text
            style={[
              styles.nextButtonText,
              !isStepValid() && styles.nextButtonTextDisabled,
            ]}
          >
            {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={isStepValid() ? "#FFFFFF" : "#8E8E93"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
    paddingTop: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: "#007AFF",
  },
  optionDescription: {
    fontSize: 14,
    color: "#8E8E93",
  },
  multiSelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  multiSelectCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  multiSelectCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  multiSelectTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 8,
    textAlign: "center",
  },
  multiSelectTitleSelected: {
    color: "#007AFF",
  },
  preferenceSection: {
    marginBottom: 32,
  },
  preferenceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  durationSelector: {
    flexDirection: "row",
    gap: 12,
  },
  durationOption: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  durationOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  durationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  durationTextSelected: {
    color: "#007AFF",
  },
  difficultyOption: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  difficultyOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  difficultyContent: {
    gap: 4,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  difficultyTitleSelected: {
    color: "#007AFF",
  },
  difficultyDescription: {
    fontSize: 14,
    color: "#8E8E93",
  },
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  focusCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  focusCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  focusTitleSelected: {
    color: "#007AFF",
  },
  footer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#E5E5EA",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  nextButtonTextDisabled: {
    color: "#8E8E93",
  },
});
