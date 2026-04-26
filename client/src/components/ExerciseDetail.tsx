"use client";

import { useEffect, useState } from "react";
import type { Exercise, ProgressPoint } from "@/lib/types";
import {
  toDisplayWeight,
  toDisplayDistance,
  distanceUnit,
  formatDuration,
  formatPace,
} from "@/lib/units";

const W = 300;
const H = 80;
const PAD = { top: 8, right: 4, bottom: 8, left: 4 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function LineChart({
  values,
  dates,
  invert = false,
}: {
  values: number[];
  dates: string[];
  invert?: boolean;
}) {
  if (values.length === 0) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const norm = (v - min) / range; // 0 = min (worst pace if invert), 1 = max
    const y = invert
      ? PAD.top + norm * innerH // lower pace plots higher
      : PAD.top + (1 - norm) * innerH;
    return {
      x: PAD.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
      y,
    };
  });

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
  const [data, setData] = useState<{ id: number; points: ProgressPoint[] } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/exercises/${exercise.id}/progress`)
      .then((r) => r.json())
      .then((points: ProgressPoint[]) => {
        if (active) setData({ id: exercise.id, points });
      });
    return () => {
      active = false;
    };
  }, [exercise.id]);

  const progress = data && data.id === exercise.id ? data.points : null;
  const dates = (progress ?? []).map((p) => p.date);
  const sessionCount = progress?.length ?? 0;

  return (
    <div className="space-y-5">
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
            <span className="capitalize">{exercise.modality}</span>
            {" · "}
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
      ) : exercise.modality === "strength" ? (
        <StrengthProgress progress={progress} dates={dates} weightUnit={weightUnit} />
      ) : exercise.modality === "cardio" ? (
        <CardioProgress progress={progress} dates={dates} weightUnit={weightUnit} />
      ) : (
        <TimedProgress progress={progress} dates={dates} />
      )}
    </div>
  );
}

function StrengthProgress({
  progress,
  dates,
  weightUnit,
}: {
  progress: ProgressPoint[];
  dates: string[];
  weightUnit: string;
}) {
  const prWeight = Math.max(...progress.map((p) => p.maxWeight ?? 0));
  const prOneRm = Math.max(...progress.map((p) => p.estimatedOneRm ?? 0));
  const maxWeightValues = progress.map((p) => toDisplayWeight(p.maxWeight ?? 0, weightUnit));
  const oneRmValues = progress.map((p) => toDisplayWeight(p.estimatedOneRm ?? 0, weightUnit));
  const volumeValues = progress.map((p) => toDisplayWeight(p.totalVolume ?? 0, weightUnit));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card label="Personal Record" value={`${toDisplayWeight(prWeight, weightUnit).toFixed(1)}`} unit={weightUnit} />
        <Card label="Est. 1RM" value={`${toDisplayWeight(prOneRm, weightUnit).toFixed(1)}`} unit={weightUnit} />
      </div>
      <ChartCard title="Max Weight" subtitle={weightUnit}>
        <LineChart values={maxWeightValues} dates={dates} />
      </ChartCard>
      <ChartCard title="Est. 1RM" subtitle={weightUnit}>
        <LineChart values={oneRmValues} dates={dates} />
      </ChartCard>
      <ChartCard title="Volume" subtitle={`reps × ${weightUnit}`}>
        <LineChart values={volumeValues} dates={dates} />
      </ChartCard>
    </>
  );
}

function CardioProgress({
  progress,
  dates,
  weightUnit,
}: {
  progress: ProgressPoint[];
  dates: string[];
  weightUnit: string;
}) {
  const longest = Math.max(...progress.map((p) => p.totalDistanceMeters ?? 0));
  const paces = progress
    .map((p) => p.avgPaceSecondsPerMeter)
    .filter((x): x is number => x !== null && x > 0);
  const bestPace = paces.length ? Math.min(...paces) : null;

  const distanceValues = progress.map((p) => toDisplayDistance(p.totalDistanceMeters ?? 0, weightUnit));
  const paceValues = progress.map((p) => p.avgPaceSecondsPerMeter ?? 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card
          label="Longest"
          value={toDisplayDistance(longest, weightUnit).toFixed(2)}
          unit={distanceUnit(weightUnit)}
        />
        <Card
          label="Best Pace"
          value={bestPace !== null ? formatPace(bestPace, weightUnit).split(" ")[0] : "—"}
          unit={bestPace !== null ? `/${distanceUnit(weightUnit)}` : ""}
        />
      </div>
      <ChartCard title="Total Distance" subtitle={distanceUnit(weightUnit)}>
        <LineChart values={distanceValues} dates={dates} />
      </ChartCard>
      <ChartCard title="Average Pace" subtitle={`/${distanceUnit(weightUnit)} (lower is better)`}>
        <LineChart values={paceValues} dates={dates} invert />
      </ChartCard>
    </>
  );
}

function TimedProgress({
  progress,
  dates,
}: {
  progress: ProgressPoint[];
  dates: string[];
}) {
  const longestHold = Math.max(...progress.map((p) => p.maxDurationSeconds ?? 0));
  const maxValues = progress.map((p) => p.maxDurationSeconds ?? 0);
  const totalValues = progress.map((p) => p.totalDurationSeconds ?? 0);

  return (
    <>
      <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5">
        <p className="text-xs text-muted-foreground mb-1">Longest Hold</p>
        <p className="text-3xl font-bold">{formatDuration(longestHold)}</p>
      </div>
      <ChartCard title="Longest Hold" subtitle="per session">
        <LineChart values={maxValues} dates={dates} />
      </ChartCard>
      <ChartCard title="Total Time" subtitle="per session">
        <LineChart values={totalValues} dates={dates} />
      </ChartCard>
    </>
  );
}

function Card({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold">
        {value}{" "}
        <span className="text-base text-muted-foreground font-normal">{unit}</span>
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5 space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
