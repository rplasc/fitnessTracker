import PlansClient from "@/components/PlansClient";
import { serverFetch } from "@/lib/server";
import type { PlanSummary, ScheduleEntry, Exercise } from "@/lib/types";

export const metadata = { title: "Plans — FitTrack" };

export default async function PlansPage() {
  const [plans, schedule, exercises] = await Promise.all([
    serverFetch<PlanSummary[]>("/api/v1/plans"),
    serverFetch<ScheduleEntry[]>("/api/v1/schedule"),
    serverFetch<Exercise[]>("/api/v1/exercises"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Plans</h1>
      <PlansClient
        initialPlans={plans ?? []}
        initialSchedule={schedule ?? []}
        exercises={exercises ?? []}
      />
    </div>
  );
}
