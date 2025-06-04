import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { initializeAuth, isAuthenticated, isAnonymous, isLoading } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated && pathname !== "/auth") {
        router.replace("/auth");
      } else if (isAuthenticated && !isAnonymous && pathname === "/auth") {
        router.replace("/(tabs)");
      }
    }
  }, [isInitialized, isAuthenticated, isAnonymous, pathname]);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#007AFF", "#5856D6", "#AF52DE"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Ionicons name="fitness" size={64} color="#FFFFFF" />
            <Text style={styles.logoText}>Gainz</Text>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
              style={styles.loader}
            />
            <Text style={styles.loadingText}>Initialisation...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
});
