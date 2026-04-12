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
    <div className="space-y-5">
      {/* Header — compact */}
      <div>
        <p className="text-zinc-500 text-xs">{dayName}, {dateStr}</p>
        <h1 className="text-xl font-semibold mt-0.5">Dashboard</h1>
      </div>

      {/* Today's Plan + Start Workout — dominant primary card */}
      <div className="bg-zinc-900 rounded-2xl p-5">
        {data?.todayPlan ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              {data.todayPlan.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: data.todayPlan.color }}
                />
              )}
              <p className="text-xs text-zinc-500">Today&apos;s plan</p>
            </div>
            <h2 className="text-xl font-bold mb-3">{data.todayPlan.name}</h2>
            <ul className="space-y-1 mb-4">
              {data.todayPlan.exercises.map((ex) => (
                <li key={ex.name} className="flex justify-between text-sm">
                  <span className="text-zinc-300">{ex.name}</span>
                  <span className="text-zinc-500">{ex.sets}×{ex.reps}</span>
                </li>
              ))}
            </ul>
          </>
        ) : !data?.lastWorkout ? (
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-200 mb-0.5">Ready to log your first workout?</p>
            <p className="text-xs text-zinc-500">No plan needed — start a session and log sets as you go.</p>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm mb-4">No plan scheduled for today</p>
        )}
        <Link
          href="/workout"
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Start Workout
        </Link>
      </div>

      {/* Current weight — compact inline row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Current weight</p>
          {data?.currentWeight != null ? (
            <p className="text-lg font-semibold">
              {data.currentWeight.toFixed(1)}{" "}
              <span className="text-sm text-zinc-400 font-normal">kg</span>
            </p>
          ) : (
            <p className="text-sm text-zinc-600">Not logged</p>
          )}
        </div>
        <Link
          href="/metrics"
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Log weight
        </Link>
      </div>

      {/* Last Workout — secondary, only shown when it exists */}
      {data?.lastWorkout && (
        <div className="bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm font-medium">Last workout</p>
            <p className="text-xs text-zinc-500">{data.lastWorkout.date}</p>
          </div>
          <ul className="space-y-2">
            {data.lastWorkout.exercises.map((ex) => (
              <li key={ex.name}>
                <p className="text-sm text-zinc-300">{ex.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{ex.sets.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
