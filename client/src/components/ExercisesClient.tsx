"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

export default function ExercisesClient({
  initialExercises,
}: {
  initialExercises: Exercise[];
}) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Chest");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

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

  async function createExercise(evt: React.FormEvent) {
    evt.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/v1/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), category: newCategory }),
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
    <div className="space-y-5">
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
              filter === cat && "bg-muted text-foreground"
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
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                  onClick={(e) => createExercise(e as unknown as React.FormEvent)}
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

      {/* Exercise list */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No exercises found</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, exs]) => (
            <div key={category}>
              <h2 className="text-xs font-medium text-muted-foreground mb-2">
                {category}
              </h2>
              <div className="bg-card rounded-2xl divide-y divide-border">
                {exs.map((ex) => (
                  <div key={ex.id} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-foreground">{ex.name}</span>
                    {ex.isCustom && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        custom
                      </span>
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
