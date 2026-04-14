import ExercisesClient from "@/components/ExercisesClient";
import { serverFetch } from "@/lib/server";
import type { Exercise, Settings } from "@/lib/types";

export const metadata = { title: "Exercises — FitTrack" };

export default async function ExercisesPage() {
  const [exercises, settings] = await Promise.all([
    serverFetch<Exercise[]>("/api/v1/exercises").then((r) => r ?? []),
    serverFetch<Settings>("/api/v1/settings"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Exercises</h1>
      <ExercisesClient
        initialExercises={exercises}
        weightUnit={settings?.weightUnit ?? "kg"}
      />
    </div>
  );
}
