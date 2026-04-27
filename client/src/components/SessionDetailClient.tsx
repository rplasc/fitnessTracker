"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionDetail, WorkoutSet, Modality } from "@/lib/types";
import {
  toDisplayWeight,
  toKg,
  toDisplayDistance,
  toMeters,
  distanceUnit,
  formatDuration,
  parseDuration,
} from "@/lib/units";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

function formatSessionDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "In progress";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface SetEditDraft {
  reps: string;
  weight: string;
  duration: string;
  distance: string;
  rpe: number | null;
  notes: string;
  isWarmup: boolean;
}

function draftFromSet(s: WorkoutSet, weightUnit: string): SetEditDraft {
  return {
    reps: s.reps !== null ? String(s.reps) : "",
    weight: s.weight !== null ? toDisplayWeight(s.weight, weightUnit).toFixed(1) : "",
    duration: s.durationSeconds !== null ? formatDuration(s.durationSeconds) : "",
    distance:
      s.distanceMeters !== null
        ? toDisplayDistance(s.distanceMeters, weightUnit).toFixed(2)
        : "",
    rpe: s.rpe,
    notes: s.notes ?? "",
    isWarmup: s.isWarmup,
  };
}

export default function SessionDetailClient({
  session: initialSession,
  weightUnit,
}: {
  session: SessionDetail;
  weightUnit: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail>(initialSession);
  const [deletingSession, setDeletingSession] = useState(false);
  const [confirmingSession, setConfirmingSession] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [draft, setDraft] = useState<SetEditDraft | null>(null);
  const [savingSetId, setSavingSetId] = useState<number | null>(null);
  const [deletingSetId, setDeletingSetId] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState(session.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  function startEdit(s: WorkoutSet) {
    setEditingSetId(s.id);
    setDraft(draftFromSet(s, weightUnit));
    setEditError(null);
  }

  function cancelEdit() {
    setEditingSetId(null);
    setDraft(null);
    setEditError(null);
  }

  async function saveEdit(s: WorkoutSet) {
    if (!draft) return;
    setEditError(null);

    const modality = s.exerciseModality;
    const payload: Record<string, unknown> = {
      rpe: draft.rpe,
      notes: draft.notes.trim().length > 0 ? draft.notes.trim() : "",
      isWarmup: draft.isWarmup,
    };

    if (modality === "strength") {
      const repsNum = parseInt(draft.reps);
      const weightNum = parseFloat(draft.weight);
      if (!Number.isFinite(repsNum) || repsNum <= 0) {
        setEditError("Reps must be at least 1.");
        return;
      }
      if (!Number.isFinite(weightNum) || weightNum < 0) {
        setEditError("Weight must be 0 or higher.");
        return;
      }
      payload.reps = repsNum;
      payload.weight = toKg(weightNum, weightUnit);
    } else if (modality === "cardio") {
      const dur = parseDuration(draft.duration);
      const distNum = parseFloat(draft.distance);
      if (dur === null || dur <= 0) {
        setEditError("Enter a valid duration (mm:ss).");
        return;
      }
      if (!Number.isFinite(distNum) || distNum <= 0) {
        setEditError(`Enter a valid distance in ${distanceUnit(weightUnit)}.`);
        return;
      }
      payload.durationSeconds = dur;
      payload.distanceMeters = toMeters(distNum, weightUnit);
    } else {
      const dur = parseDuration(draft.duration);
      if (dur === null || dur <= 0) {
        setEditError("Enter a valid duration (mm:ss).");
        return;
      }
      payload.durationSeconds = dur;
    }

    setSavingSetId(s.id);
    try {
      const res = await fetch(`/api/v1/workouts/sets/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setEditError("Could not save. Try again.");
        return;
      }
      setSession((prev) => ({
        ...prev,
        sets: prev.sets.map((existing) =>
          existing.id !== s.id
            ? existing
            : {
                ...existing,
                reps: modality === "strength" ? parseInt(draft.reps) : existing.reps,
                weight:
                  modality === "strength"
                    ? toKg(parseFloat(draft.weight), weightUnit)
                    : existing.weight,
                durationSeconds:
                  modality === "cardio" || modality === "timed"
                    ? parseDuration(draft.duration)
                    : existing.durationSeconds,
                distanceMeters:
                  modality === "cardio"
                    ? toMeters(parseFloat(draft.distance), weightUnit)
                    : existing.distanceMeters,
                rpe: draft.rpe,
                notes: draft.notes.trim().length > 0 ? draft.notes.trim() : null,
                isWarmup: draft.isWarmup,
              }
        ),
      }));
      cancelEdit();
    } finally {
      setSavingSetId(null);
    }
  }

  async function deleteSet(setId: number) {
    setDeletingSetId(setId);
    try {
      const res = await fetch(`/api/v1/workouts/sets/${setId}`, { method: "DELETE" });
      if (!res.ok) return;
      setSession((prev) => ({ ...prev, sets: prev.sets.filter((s) => s.id !== setId) }));
      if (editingSetId === setId) cancelEdit();
    } finally {
      setDeletingSetId(null);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (res.ok) {
        setSession((prev) => ({
          ...prev,
          notes: notesDraft.trim().length > 0 ? notesDraft.trim() : null,
        }));
        setNotesSaved(true);
        window.setTimeout(() => setNotesSaved(false), 1500);
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function deleteSession() {
    setDeletingSession(true);
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${session.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/history");
        router.refresh();
      }
    } finally {
      setDeletingSession(false);
    }
  }

  const byExercise = session.sets.reduce<Record<string, WorkoutSet[]>>(
    (acc, s) => {
      if (!acc[s.exerciseName]) acc[s.exerciseName] = [];
      acc[s.exerciseName].push(s);
      return acc;
    },
    {}
  );

  const started = new Date(session.startedAt);
  const notesChanged = (notesDraft.trim() || null) !== (session.notes ?? null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/history"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Back to history"
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
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">
            {started.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h1>
          <p className="text-xs text-muted-foreground">
            {started.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            {" · "}
            {formatSessionDuration(session.startedAt, session.finishedAt)}
            {" · "}
            {session.sets.length} {session.sets.length === 1 ? "set" : "sets"}
          </p>
        </div>
      </div>

      {session.sets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">No sets logged.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(byExercise).map(([name, sets]) => (
            <div key={name}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {name}
              </p>
              <div className="divide-y divide-border border-y border-border">
                {sets.map((s) =>
                  editingSetId === s.id && draft ? (
                    <SetEditor
                      key={s.id}
                      set={s}
                      draft={draft}
                      weightUnit={weightUnit}
                      saving={savingSetId === s.id}
                      deleting={deletingSetId === s.id}
                      error={editError}
                      onChange={setDraft}
                      onSave={() => saveEdit(s)}
                      onCancel={cancelEdit}
                      onDelete={() => deleteSet(s.id)}
                    />
                  ) : (
                    <SetRow
                      key={s.id}
                      set={s}
                      weightUnit={weightUnit}
                      onEdit={() => startEdit(s)}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Session notes
          </p>
          {notesSaved && (
            <p className="text-[10px] text-primary">Saved</p>
          )}
        </div>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="How did this session feel?"
          className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            disabled={!notesChanged || savingNotes}
            onClick={saveNotes}
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </Button>
        </div>
      </div>

      <div className="pt-2">
        {confirmingSession ? (
          <div className="border border-destructive/30 rounded-md p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Delete this session?</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmingSession(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteSession}
                disabled={deletingSession}
                className="text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingSession ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingSession(true)}
            className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
          >
            Delete session
          </button>
        )}
      </div>
    </div>
  );
}

function SetRow({
  set,
  weightUnit,
  onEdit,
}: {
  set: WorkoutSet;
  weightUnit: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full text-left py-2 hover:bg-muted/30 transition-colors -mx-1 px-1"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0 text-right">
          {set.setNumber}
        </span>
        <div className="flex-1 flex items-baseline gap-2 min-w-0">
          <span className="text-base font-semibold tabular-nums">
            {formatSetSummary(set, weightUnit)}
          </span>
          {set.rpe !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">@{set.rpe}</span>
          )}
        </div>
        {set.isWarmup && (
          <span className="text-[9px] font-semibold px-1 rounded bg-muted text-muted-foreground shrink-0">
            W
          </span>
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 text-muted-foreground shrink-0"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" />
        </svg>
      </div>
      {set.notes && (
        <p className="text-xs text-muted-foreground pl-8 pr-2 mt-0.5">
          {set.notes}
        </p>
      )}
    </button>
  );
}

function SetEditor({
  set,
  draft,
  weightUnit,
  saving,
  deleting,
  error,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: {
  set: WorkoutSet;
  draft: SetEditDraft;
  weightUnit: string;
  saving: boolean;
  deleting: boolean;
  error: string | null;
  onChange: (next: SetEditDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const modality: Modality = set.exerciseModality;

  return (
    <div className="px-4 py-3 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Editing set {set.setNumber}
        </p>
        <button
          type="button"
          onClick={() => onChange({ ...draft, isWarmup: !draft.isWarmup })}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
            draft.isWarmup
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {draft.isWarmup ? "Warm-up" : "Working set"}
        </button>
      </div>

      {modality === "strength" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Reps</label>
            <Input
              type="number"
              min={1}
              value={draft.reps}
              onChange={(e) => onChange({ ...draft, reps: e.target.value })}
              className="text-center font-bold"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Weight ({weightUnit})</label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={draft.weight}
              onChange={(e) => onChange({ ...draft, weight: e.target.value })}
              className="text-center font-bold"
            />
          </div>
        </div>
      )}

      {modality === "cardio" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Duration</label>
            <Input
              type="text"
              inputMode="numeric"
              value={draft.duration}
              placeholder="20:00"
              onChange={(e) => onChange({ ...draft, duration: e.target.value })}
              className="text-center font-bold"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Distance ({distanceUnit(weightUnit)})</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={draft.distance}
              onChange={(e) => onChange({ ...draft, distance: e.target.value })}
              className="text-center font-bold"
            />
          </div>
        </div>
      )}

      {modality === "timed" && (
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Duration</label>
          <Input
            type="text"
            inputMode="numeric"
            value={draft.duration}
            placeholder="0:30"
            onChange={(e) => onChange({ ...draft, duration: e.target.value })}
            className="text-center font-bold"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">RPE</label>
        <div className="flex flex-wrap gap-1">
          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() =>
                onChange({ ...draft, rpe: draft.rpe === v ? null : v })
              }
              className={`text-xs font-medium w-9 h-7 rounded-lg transition-colors ${
                draft.rpe === v
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
        <label className="text-[10px] text-muted-foreground mb-1 block">Notes</label>
        <Input
          type="text"
          value={draft.notes}
          maxLength={200}
          onChange={(e) => onChange({ ...draft, notes: e.target.value })}
          placeholder="Optional"
        />
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={deleting || saving}
          className="text-destructive hover:text-destructive"
        >
          {deleting ? "…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
