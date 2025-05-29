import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Toast } from "@/components/ui/Toast";
import { useWorkoutStore } from "@/store/workoutStore";
import { useExerciseStore } from "@/store/exerciseStore";
import { useToastStore } from "@/store/toastStore";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { loadWorkoutHistory } = useWorkoutStore();
  const { loadExercises } = useExerciseStore();
  const { visible, message, type, hideToast } = useToastStore();

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

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />

      <Toast
        visible={visible}
        message={message}
        type={type}
        onHide={hideToast}
      />
    </>
  );
}
