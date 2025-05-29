import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="new"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="active"
        options={{
          headerShown: false,
          gestureEnabled: false, // Empêche de swiper pour fermer
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
