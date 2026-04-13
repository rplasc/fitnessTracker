"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

const TOTAL_STEPS = 3;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full flex-1 transition-colors",
            i < current ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");

  // Step 2
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Step 3
  const [planName, setPlanName] = useState("");
  const [planColor, setPlanColor] = useState(COLORS[0]);

  async function finish(skipPlan = false) {
    setSaving(true);
    try {
      await fetch("/api/v1/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          heightCm: heightCm ? parseFloat(heightCm) : null,
          initialWeightKg: weightKg ? parseFloat(weightKg) : null,
          planName: !skipPlan && planName.trim() ? planName.trim() : null,
          planColor: !skipPlan && planName.trim() ? planColor : null,
        }),
      });
    } finally {
      router.push("/dashboard");
    }
  }

  // ── Step 1: Name ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <div>
        <StepIndicator current={1} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Welcome to FitTrack!</h1>
          <p className="text-muted-foreground text-sm">Let&apos;s get you set up in under a minute.</p>
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="displayName" className="mb-2">What should we call you?</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="First name or nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              disabled={!displayName.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 2: Biometrics ────────────────────────────────────────
  if (step === 2) {
    return (
      <div>
        <StepIndicator current={2} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Your stats</h1>
          <p className="text-muted-foreground text-sm">Optional — helps track progress over time.</p>
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="height" className="mb-2">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="e.g. 178"
                min={100}
                max={250}
                step={1}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight" className="mb-2">Current weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="e.g. 80.5"
                min={20}
                max={500}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => setStep(3)}>
              Continue
            </Button>
            <button
              onClick={() => setStep(3)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 3: First Plan ────────────────────────────────────────
  return (
    <div>
      <StepIndicator current={3} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Your first plan</h1>
        <p className="text-muted-foreground text-sm">
          Name a workout plan — you can add exercises to it afterwards.
        </p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label htmlFor="planName" className="mb-2">Plan name (optional)</Label>
            <Input
              id="planName"
              type="text"
              placeholder="e.g. Push Day, Full Body, Leg Day"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              maxLength={100}
            />
          </div>

          {planName.trim() && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPlanColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      planColor === c && "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={saving}
            onClick={() => finish(false)}
          >
            {saving ? "Setting up…" : planName.trim() ? "Create Plan & Finish" : "Finish"}
          </Button>
          {planName.trim() && (
            <button
              onClick={() => finish(true)}
              disabled={saving}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip plan, go to dashboard
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
