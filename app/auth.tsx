import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get("screen");

export default function AuthScreen() {
  const { mode: urlMode } = useLocalSearchParams<{ mode?: string }>();
  const [isMounted, setIsMounted] = useState(false);

  const [mode, setMode] = useState<"signin" | "signup">(
    urlMode === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {
    signIn,
    signUp,
    signInAnonymously,
    isAuthenticated,
    isAnonymous,
    isLoading,
    error,
    clearError,
    showWelcome,
  } = useAuthStore();

  useEffect(() => {
    if (urlMode === "signup" || urlMode === "signin") {
      setMode(urlMode);
    }
  }, [urlMode]);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez saisir votre email");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez saisir un email valide");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Erreur", "Veuillez saisir votre mot de passe");
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return false;
    }

    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      clearError();

      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        Alert.alert("Compte créé !", "Votre compte a été créé avec succès.");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsMounted(true);
      return () => setIsMounted(false);
    }, [])
  );

  const safeNavigate = (route: string) => {
    if (isMounted) {
      setTimeout(() => {
        try {
          router.replace(route as any);
        } catch (error) {
          console.error("Navigation error:", error);
        }
      }, 100);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously();
      safeNavigate("/(tabs)");
    } catch (error) {
      console.error("Anonymous login error:", error);
    }
  };

  const handleGoBack = () => {
    if (isAnonymous) {
      router.replace("/(tabs)/profile");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    clearError();
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    resetForm();
  };

  const getHeaderTitle = () => {
    if (isAnonymous && mode === "signup") {
      return "Créer un compte";
    }
    return mode === "signin" ? "Connexion" : "Inscription";
  };

  const getHeaderSubtitle = () => {
    if (isAnonymous && mode === "signup") {
      return "Sauvegardez vos données dans le cloud";
    }
    return mode === "signin"
      ? "Accédez à vos données synchronisées"
      : "Rejoignez la communauté Gainz";
  };

  if (showWelcome) {
    return;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#007AFF", "#5856D6", "#AF52DE"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header avec bouton retour si utilisateur anonyme */}
            <View style={styles.header}>
              {isAnonymous && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              <View style={styles.logoContainer}>
                <Ionicons name="fitness" size={48} color="#FFFFFF" />
                <Text style={styles.logoText}>Gainz</Text>
              </View>

              {isAnonymous && (
                <View style={styles.anonymousBadge}>
                  <Ionicons name="person" size={16} color="#FF9500" />
                  <Text style={styles.anonymousBadgeText}>Mode anonyme</Text>
                </View>
              )}

              <Text style={styles.subtitle}>
                {isAnonymous
                  ? "Transformez votre compte anonyme en compte permanent"
                  : "Votre coach personnel pour atteindre vos objectifs"}
              </Text>
            </View>

            {/* Auth Card */}
            <View style={styles.authCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{getHeaderTitle()}</Text>
                <Text style={styles.cardSubtitle}>{getHeaderSubtitle()}</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Email */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail"
                      size={20}
                      color="#8E8E93"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Votre email"
                      placeholderTextColor="#8E8E93"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color="#8E8E93"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mot de passe"
                      placeholderTextColor="#8E8E93"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password (signup only) */}
                {mode === "signup" && (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color="#8E8E93"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor="#8E8E93"
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                      />
                    </View>
                  </View>
                )}

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {mode === "signin"
                          ? "Se connecter"
                          : isAnonymous
                          ? "Migrer mon compte"
                          : "Créer mon compte"}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>

                {/* Switch Mode */}
                <TouchableOpacity
                  onPress={switchMode}
                  style={styles.switchButton}
                >
                  <Text style={styles.switchText}>
                    {mode === "signin"
                      ? "Pas encore de compte ? "
                      : "Déjà un compte ? "}
                    <Text style={styles.switchTextBold}>
                      {mode === "signin" ? "S'inscrire" : "Se connecter"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Anonymous Access - Logique différente selon le contexte */}
            {!isAuthenticated ? (
              // Utilisateur pas connecté du tout - Montrer l'option anonyme
              <View style={styles.anonymousSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.anonymousButton}
                  onPress={handleAnonymousLogin}
                  disabled={isLoading}
                >
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                  <Text style={styles.anonymousButtonText}>
                    Continuer en mode anonyme
                  </Text>
                </TouchableOpacity>

                <Text style={styles.anonymousNote}>
                  Vos données seront stockées localement. Vous pourrez créer un
                  compte plus tard.
                </Text>
              </View>
            ) : isAnonymous ? (
              // Utilisateur anonyme qui veut créer un compte - Montrer l'info de migration
              <View style={styles.migrationSection}>
                <View style={styles.migrationInfo}>
                  <Ionicons name="information-circle" size={20} color="#FFF" />
                  <Text
                    style={[styles.migrationText, styles.migrationTextWhite]}
                  >
                    En créant un compte, toutes vos données actuelles seront
                    automatiquement sauvegardées dans le cloud.
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
  },
  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1C1C1E",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1C1C1E",
  },
  eyeButton: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF2F2",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  switchText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  switchTextBold: {
    color: "#007AFF",
    fontWeight: "600",
  },
  anonymousSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginHorizontal: 16,
    opacity: 0.8,
  },
  anonymousButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  anonymousButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  anonymousNote: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
  },
  benefits: {
    alignItems: "center",
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  benefitsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  benefitText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  anonymousBadgeText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "500",
  },
  migrationSection: {
    alignItems: "center",
    marginTop: 10,
  },
  migrationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    maxWidth: width - 80,
  },
  migrationTextWhite: {
    color: "#FFF",
  },
  migrationText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
    opacity: 0.9,
  },
});
