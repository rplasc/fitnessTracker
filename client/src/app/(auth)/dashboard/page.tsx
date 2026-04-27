import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { DashboardData, Settings } from "@/lib/types";
import { formatWeight } from "@/lib/units";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const metadata = { title: "Dashboard - FitTrack" };

function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatWeightGoalDelta(deltaKg: number, weightUnit: string): string {
  const abs = Math.abs(deltaKg);
  if (abs < 0.05) return "On target";

  const label = formatWeight(abs, weightUnit);
  return deltaKg > 0 ? `${label} above target` : `${label} below target`;
}

export default async function DashboardPage() {
  const [data, settings] = await Promise.all([
    serverFetch<DashboardData>("/api/v1/dashboard"),
    serverFetch<Settings>("/api/v1/settings"),
  ]);

  const weightUnit = settings?.weightUnit ?? "kg";
  const today = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const weekRange =
    data?.weeklyWorkoutGoal != null
      ? `${formatShortDate(data.weeklyGoalStartDate)}-${formatShortDate(data.weeklyGoalEndDate)}`
      : null;

  const hasStreak = (data?.currentStreakDays ?? 0) > 0;
  const hasWeeklyGoal = data?.weeklyWorkoutGoal != null;
  const hasCurrentWeight = data?.currentWeight != null;
  const hasTargetWeight = data?.targetWeightKg != null;

  const statItems = [
    hasStreak ? `Streak ${data?.currentStreakDays} days` : null,
    hasWeeklyGoal ? `This week ${data?.weeklyWorkoutCount}/${data?.weeklyWorkoutGoal}` : null,
    hasCurrentWeight ? `Weight ${formatWeight(data.currentWeight!, weightUnit)}` : null,
  ].filter(Boolean) as string[];

  const goalItems = [
    hasWeeklyGoal
      ? `Weekly goal ${data?.weeklyWorkoutCount}/${data?.weeklyWorkoutGoal}${
          weekRange ? ` - ${weekRange}` : ""
        }`
      : null,
    hasTargetWeight
      ? data?.currentWeightKg != null && data.weightGoalDeltaKg != null
        ? `Target ${formatWeight(data.targetWeightKg!, weightUnit)} - ${formatWeightGoalDelta(
            data.weightGoalDeltaKg,
            weightUnit
          )}`
        : `Target ${formatWeight(data.targetWeightKg!, weightUnit)}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {dayName}, {dateStr}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section className="space-y-4 border-b border-border pb-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Today
            </p>
            {data?.todayPlan ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {data.todayPlan.color ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: data.todayPlan.color }}
                    />
                  ) : null}
                  <h2 className="text-lg font-semibold">{data.todayPlan.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.todayPlan.exercises.length} exercises scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {data?.lastWorkout ? "No plan scheduled" : "Ready to log your first workout?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data?.lastWorkout
                    ? "Start a session and log sets as you go."
                    : "No plan required. Start a session and log sets as you go."}
                </p>
              </div>
            )}
          </div>

          {data?.todayPlan ? (
            <ul className="border-t border-border pt-3">
              {data.todayPlan.exercises.map((ex) => (
                <li
                  key={ex.name}
                  className="flex items-baseline justify-between gap-3 py-1.5 text-sm"
                >
                  <span className="min-w-0 flex-1">{ex.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {ex.sets}x{ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href="/workout"
            className="block rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Start workout
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        {statItems.length > 0 ? (
          <p className="text-sm text-muted-foreground">{statItems.join(" - ")}</p>
        ) : null}

        {goalItems.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
            {hasWeeklyGoal ? (
              <div className="flex items-start justify-between gap-4">
                <p>{goalItems[0]}</p>
                <Link
                  href="/settings"
                  className="shrink-0 transition-colors hover:text-foreground"
                >
                  Edit
                </Link>
              </div>
            ) : null}

            {hasTargetWeight ? (
              <div className="flex items-start justify-between gap-4">
                <p>{goalItems[hasWeeklyGoal ? 1 : 0]}</p>
                <Link
                  href="/metrics"
                  className="shrink-0 transition-colors hover:text-foreground"
                >
                  Update
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {data?.lastWorkout ? (
        <section className="space-y-3 border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Last workout</h2>
            <p className="text-xs text-muted-foreground">{data.lastWorkout.date}</p>
          </div>
          <ul className="space-y-2">
            {data.lastWorkout.exercises.map((ex) => (
              <li key={ex.name} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1">{ex.name}</span>
                <span className="shrink-0 text-right text-xs text-muted-foreground">
                  {ex.sets.join(" - ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
