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

const W = 320;
const H = 96;
const PAD = { top: 12, right: 36, bottom: 14, left: 4 };

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Sparkline({
  values,
  invert = false,
  formatLabel,
}: {
  values: number[];
  invert?: boolean;
  formatLabel: (v: number) => string;
}) {
  if (values.length === 0) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const norm = (v - min) / range;
    const y = invert ? PAD.top + norm * innerH : PAD.top + (1 - norm) * innerH;
    return {
      x: PAD.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
      y,
    };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const lastValue = values[values.length - 1];
  const best = invert ? min : max;
  const bestY = invert ? PAD.top + innerH : PAD.top;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H, color: "var(--primary)" }}
      role="img"
      aria-label="trend chart"
    >
      {/* Best gridline */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={bestY}
        y2={bestY}
        stroke="currentColor"
        strokeOpacity={0.18}
        strokeDasharray="2 3"
        strokeWidth={1}
      />
      <text
        x={W - PAD.right + 4}
        y={bestY + 3}
        fontSize="9"
        fill="currentColor"
        fillOpacity={0.6}
      >
        {formatLabel(best)}
      </text>
      {/* Line */}
      {values.length > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Latest dot + label */}
      <circle cx={last.x} cy={last.y} r={2.75} fill="currentColor" />
      <text
        x={W - PAD.right + 4}
        y={last.y + 3}
        fontSize="11"
        fontWeight={600}
        fill="currentColor"
      >
        {formatLabel(lastValue)}
      </text>
    </svg>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground tabular-nums">{sub}</p>}
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
  const sessionCount = progress?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
          <h2 className="text-xl font-semibold truncate tracking-tight">{exercise.name}</h2>
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
        <p className="text-sm text-muted-foreground py-8">Loading…</p>
      ) : progress.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">
          Log a set to start tracking.
        </p>
      ) : exercise.modality === "strength" ? (
        <StrengthView progress={progress} weightUnit={weightUnit} />
      ) : exercise.modality === "cardio" ? (
        <CardioView progress={progress} weightUnit={weightUnit} />
      ) : (
        <TimedView progress={progress} />
      )}
    </div>
  );
}

function StrengthView({
  progress,
  weightUnit,
}: {
  progress: ProgressPoint[];
  weightUnit: string;
}) {
  const prWeight = Math.max(...progress.map((p) => p.maxWeight ?? 0));
  const prOneRm = Math.max(...progress.map((p) => p.estimatedOneRm ?? 0));
  const lastVolume = progress[progress.length - 1]?.totalVolume ?? 0;
  const oneRmValues = progress.map((p) => toDisplayWeight(p.estimatedOneRm ?? 0, weightUnit));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-x-4">
        <Kpi
          label="PR"
          value={`${toDisplayWeight(prWeight, weightUnit).toFixed(1)} ${weightUnit}`}
        />
        <Kpi
          label="Est. 1RM"
          value={`${toDisplayWeight(prOneRm, weightUnit).toFixed(1)} ${weightUnit}`}
        />
        <Kpi
          label="Last vol."
          value={`${toDisplayWeight(lastVolume, weightUnit).toFixed(0)} ${weightUnit}`}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Est. 1RM trend
        </p>
        <Sparkline
          values={oneRmValues}
          formatLabel={(v) => v.toFixed(0)}
        />
      </div>

      <RecentList>
        <RecentRow
          cols={["Date", "Top set", "Est. 1RM", "Volume"]}
          header
        />
        {[...progress].reverse().slice(0, 12).map((p) => (
          <RecentRow
            key={p.date}
            cols={[
              shortDate(p.date),
              `${toDisplayWeight(p.maxWeight ?? 0, weightUnit).toFixed(1)} ${weightUnit}`,
              `${toDisplayWeight(p.estimatedOneRm ?? 0, weightUnit).toFixed(0)}`,
              `${toDisplayWeight(p.totalVolume ?? 0, weightUnit).toFixed(0)}`,
            ]}
          />
        ))}
      </RecentList>
    </div>
  );
}

