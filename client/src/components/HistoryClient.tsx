"use client";

import Link from "next/link";
import type { WorkoutSession } from "@/lib/types";

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "In progress";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function weekLabel(d: Date, now: Date): string {
  const thisWeek = startOfWeek(now).getTime();
  const target = startOfWeek(d).getTime();
  if (target === thisWeek) return "This week";
  if (target === thisWeek - 7 * 86400000) return "Last week";
  const end = new Date(target + 6 * 86400000);
  const fmt = (x: Date) =>
    x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(new Date(target))} – ${fmt(end)}`;
}

export default function HistoryClient({
  initialSessions,
}: {
  initialSessions: WorkoutSession[];
}) {
  if (initialSessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        No workouts logged yet. Start one from the Workout tab.
      </p>
    );
  }

  const now = new Date();
  const groups: { label: string; sessions: WorkoutSession[] }[] = [];
  for (const s of initialSessions) {
    const label = weekLabel(new Date(s.startedAt), now);
    const existing = groups[groups.length - 1];
    if (existing && existing.label === label) existing.sessions.push(s);
    else groups.push({ label, sessions: [s] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            {g.label}
          </p>
          <div className="divide-y divide-border border-y border-border">
            {g.sessions.map((s) => {
              const date = new Date(s.startedAt);
              return (
                <Link
                  key={s.id}
                  href={`/history/${s.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-muted/30 transition-colors -mx-1 px-1"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {date.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {formatDuration(s.startedAt, s.finishedAt)}
                      {" · "}
                      {s.setCount} {s.setCount === 1 ? "set" : "sets"}
                    </p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-muted-foreground shrink-0"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
