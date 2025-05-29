import { create } from "zustand";
import { Exercise } from "@/types";
import { DEFAULT_EXERCISES } from "@/data/exercises";
import { StorageService } from "@/services/storage";

interface ExerciseStore {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  searchQuery: string;
  selectedMuscleGroup: string;
  isLoading: boolean;

  // Actions
  loadExercises: () => Promise<void>;
  searchExercises: (query: string) => void;
  filterByMuscleGroup: (muscleGroup: string) => void;
  toggleExerciseSelection: (exercise: Exercise) => void;
  clearSelection: () => void;
  getFilteredExercises: () => Exercise[];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  selectedExercises: [],
  searchQuery: "",
  selectedMuscleGroup: "",
  isLoading: false,

  loadExercises: async () => {
    try {
      set({ isLoading: true });

      // Essaie de charger depuis le storage local
      let exercises = await StorageService.getExercises();

      // Si pas d'exercices en local, utilise les exercices par défaut
      if (exercises.length === 0) {
        exercises = DEFAULT_EXERCISES;
        await StorageService.saveExercises(exercises);
      }

      set({ exercises });
    } catch (error) {
      console.error("Error loading exercises:", error);
      // Fallback sur les exercices par défaut
      set({ exercises: DEFAULT_EXERCISES });
    } finally {
      set({ isLoading: false });
    }
  },

  searchExercises: (query: string) => {
    set({ searchQuery: query });
  },

  filterByMuscleGroup: (muscleGroup: string) => {
    set({ selectedMuscleGroup: muscleGroup });
  },

  toggleExerciseSelection: (exercise: Exercise) => {
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

  getFilteredExercises: () => {
    const { exercises, searchQuery, selectedMuscleGroup } = get();

    return exercises.filter((exercise) => {
      const matchesSearch =
        searchQuery === "" ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle_groups.some((mg) =>
          mg.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesMuscleGroup =
        selectedMuscleGroup === "" ||
        exercise.muscle_groups.includes(selectedMuscleGroup);

      return matchesSearch && matchesMuscleGroup;
    });
  },
}));
