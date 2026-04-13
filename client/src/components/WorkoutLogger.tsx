"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
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
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-semibold mb-1">No active session</h2>
        <p className="text-muted-foreground text-sm mb-6">Start a session to begin logging sets</p>
        <Button onClick={startSession} size="lg">
          Start Workout
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Session header */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Active session</p>
            <p className="text-sm font-medium mt-0.5">
              {new Date(session.startedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Button
            onClick={finishSession}
            disabled={finishing}
            variant="secondary"
          >
            {finishing ? "Finishing…" : "Finish"}
          </Button>
        </CardContent>
      </Card>

      {/* Exercise picker */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Log a Set</h3>

          {/* Search */}
          <Input
            type="text"
            placeholder="Search exercise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex justify-between"
                >
                  <span className="text-foreground">{ex.name}</span>
                  <span className="text-muted-foreground text-xs">{ex.category}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-2">No exercises found</p>
              )}
            </div>
          )}

          {selectedExercise && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-medium text-primary">{selectedExercise.name}</p>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Reps + Weight inputs */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
                  <Input
                    type="number"
                    min={1}
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="text-center text-lg font-semibold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="text-center text-lg font-semibold"
                  />
                </div>
              </div>

              <Button
                onClick={addSet}
                disabled={addingSet}
                className="w-full"
              >
                {addingSet ? "Logging…" : "Add Set"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logged sets */}
      {setsByExercise && Object.keys(setsByExercise).length > 0 && (
        <div className="bg-card rounded-2xl p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Logged Sets ({session.sets.length})
          </h3>
          {Object.entries(setsByExercise).map(([name, sets]) => (
            <div key={name}>
              <p className="text-sm font-medium text-foreground mb-2">{name}</p>
              <div className="space-y-1">
                {sets.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">Set {s.setNumber}</span>
                    <span className="text-sm tabular-nums">
                      {s.reps} × {s.weight} kg
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteSet(s.id)}
                      aria-label="Delete set"
                    >
                      <CloseIcon />
                    </Button>
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
