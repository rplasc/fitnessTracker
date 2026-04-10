import WorkoutLogger from "@/components/WorkoutLogger";
import { serverFetch } from "@/lib/server";
import type { Exercise } from "@/lib/types";

export const metadata = { title: "Workout — FitTrack" };

export default async function WorkoutPage() {
  const exercises = await serverFetch<Exercise[]>("/api/v1/exercises") ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workout</h1>
      <WorkoutLogger initialExercises={exercises} />
    </div>
  );
}
