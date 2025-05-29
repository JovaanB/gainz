import { Exercise } from "@/types";

export const DEFAULT_EXERCISES: Exercise[] = [
  // Pectoraux
  {
    id: "bench-press",
    name: "Développé couché",
    muscle_groups: ["Pectoraux", "Triceps", "Épaules"],
    category: "strength",
    instructions:
      "Allongé sur le banc, descendre la barre jusqu'à la poitrine puis pousser.",
    is_bodyweight: false,
  },
  {
    id: "incline-press",
    name: "Développé incliné",
    muscle_groups: ["Pectoraux", "Épaules"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "push-ups",
    name: "Pompes",
    muscle_groups: ["Pectoraux", "Triceps"],
    category: "strength",
    is_bodyweight: true,
  },
  // Dos
  {
    id: "pull-ups",
    name: "Tractions",
    muscle_groups: ["Dos", "Biceps"],
    category: "strength",
    is_bodyweight: true,
  },
  {
    id: "barbell-row",
    name: "Rowing barre",
    muscle_groups: ["Dos", "Biceps"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "lat-pulldown",
    name: "Tirage vertical",
    muscle_groups: ["Dos", "Biceps"],
    category: "strength",
    is_bodyweight: false,
  },
  // Jambes
  {
    id: "squat",
    name: "Squat",
    muscle_groups: ["Quadriceps", "Fessiers"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "deadlift",
    name: "Soulevé de terre",
    muscle_groups: ["Ischio-jambiers", "Fessiers", "Dos"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "leg-press",
    name: "Presse à cuisses",
    muscle_groups: ["Quadriceps", "Fessiers"],
    category: "strength",
    is_bodyweight: false,
  },
  // Épaules
  {
    id: "shoulder-press",
    name: "Développé épaules",
    muscle_groups: ["Épaules", "Triceps"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "lateral-raise",
    name: "Élévations latérales",
    muscle_groups: ["Épaules"],
    category: "strength",
    is_bodyweight: false,
  },
  // Bras
  {
    id: "bicep-curl",
    name: "Curl biceps",
    muscle_groups: ["Biceps"],
    category: "strength",
    is_bodyweight: false,
  },
  {
    id: "tricep-dips",
    name: "Dips triceps",
    muscle_groups: ["Triceps", "Pectoraux"],
    category: "strength",
    is_bodyweight: true,
  },
  // Cardio
  {
    id: "treadmill",
    name: "Tapis de course",
    muscle_groups: ["Cardio"],
    category: "cardio",
    is_bodyweight: true,
  },
  {
    id: "cycling",
    name: "Vélo",
    muscle_groups: ["Cardio", "Jambes"],
    category: "cardio",
    is_bodyweight: true,
  },
];
