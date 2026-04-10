"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";

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
      <input
        type="text"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-indigo-600 text-white"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add custom exercise */}
      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-zinc-900 border border-dashed border-zinc-700 hover:border-indigo-600 text-zinc-400 hover:text-indigo-400 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Custom Exercise
          </button>
        ) : (
          <form
            onSubmit={createExercise}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
          >
            <h3 className="font-semibold text-sm text-zinc-300">New Exercise</h3>
            <input
              type="text"
              placeholder="Exercise name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                {creating ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Exercise list */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-8">No exercises found</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, exs]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {category}
              </h2>
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
                {exs.map((ex) => (
                  <div key={ex.id} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-200">{ex.name}</span>
                    {ex.isCustom && (
                      <span className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded-full">
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
