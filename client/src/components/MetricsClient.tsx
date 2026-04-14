"use client";

import { useState } from "react";
import type { Metric } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toDisplayWeight, toKg, toDisplayHeight, toCm, formatWeight, formatHeight, weightStep, weightPlaceholder } from "@/lib/units";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function MetricsClient({
  initialMetrics,
  initialWeightUnit,
  initialHeightUnit,
  initialHeightCm,
}: {
  initialMetrics: Metric[];
  initialWeightUnit: string;
  initialHeightUnit: string;
  initialHeightCm: number | null;
}) {
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
  const [weightUnit] = useState(initialWeightUnit);
  const [heightUnit] = useState(initialHeightUnit);
  const [heightCm, setHeightCm] = useState<number | null>(initialHeightCm);
  const [weight, setWeight] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [editingHeight, setEditingHeight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function patchSettings(patch: Record<string, unknown>) {
    await fetch("/api/v1/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function logWeight(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weightKg = toKg(parseFloat(weight), weightUnit);
    try {
      const res = await fetch(`/api/v1/metrics/${today}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyWeight: weightKg }),
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

  async function saveHeight(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(heightInput);
    if (isNaN(val) || val <= 0) return;
    const cm = toCm(val, heightUnit);
    await patchSettings({ heightCm: cm });
    setHeightCm(cm);
    setHeightInput("");
    setEditingHeight(false);
  }

  async function deleteMetric(id: number) {
    const res = await fetch(`/api/v1/metrics/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }

  const latest = metrics[0];

  return (
    <div className="space-y-5">
      {/* Current weight */}
      {latest && (
        <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5">
          <p className="text-xs text-muted-foreground mb-1">Current weight</p>
          <p className="text-4xl font-bold">
            {toDisplayWeight(latest.bodyWeight, weightUnit).toFixed(1)}{" "}
            <span className="text-xl text-muted-foreground font-normal">{weightUnit}</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Logged{" "}
            {new Date(latest.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Height */}
      <div className="bg-card rounded-2xl p-5 ring-1 ring-foreground/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Height</p>
            {heightCm != null ? (
              <p className="text-lg font-semibold">{formatHeight(heightCm, heightUnit)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not set</p>
            )}
          </div>
          <button
            onClick={() => {
              setEditingHeight((v) => !v);
              if (heightCm != null) {
                setHeightInput(toDisplayHeight(heightCm, heightUnit).toFixed(1));
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {editingHeight ? "Cancel" : heightCm != null ? "Edit" : "Set height"}
          </button>
        </div>
        {editingHeight && (
          <form onSubmit={saveHeight} className="flex gap-2 mt-3">
            <Input
              type="number"
              min={50}
              max={300}
              step={0.1}
              placeholder={heightUnit === "in" ? "e.g. 70" : "e.g. 175"}
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm">Save</Button>
          </form>
        )}
      </div>

      {/* Log weight form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium text-sm text-foreground">Log today&apos;s weight</h3>
          <form onSubmit={logWeight} className="flex gap-3">
            <Input
              type="number"
              step={weightStep(weightUnit)}
              min={1}
              max={weightUnit === "lb" ? 1100 : 500}
              placeholder={weightPlaceholder(weightUnit)}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? "…" : "Log"}
            </Button>
          </form>
          <p className="text-muted-foreground text-xs">
            Weight in {weightUnit}. Updates today&apos;s entry if already logged.
          </p>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">History</h3>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No weight entries yet</p>
        ) : (
          <div className="bg-card rounded-2xl divide-y divide-border">
            {metrics.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatWeight(m.bodyWeight, weightUnit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMetric(m.id)}
                  aria-label="Delete entry"
                >
                  <CloseIcon />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
