import React, { useState } from "react";
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

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const router = useRouter();

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

        {/* Sync Status Card */}

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
});
