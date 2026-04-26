"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionDetail, WorkoutSet } from "@/lib/types";
import {
  toDisplayWeight,
  toDisplayDistance,
  distanceUnit,
  formatDuration,
} from "@/lib/units";

function formatSetSummary(s: WorkoutSet, weightUnit: string): string {
  if (s.exerciseModality === "strength") {
    const w = s.weight !== null ? toDisplayWeight(s.weight, weightUnit).toFixed(1) : "0";
    return `${s.reps ?? 0} × ${w} ${weightUnit}`;
  }
  if (s.exerciseModality === "cardio") {
    const dist = s.distanceMeters !== null
      ? toDisplayDistance(s.distanceMeters, weightUnit).toFixed(2)
      : "0";
    const dur = formatDuration(s.durationSeconds ?? 0);
    return `${dist} ${distanceUnit(weightUnit)} · ${dur}`;
  }
  return formatDuration(s.durationSeconds ?? 0);
}

function formatSessionDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "In progress";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function SessionDetailClient({
  session,
  weightUnit,
}: {
  session: SessionDetail;
  weightUnit: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${session.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/history");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const byExercise = session.sets.reduce<Record<string, WorkoutSet[]>>(
    (acc, s) => {
      if (!acc[s.exerciseName]) acc[s.exerciseName] = [];
      acc[s.exerciseName].push(s);
      return acc;
    },
    {}
  );

  const started = new Date(session.startedAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/history"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Back to history"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">
            {started.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h1>
          <p className="text-xs text-muted-foreground">
            {started.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            {" · "}
            {formatSessionDuration(session.startedAt, session.finishedAt)}
            {" · "}
            {session.sets.length} {session.sets.length === 1 ? "set" : "sets"}
          </p>
        </div>
      </div>

      {session.sets.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 ring-1 ring-foreground/5 text-center">
          <p className="text-sm text-muted-foreground">No sets logged.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byExercise).map(([name, sets]) => (
            <div key={name} className="bg-card rounded-2xl ring-1 ring-foreground/5 overflow-hidden">
              <p className="text-sm font-medium px-4 pt-3 pb-2">{name}</p>
              <div className="divide-y divide-border">
                {sets.map((s) => (
                  <div key={s.id} className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground w-16 flex items-center gap-1">
                        <span>Set {s.setNumber}</span>
                        {s.isWarmup && (
                          <span className="text-[9px] font-semibold px-1 rounded bg-muted text-muted-foreground">
                            W
                          </span>
                        )}
                      </span>
                      <span className="text-sm tabular-nums flex-1 text-center">
                        {formatSetSummary(s, weightUnit)}
                        {s.rpe !== null && (
                          <span className="ml-2 text-xs text-muted-foreground">@{s.rpe}</span>
                        )}
                      </span>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground pl-16 pr-2 mt-0.5">
                        {s.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        {confirming ? (
          <div className="bg-card rounded-2xl p-4 ring-1 ring-destructive/30 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Delete this session?</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
          >
            Delete session
          </button>
        )}
      </div>
    </div>
  );
}
