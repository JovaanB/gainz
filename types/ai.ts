export interface AICoachState {
  recommendations: AIRecommendation[];
  userProfile: UserProfile | null;
  isAnalyzing: boolean;
  lastAnalysis: number | null;
}

export interface AIRecommendation {
  id: string;
  type:
    | "weight_increase"
    | "rep_increase"
    | "rest_adjustment"
    | "exercise_swap"
    | "deload";
  title: string;
  description: string;
  confidence: number;
  exerciseId?: string;
  suggestedValue?: number;
  reasoning: string;
  createdAt: number;
  dismissed?: boolean;
}

export interface UserProfile {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goals: ("strength" | "muscle" | "endurance" | "weight_loss")[];
  preferences: {
    workoutDuration: number;
    difficulty: "easy" | "moderate" | "hard";
    focusAreas: ("chest" | "back" | "legs" | "shoulders" | "arms" | "core")[];
  };
  limitations: string[];
  createdAt: number;
  updatedAt: number;
}
