import Link from "next/link";
import { serverFetch } from "@/lib/server";
import type { DashboardData } from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const metadata = { title: "Dashboard — FitTrack" };

export default async function DashboardPage() {
  const data = await serverFetch<DashboardData>("/api/v1/dashboard");

  const today = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-zinc-400 text-sm">{dayName}, {dateStr}</p>
        <h1 className="text-2xl font-bold mt-1">Dashboard</h1>
      </div>

      {/* Current Weight */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Current Weight</p>
        {data?.currentWeight != null ? (
          <p className="text-3xl font-bold">
            {data.currentWeight.toFixed(1)}{" "}
            <span className="text-lg text-zinc-400">kg</span>
          </p>
        ) : (
          <p className="text-zinc-500 text-sm mt-1">No weight logged yet</p>
        )}
        <Link
          href="/metrics"
          className="mt-3 inline-block text-xs text-indigo-400 hover:text-indigo-300"
        >
          Log weight →
        </Link>
      </div>

      {/* Today's Plan */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Today&apos;s Plan</p>
        {data?.todayPlan ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              {data.todayPlan.color && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: data.todayPlan.color }}
                />
              )}
              <h2 className="font-semibold text-lg">{data.todayPlan.name}</h2>
            </div>
            <ul className="space-y-1">
              {data.todayPlan.exercises.map((ex) => (
                <li key={ex.name} className="flex justify-between text-sm">
                  <span className="text-zinc-200">{ex.name}</span>
                  <span className="text-zinc-500">
                    {ex.sets}×{ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-zinc-500 text-sm">No plan scheduled for today</p>
        )}
        <div className="mt-4 flex gap-3">
          <Link
            href="/workout"
            className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 rounded-xl transition-colors"
          >
            Start Workout
          </Link>
          <Link
            href="/plans"
            className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium py-2 rounded-xl transition-colors"
          >
            Manage Plans
          </Link>
        </div>
      </div>

      {/* Last Workout */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Last Workout</p>
        {data?.lastWorkout ? (
          <>
            <p className="text-zinc-400 text-xs mb-3">{data.lastWorkout.date}</p>
            <ul className="space-y-2">
              {data.lastWorkout.exercises.map((ex) => (
                <li key={ex.name}>
                  <p className="text-sm font-medium text-zinc-200">{ex.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ex.sets.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-zinc-500 text-sm">No workouts logged yet</p>
        )}
      </div>
    </div>
  );
}
