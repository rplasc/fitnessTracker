"use client";

import { useState } from "react";

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
  const [weightUnit, setWeightUnit] = useState(initialWeightUnit);
  const [heightUnit, setHeightUnit] = useState(initialHeightUnit);

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
    </div>
  );
}
