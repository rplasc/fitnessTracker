import WorkoutLogger from "@/components/WorkoutLogger";
import { serverFetch } from "@/lib/server";
import type { Exercise, Settings } from "@/lib/types";

export const metadata = { title: "Workout — FitTrack" };

export default async function WorkoutPage() {
  const [exercises, settings] = await Promise.all([
    serverFetch<Exercise[]>("/api/v1/exercises").then((r) => r ?? []),
    serverFetch<Settings>("/api/v1/settings"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workout</h1>
      <WorkoutLogger
        initialExercises={exercises}
        weightUnit={settings?.weightUnit ?? "kg"}
      />
    </div>
  );
}
