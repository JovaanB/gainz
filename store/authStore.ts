import { create } from "zustand";
import { authService, User } from "@/services/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/config/supabase";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
  error: string | null;
  showWelcome: boolean;

  setShowWelcome: (show: boolean) => void;
  initializeAuth: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  migrateToRealAccount: (email: string, password: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAnonymous: false,
  error: null,
  isInitialized: false,
  showWelcome: false,

  setShowWelcome: (show: boolean) => {
    set({ showWelcome: show });
  },

  initializeAuth: async () => {
    const currentState = get();

    if (currentState.isLoading || currentState.isInitialized) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Écouter les changements de session Supabase
      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          // Utilisateur connecté avec session Supabase
          set({
            user: {
              id: session.user.id,
              email: session.user.email!,
              created_at: session.user.created_at,
              is_anonymous: false,
            },
            isAuthenticated: true,
            isAnonymous: false,
          });
        }
      });

      // Récupérer l'utilisateur actuel
      let user = await authService.getCurrentUser();

      if (user) {
        set({
          user,
          isAuthenticated: true,
          isAnonymous: user?.is_anonymous,
        });
      }

      set({
        isInitialized: true,
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({
        error: "Erreur lors de l'initialisation de l'authentification",
        user: null,
        isAuthenticated: false,
        isAnonymous: false,
        isInitialized: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },

  signInAnonymously: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.signInAnonymously();
      set({
        user,
        isAuthenticated: true,
        isAnonymous: true,
      });
    } catch (error) {
      set({ error: "Erreur lors de la connexion anonyme" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { isAnonymous: wasAnonymous } = get();

      if (wasAnonymous) {
        // Migration d'un utilisateur anonyme
        const user = await authService.migrateAnonymousUser(email, password);
        set({
          user,
          isAuthenticated: true,
          isAnonymous: false,
        });
      } else {
        // Nouvelle inscription normale
        const user = await authService.signUp(email, password);
        set({
          user,
          isAuthenticated: true,
          isAnonymous: false,
        });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      let errorMessage = "Erreur lors de l'inscription";

      if (error.message?.includes("already registered")) {
        errorMessage = "Cette adresse email est déjà utilisée";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Adresse email invalide";
      } else if (error.message?.includes("Password")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      }

      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.signIn(email, password);
      set({
        user,
        isAuthenticated: true,
        isAnonymous: false,
      });
    } catch (error: any) {
      console.error("Error signing in:", error);
      let errorMessage = "Erreur lors de la connexion";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email";
      }

      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      // Déconnexion de Supabase si connecté
      await authService.signOut();

      // Supprimer l'utilisateur anonyme aussi
      await AsyncStorage.removeItem("anonymous_user");

      // Reset complet de l'état
      set({
        user: null,
        isAuthenticated: false,
        isAnonymous: false,
        isInitialized: false,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      set({ error: "Erreur lors de la déconnexion" });
    } finally {
      set({ isLoading: false });
    }
  },

  migrateToRealAccount: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.migrateAnonymousUser(email, password);
      set({
        user,
        isAuthenticated: true,
        isAnonymous: false,
      });
    } catch (error: any) {
      console.error("Error migrating to real account:", error);
      set({ error: "Erreur lors de la création du compte" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
