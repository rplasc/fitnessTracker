"use client";

import { useEffect, useState } from "react";
import type { Exercise, ProgressPoint } from "@/lib/types";
import { toDisplayWeight } from "@/lib/units";

const W = 300;
const H = 80;
const PAD = { top: 8, right: 4, bottom: 8, left: 4 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function LineChart({ values, dates }: { values: number[]; dates: string[] }) {
  if (values.length === 0) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => ({
    x: PAD.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: PAD.top + (1 - (v - min) / range) * innerH,
  }));

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PAD.top + innerH}`,
    `${pts[0].x},${PAD.top + innerH}`,
  ].join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H, color: "var(--primary)" }}>
        <defs>
          <linearGradient id="exDetailFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} stopOpacity="0.25" />
            <stop offset="100%" style={{ stopColor: "var(--primary)" }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {values.length > 1 && <polygon points={areaPoints} fill="url(#exDetailFade)" />}
        {values.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={values.length === 1 ? 4 : 2.5}
            fill="currentColor"
          />
        ))}
      </svg>
      {dates.length >= 2 && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
          <span>{formatDate(dates[0])}</span>
          <span>{formatDate(dates[dates.length - 1])}</span>
        </div>
      )}
    </div>
  );
}

export default function ExerciseDetail({
  exercise,
  weightUnit,
  onBack,
}: {
  exercise: Exercise;
  weightUnit: string;
  onBack: () => void;
}) {
  const [progress, setProgress] = useState<ProgressPoint[] | null>(null);

  useEffect(() => {
    setProgress(null);
    fetch(`/api/v1/exercises/${exercise.id}/progress`)
      .then((r) => r.json())
      .then(setProgress);
  }, [exercise.id]);

  const prWeight =
    progress && progress.length > 0
      ? Math.max(...progress.map((p) => p.maxWeight))
      : null;

  const dates = (progress ?? []).map((p) => p.date);
  const maxWeightValues = (progress ?? []).map((p) =>
    toDisplayWeight(p.maxWeight, weightUnit)
  );
  const volumeValues = (progress ?? []).map((p) =>
    toDisplayWeight(p.totalVolume, weightUnit)
  );
  const sessionCount = progress?.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Back to exercises"
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
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{exercise.name}</h2>
          <p className="text-xs text-muted-foreground">
            {exercise.category}
            {progress !== null && (
              <>
                {" · "}
                {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
              </>
            )}
          </p>
        </div>
      </div>

      {progress === null ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : progress.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 ring-1 ring-foreground/5 text-center">
          <p className="text-muted-foreground text-sm">No sets logged yet for this exercise.</p>
        </div>
      ) : (
        <>
          {/* Personal record */}
          <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5">
            <p className="text-xs text-muted-foreground mb-1">Personal Record</p>
            <p className="text-4xl font-bold">
              {toDisplayWeight(prWeight!, weightUnit).toFixed(1)}{" "}
              <span className="text-xl text-muted-foreground font-normal">{weightUnit}</span>
            </p>
          </div>

          {/* Max weight chart */}
          <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Max Weight</p>
              <p className="text-xs text-muted-foreground">{weightUnit}</p>
            </div>
            <LineChart values={maxWeightValues} dates={dates} />
          </div>

          {/* Volume chart */}
          <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Volume</p>
              <p className="text-xs text-muted-foreground">reps × {weightUnit}</p>
            </div>
            <LineChart values={volumeValues} dates={dates} />
          </div>
        </>
      )}
    </div>
  );
}