function CardioView({
  progress,
  weightUnit,
}: {
  progress: ProgressPoint[];
  weightUnit: string;
}) {
  const longest = Math.max(...progress.map((p) => p.totalDistanceMeters ?? 0));
  const paces = progress
    .map((p) => p.avgPaceSecondsPerMeter)
    .filter((x): x is number => x !== null && x > 0);
  const bestPace = paces.length ? Math.min(...paces) : null;
  const lastDist = progress[progress.length - 1]?.totalDistanceMeters ?? 0;
  const distanceValues = progress.map((p) => toDisplayDistance(p.totalDistanceMeters ?? 0, weightUnit));
  const unit = distanceUnit(weightUnit);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-x-4">
        <Kpi
          label="Longest"
          value={`${toDisplayDistance(longest, weightUnit).toFixed(2)} ${unit}`}
        />
        <Kpi
          label="Best pace"
          value={bestPace !== null ? formatPace(bestPace, weightUnit) : "—"}
        />
        <Kpi
          label="Last"
          value={`${toDisplayDistance(lastDist, weightUnit).toFixed(2)} ${unit}`}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Distance per session
        </p>
        <Sparkline
          values={distanceValues}
          formatLabel={(v) => v.toFixed(1)}
        />
      </div>

      <RecentList>
        <RecentRow cols={["Date", `Distance`, "Duration", `Pace`]} header />
        {[...progress].reverse().slice(0, 12).map((p) => (
          <RecentRow
            key={p.date}
            cols={[
              shortDate(p.date),
              `${toDisplayDistance(p.totalDistanceMeters ?? 0, weightUnit).toFixed(2)} ${unit}`,
              formatDuration(p.totalDurationSeconds ?? 0),
              p.avgPaceSecondsPerMeter ? formatPace(p.avgPaceSecondsPerMeter, weightUnit) : "—",
            ]}
          />
        ))}
      </RecentList>
    </div>
  );
}

function TimedView({ progress }: { progress: ProgressPoint[] }) {
  const longestHold = Math.max(...progress.map((p) => p.maxDurationSeconds ?? 0));
  const lastTotal = progress[progress.length - 1]?.totalDurationSeconds ?? 0;
  const maxValues = progress.map((p) => p.maxDurationSeconds ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-x-4">
        <Kpi label="Longest hold" value={formatDuration(longestHold)} />
        <Kpi label="Last session" value={formatDuration(lastTotal)} />
        <Kpi label="Sessions" value={String(progress.length)} />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Longest hold per session
        </p>
        <Sparkline values={maxValues} formatLabel={(v) => formatDuration(v)} />
      </div>

      <RecentList>
        <RecentRow cols={["Date", "Longest", "Total"]} header />
        {[...progress].reverse().slice(0, 12).map((p) => (
          <RecentRow
            key={p.date}
            cols={[
              shortDate(p.date),
              formatDuration(p.maxDurationSeconds ?? 0),
              formatDuration(p.totalDurationSeconds ?? 0),
            ]}
          />
        ))}
      </RecentList>
    </div>
  );
}

function RecentList({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Recent sessions
      </p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function RecentRow({ cols, header = false }: { cols: string[]; header?: boolean }) {
  const styles = header
    ? "text-[10px] uppercase tracking-wider text-muted-foreground py-1"
    : "text-sm text-foreground tabular-nums py-1.5";
  const cls = `grid gap-2 ${styles}`;
  const gridCols = cols.length === 4 ? "grid-cols-[3.5rem_1fr_1fr_1fr]" : "grid-cols-[3.5rem_1fr_1fr]";
  return (
    <div className={`${cls} ${gridCols}`}>
      {cols.map((c, i) => (
        <span key={i} className={i === 0 ? "" : "text-right"}>
          {c}
        </span>
      ))}
    </div>
  );
}
