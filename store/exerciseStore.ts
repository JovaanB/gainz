// store/exerciseStore.ts
import { create } from "zustand";
import { Exercise } from "@/types";
import {
  exerciseService,
  ExerciseWithSource,
} from "@/services/exerciseService";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_EXERCISES } from "@/data/exercises";

interface ExerciseStore {
  exercises: ExerciseWithSource[];
  selectedExercises: ExerciseWithSource[];
  searchQuery: string;
  selectedMuscleGroup: string;
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadExercises: () => Promise<void>;
  searchExercises: (query: string) => void;
  filterByMuscleGroup: (muscleGroup: string) => void;
  filterByCategory: (category: string) => void;
  toggleExerciseSelection: (exercise: ExerciseWithSource) => void;
  clearSelection: () => void;
  getFilteredExercises: () => ExerciseWithSource[];
  addPersonalExercise: (exercise: Omit<Exercise, "id">) => Promise<void>;
  refreshExercises: () => Promise<void>;
  clearError: () => void;
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  selectedExercises: [],
  searchQuery: "",
  selectedMuscleGroup: "",
  selectedCategory: "",
  isLoading: false,
  error: null,

  loadExercises: async () => {
    try {
      set({ isLoading: true, error: null });

      // Vérifier si l'utilisateur est authentifié
      const { isAuthenticated } = useAuthStore.getState();

      if (!isAuthenticated) {
        // Utilisateur non connecté, utiliser une liste basique locale
        console.log("User not authenticated, loading basic exercises");
        set({
          exercises: getBasicExercises(),
          isLoading: false,
        });
        return;
      }

      // Charger tous les exercices accessibles depuis Supabase
      const exercises = await exerciseService.getAccessibleExercises();
      console.log(`Loaded ${exercises.length} exercises from Supabase`);

      set({ exercises });
    } catch (error) {
      console.error("Error loading exercises:", error);
      set({
        error: "Impossible de charger les exercices",
        exercises: getBasicExercises(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshExercises: async () => {
    await get().loadExercises();
  },

  searchExercises: (query: string) => {
    set({ searchQuery: query });
  },

  filterByMuscleGroup: (muscleGroup: string) => {
    set({ selectedMuscleGroup: muscleGroup });
  },

  filterByCategory: (category: string) => {
    set({ selectedCategory: category });
  },

  toggleExerciseSelection: (exercise: ExerciseWithSource) => {
    const { selectedExercises } = get();
    const isSelected = selectedExercises.some((ex) => ex.id === exercise.id);

    if (isSelected) {
      set({
        selectedExercises: selectedExercises.filter(
          (ex) => ex.id !== exercise.id
        ),
      });
    } else {
      set({
        selectedExercises: [...selectedExercises, exercise],
      });
    }
  },

  clearSelection: () => {
    set({ selectedExercises: [] });
  },

  addPersonalExercise: async (exercise: Omit<Exercise, "id">) => {
    try {
      set({ isLoading: true, error: null });

      // Créer l'exercice personnel
      const newExercise = await exerciseService.createPersonalExercise(
        exercise
      );

      // Ajouter à la liste locale
      const { exercises } = get();
      set({ exercises: [...exercises, newExercise] });

      console.log("Personal exercise created:", newExercise.name);
    } catch (error) {
      console.error("Error creating personal exercise:", error);
      set({ error: "Impossible de créer l'exercice personnel" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getFilteredExercises: () => {
    const { exercises, searchQuery, selectedMuscleGroup, selectedCategory } =
      get();

    return exercises.filter((exercise) => {
      // Filtre de recherche
      const matchesSearch =
        searchQuery === "" ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle_groups.some((mg) =>
          mg.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (exercise.category &&
          exercise.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtre par groupe musculaire
      const matchesMuscleGroup =
        selectedMuscleGroup === "" ||
        exercise.muscle_groups.some(
          (mg) => mg.toLowerCase() === selectedMuscleGroup.toLowerCase()
        );

      // Filtre par catégorie
      const matchesCategory =
        selectedCategory === "" || exercise.category === selectedCategory;

      return matchesSearch && matchesMuscleGroup && matchesCategory;
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Exercices de base pour le fallback (utilisateurs non connectés)
function getBasicExercises(): ExerciseWithSource[] {
  return DEFAULT_EXERCISES;
}
