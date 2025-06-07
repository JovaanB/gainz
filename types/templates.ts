// src/types/templates.ts

import { SupabaseWorkoutExercise } from "@/config/supabase";
import { number } from "yup";

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  level: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  frequency: number; // sessions per week
  equipment: Equipment[];
  tags: string[];
  exercises: SupabaseWorkoutExercise[];
  preview_image?: string;
  popularity: number; // pour le tri
  estimated_results: string;
}

export interface TemplateSession {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  rest_between_exercises: number;
  estimated_duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface TemplateExercise {
  exercise_id: string;
  sets: number;
  reps: number | string;
  rest_seconds: number;
  notes?: string;
  name?: string;
  category?: string;
  is_bodyweight?: boolean;
  is_superset?: boolean;
  superset_group?: string;
  progression_notes?: string;
}

export interface TemplateStats {
  totalWeeks: number;
  currentWeek: number;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  progressPercent: number;
  estimatedCompletion: Date | null;
}

export type TemplateCategory =
  | "strength"
  | "muscle_building"
  | "fat_loss"
  | "general_fitness"
  | "sport_specific";

export type Equipment =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "machines"
  | "cables"
  | "bands";

export interface UserProgram {
  templateId: string;
  startDate: number;
  currentWeek: number;
  currentSession: number;
  completedSessions: string[];
  customizations: Record<string, any>;
  progressHistory: ProgramProgress[];
}

export interface ProgramProgress {
  sessionId: string;
  date: number;
  duration: number;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number; completed: boolean }[];
  }[];
}
