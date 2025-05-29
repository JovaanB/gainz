import AsyncStorage from "@react-native-async-storage/async-storage";
import { Workout, Exercise } from "@/types";

export class StorageService {
  private static KEYS = {
    WORKOUTS: "workouts",
    EXERCISES: "exercises",
    USER_SETTINGS: "user_settings",
  };

  // Workouts
  static async saveWorkout(workout: Workout): Promise<void> {
    try {
      const existingWorkouts = await this.getWorkouts();
      const updatedWorkouts = [
        workout,
        ...existingWorkouts.filter((w) => w.id !== workout.id),
      ];
      await AsyncStorage.setItem(
        this.KEYS.WORKOUTS,
        JSON.stringify(updatedWorkouts)
      );
    } catch (error) {
      console.error("Error saving workout:", error);
      throw error;
    }
  }

  static async getWorkouts(): Promise<Workout[]> {
    try {
      const workoutsJson = await AsyncStorage.getItem(this.KEYS.WORKOUTS);
      return workoutsJson ? JSON.parse(workoutsJson) : [];
    } catch (error) {
      console.error("Error loading workouts:", error);
      return [];
    }
  }

  static async deleteWorkout(workoutId: string): Promise<void> {
    try {
      const workouts = await this.getWorkouts();
      const filteredWorkouts = workouts.filter((w) => w.id !== workoutId);
      await AsyncStorage.setItem(
        this.KEYS.WORKOUTS,
        JSON.stringify(filteredWorkouts)
      );
    } catch (error) {
      console.error("Error deleting workout:", error);
      throw error;
    }
  }

  // Exercises (cache local)
  static async saveExercises(exercises: Exercise[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.KEYS.EXERCISES,
        JSON.stringify(exercises)
      );
    } catch (error) {
      console.error("Error saving exercises:", error);
      throw error;
    }
  }

  static async getExercises(): Promise<Exercise[]> {
    try {
      const exercisesJson = await AsyncStorage.getItem(this.KEYS.EXERCISES);
      return exercisesJson ? JSON.parse(exercisesJson) : [];
    } catch (error) {
      console.error("Error loading exercises:", error);
      return [];
    }
  }

  // User Settings
  static async saveUserSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.KEYS.USER_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving user settings:", error);
      throw error;
    }
  }

  static async getUserSettings(): Promise<any> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.KEYS.USER_SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : null;
    } catch (error) {
      console.error("Error loading user settings:", error);
      return null;
    }
  }

  // Utility
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.WORKOUTS,
        this.KEYS.EXERCISES,
        this.KEYS.USER_SETTINGS,
      ]);
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }
}
