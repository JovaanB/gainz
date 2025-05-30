import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useWorkoutStore } from "@/store/workoutStore";
import { StorageService } from "@/services/storage";

export const useWorkoutPersistence = () => {
  const { currentWorkout, isRecording } = useWorkoutStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Sauvegarde automatique quand l'app passe en arrière-plan
      if (
        appState.current.match(/active|foreground/) &&
        nextAppState === "background"
      ) {
        if (currentWorkout && isRecording) {
          try {
            // Sauvegarde de secours de la séance en cours
            await StorageService.saveWorkout({
              ...currentWorkout,
              // Marque comme sauvegarde temporaire
              notes:
                (currentWorkout.notes || "") + "\n[Sauvegarde automatique]",
            });
          } catch (error) {
            console.error("Auto-save failed:", error);
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription?.remove();
  }, [currentWorkout, isRecording]);

  return { isRecording };
};
