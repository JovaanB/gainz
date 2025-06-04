import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
});

// Types pour Supabase (basés sur tes interfaces)
export interface SupabaseExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
  rest_seconds?: number;
  notes?: string;
  category?: string;
  progression_notes?: string;
  is_bodyweight?: boolean;
  suggested_weight?: number;
  muscle_groups: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseWorkout {
  id: string;
  name: string;
  date: number;
  started_at: number;
  finished_at?: number;
  completed: boolean;
  user_id: string;
  is_template?: boolean;
  template_id?: string;
  template_session_id?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface SupabaseWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  completed: boolean;
  order_index?: number;
  notes?: string;
  created_at?: string;
}

export interface SupabaseSet {
  id: string;
  workout_exercise_id: string;
  weight?: number;
  reps?: number;
  completed: boolean;
  duration_seconds?: number;
  distance_km?: number;
  rest_seconds?: number;
  set_order: number;
  created_at?: string;
}
