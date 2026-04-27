"use client";

import { useState } from "react";
import type { Exercise, Modality } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ExerciseDetail from "@/components/ExerciseDetail";

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

const MODALITIES: { value: Modality; label: string; help: string }[] = [
  { value: "strength", label: "Strength", help: "reps × weight" },
  { value: "cardio", label: "Cardio", help: "duration + distance" },
  { value: "timed", label: "Timed", help: "duration only (e.g. plank)" },
];

export default function ExercisesClient({
  initialExercises,
  weightUnit,
}: {
  initialExercises: Exercise[];
  weightUnit: string;
}) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Chest");
  const [newModality, setNewModality] = useState<Modality>("strength");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        weightUnit={weightUnit}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }

  const visible = exercises.filter((e) => {
    const matchCat = filter === "All" || e.category === filter;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = visible.reduce<Record<string, Exercise[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  async function createExercise() {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/v1/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), category: newCategory, modality: newModality }),
      });
      if (res.status === 409) {
        setError("An exercise with that name already exists.");
        return;
      }
      if (!res.ok) {
        setError("Failed to create exercise.");
        return;
      }
      const created: Exercise = await res.json();
      setExercises((prev) => [...prev, created]);
      setNewName("");
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {/* Controls group: search → filters → add */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant="outline"
              size="sm"
              onClick={() => setFilter(cat)}
              className={cn(
                "shrink-0 rounded-full",
                filter === cat
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted-foreground"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Add custom exercise */}
        <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-card border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Custom Exercise
          </button>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">New Exercise</h3>
              <div>
                <Label htmlFor="ex-name" className="mb-1">Name</Label>
                <Input
                  id="ex-name"
                  type="text"
                  placeholder="Exercise name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ex-category" className="mb-1">Category</Label>
                <select
                  id="ex-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1">Type</Label>
                <div className="grid grid-cols-3 gap-1">
                  {MODALITIES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setNewModality(m.value)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs transition-colors text-left",
                        newModality === m.value
                          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="block font-medium">{m.label}</span>
                      <span className="block text-[10px] opacity-75">{m.help}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                  onClick={createExercise}
                >
                  {creating ? "Adding…" : "Add"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => { setShowForm(false); setError(""); }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Exercise list */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No exercises found</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, exs]) => (
            <div key={category}>
              <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {category}
              </h2>
              <div className="divide-y divide-border border-y border-border">
                {exs.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    className="w-full py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left cursor-pointer -mx-1 px-1"
                  >
                    <span className="text-sm text-foreground">{ex.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {ex.modality !== "strength" && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {ex.modality}
                        </span>
                      )}
                      {ex.isCustom && (
                        <span className="text-[10px] uppercase tracking-wider text-primary">
                          custom
                        </span>
                      )}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 text-muted-foreground"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
