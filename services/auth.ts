// services/authServices.ts
import { supabase } from "@/config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: string;
  email: string;
  created_at: string;
  is_anonymous: boolean;
}

class AuthService {
  generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  async signInAnonymously(): Promise<User> {
    try {
      const existingUser = await AsyncStorage.getItem("anonymous_user");
      if (existingUser) {
        const user = JSON.parse(existingUser);
        return user;
      }

      // Créer un utilisateur anonyme
      const anonymousUser: User = {
        id: this.generateUUID(),
        email: `anonymous_${Date.now()}@gainz.local`,
        created_at: new Date().toISOString(),
        is_anonymous: true,
      };

      await AsyncStorage.setItem(
        "anonymous_user",
        JSON.stringify(anonymousUser)
      );

      return anonymousUser;
    } catch (error) {
      console.error("Error in anonymous sign in:", error);
      throw error;
    }
  }

  // Inscription avec email
  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned");

    await AsyncStorage.removeItem("anonymous_user");

    return {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
      is_anonymous: false,
    };
  }

  // Connexion avec email
  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned");

    // Supprimer l'utilisateur anonyme s'il existe
    await AsyncStorage.removeItem("anonymous_user");

    return {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
      is_anonymous: false,
    };
  }

  // Récupérer l'utilisateur actuel
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await AsyncStorage.removeItem("anonymous_user");

        return {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
          is_anonymous: false,
        };
      }

      const anonymousUser = await AsyncStorage.getItem("anonymous_user");
      if (anonymousUser) {
        return JSON.parse(anonymousUser);
      }

      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  // Déconnexion
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("anonymous_user");
  }

  async clearAllStorage(): Promise<void> {
    try {
      await AsyncStorage.clear();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  // Vérifier si l'utilisateur est anonyme
  async isAnonymous(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.is_anonymous ?? false;
  }

  // Migrer un utilisateur anonyme vers un compte réel
  async migrateAnonymousUser(email: string, password: string): Promise<User> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser || !currentUser.is_anonymous) {
      throw new Error("No anonymous user to migrate");
    }

    try {
      // 1. Créer le compte réel avec session Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Améliorer les messages d'erreur
        if (error.message.includes("already registered")) {
          throw new Error("Cette adresse email est déjà utilisée");
        }
        throw error;
      }

      if (!data.user) throw new Error("No user returned");

      const realUser: User = {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        is_anonymous: false,
      };

      await this.migrateWorkoutsToNewUser(currentUser.id, realUser.id);

      await AsyncStorage.removeItem("anonymous_user");

      return realUser;
    } catch (error) {
      console.error("Error migrating user:", error);
      throw error;
    }
  }

  // Améliorer migrateWorkoutsToNewUser
  private async migrateWorkoutsToNewUser(
    oldUserId: string,
    newUserId: string
  ): Promise<void> {
    try {
      // Récupérer tous les IDs de workouts
      const workoutIdsData = await AsyncStorage.getItem("workout_ids");
      if (!workoutIdsData) return;

      const workoutIds: string[] = JSON.parse(workoutIdsData);

      // Mettre à jour chaque workout avec le nouveau user_id
      for (const workoutId of workoutIds) {
        const workoutData = await AsyncStorage.getItem(`workout_${workoutId}`);
        if (workoutData) {
          const workout = JSON.parse(workoutData);

          // Vérifier que le workout appartient bien à l'ancien utilisateur
          if (workout.user_id === oldUserId) {
            workout.user_id = newUserId;

            // Sauvegarder avec le nouveau user_id
            await AsyncStorage.setItem(
              `workout_${workoutId}`,
              JSON.stringify(workout)
            );

            // Marquer pour re-sync (sera synchronisé avec le nouveau compte)
            await AsyncStorage.removeItem(`sync_status_${workoutId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error migrating workouts:", error);
    }
  }

  // Obtenir le token de session pour les requêtes API
  async getSessionToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
}

export const authService = new AuthService();
