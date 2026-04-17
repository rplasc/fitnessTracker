"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden border border-border text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 transition-colors ${
            value === opt
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-muted text-muted-foreground hover:text-foreground"
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
}: {
  initialWeightUnit: string;
  initialHeightUnit: string;
}) {
  const router = useRouter();
  const [weightUnit, setWeightUnit] = useState(initialWeightUnit);
  const [heightUnit, setHeightUnit] = useState(initialHeightUnit);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function patchSettings(patch: Record<string, unknown>) {
    await fetch("/api/v1/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function handleWeightUnitChange(unit: string) {
    setWeightUnit(unit);
    await patchSettings({ weightUnit: unit });
  }

  async function handleHeightUnitChange(unit: string) {
    setHeightUnit(unit);
    await patchSettings({ heightUnit: unit });
  }

  async function handleSignOut() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Weight unit</p>
          <p className="text-xs text-muted-foreground mt-0.5">Used across workouts and body weight log</p>
        </div>
        <UnitToggle options={["kg", "lb"]} value={weightUnit} onChange={handleWeightUnitChange} />
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Height unit</p>
          <p className="text-xs text-muted-foreground mt-0.5">Used for your profile height</p>
        </div>
        <UnitToggle options={["cm", "in"]} value={heightUnit} onChange={handleHeightUnitChange} />
      </div>

      {/* Sign out */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium">Sign out</p>
          <p className="text-xs text-muted-foreground mt-0.5">End your current session</p>
        </div>
        {confirmSignOut ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmSignOut(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-foreground bg-muted hover:bg-muted/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="text-xs font-medium text-foreground bg-muted hover:bg-muted/70 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        )}
      </div>

      {/* Reset data */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium text-destructive">Reset data</p>
          <p className="text-xs text-muted-foreground mt-0.5">Delete all workouts, metrics, and plans</p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmReset(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {resetting ? "Deleting…" : "Delete everything"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 px-3 py-1.5 rounded-lg transition-colors"
          >
            Reset data
          </button>
        )}
      </div>
    </div>
  );
}
