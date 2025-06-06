import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Toast } from "@/components/ui/Toast";
import { useWorkoutStore } from "@/store/workoutStore";
import { useExerciseStore } from "@/store/exerciseStore";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WelcomeFlow } from "@/components/auth/WelcomeFlow";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { loadWorkoutHistory } = useWorkoutStore();
  const { loadExercises } = useExerciseStore();
  const { visible, message, type, hideToast } = useToastStore();
  const { isLoading } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([loadWorkoutHistory(), loadExercises()]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn("Error loading initial data:", e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout" />
          <Stack.Screen name="templates/index" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <WelcomeFlow />
      </AuthGuard>
      <StatusBar style="auto" />

      <Toast
        visible={visible}
        message={message}
        type={type}
        onHide={hideToast}
      />
    </SafeAreaProvider>
  );
}
