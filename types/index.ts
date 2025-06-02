export interface Exercise {
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
}

export interface Set {
  weight?: number;
  reps?: number;
  completed: boolean;
  duration_seconds?: number;
  distance_km?: number;
  rest_seconds?: number;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: Set[];
  completed: boolean;
  order_index?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: number;
  started_at: number;
  finished_at?: number;
  exercises: WorkoutExercise[];
  completed: boolean;
  user_id: string;
  is_template?: boolean;
  template_id?: string;
  template_session_id?: string;
}

export interface WorkoutHistory extends Workout {
  duration: number;
  notes?: string;
}

export interface UnifiedExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string | number;
  rest_seconds?: number;
  notes?: string;
  progression_notes?: string;
  is_bodyweight?: boolean;
  suggested_weight?: number;
}

export interface TemplateExercise extends Exercise {
  progression_type?: string;
  progression_value?: number;
  progression_notes?: string;
}

export interface TemplateSession {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}

export interface Template {
  id: string;
  name: string;
  sessions: TemplateSession[];
}

export interface ProgressData {
  sessionId: string;
  date: number;
  exercises: {
    exerciseId: string;
    sets: Set[];
  }[];
}

export interface PR {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: number;
}
