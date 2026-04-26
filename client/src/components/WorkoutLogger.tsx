"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import PrBanner from "@/components/PrBanner";
import RestTimer, { startRestTimer } from "@/components/RestTimer";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
import type {
  Exercise,
  WorkoutSet,
  WorkoutSession,
  AddSetResponse,
  Modality,
} from "@/lib/types";
import {
  toDisplayWeight,
  toKg,
  toDisplayDistance,
  toMeters,
  distanceUnit,
  formatDuration,
  formatPace,
  parseDuration,
} from "@/lib/units";

interface ActiveSession {
  id: number;
  startedAt: string;
  sets: WorkoutSet[];
}

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

export default function WorkoutLogger({
  initialExercises,
  weightUnit = "kg",
  restSeconds,
}: {
  initialExercises: Exercise[];
  weightUnit?: string;
  restSeconds: number;
}) {
  const [exercises] = useState<Exercise[]>(initialExercises);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [isWarmup, setIsWarmup] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [addingSet, setAddingSet] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [prMessage, setPrMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const repsId = useId();
  const weightId = useId();
  const durationId = useId();
  const distanceId = useId();
  const notesId = useId();

  useEffect(() => {
    async function findActive() {
      try {
        const res = await fetch("/api/v1/workouts/sessions");
        if (!res.ok) {
          setSessionError("Could not load your active workout.");
          return;
        }
        const sessions: WorkoutSession[] = await res.json();
        const active = sessions.find((s) => !s.finishedAt);
        if (active) {
          const detailRes = await fetch(`/api/v1/workouts/sessions/${active.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setSession({ id: detail.id, startedAt: detail.startedAt, sets: detail.sets });
          } else {
            setSessionError("Could not load your active workout.");
          }
        }
      } catch {
        setSessionError("Could not load your active workout.");
      } finally {
        setLoading(false);
      }
    }
    findActive();
  }, []);

  function pickExercise(ex: Exercise) {
    setSelectedExercise(ex);
    setSearch("");
    setFormError(null);
    setIsWarmup(false);
    setRpe(null);
    setNotes("");
    setMoreOpen(false);
    if (ex.modality === "cardio") {
      setDuration("20:00");
      setDistance("5");
    } else if (ex.modality === "timed") {
      setDuration("0:30");
      setDistance("");
    } else {
      setReps("10");
      setWeight("0");
      setDuration("");
      setDistance("");
    }
  }

  async function startSession() {
    setSessionError(null);
    const res = await fetch("/api/v1/workouts/sessions", { method: "POST" });
    if (!res.ok) {
      setSessionError("Could not start a workout.");
      return;
    }
    const data: { sessionId: number } = await res.json();
    setSession({ id: data.sessionId, startedAt: new Date().toISOString(), sets: [] });
  }

  async function addSet() {
    if (!session || !selectedExercise) return;
    setFormError(null);
    setAddingSet(true);
    try {
      const modality: Modality = selectedExercise.modality;
      const trimmedNotes = notes.trim();

      let payload: Record<string, unknown> = {
        sessionId: session.id,
        exerciseId: selectedExercise.id,
        rpe,
        notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        isWarmup,
        reps: null,
        weight: null,
        durationSeconds: null,
        distanceMeters: null,
      };

      let weightKg: number | null = null;
      let repsNum: number | null = null;
      let durationSec: number | null = null;
      let distanceM: number | null = null;

      if (modality === "strength") {
        weightKg = toKg(parseFloat(weight) || 0, weightUnit);
        repsNum = parseInt(reps);
        if (!Number.isFinite(repsNum) || repsNum <= 0) {
          setFormError("Enter at least 1 rep.");
          return;
        }
        payload = { ...payload, reps: repsNum, weight: weightKg };
      } else if (modality === "cardio") {
        durationSec = parseDuration(duration);
        const distNum = parseFloat(distance);
        if (durationSec === null || durationSec <= 0) {
          setFormError("Enter a valid duration like 20:00.");
          return;
        }
        if (!Number.isFinite(distNum) || distNum <= 0) {
          setFormError(`Enter a valid distance in ${distanceUnit(weightUnit)}.`);
          return;
        }
        distanceM = toMeters(distNum, weightUnit);
        payload = { ...payload, durationSeconds: durationSec, distanceMeters: distanceM };
      } else {
        durationSec = parseDuration(duration);
        if (durationSec === null || durationSec <= 0) {
          setFormError("Enter a valid duration like 0:30.");
          return;
        }
        payload = { ...payload, durationSeconds: durationSec };
      }

      const res = await fetch("/api/v1/workouts/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setFormError("Could not log that set. Try again.");
        return;
      }
      const newSet: AddSetResponse = await res.json();

      const newWorkoutSet: WorkoutSet = {
        id: newSet.id,
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        exerciseModality: modality,
        reps: repsNum,
        weight: weightKg,
        durationSeconds: durationSec,
        distanceMeters: distanceM,
        setNumber: newSet.setNumber,
        rpe,
        notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        isWarmup,
      };

      setSession((s) =>
        s ? { ...s, sets: [...s.sets, newWorkoutSet] } : s
      );

      if (!isWarmup) startRestTimer(restSeconds);

      // PR message per modality
      if (modality === "strength" && (newSet.isWeightPr || newSet.isOneRmPr)) {
        const displayWeight = toDisplayWeight(weightKg ?? 0, weightUnit).toFixed(1);
        setPrMessage(
          newSet.isWeightPr
            ? `${selectedExercise.name}: ${displayWeight} ${weightUnit} × ${repsNum}`
            : `${selectedExercise.name}: new est. 1RM`
        );
      } else if (modality === "cardio" && (newSet.isDistancePr || newSet.isPacePr)) {
        if (newSet.isDistancePr) {
          const d = toDisplayDistance(distanceM ?? 0, weightUnit).toFixed(2);
          setPrMessage(`${selectedExercise.name}: longest ${d} ${distanceUnit(weightUnit)}`);
        } else {
          const pace = (durationSec ?? 0) / (distanceM ?? 1);
          setPrMessage(`${selectedExercise.name}: best pace ${formatPace(pace, weightUnit)}`);
        }
      } else if (modality === "timed" && newSet.isDurationPr) {
        setPrMessage(`${selectedExercise.name}: longest hold ${formatDuration(durationSec ?? 0)}`);
      }

      setIsWarmup(false);
      setRpe(null);
      setNotes("");
      setMoreOpen(false);
      setFormError(null);
    } catch {
      setFormError("Could not log that set. Try again.");
    } finally {
      setAddingSet(false);
    }
  }

  const deleteSet = useCallback(async (setId: number) => {
    setSessionError(null);
    const res = await fetch(`/api/v1/workouts/sets/${setId}`, { method: "DELETE" });
    if (!res.ok) {
      setSessionError("Could not delete that set.");
      return;
    }
    setSession((s) =>
      s ? { ...s, sets: s.sets.filter((ws) => ws.id !== setId) } : s
    );
  }, []);

  async function finishSession() {
    if (!session) return;
    setSessionError(null);
    setFinishing(true);
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${session.id}/finish`, { method: "POST" });
      if (!res.ok) {
        setSessionError("Could not finish this workout.");
        return;
      }
      setSession(null);
      setSelectedExercise(null);
      setPrMessage(null);
    } catch {
      setSessionError("Could not finish this workout.");
    } finally {
      setFinishing(false);
    }
  }

  async function cancelSession() {
    if (!session) return;

    const message = session.sets.length > 0
      ? "Cancel this workout and discard all logged sets?"
      : "Cancel this workout?";

    if (!window.confirm(message)) return;

    setSessionError(null);
    setCanceling(true);
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${session.id}`, { method: "DELETE" });
      if (!res.ok) {
        setSessionError("Could not cancel this workout.");
        return;
      }
      setSession(null);
      setSelectedExercise(null);
      setPrMessage(null);
    } catch {
      setSessionError("Could not cancel this workout.");
    } finally {
      setCanceling(false);
    }
  }

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase())
      )
    : exercises;

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
        {sessionError && (
          <p className="mb-4 text-xs text-destructive" aria-live="polite">
            {sessionError}
          </p>
        )}
        <Button onClick={startSession} size="lg">
          Start Workout
        </Button>
      </div>
    );
  }

  const modality: Modality | null = selectedExercise?.modality ?? null;

  return (
    <div>
      <RestTimer />

      {prMessage && (
        <PrBanner message={prMessage} onDismiss={() => setPrMessage(null)} />
      )}

        <div className="flex items-center justify-between py-1 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Active session</p>
          <div className="mt-0.5 flex items-center gap-2 text-sm">
            <p className="font-medium">
              {new Date(session.startedAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <span className="text-xs text-muted-foreground">
              {session.sets.length} {session.sets.length === 1 ? "set" : "sets"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={cancelSession}
            disabled={canceling || finishing}
            variant="ghost"
          >
            {canceling ? "Canceling…" : "Cancel"}
          </Button>
          <Button
            onClick={finishSession}
            disabled={finishing || canceling || session.sets.length === 0}
            variant="secondary"
          >
            {finishing ? "Finishing…" : "Finish"}
          </Button>
        </div>
      </div>

      {sessionError && (
        <p className="mb-3 text-xs text-destructive" aria-live="polite">
          {sessionError}
        </p>
      )}

      {session.sets.length === 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          Add at least one set before finishing this workout.
        </p>
      )}

      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <Input
            type="text"
            placeholder="Search exercises"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!selectedExercise && (
            <p className="text-xs text-muted-foreground">
              Choose an exercise, then log one set at a time.
            </p>
          )}

          {!selectedExercise && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => pickExercise(ex)}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="text-foreground">{ex.name}</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-2">
                    {ex.modality !== "strength" && (
                      <span className="text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-muted">
                        {ex.modality}
                      </span>
                    )}
                    {ex.category}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-2">No exercises found</p>
              )}
            </div>
          )}

          {selectedExercise && modality && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedExercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedExercise.category}
                    {modality !== "strength" ? ` · ${modality}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExercise(null);
                    setFormError(null);
                  }}
                  className="min-h-11 rounded-lg px-2 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Change
                </button>
              </div>

              {modality === "strength" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor={repsId} className="text-xs text-muted-foreground mb-1 block">Reps</label>
                    <Input
                      id={repsId}
                      type="number"
                      min={1}
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="text-center text-2xl font-bold"
                      aria-invalid={Boolean(formError)}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={weightId} className="text-xs text-muted-foreground mb-1 block">Weight ({weightUnit})</label>
                    <Input
                      id={weightId}
                      type="number"
                      min={0}
                      step={0.5}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="text-center text-2xl font-bold"
                    />
                  </div>
                </div>
              )}

              {modality === "cardio" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor={durationId} className="text-xs text-muted-foreground mb-1 block">Duration (mm:ss)</label>
                    <Input
                      id={durationId}
                      type="text"
                      inputMode="numeric"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="20:00"
                      className="text-center text-2xl font-bold"
                      aria-invalid={Boolean(formError)}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={distanceId} className="text-xs text-muted-foreground mb-1 block">Distance ({distanceUnit(weightUnit)})</label>
                    <Input
                      id={distanceId}
                      type="number"
                      min={0}
                      step={0.01}
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="text-center text-2xl font-bold"
                      aria-invalid={Boolean(formError)}
                    />
                  </div>
                </div>
              )}

              {modality === "timed" && (
                <div>
                  <label htmlFor={durationId} className="text-xs text-muted-foreground mb-1 block">Duration (mm:ss)</label>
                  <Input
                    id={durationId}
                    type="text"
                    inputMode="numeric"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="0:30"
                    className="text-center text-2xl font-bold"
                    aria-invalid={Boolean(formError)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWarmup((v) => !v)}
                  aria-pressed={isWarmup}
                  className={`min-h-11 rounded-lg px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    isWarmup
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Warm-up
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="min-h-11 rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-expanded={moreOpen}
                >
                  {moreOpen ? "Hide RPE & notes" : "RPE & notes"}
                  {rpe !== null && <span className="ml-1 text-primary">@{rpe}</span>}
                </button>
              </div>

              {moreOpen && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">RPE</label>
                    <div className="flex flex-wrap gap-1">
                      {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRpe(rpe === v ? null : v)}
                          aria-pressed={rpe === v}
                          className={`h-11 min-w-11 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                            rpe === v
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor={notesId} className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <Input
                      id={notesId}
                      type="text"
                      value={notes}
                      maxLength={200}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. last rep grindy"
                    />
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-xs text-destructive" aria-live="polite">
                  {formError}
                </p>
              )}

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

      {setsByExercise && Object.keys(setsByExercise).length > 0 && (
        <div className="space-y-4 pt-1 border-t border-border">
          <h3 className="font-semibold text-sm pt-3">
            Logged Sets ({session.sets.length})
          </h3>
          {Object.entries(setsByExercise).map(([name, sets]) => (
            <div key={name}>
              <p className="text-sm font-medium text-foreground mb-1">{name}</p>
              <div className="divide-y divide-border">
                {sets.map((s) => (
                  <div key={s.id} className="py-2.5">
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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteSet(s.id)}
                        aria-label="Delete set"
                      >
                        <CloseIcon />
                      </Button>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground pl-16 pr-8 mt-0.5 truncate">
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
    </div>
  );
}
