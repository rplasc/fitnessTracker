"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingClient() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);

  async function complete(skip = false) {
    setSaving(true);
    try {
      await fetch("/api/v1/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: skip ? "" : displayName.trim(),
          heightCm: null,
          initialWeightKg: !skip && weightKg ? parseFloat(weightKg) : null,
          planName: null,
          planColor: null,
        }),
      });
    } finally {
      router.push("/workout");
    }
  }

  return (
    <div>
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
          >
            <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">You&apos;re in.</h1>
        <p className="text-muted-foreground text-sm mt-1">One quick step before you start training.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* Name */}
          <div>
            <Label htmlFor="displayName" className="mb-2">
              What should we call you?
            </Label>
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

          {/* Starting weight */}
          <div>
            <Label htmlFor="weight" className="mb-2">
              Starting weight{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="kg — e.g. 80.5"
              min={20}
              max={500}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">Logged to your weight history. Easy to update later.</p>
          </div>

          <Button
            className="w-full"
            disabled={!displayName.trim() || saving}
            onClick={() => complete(false)}
          >
            {saving ? "Setting up…" : "Start Training"}
          </Button>
        </CardContent>
      </Card>

      <button
        onClick={() => complete(true)}
        disabled={saving}
        className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip setup
      </button>
    </div>
  );
}
