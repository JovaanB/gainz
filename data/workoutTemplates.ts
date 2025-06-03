
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: string[]; // IDs des exercices
  estimatedDuration: number; // en minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  muscleGroups: string[];
  icon: string; // nom de l'icône Ionicons
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "push-day",
    name: "Push Day",
    description: "Pectoraux, épaules et triceps",
    exercises: [
      "bench-press",
      "incline-press",
      "shoulder-press",
      "lateral-raise",
      "tricep-dips",
    ],
    estimatedDuration: 45,
    difficulty: "intermediate",
    muscleGroups: ["Pectoraux", "Épaules", "Triceps"],
    icon: "fitness-outline",
  },
  {
    id: "pull-day",
    name: "Pull Day",
    description: "Dos et biceps",
    exercises: ["pull-ups", "barbell-row", "lat-pulldown", "bicep-curl"],
    estimatedDuration: 40,
    difficulty: "intermediate",
    muscleGroups: ["Dos", "Biceps"],
    icon: "body-outline",
  },
  {
    id: "leg-day",
    name: "Jambes",
    description: "Quadriceps, ischio-jambiers et fessiers",
    exercises: ["squat", "deadlift", "leg-press"],
    estimatedDuration: 50,
    difficulty: "advanced",
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    icon: "walk-outline",
  },
  {
    id: "full-body",
    name: "Full Body",
    description: "Entraînement complet du corps",
    exercises: [
      "squat",
      "bench-press",
      "barbell-row",
      "shoulder-press",
      "pull-ups",
    ],
    estimatedDuration: 60,
    difficulty: "beginner",
    muscleGroups: ["Corps entier"],
    icon: "body-outline",
  },
  {
    id: "upper-body",
    name: "Haut du Corps",
    description: "Pectoraux, dos, épaules et bras",
    exercises: [
      "bench-press",
      "pull-ups",
      "shoulder-press",
      "bicep-curl",
      "tricep-dips",
    ],
    estimatedDuration: 40,
    difficulty: "beginner",
    muscleGroups: ["Pectoraux", "Dos", "Épaules", "Bras"],
    icon: "accessibility-outline",
  },
  {
    id: "quick-session",
    name: "Session Express",
    description: "Entraînement rapide et efficace",
    exercises: ["push-ups", "squat", "pull-ups"],
    estimatedDuration: 20,
    difficulty: "beginner",
    muscleGroups: ["Corps entier"],
    icon: "flash-outline",
  },
];
