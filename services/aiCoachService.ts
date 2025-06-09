import { Workout, Exercise } from "@/types/index";

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
  goals: string[];
  preferences: {
    workoutDuration: number; // minutes
    difficulty: "easy" | "moderate" | "hard";
    focusAreas: string[];
  };
  limitations: string[];
}

export class AICoachService {
  private static instance: AICoachService;

  static getInstance(): AICoachService {
    if (!AICoachService.instance) {
      AICoachService.instance = new AICoachService();
    }
    return AICoachService.instance;
  }

  async analyzePerformance(
    recentWorkouts: any[],
    userProfile: UserProfile
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Analyse progression par exercice
    const exerciseProgress = this.analyzeExerciseProgression(recentWorkouts);

    // Détection plateaux
    const plateaus = this.detectPlateaus(exerciseProgress);

    // Recommandations de progression
    const progressionRecs = this.generateProgressionRecommendations(
      exerciseProgress,
      plateaus,
      userProfile
    );

    recommendations.push(...progressionRecs);

    // Analyse récupération
    const recoveryRecs = this.analyzeRecoveryPatterns(recentWorkouts);
    recommendations.push(...recoveryRecs);

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeExerciseProgression(workouts: Workout[]) {
    const exerciseData: Record<
      string,
      {
        sessions: Array<{
          date: number;
          maxWeight: number;
          totalVolume: number;
          avgReps: number;
        }>;
      }
    > = {};

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        if (!exerciseData[exercise.exercise.id]) {
          exerciseData[exercise.exercise.id] = { sessions: [] };
        }

        const sets = exercise.sets.filter((set) => set.completed);
        if (sets.length === 0) return;

        const maxWeight = Math.max(...sets.map((set) => set.weight || 0));
        const totalVolume = sets.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
          0
        );
        const avgReps =
          sets.reduce((sum, set) => sum + (set.reps || 0), 0) / sets.length;

        exerciseData[exercise.exercise.id].sessions.push({
          date: workout.started_at,
          maxWeight,
          totalVolume,
          avgReps,
        });
      });
    });

    return exerciseData;
  }

  private detectPlateaus(exerciseData: Record<string, any>): string[] {
    const plateauExercises: string[] = [];

    Object.entries(exerciseData).forEach(([exerciseId, data]) => {
      if (data.sessions.length < 3) return;

      const recentSessions = data.sessions.slice(-3);
      const weights = recentSessions.map((s: any) => s.maxWeight);

      // Si pas d'amélioration sur 3 sessions
      const hasImprovement = weights.some(
        (weight: number, i: number) => i > 0 && weight > weights[i - 1]
      );

      if (!hasImprovement) {
        plateauExercises.push(exerciseId);
      }
    });

    return plateauExercises;
  }

  private generateProgressionRecommendations(
    exerciseData: Record<string, any>,
    plateaus: string[],
    userProfile: UserProfile
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    Object.entries(exerciseData).forEach(([exerciseId, data]) => {
      if (data.sessions.length < 2) return;

      const lastTwo = data.sessions.slice(-2);
      const improvement = lastTwo[1].maxWeight - lastTwo[0].maxWeight;

      if (plateaus.includes(exerciseId)) {
        // Recommandation de décharge
        recommendations.push({
          id: `deload_${exerciseId}`,
          type: "deload",
          title: "Semaine de décharge recommandée",
          description: "Réduisez de 10-15% pour mieux progresser ensuite",
          confidence: 0.8,
          exerciseId,
          suggestedValue: Math.round(lastTwo[1].maxWeight * 0.85),
          reasoning: "Plateau détecté sur 3 séances consécutives",
          createdAt: Date.now(),
        });
      } else if (improvement > 0) {
        // Progression positive, suggérer d'augmenter
        const suggestedIncrease = this.calculateWeightIncrease(
          lastTwo[1].maxWeight,
          userProfile.fitnessLevel
        );

        recommendations.push({
          id: `increase_${exerciseId}`,
          type: "weight_increase",
          title: "Augmentation de charge suggérée",
          description: `Vous progressez bien ! Tentez +${suggestedIncrease}kg`,
          confidence: 0.9,
          exerciseId,
          suggestedValue: lastTwo[1].maxWeight + suggestedIncrease,
          reasoning: `Progression constante de ${improvement}kg détectée`,
          createdAt: Date.now(),
        });
      }
    });

    return recommendations;
  }

  private calculateWeightIncrease(
    currentWeight: number,
    level: string
  ): number {
    const baseIncrease =
      currentWeight < 50 ? 2.5 : currentWeight < 100 ? 5 : 10;

    switch (level) {
      case "beginner":
        return baseIncrease;
      case "intermediate":
        return baseIncrease * 0.75;
      case "advanced":
        return baseIncrease * 0.5;
      default:
        return baseIncrease;
    }
  }

  private analyzeRecoveryPatterns(workouts: Workout[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    // Analyse fréquence d'entraînement
    if (workouts.length >= 2) {
      const daysBetween = workouts
        .map((workout, i) => {
          if (i === 0) return 0;
          return (
            (workout.started_at - workouts[i - 1].started_at) /
            (1000 * 60 * 60 * 24)
          );
        })
        .filter((days) => days > 0);

      const avgDaysBetween =
        daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;

      if (avgDaysBetween < 1) {
        recommendations.push({
          id: "recovery_warning",
          type: "rest_adjustment",
          title: "Attention à la récupération",
          description:
            "Vous vous entraînez très fréquemment. Pensez aux jours de repos.",
          confidence: 0.7,
          reasoning: `Moyenne de ${avgDaysBetween.toFixed(
            1
          )} jours entre séances`,
          createdAt: Date.now(),
        });
      }
    }

    return recommendations;
  }

  async generatePersonalizedWorkout(
    userProfile: UserProfile,
    recentWorkouts: Workout[],
    availableExercises: Exercise[]
  ): Promise<{
    exercises: Exercise[];
    suggestedSets: number[];
    suggestedReps: number[];
    suggestedWeights: number[];
    reasoning: string;
  }> {
    // Logique de génération de séance personnalisée
    // Pour l'instant, version simple, on peut complexifier après

    const recentExerciseIds = new Set(
      recentWorkouts
        .slice(-3)
        .flatMap((w) => w.exercises.map((e) => e.exercise.id))
    );

    // Mélange exercices récents et nouveaux
    const newExercises = availableExercises.filter(
      (e) => !recentExerciseIds.has(e.id)
    );
    const recentExercises = availableExercises.filter((e) =>
      recentExerciseIds.has(e.id)
    );

    const selectedExercises = [
      ...recentExercises.slice(0, 3),
      ...newExercises.slice(0, 2),
    ].slice(0, 5);

    return {
      exercises: selectedExercises,
      suggestedSets: selectedExercises.map(() => 3),
      suggestedReps: selectedExercises.map(() =>
        userProfile.goals.includes("strength") ? 5 : 10
      ),
      suggestedWeights: selectedExercises.map(() => 0), // À calculer selon historique
      reasoning: "Mélange optimisé entre exercices familiers et nouveaux défis",
    };
  }
}
