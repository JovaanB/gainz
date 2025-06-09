import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Switch,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useRouter } from "expo-router";
import { SyncStatus } from "@/components/ui/SyncStatus";
import { useAICoachStore } from "@/store/aiCoachStore";
import { ProfileSetup } from "@/components/ai/ProfileSetup";
import { RecommendationsModal } from "@/components/ai/RecommendationsModal";

export default function ProfileScreen() {
  const [_notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [_soundEnabled, setSoundEnabled] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const router = useRouter();

  const {
    userProfile,
    recommendations,
    isAnalyzing,
    lastAnalysis,
    initializeProfile,
    analyzePerformance,
    dismissRecommendation,
  } = useAICoachStore();

  const { user, isAnonymous, signOut } = useAuthStore();
  const { syncStatus, forceSyncAll, workoutHistory } = useWorkoutStore();

  const handleCreateAccount = () => {
    router.push({
      pathname: "/auth",
      params: { mode: "signup" },
    });
  };

  const handleSignIn = () => {
    router.push({
      pathname: "/auth",
      params: { mode: "signin" },
    });
  };

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Sign out error:", error);
          }
        },
      },
    ]);
  };

  const handleForceSync = async () => {
    if (isAnonymous) {
      Alert.alert(
        "Compte requis",
        "Vous devez créer un compte pour synchroniser vos données.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Créer un compte", onPress: handleCreateAccount },
        ]
      );
      return;
    }

    try {
      await forceSyncAll();
      Alert.alert("Succès", "Synchronisation terminée avec succès !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de synchroniser les données");
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          "Découvre Gainz, l'app de fitness qui va transformer tes entraînements ! 💪",
        title: "Gainz - App de Fitness",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleAIAnalysis = async () => {
    if (!userProfile) {
      setShowProfileSetup(true);
      return;
    }

    await analyzePerformance();
    setShowRecommendations(true);
  };

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    // Lancer automatiquement l'analyse après configuration
    setTimeout(() => {
      analyzePerformance();
    }, 500);
  };

  const getAIStatusText = () => {
    if (!userProfile) return "Configuration requise";
    if (isAnalyzing) return "Analyse en cours...";
    if (recommendations.filter((r) => !r.dismissed).length > 0) {
      return `${
        recommendations.filter((r) => !r.dismissed).length
      } recommandations`;
    }
    if (lastAnalysis) {
      const daysSince = Math.floor(
        (Date.now() - lastAnalysis) / (1000 * 60 * 60 * 24)
      );
      return `Analysé il y a ${daysSince} jour${daysSince > 1 ? "s" : ""}`;
    }
    return "Prêt pour l'analyse";
  };

  const getAIStatusColor = () => {
    if (!userProfile) return "#FF9500";
    if (isAnalyzing) return "#007AFF";
    if (recommendations.filter((r) => !r.dismissed).length > 0)
      return "#34C759";
    return "#8E8E93";
  };

  const getUserDisplayName = () => {
    if (isAnonymous) return "Utilisateur anonyme";
    return user?.email?.split("@")[0] || "Utilisateur";
  };

  const getUserEmail = () => {
    return user?.email || "";
  };

  const getStatusColor = () => {
    if (isAnonymous) return "#FF9500";
    if (syncStatus.pending > 0) return "#FF9500";
    return "#34C759";
  };

  const totalWorkouts = workoutHistory.length;
  const thisMonth = workoutHistory.filter((w) => {
    const workoutDate = new Date(w.date);
    const now = new Date();
    return (
      workoutDate.getMonth() === now.getMonth() &&
      workoutDate.getFullYear() === now.getFullYear()
    );
  }).length;

  useEffect(() => {
    initializeProfile();
  }, []);

  if (showProfileSetup) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={["#007AFF", "#5856D6"]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Ionicons
                  name={isAnonymous ? "person" : "person-circle"}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor() },
                ]}
              />
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              {!isAnonymous && (
                <Text style={styles.userEmail}>{getUserEmail()}</Text>
              )}
              <SyncStatus variant="inline" />
            </View>
          </View>

          {/* Stats rapides */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalWorkouts}</Text>
              <Text style={styles.statLabel}>Séances totales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{thisMonth}</Text>
              <Text style={styles.statLabel}>Ce mois-ci</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {syncStatus.synced + syncStatus.pending}
              </Text>
              <Text style={styles.statLabel}>Données locales</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>

          {isAnonymous ? (
            <View style={styles.anonymousCard}>
              <View style={styles.anonymousHeader}>
                <Ionicons name="information-circle" size={24} color="#FF9500" />
                <View style={styles.anonymousText}>
                  <Text style={styles.anonymousTitle}>Mode anonyme actif</Text>
                  <Text style={styles.anonymousSubtitle}>
                    Créez un compte pour sauvegarder vos données dans le cloud
                  </Text>
                </View>
              </View>

              <View style={styles.anonymousActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateAccount}
                >
                  <Ionicons name="person-add" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Créer un compte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSignIn}
                >
                  <Text style={styles.secondaryButtonText}>
                    J'ai déjà un compte
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.authenticatedCard}>
              <View style={styles.cardRow}>
                <View style={styles.cardRowLeft}>
                  <Ionicons name="person-circle" size={24} color="#34C759" />
                  <View>
                    <Text style={styles.cardRowTitle}>Compte connecté</Text>
                    <Text style={styles.cardRowSubtitle}>{user?.email}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Data & Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données & Synchronisation</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.cardRow} onPress={handleForceSync}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="refresh" size={24} color="#007AFF" />
                <View>
                  <Text style={styles.cardRowTitle}>
                    Forcer la synchronisation
                  </Text>
                  <Text style={styles.cardRowSubtitle}>
                    {isAnonymous
                      ? "Nécessite un compte"
                      : "Synchroniser maintenant"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Coach Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IA Coach Personnel</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.cardRow} onPress={handleAIAnalysis}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="bulb" size={24} color="#5856D6" />
                <View>
                  <Text style={styles.cardRowTitle}>
                    Analyse de performance
                  </Text>
                  <Text style={styles.cardRowSubtitle}>
                    {getAIStatusText()}
                  </Text>
                </View>
              </View>
              <View style={styles.aiStatusContainer}>
                {isAnalyzing ? (
                  <View style={styles.loadingIndicator} />
                ) : (
                  <>
                    {recommendations.filter((r) => !r.dismissed).length > 0 && (
                      <View
                        style={[styles.badge, { backgroundColor: "#34C759" }]}
                      >
                        <Text style={styles.badgeText}>
                          {recommendations.filter((r) => !r.dismissed).length}
                        </Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8E8E93"
                    />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {userProfile && (
              <>
                <View style={styles.cardDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  onPress={() => setShowProfileSetup(true)}
                >
                  <View style={styles.cardRowLeft}>
                    <Ionicons name="person-circle" size={24} color="#007AFF" />
                    <View>
                      <Text style={styles.cardRowTitle}>Profil IA</Text>
                      <Text style={styles.cardRowSubtitle}>
                        {userProfile.fitnessLevel === "beginner"
                          ? "Débutant"
                          : userProfile.fitnessLevel === "intermediate"
                          ? "Intermédiaire"
                          : "Avancé"}{" "}
                        • {userProfile.goals.length} objectif
                        {userProfile.goals.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Recommandations récentes */}
          {recommendations.filter((r) => !r.dismissed).length > 0 && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.recommendationsHeader}>
                <Ionicons name="bulb" size={20} color="#FF9500" />
                <Text style={styles.recommendationsTitle}>
                  Recommandations récentes
                </Text>
              </View>

              {recommendations
                .filter((r) => !r.dismissed)
                .slice(0, 2)
                .map((rec) => (
                  <View key={rec.id}>
                    <View style={styles.cardDivider} />
                    <View style={styles.recommendationItem}>
                      <View style={styles.recommendationContent}>
                        <Text style={styles.recommendationTitle}>
                          {rec.exerciseId
                            ? `${rec.exerciseId} - ${rec.title}`
                            : rec.title}
                        </Text>
                        <Text style={styles.recommendationDescription}>
                          {rec.description}
                        </Text>
                        <View style={styles.recommendationMeta}>
                          <View style={styles.confidenceBar}>
                            <View
                              style={[
                                styles.confidenceFill,
                                { width: `${rec.confidence * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.confidenceText}>
                            {Math.round(rec.confidence * 100)}% confiance
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={() => dismissRecommendation(rec.id)}
                      >
                        <Ionicons name="close" size={16} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres de l'app</Text>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="notifications" size={24} color="#FF9500" />
                <View>
                  <Text style={styles.cardRowTitle}>Notifications</Text>
                  <Text style={styles.cardRowSubtitle}>
                    Rappels d'entraînement
                  </Text>
                </View>
              </View>
              <Switch
                disabled
                value={false}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="volume-high" size={24} color="#AF52DE" />
                <View>
                  <Text style={styles.cardRowTitle}>Sons</Text>
                  <Text style={styles.cardRowSubtitle}>
                    Timer et feedback audio
                  </Text>
                </View>
              </View>
              <Switch
                disabled
                value={false}
                onValueChange={setSoundEnabled}
                trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Support & Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Informations</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.cardRow} onPress={handleShareApp}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="share" size={24} color="#007AFF" />
                <View>
                  <Text style={styles.cardRowTitle}>Partager l'app</Text>
                  <Text style={styles.cardRowSubtitle}>
                    Recommander à un ami
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="help-circle" size={24} color="#34C759" />
                <View>
                  <Text style={styles.cardRowTitle}>Centre d'aide</Text>
                  <Text style={styles.cardRowSubtitle}>FAQ et support</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Ionicons name="information-circle" size={24} color="#8E8E93" />
                <View>
                  <Text style={styles.cardRowTitle}>À propos</Text>
                  <Text style={styles.cardRowSubtitle}>Version 1.0.0</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button (only if authenticated) */}
        {!isAnonymous && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out" size={20} color="#FF3B30" />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modals */}
      <RecommendationsModal
        visible={showRecommendations}
        recommendations={recommendations}
        onClose={() => setShowRecommendations(false)}
        onDismiss={dismissRecommendation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  cardRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  cardRowSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 60,
  },
  anonymousCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  anonymousHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  anonymousText: {
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  anonymousSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  anonymousActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  authenticatedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
  aiStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderTopColor: "transparent",
    // Note: Pour l'animation, vous pourriez ajouter une library comme react-native-reanimated
  },
  recommendationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  recommendationItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "flex-start",
  },
  recommendationContent: {
    flex: 1,
    gap: 6,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  recommendationDescription: {
    fontSize: 13,
    color: "#8E8E93",
    lineHeight: 18,
  },
  recommendationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
});
