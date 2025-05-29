import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Workout } from "@/types";

interface ProgressChartProps {
  workouts: Workout[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ workouts }) => {
  // Calcul du volume par semaine (dernières 4 semaines)
  const getWeeklyVolume = () => {
    const weeks = [];
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekWorkouts = workouts.filter((w) => {
        const workoutDate = new Date(w.started_at);
        return (
          workoutDate >= weekStart && workoutDate <= weekEnd && w.finished_at
        );
      });

      const volume = weekWorkouts.reduce((total, workout) => {
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

      weeks.push({
        week: i === 0 ? "Cette sem." : `${i}sem`,
        volume: Math.round(volume / 1000), // En tonnes
        workoutCount: weekWorkouts.length,
      });
    }

    return weeks;
  };

  const weeklyData = getWeeklyVolume();
  const maxVolume = Math.max(...weeklyData.map((w) => w.volume), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volume d'entraînement (tonnes)</Text>

      <View style={styles.chart}>
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxVolume}t</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxVolume / 2)}t</Text>
          <Text style={styles.yAxisLabel}>0t</Text>
        </View>

        <View style={styles.chartArea}>
          <View style={styles.gridLines}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.bars}>
            {weeklyData.map((week, index) => {
              const barHeight =
                maxVolume > 0 ? (week.volume / maxVolume) * 120 : 0;
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.bar,
                        { height: barHeight },
                        week.volume > 0 && styles.barActive,
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{week.week}</Text>
                  {week.volume > 0 && (
                    <Text style={styles.barValue}>{week.volume}t</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  chart: {
    flexDirection: "row",
    height: 140,
  },
  yAxis: {
    width: 30,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  gridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#F2F2F7",
  },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barBackground: {
    width: 20,
    height: 120,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    minHeight: 2,
  },
  barActive: {
    backgroundColor: "#007AFF",
  },
  barLabel: {
    fontSize: 10,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  barValue: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "500",
    marginTop: 2,
  },
});
