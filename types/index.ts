export interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  category: "strength" | "cardio";
  instructions?: string;
  image_url?: string;
  is_bodyweight: boolean;
}

export interface WorkoutSet {
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance_km?: number;
  rest_seconds?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  order_index: number;
  notes?: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  started_at: number;
  finished_at?: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  weight_unit: "kg" | "lbs";
  experience_level: "beginner" | "intermediate" | "advanced";
}
