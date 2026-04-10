"use client";

import { useState } from "react";
import type { Metric } from "@/lib/types";

export default function MetricsClient({
  initialMetrics,
}: {
  initialMetrics: Metric[];
}) {
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function logWeight(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/v1/metrics/${today}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyWeight: parseFloat(weight) }),
      });
      if (!res.ok) {
        setError("Failed to save weight.");
        return;
      }
      const updated: Metric = await res.json();
      setMetrics((prev) => {
        const idx = prev.findIndex((m) => m.date === updated.date);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
      setWeight("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMetric(id: number) {
    const res = await fetch(`/api/v1/metrics/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }

  const latest = metrics[0];

  return (
    <div className="space-y-5">
      {/* Current weight card */}
      {latest && (
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Current Weight</p>
          <p className="text-4xl font-bold">
            {latest.bodyWeight.toFixed(1)}{" "}
            <span className="text-xl text-zinc-400">kg</span>
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Logged {new Date(latest.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Log weight form */}
      <form
        onSubmit={logWeight}
        className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3"
      >
        <h3 className="font-semibold text-sm text-zinc-300">Log Today&apos;s Weight</h3>
        <div className="flex gap-3">
          <input
            type="number"
            step={0.1}
            min={1}
            max={500}
            placeholder="e.g. 75.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-5 rounded-xl transition-colors"
          >
            {saving ? "…" : "Log"}
          </button>
        </div>
        <p className="text-zinc-500 text-xs">Weight in kilograms. Updates today&apos;s entry if already logged.</p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </form>

      {/* Mini trend */}
      {metrics.length >= 2 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Trend (last 7)</p>
          <div className="flex items-end gap-1 h-16">
            {metrics
              .slice(0, 7)
              .reverse()
              .map((m, i, arr) => {
                const min = Math.min(...arr.map((x) => x.bodyWeight));
                const max = Math.max(...arr.map((x) => x.bodyWeight));
                const range = max - min || 1;
                const pct = ((m.bodyWeight - min) / range) * 80 + 20;
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-600 rounded-t-sm"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>{metrics.length >= 7 ? new Date(metrics[6].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
            <span>{new Date(metrics[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          History
        </h3>
        {metrics.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">No weight entries yet</p>
        ) : (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
            {metrics.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {m.bodyWeight.toFixed(1)} kg
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(m.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteMetric(m.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
