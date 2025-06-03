import { Workout } from "@/types";

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type:
    | "weight"
    | "reps"
    | "volume"
    | "distance"
    | "duration"
    | "speed"
    | "1rm";
  value: number;
  duration_seconds?: number;
  distance_km?: number;
  reps?: number;
  weight?: number;
  date: number;
  workoutId: string;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  type: "weight" | "reps" | "sets";
  currentBest: {
    sets: number;
    reps: number;
    weight?: number;
  };
  suggested: {
    sets: number;
    reps: number;
    weight?: number;
  };
  reasoning: string;
}

export class ProgressCalculator {
  // Calcule le 1RM estimé (formule Epley)
  static calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  // Trouve tous les PRs pour un utilisateur
  static findPersonalRecords(workouts: Workout[]): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    const exerciseMap = new Map<string, PersonalRecord[]>();

    // Parcourt tous les workouts
    workouts.forEach((workout, workoutIndex) => {
      if (!workout.finished_at) {
        return;
      }

      workout.exercises.forEach((workoutExercise, exerciseIndex) => {
        const exerciseId = workoutExercise.exercise.id;
        const exerciseName = workoutExercise.exercise.name;
        const isBodyweight = workoutExercise.exercise.is_bodyweight;
        const isCardio = workoutExercise.exercise.category === "cardio";

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, []);
        }

        workoutExercise.sets.forEach((set, setIndex) => {
          if (!set.completed) {
            return;
          }

          const exerciseRecords = exerciseMap.get(exerciseId)!;

          if (isCardio) {
            if (set.duration_seconds) {
              const durationPR = exerciseRecords.find(
                (r) => r.type === "duration"
              );
              const isNewDurationPR =
                !durationPR || set.duration_seconds > durationPR.value;

              if (isNewDurationPR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "duration",
                  value: set.duration_seconds,
                  duration_seconds: set.duration_seconds,
                  distance_km: set.distance_km,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (durationPR) {
                  exerciseRecords[exerciseRecords.indexOf(durationPR)] =
                    newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }
            }

            // PR Distance maximale
            if (set.distance_km) {
              const distancePR = exerciseRecords.find(
                (r) => r.type === "distance"
              );
              const isNewDistancePR =
                !distancePR || set.distance_km > distancePR.value;

              if (isNewDistancePR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "distance",
                  value: set.distance_km,
                  duration_seconds: set.duration_seconds,
                  distance_km: set.distance_km,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (distancePR) {
                  exerciseRecords[exerciseRecords.indexOf(distancePR)] =
                    newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }
            }

            // PR Vitesse (si on a durée ET distance)
            if (set.duration_seconds && set.distance_km) {
              const speed = set.distance_km / (set.duration_seconds / 3600); // km/h
              const speedPR = exerciseRecords.find((r) => r.type === "speed");
              const isNewSpeedPR = !speedPR || speed > speedPR.value;

              if (isNewSpeedPR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "speed",
                  value: speed,
                  duration_seconds: set.duration_seconds,
                  distance_km: set.distance_km,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (speedPR) {
                  exerciseRecords[exerciseRecords.indexOf(speedPR)] = newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }
            }
          } else {
            if (!set.reps) {
              return;
            }

            // PR Poids maximum (si pas bodyweight)
            if (!isBodyweight && set.weight) {
              const weightPR = exerciseRecords.find((r) => r.type === "weight");
              const isNewWeightPR = !weightPR || set.weight > weightPR.value;

              if (isNewWeightPR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "weight",
                  value: set.weight,
                  reps: set.reps,
                  weight: set.weight,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (weightPR) {
                  exerciseRecords[exerciseRecords.indexOf(weightPR)] =
                    newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }

              // PR 1RM estimé
              const oneRM = this.calculate1RM(set.weight, set.reps);
              const oneRMPR = exerciseRecords.find((r) => r.type === "1rm");
              const isNew1RMPR = !oneRMPR || oneRM > oneRMPR.value;

              if (isNew1RMPR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "1rm",
                  value: oneRM,
                  reps: set.reps,
                  weight: set.weight,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (oneRMPR) {
                  exerciseRecords[exerciseRecords.indexOf(oneRMPR)] = newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }

              // PR Volume pour cette série
              const volume = set.reps * set.weight;
              const volumePR = exerciseRecords.find((r) => r.type === "volume");
              const isNewVolumePR = !volumePR || volume > volumePR.value;

              if (isNewVolumePR) {
                const newRecord: PersonalRecord = {
                  exerciseId,
                  exerciseName,
                  type: "volume",
                  value: volume,
                  reps: set.reps,
                  weight: set.weight,
                  date: workout.started_at,
                  workoutId: workout.id,
                };

                if (volumePR) {
                  exerciseRecords[exerciseRecords.indexOf(volumePR)] =
                    newRecord;
                } else {
                  exerciseRecords.push(newRecord);
                }
              }
            }

            // PR Répétitions maximum
            const repsPR = exerciseRecords.find((r) => r.type === "reps");
            const isNewRepsPR = !repsPR || set.reps > repsPR.value;

            if (isNewRepsPR) {
              const newRecord: PersonalRecord = {
                exerciseId,
                exerciseName,
                type: "reps",
                value: set.reps,
                reps: set.reps,
                weight: set.weight,
                date: workout.started_at,
                workoutId: workout.id,
              };

              if (repsPR) {
                exerciseRecords[exerciseRecords.indexOf(repsPR)] = newRecord;
              } else {
                exerciseRecords.push(newRecord);
              }
            }
          }
        });
      });
    });

    // Flatten tous les records
    exerciseMap.forEach((exerciseRecords) => {
      records.push(...exerciseRecords);
    });

    return records.sort((a, b) => b.date - a.date);
  }

  // Génère des suggestions de progression
  static generateProgressionSuggestions(
    workouts: Workout[],
    exerciseId: string
  ): ProgressionSuggestion | null {
    const recentPerformances = this.getRecentPerformances(
      workouts,
      exerciseId,
      3
    );

    if (recentPerformances.length === 0) return null;

    const latest = recentPerformances[0];
    const isBodyweight = latest.exercise.is_bodyweight;

    const completedSets = latest.sets.filter((set) => set.completed);

    if (completedSets.length == 0) return null;

    const bestSet = completedSets.reduce((best, current) => {
      if (!best) return current;

      if (isBodyweight) {
        return current.reps! > best.reps! ? current : best;
      } else {
        const currentScore = (current.weight || 0) * (current.reps || 0);
        const bestScore = (best.weight || 0) * (best.reps || 0);
        return currentScore > bestScore ? current : best;
      }
    });

    if (!bestSet || !bestSet.reps) return null;

    // Logique de progression
    if (isBodyweight) {
      // Pour exercices au poids de corps : +1-2 reps
      return {
        exerciseId,
        type: "reps",
        currentBest: {
          sets: latest.sets.filter((s) => s.completed).length,
          reps: bestSet.reps,
        },
        suggested: {
          sets: latest.sets.filter((s) => s.completed).length,
          reps: bestSet.reps + (bestSet.reps < 5 ? 1 : 2),
        },
        reasoning: `Essaie ${
          bestSet.reps + (bestSet.reps < 5 ? 1 : 2)
        } reps cette fois !`,
      };
    } else {
      // Pour exercices avec poids
      const currentWeight = bestSet.weight || 0;
      const currentReps = bestSet.reps;

      if (currentReps >= 12) {
        // Si >12 reps : augmente le poids, diminue les reps
        const newWeight = currentWeight + (currentWeight < 20 ? 2.5 : 5);
        return {
          exerciseId,
          type: "weight",
          currentBest: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: currentReps,
            weight: currentWeight,
          },
          suggested: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: Math.max(8, currentReps - 2),
            weight: newWeight,
          },
          reasoning: `Augmente le poids ! ${newWeight}kg pour ${Math.max(
            8,
            currentReps - 2
          )} reps`,
        };
      } else if (currentReps < 6) {
        // Si <6 reps : diminue le poids, augmente les reps
        const newWeight = Math.max(currentWeight * 0.9, currentWeight - 5);
        return {
          exerciseId,
          type: "weight",
          currentBest: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: currentReps,
            weight: currentWeight,
          },
          suggested: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: currentReps + 2,
            weight: newWeight,
          },
          reasoning: `Diminue le poids pour plus de reps : ${newWeight}kg`,
        };
      } else {
        // Zone 6-12 reps : progression linéaire
        const increment = currentWeight < 50 ? 2.5 : 5;
        return {
          exerciseId,
          type: "weight",
          currentBest: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: currentReps,
            weight: currentWeight,
          },
          suggested: {
            sets: latest.sets.filter((s) => s.completed).length,
            reps: currentReps,
            weight: currentWeight + increment,
          },
          reasoning: `Essaie ${
            currentWeight + increment
          }kg pour ${currentReps} reps`,
        };
      }
    }
  }

  // Utilitaire : récupère les performances récentes pour un exercice
  private static getRecentPerformances(
    workouts: Workout[],
    exerciseId: string,
    limit: number = 5
  ) {
    return workouts
      .filter((w) => w.finished_at)
      .sort((a, b) => b.started_at - a.started_at)
      .map((workout) => ({
        workout,
        exercise: workout.exercises.find((ex) => ex.exercise.id === exerciseId),
      }))
      .filter((item) => item.exercise)
      .map((item) => ({
        ...item.exercise!,
        workoutDate: item.workout.started_at,
      }))
      .slice(0, limit);
  }

  static detectNewPRs(
    completedWorkout: Workout,
    previousWorkouts: Workout[]
  ): PersonalRecord[] {
    const allWorkouts = [...previousWorkouts, completedWorkout];
    const allPRs = this.findPersonalRecords(allWorkouts);
    const previousPRs = this.findPersonalRecords(previousWorkouts);

    const newPRs: PersonalRecord[] = [];

    allPRs.forEach((pr) => {
      const isFromThisWorkout = pr.workoutId === completedWorkout.id;

      if (isFromThisWorkout) {
        const previousPR = previousPRs.find(
          (prev) => prev.exerciseId === pr.exerciseId && prev.type === pr.type
        );

        const isNew = !previousPR || pr.value > previousPR.value;

        if (isNew) {
          newPRs.push(pr);
        }
      }
    });

    return newPRs;
  }

  static calculateProgressStats(workouts: Workout[], periodDays: number = 30) {
    const cutoffDate = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const recentWorkouts = workouts.filter(
      (w) => w.started_at > cutoffDate && w.finished_at
    );
    const previousWorkouts = workouts.filter(
      (w) => w.started_at <= cutoffDate && w.finished_at
    );

    const recentVolume = this.calculateTotalVolume(recentWorkouts);
    const previousVolume = this.calculateTotalVolume(previousWorkouts);

    const volumeChange =
      previousVolume > 0
        ? ((recentVolume - previousVolume) / previousVolume) * 100
        : 0;

    return {
      recentWorkouts: recentWorkouts.length,
      volumeChange: Math.round(volumeChange),
      avgDuration:
        recentWorkouts.length > 0
          ? Math.round(
              recentWorkouts.reduce(
                (sum, w) => sum + (w.finished_at! - w.started_at),
                0
              ) /
                recentWorkouts.length /
                1000 /
                60
            )
          : 0,
    };
  }

  private static calculateTotalVolume(workouts: Workout[]): number {
    return workouts.reduce((total, workout) => {
      return (
        total +
        workout.exercises.reduce((exerciseTotal, exercise) => {
          return (
            exerciseTotal +
            exercise.sets.reduce((setTotal, set) => {
              if (set.completed && set.reps && set.weight) {
                return setTotal + set.reps * set.weight;
              }
              return setTotal;
            }, 0)
          );
        }, 0)
      );
    }, 0);
  }
}
