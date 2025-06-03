// src/data/templates.ts
import { WorkoutTemplate } from "../types/templates";

export const POPULAR_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "ppl_beginner",
    name: "Push Pull Legs - Débutant",
    description:
      "Programme classique 6 jours, parfait pour débuter la musculation sérieusement",
    category: "muscle_building",
    level: "beginner",
    duration: 75,
    frequency: 6,
    equipment: ["barbell", "dumbbells", "machines"],
    tags: ["muscle building", "beginner friendly", "balanced", "popular"],
    estimated_results: "Gain de masse et force significatifs en 8-12 semaines",
    popularity: 95,
    sessions: [
      {
        id: "push",
        name: "Push - Pectoraux, Épaules, Triceps",
        estimated_duration: 75,
        rest_between_exercises: 90,
        exercises: [
          {
            exercise_id: "bench_press",
            sets: 3,
            reps: "8-10",
            rest_seconds: 120,
            progression_notes:
              "Ajouter 2.5kg quand vous réussissez 3x10 avec une bonne forme",
          },
          {
            exercise_id: "incline_dumbbell_press",
            sets: 3,
            reps: "8-12",
            rest_seconds: 90,
            notes: "Concentrez-vous sur la partie haute des pectoraux",
          },
          {
            exercise_id: "overhead_press",
            sets: 3,
            reps: "6-8",
            rest_seconds: 120,
            progression_notes: "Progression plus lente, +1.25kg par semaine",
          },
          {
            exercise_id: "lateral_raises",
            sets: 3,
            reps: "12-15",
            rest_seconds: 60,
            notes: "Gardez les coudes légèrement fléchis",
          },
          {
            exercise_id: "tricep_dips",
            sets: 3,
            reps: "10-15",
            rest_seconds: 75,
            notes: "Utilisez une assistance si nécessaire",
          },
          {
            exercise_id: "overhead_tricep_extension",
            sets: 3,
            reps: "10-12",
            rest_seconds: 60,
          },
        ],
      },
      {
        id: "pull",
        name: "Pull - Dos, Biceps",
        estimated_duration: 70,
        rest_between_exercises: 90,
        exercises: [
          {
            exercise_id: "deadlift",
            sets: 3,
            reps: "5-6",
            rest_seconds: 180,
            progression_notes: "Exercice roi pour le dos. +2.5kg par semaine",
            notes: "Échauffement obligatoire avec barres vides",
          },
          {
            exercise_id: "pull_ups",
            sets: 3,
            reps: "6-10",
            rest_seconds: 120,
            notes: "Utilisez une assistance ou des négatives si besoin",
          },
          {
            exercise_id: "barbell_rows",
            sets: 3,
            reps: "8-10",
            rest_seconds: 90,
            notes: "Gardez le dos droit, tirez vers le bas du sternum",
          },
          {
            exercise_id: "lat_pulldown",
            sets: 3,
            reps: "10-12",
            rest_seconds: 75,
          },
          {
            exercise_id: "barbell_curls",
            sets: 3,
            reps: "10-12",
            rest_seconds: 60,
            progression_notes: "Évitez de balancer le corps",
          },
          {
            exercise_id: "hammer_curls",
            sets: 3,
            reps: "12-15",
            rest_seconds: 60,
          },
        ],
      },
      {
        id: "legs",
        name: "Legs - Jambes, Fessiers",
        estimated_duration: 80,
        rest_between_exercises: 120,
        exercises: [
          {
            exercise_id: "squat",
            sets: 3,
            reps: "8-10",
            rest_seconds: 180,
            progression_notes: "Roi des exercices jambes. +2.5kg par semaine",
            notes: "Descendez jusqu'à ce que les cuisses soient parallèles",
          },
          {
            exercise_id: "romanian_deadlift",
            sets: 3,
            reps: "8-10",
            rest_seconds: 120,
            notes: "Cible les ischio-jambiers et fessiers",
          },
          {
            exercise_id: "leg_press",
            sets: 3,
            reps: "12-15",
            rest_seconds: 90,
            notes: "Variante plus sûre pour débutants",
          },
          {
            exercise_id: "leg_curls",
            sets: 3,
            reps: "12-15",
            rest_seconds: 75,
            notes: "Isolation des ischio-jambiers",
          },
          {
            exercise_id: "calf_raises",
            sets: 4,
            reps: "15-20",
            rest_seconds: 45,
            notes: "Pause de 1 seconde en haut du mouvement",
          },
        ],
      },
    ],
  },

  {
    id: "stronglifts_5x5",
    name: "StrongLifts 5x5",
    description:
      "Programme de force légendaire avec seulement 5 exercices de base",
    category: "strength",
    level: "beginner",
    duration: 45,
    frequency: 3,
    equipment: ["barbell"],
    tags: ["strength", "simple", "proven", "powerlifting"],
    estimated_results: "Doublage de la force en 12 semaines",
    popularity: 92,
    sessions: [
      {
        id: "workout_a",
        name: "Workout A - SQD/BP/ROW",
        estimated_duration: 45,
        rest_between_exercises: 180,
        exercises: [
          {
            exercise_id: "squat",
            sets: 5,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+2.5kg chaque session réussie",
            notes: "Exercice principal - donnez tout ce que vous avez",
          },
          {
            exercise_id: "bench_press",
            sets: 5,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+2.5kg chaque session réussie",
          },
          {
            exercise_id: "barbell_row",
            sets: 5,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+2.5kg chaque session réussie",
          },
        ],
      },
      {
        id: "workout_b",
        name: "Workout B - SQD/OHP/DL",
        estimated_duration: 45,
        rest_between_exercises: 180,
        exercises: [
          {
            exercise_id: "squat",
            sets: 5,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+2.5kg chaque session réussie",
          },
          {
            exercise_id: "overhead_press",
            sets: 5,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+1.25kg chaque session (plus difficile)",
          },
          {
            exercise_id: "deadlift",
            sets: 1,
            reps: "5",
            rest_seconds: 180,
            progression_notes: "+5kg chaque session réussie",
            notes: "Une seule série mais très intense",
          },
        ],
      },
    ],
  },

  {
    id: "full_body_home",
    name: "Full Body Maison",
    description:
      "Entraînement complet sans matériel, parfait pour débuter à la maison",
    category: "general_fitness",
    level: "beginner",
    duration: 35,
    frequency: 3,
    equipment: ["bodyweight"],
    tags: ["home workout", "no equipment", "time efficient", "bodyweight"],
    estimated_results: "Tonification et endurance en 6-8 semaines",
    popularity: 88,
    sessions: [
      {
        id: "full_body",
        name: "Corps Complet",
        estimated_duration: 35,
        rest_between_exercises: 45,
        exercises: [
          {
            exercise_id: "push_ups",
            is_bodyweight: true,
            sets: 3,
            reps: "8-15",
            rest_seconds: 60,
            notes: "Adaptez selon votre niveau (genoux si besoin)",
            progression_notes:
              "Augmentez les reps avant de passer aux variantes",
          },
          {
            exercise_id: "bodyweight_squats",
            sets: 3,
            reps: "15-25",
            rest_seconds: 45,
            notes: "Concentrez-vous sur la profondeur",
          },
          {
            exercise_id: "pike_push_ups",
            sets: 3,
            reps: "6-12",
            rest_seconds: 60,
            notes:
              "Cible les épaules - pieds surélevés pour plus de difficulté",
          },
          {
            exercise_id: "lunges",
            sets: 3,
            reps: "10-15",
            rest_seconds: 45,
            notes: "Alternez les jambes",
          },
          {
            exercise_id: "plank",
            sets: 3,
            reps: "30-60s",
            rest_seconds: 60,
            notes: "Gardez le corps bien droit",
          },
          {
            exercise_id: "burpees",
            sets: 3,
            reps: "5-10",
            rest_seconds: 75,
            notes: "Excellent pour le cardio et la force",
          },
        ],
      },
    ],
  },
];

// Helper functions
export const getTemplatesByCategory = (category: string) => {
  if (category === "all") return POPULAR_TEMPLATES;
  return POPULAR_TEMPLATES.filter((template) => template.category === category);
};

export const getTemplatesByLevel = (level: string) => {
  if (level === "all") return POPULAR_TEMPLATES;
  return POPULAR_TEMPLATES.filter((template) => template.level === level);
};

export const getTemplateById = (id: string) => {
  return POPULAR_TEMPLATES.find((template) => template.id === id);
};

export const getFavoriteTemplates = (favoriteIds: string[]) => {
  return POPULAR_TEMPLATES.filter((template) =>
    favoriteIds.includes(template.id)
  );
};
