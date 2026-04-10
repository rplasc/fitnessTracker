"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Incorrect passcode. Try again.");
        setPasscode("");
      }
    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="passcode" className="block text-sm text-zinc-400 mb-2">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
          autoComplete="current-password"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
