"use client";

import { useState } from "react";

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
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >
            <BackIcon />
            Back
          </button>
          <div className="flex items-center gap-2 flex-1">
            {activePlan.color && (
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activePlan.color }} />
            )}
            <h2 className="font-bold text-lg">{activePlan.name}</h2>
          </div>
          <button
            onClick={() => deletePlan(activePlan.id)}
            className="text-red-500 hover:text-red-400 text-xs"
          >
            Delete
          </button>
        </div>

        {activePlan.description && (
          <p className="text-zinc-400 text-sm">{activePlan.description}</p>
        )}

        {/* Exercises */}
        <div className="bg-zinc-900 rounded-2xl divide-y divide-zinc-800">
          {activePlan.exercises.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-6">No exercises yet</p>
          )}
          {activePlan.exercises.map((pe) => (
            <div key={pe.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{pe.exerciseName}</p>
                <p className="text-xs text-zinc-500">{pe.sets} sets × {pe.reps} reps</p>
              </div>
              <button
                onClick={() => removePlanExercise(pe.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                aria-label="Remove exercise"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <form onSubmit={addExerciseToPlan} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Add Exercise</h3>
          <select
            value={addExId}
            onChange={(e) => setAddExId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select exercise…</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
            ))}
          </select>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Sets</label>
              <input type="number" min={1} value={addSets} onChange={(e) => setAddSets(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Reps</label>
              <input type="number" min={1} value={addReps} onChange={(e) => setAddReps(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button type="submit" disabled={addingEx}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {addingEx ? "Adding…" : "Add to Plan"}
          </button>
        </form>
      </div>
    );
  }

  if (view === "schedule") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
            <BackIcon />
            Back
          </button>
          <h2 className="font-bold text-lg">Weekly Schedule</h2>
        </div>
        <div className="bg-zinc-900 rounded-2xl divide-y divide-zinc-800">
          {schedule.map((entry) => (
            <div key={entry.dayOfWeek} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium w-8 text-zinc-300">
                {DAY_NAMES[entry.dayOfWeek]}
              </span>
              <select
                value={entry.planId ?? ""}
                onChange={(e) =>
                  setScheduleDay(entry.dayOfWeek, e.target.value ? parseInt(e.target.value) : null)
                }
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <button
          onClick={() => setView("schedule")}
          className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-indigo-600 text-zinc-300 hover:text-indigo-300 text-sm py-2.5 rounded-xl transition-colors"
        >
          Weekly Schedule
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          + New Plan
        </button>
      </div>

      {/* Create plan form */}
      {showCreate && (
        <form onSubmit={createPlan} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
          <h3 className="font-semibold text-sm text-zinc-300">New Plan</h3>
          <input
            type="text" placeholder="Plan name" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text" placeholder="Description (optional)" value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div>
            <p className="text-xs text-zinc-400 mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm py-2 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Plan cards */}
      {plans.length === 0 ? (
        <div className="py-10 text-center space-y-1.5">
          <p className="text-sm font-medium text-zinc-300">No plans yet</p>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Plans let you pre-define exercises, sets, and reps — then assign them to days of the week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => openPlan(plan.id)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 text-left transition-colors flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-xl shrink-0"
                style={{ backgroundColor: plan.color ?? "#6366f1" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100 truncate">{plan.name}</p>
                {plan.description && (
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{plan.description}</p>
                )}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-zinc-600">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
