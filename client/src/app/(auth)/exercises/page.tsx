import ExercisesClient from "@/components/ExercisesClient";
import { serverFetch } from "@/lib/server";
import type { Exercise } from "@/lib/types";

export const metadata = { title: "Exercises — FitTrack" };

export default async function ExercisesPage() {
  const exercises = await serverFetch<Exercise[]>("/api/v1/exercises") ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Exercises</h1>
      <ExercisesClient initialExercises={exercises} />
    </div>
  );
}
