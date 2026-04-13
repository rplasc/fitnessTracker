"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
import type {
  PlanSummary,
  PlanDetail,
  Exercise,
  ScheduleEntry,
} from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

export default function PlansClient({
  initialPlans,
  initialSchedule,
  exercises,
}: {
  initialPlans: PlanSummary[];
  initialSchedule: ScheduleEntry[];
  exercises: Exercise[];
}) {
  const [plans, setPlans] = useState<PlanSummary[]>(initialPlans);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
  const [activePlan, setActivePlan] = useState<PlanDetail | null>(null);
  const [view, setView] = useState<"list" | "detail" | "schedule">("list");

  // Create plan form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Add exercise to plan
  const [addExId, setAddExId] = useState("");
  const [addSets, setAddSets] = useState("3");
  const [addReps, setAddReps] = useState("10");
  const [addingEx, setAddingEx] = useState(false);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc || null, color: newColor }),
      });
      if (!res.ok) return;
      const created: PlanDetail = await res.json();
      setPlans((p) => [...p, { id: created.id, name: created.name, description: created.description, color: created.color }]);
      setNewName(""); setNewDesc(""); setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  async function openPlan(id: number) {
    const res = await fetch(`/api/v1/plans/${id}`);
    if (!res.ok) return;
    const detail: PlanDetail = await res.json();
    setActivePlan(detail);
    setView("detail");
  }

  async function deletePlan(id: number) {
    if (!confirm("Delete this plan?")) return;
    const res = await fetch(`/api/v1/plans/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setPlans((p) => p.filter((x) => x.id !== id));
    if (activePlan?.id === id) { setActivePlan(null); setView("list"); }
  }

  async function addExerciseToPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlan || !addExId) return;
    setAddingEx(true);
    try {
      const res = await fetch(`/api/v1/plans/${activePlan.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: parseInt(addExId),
          sets: parseInt(addSets),
          reps: parseInt(addReps),
          targetWeight: null,
        }),
      });
      if (!res.ok) return;
      const pe = await res.json();
      const ex = exercises.find((x) => x.id === parseInt(addExId));
      if (!ex) return;
      setActivePlan((p) =>
        p ? { ...p, exercises: [...p.exercises, { ...pe, exerciseName: ex.name }] } : p
      );
      setAddExId("");
    } finally {
      setAddingEx(false);
    }
  }

  async function removePlanExercise(planExId: number) {
    if (!activePlan) return;
    const res = await fetch(`/api/v1/plans/${activePlan.id}/exercises/${planExId}`, { method: "DELETE" });
    if (!res.ok) return;
    setActivePlan((p) =>
      p ? { ...p, exercises: p.exercises.filter((x) => x.id !== planExId) } : p
    );
  }

  async function setScheduleDay(dayOfWeek: number, planId: number | null) {
    const res = await fetch(`/api/v1/schedule/${dayOfWeek}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    if (!res.ok) return;
    const updated: ScheduleEntry = await res.json();
    setSchedule((s) => s.map((e) => (e.dayOfWeek === dayOfWeek ? updated : e)));
  }

  // ── Views ──

  if (view === "detail" && activePlan) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("list")}
            className="gap-1"
          >
            <BackIcon />
            Back
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {activePlan.color && (
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activePlan.color }} />
            )}
            <h2 className="font-bold text-lg">{activePlan.name}</h2>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deletePlan(activePlan.id)}
          >
            Delete
          </Button>
        </div>

        {activePlan.description && (
          <p className="text-muted-foreground text-sm">{activePlan.description}</p>
        )}

        {/* Exercises */}
        <div className="bg-card rounded-2xl divide-y divide-border">
          {activePlan.exercises.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">No exercises yet</p>
          )}
          {activePlan.exercises.map((pe) => (
            <div key={pe.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{pe.exerciseName}</p>
                <p className="text-xs text-muted-foreground">{pe.sets} sets × {pe.reps} reps</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removePlanExercise(pe.id)}
                aria-label="Remove exercise"
              >
                <CloseIcon />
              </Button>
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Add Exercise</h3>
            <select
              value={addExId}
              onChange={(e) => setAddExId(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Select exercise…</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
              ))}
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1">Sets</Label>
                <Input type="number" min={1} value={addSets} onChange={(e) => setAddSets(e.target.value)} className="text-center" />
              </div>
              <div className="flex-1">
                <Label className="mb-1">Reps</Label>
                <Input type="number" min={1} value={addReps} onChange={(e) => setAddReps(e.target.value)} className="text-center" />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={addingEx}
              onClick={(e) => addExerciseToPlan(e as unknown as React.FormEvent)}
            >
              {addingEx ? "Adding…" : "Add to Plan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "schedule") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")} className="gap-1">
            <BackIcon />
            Back
          </Button>
          <h2 className="font-bold text-lg">Weekly Schedule</h2>
        </div>
        <div className="bg-card rounded-2xl divide-y divide-border">
          {schedule.map((entry) => (
            <div key={entry.dayOfWeek} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium w-8 text-foreground">
                {DAY_NAMES[entry.dayOfWeek]}
              </span>
              <select
                value={entry.planId ?? ""}
                onChange={(e) =>
                  setScheduleDay(entry.dayOfWeek, e.target.value ? parseInt(e.target.value) : null)
                }
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Rest day —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: list view
  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setView("schedule")}
        >
          Weekly Schedule
        </Button>
        <Button
          className="flex-1"
          onClick={() => setShowCreate(true)}
        >
          + New Plan
        </Button>
      </div>

      {/* Create plan form */}
      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">New Plan</h3>
            <div>
              <Label htmlFor="plan-name" className="mb-1">Name</Label>
              <Input
                id="plan-name"
                type="text"
                placeholder="Plan name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="plan-desc" className="mb-1">Description (optional)</Label>
              <Input
                id="plan-desc"
                type="text"
                placeholder="Description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c} type="button" onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={creating}
                onClick={(e) => createPlan(e as unknown as React.FormEvent)}
              >
                {creating ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      {plans.length === 0 ? (
        <div className="py-10 text-center space-y-1.5">
          <p className="text-sm font-medium text-foreground">No plans yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Plans let you pre-define exercises, sets, and reps — then assign them to days of the week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => openPlan(plan.id)}
              className="w-full bg-card border border-border hover:border-muted-foreground rounded-2xl p-4 text-left transition-colors flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-xl shrink-0"
                style={{ backgroundColor: plan.color ?? "#6366f1" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{plan.name}</p>
                {plan.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{plan.description}</p>
                )}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted-foreground">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
