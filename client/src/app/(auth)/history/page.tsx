import { serverFetch } from "@/lib/server";
import type { WorkoutSession } from "@/lib/types";
import HistoryClient from "@/components/HistoryClient";

export const metadata = { title: "History — FitTrack" };

export default async function HistoryPage() {
  const sessions =
    (await serverFetch<WorkoutSession[]>("/api/v1/workouts/sessions?take=50")) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">History</h1>
      <HistoryClient initialSessions={sessions} />
    </div>
  );
}
