"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function UnitToggle({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-border bg-muted/40 p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          disabled={disabled}
          className={`min-h-10 min-w-10 rounded-lg px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            value === opt
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function SettingsClient({
  initialWeightUnit,
  initialHeightUnit,
  initialRestSeconds,
  initialWeeklyWorkoutGoal,
}: {
  initialWeightUnit: string;
  initialHeightUnit: string;
  initialRestSeconds: number;
  initialWeeklyWorkoutGoal: number | null;
}) {
  const router = useRouter();
  const [weightUnit, setWeightUnit] = useState(initialWeightUnit);
  const [heightUnit, setHeightUnit] = useState(initialHeightUnit);
  const [restSeconds, setRestSeconds] = useState(initialRestSeconds);
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState<number | null>(initialWeeklyWorkoutGoal);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (saveMessage !== "Saved") return;
    const timeout = window.setTimeout(() => setSaveMessage(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  async function patchSettings(field: string, patch: Record<string, unknown>) {
    setSavingField(field);
    setSaveMessage("Saving…");
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        throw new Error("Failed to update settings");
      }
      setSaveMessage("Saved");
      return true;
    } catch {
      setSaveMessage("Could not save changes");
      return false;
    } finally {
      setSavingField(null);
    }
  }

  async function handleWeightUnitChange(unit: string) {
    if (unit === weightUnit) return;
    const previous = weightUnit;
    setWeightUnit(unit);
    if (!(await patchSettings("weightUnit", { weightUnit: unit }))) {
      setWeightUnit(previous);
    }
  }

  async function handleHeightUnitChange(unit: string) {
    if (unit === heightUnit) return;
    const previous = heightUnit;
    setHeightUnit(unit);
    if (!(await patchSettings("heightUnit", { heightUnit: unit }))) {
      setHeightUnit(previous);
    }
  }

  async function handleRestSecondsChange(seconds: number) {
    if (seconds === restSeconds) return;
    const previous = restSeconds;
    setRestSeconds(seconds);
    if (!(await patchSettings("restSeconds", { restSeconds: seconds }))) {
      setRestSeconds(previous);
    }
  }

  async function handleWeeklyWorkoutGoalChange(goal: number | null) {
    if (goal === weeklyWorkoutGoal) return;
    const previous = weeklyWorkoutGoal;
    setWeeklyWorkoutGoal(goal);
    if (!(await patchSettings("weeklyWorkoutGoal", { weeklyWorkoutGoal: goal }))) {
      setWeeklyWorkoutGoal(previous);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleResetData() {
    setResetting(true);
    try {
      await fetch("/api/v1/auth/data", { method: "DELETE" });
      setConfirmReset(false);
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="bg-card rounded-2xl ring-1 ring-foreground/5 divide-y divide-border">
      <div className="flex items-center justify-between px-5 py-3 text-xs text-muted-foreground">
        <span>Preferences update immediately.</span>
        <span aria-live="polite">{saveMessage ?? "\u00A0"}</span>
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Weight unit</p>
          <p className="text-xs text-muted-foreground mt-0.5">Used across workouts and body weight log</p>
        </div>
        <UnitToggle options={["kg", "lb"]} value={weightUnit} onChange={handleWeightUnitChange} disabled={savingField !== null} />
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Height unit</p>
          <p className="text-xs text-muted-foreground mt-0.5">Used for your profile height</p>
        </div>
        <UnitToggle options={["cm", "in"]} value={heightUnit} onChange={handleHeightUnitChange} disabled={savingField !== null} />
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Rest timer</p>
          <p className="text-xs text-muted-foreground mt-0.5">Default countdown after each working set</p>
        </div>
        <UnitToggle
          options={["60", "90", "120", "180"]}
          value={String(restSeconds)}
          onChange={(v) => handleRestSecondsChange(parseInt(v, 10))}
          disabled={savingField !== null}
        />
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Weekly workout goal</p>
          <p className="text-xs text-muted-foreground mt-0.5">Track finished workouts from Monday to Sunday</p>
        </div>
        <UnitToggle
          options={["None", "2", "3", "4", "5"]}
          value={weeklyWorkoutGoal === null ? "None" : String(weeklyWorkoutGoal)}
          onChange={(v) => handleWeeklyWorkoutGoalChange(v === "None" ? null : parseInt(v, 10))}
          disabled={savingField !== null}
        />
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Sign out</p>
          <p className="text-xs text-muted-foreground mt-0.5">End your current session</p>
        </div>
        {confirmSignOut ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmSignOut(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSignOut}
              variant="secondary"
              size="sm"
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            variant="secondary"
            size="sm"
            disabled={signingOut}
          >
            Sign out
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium text-destructive">Reset data</p>
          <p className="text-xs text-muted-foreground mt-0.5">Delete all workouts, metrics, and plans</p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleResetData}
              disabled={resetting}
              variant="destructive"
              size="sm"
            >
              {resetting ? "Deleting…" : "Delete everything"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setConfirmReset(true)}
            variant="destructive"
            size="sm"
            disabled={resetting}
          >
            Reset data
          </Button>
        )}
      </div>
    </div>
  );
}
