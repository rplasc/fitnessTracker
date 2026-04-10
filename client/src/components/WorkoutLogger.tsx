"use client";

import { useState, useEffect, useCallback } from "react";
import type { Exercise, WorkoutSet, WorkoutSession } from "@/lib/types";

interface ActiveSession {
  id: number;
  startedAt: string;
  sets: WorkoutSet[];
}

export default function WorkoutLogger({
  initialExercises,
}: {
  initialExercises: Exercise[];
}) {
  const [exercises] = useState<Exercise[]>(initialExercises);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [addingSet, setAddingSet] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Find any unfinished session on mount
  useEffect(() => {
    async function findActive() {
      try {
        const res = await fetch("/api/v1/workouts/sessions");
        if (!res.ok) return;
        const sessions: WorkoutSession[] = await res.json();
        const active = sessions.find((s) => !s.finishedAt);
        if (active) {
          const detailRes = await fetch(`/api/v1/workouts/sessions/${active.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setSession({ id: detail.id, startedAt: detail.startedAt, sets: detail.sets });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    findActive();
  }, []);

  async function startSession() {
    const res = await fetch("/api/v1/workouts/sessions", { method: "POST" });
    if (!res.ok) return;
    const data: { sessionId: number } = await res.json();
    setSession({ id: data.sessionId, startedAt: new Date().toISOString(), sets: [] });
  }

  async function addSet() {
    if (!session || !selectedExercise) return;
    setAddingSet(true);
    try {
      const res = await fetch("/api/v1/workouts/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          exerciseId: selectedExercise.id,
          reps: parseInt(reps),
          weight: parseFloat(weight),
        }),
      });
      if (!res.ok) return;
      const newSet: { id: number; setNumber: number } = await res.json();
      setSession((s) =>
        s
          ? {
              ...s,
              sets: [
                ...s.sets,
                {
                  id: newSet.id,
                  exerciseId: selectedExercise.id,
                  exerciseName: selectedExercise.name,
                  reps: parseInt(reps),
                  weight: parseFloat(weight),
                  setNumber: newSet.setNumber,
                },
              ],
            }
          : s
      );
    } finally {
      setAddingSet(false);
    }
  }

  const deleteSet = useCallback(async (setId: number) => {
    const res = await fetch(`/api/v1/workouts/sets/${setId}`, { method: "DELETE" });
    if (!res.ok) return;
    setSession((s) =>
      s ? { ...s, sets: s.sets.filter((ws) => ws.id !== setId) } : s
    );
  }, []);

  async function finishSession() {
    if (!session) return;
    setFinishing(true);
    try {
      await fetch(`/api/v1/workouts/sessions/${session.id}/finish`, { method: "POST" });
      setSession(null);
      setSelectedExercise(null);
    } finally {
      setFinishing(false);
    }
  }

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase())
      )
    : exercises;

  // Group sets by exercise for display
  const setsByExercise = session?.sets.reduce<Record<string, WorkoutSet[]>>(
    (acc, s) => {
      if (!acc[s.exerciseName]) acc[s.exerciseName] = [];
      acc[s.exerciseName].push(s);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-zinc-400">
            <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Ready to train?</h2>
          <p className="text-zinc-400 text-sm mt-1">Start a new workout session</p>
        </div>
        <button
          onClick={startSession}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Start Workout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Session header */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-widest">Active Session</p>
          <p className="text-sm font-medium mt-0.5">
            {new Date(session.startedAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={finishSession}
          disabled={finishing}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {finishing ? "Finishing…" : "Finish"}
        </button>
      </div>

      {/* Exercise picker */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
        <h3 className="font-semibold text-sm text-zinc-300">Log a Set</h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search exercise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Exercise list */}
        {!selectedExercise && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  setSelectedExercise(ex);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors flex justify-between"
              >
                <span className="text-zinc-200">{ex.name}</span>
                <span className="text-zinc-500 text-xs">{ex.category}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-2">No exercises found</p>
            )}
          </div>
        )}

        {selectedExercise && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-medium text-indigo-300">{selectedExercise.name}</p>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                change
              </button>
            </div>

            {/* Reps + Weight inputs */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-1 block">Reps</label>
                <input
                  type="number"
                  min={1}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-semibold"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-400 mb-1 block">Weight (kg)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-semibold"
                />
              </div>
            </div>

            <button
              onClick={addSet}
              disabled={addingSet}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {addingSet ? "Logging…" : "Add Set"}
            </button>
          </>
        )}
      </div>

      {/* Logged sets */}
      {setsByExercise && Object.keys(setsByExercise).length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-sm text-zinc-300">
            Logged Sets ({session.sets.length})
          </h3>
          {Object.entries(setsByExercise).map(([name, sets]) => (
            <div key={name}>
              <p className="text-sm font-medium text-zinc-200 mb-2">{name}</p>
              <div className="space-y-1">
                {sets.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-zinc-400">Set {s.setNumber}</span>
                    <span className="text-sm font-mono">
                      {s.reps} × {s.weight} kg
                    </span>
                    <button
                      onClick={() => deleteSet(s.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
