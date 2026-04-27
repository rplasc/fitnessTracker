"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fittrack.restTimer";

type Stored = { targetEndMs: number; durationSec: number };

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (typeof parsed.targetEndMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: Stored | null) {
  if (typeof window === "undefined") return;
  if (value === null) sessionStorage.removeItem(STORAGE_KEY);
  else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function startRestTimer(durationSec: number) {
  writeStored({
    targetEndMs: Date.now() + durationSec * 1000,
    durationSec,
  });
  window.dispatchEvent(new CustomEvent("fittrack:rest-timer-start"));
}

function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // ignore
  }
}

export default function RestTimer() {
  const [stored, setStored] = useState<Stored | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const rangForEndMs = useRef<number | null>(null);

  useEffect(() => {
    function sync() {
      setStored(readStored());
    }
    function onStart() {
      sync();
    }
    // Defer the initial read so we're not calling setState synchronously in the effect body.
    const initId = window.setTimeout(sync, 0);
    window.addEventListener("fittrack:rest-timer-start", onStart);
    return () => {
      window.clearTimeout(initId);
      window.removeEventListener("fittrack:rest-timer-start", onStart);
    };
  }, []);

  useEffect(() => {
    if (!stored) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [stored]);

  // Beep once per target via a scheduled timeout (no state needed).
  useEffect(() => {
    if (!stored) return;
    const delay = stored.targetEndMs - Date.now();
    if (rangForEndMs.current === stored.targetEndMs) return;
    const id = window.setTimeout(() => {
      rangForEndMs.current = stored.targetEndMs;
      beep();
    }, Math.max(0, delay));
    return () => window.clearTimeout(id);
  }, [stored]);

  const remainingMs = stored ? stored.targetEndMs - now : 0;

  if (!stored) return null;

  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = Math.max(
    0,
    Math.min(1, remainingMs / (stored.durationSec * 1000))
  );

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const label = `${mm}:${ss.toString().padStart(2, "0")}`;

  function dismiss() {
    writeStored(null);
    setStored(null);
    setExpanded(false);
  }

  function addFifteen() {
    if (!stored) return;
    const next: Stored = {
      targetEndMs: stored.targetEndMs + 15_000,
      durationSec: stored.durationSec + 15,
    };
    writeStored(next);
    setStored(next);
  }

  const expired = remainingMs <= 0;

  return (
    <div
      className="fixed inset-x-0 z-40 pointer-events-none"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-lg mx-auto px-3 pb-2">
        <div
          className={`pointer-events-auto bg-card ring-1 ring-foreground/10 rounded-md shadow-sm overflow-hidden ${
            expired ? "ring-primary/50" : ""
          }`}
        >
          <div
            className="h-0.5 bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left"
            aria-expanded={expanded}
          >
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {expired ? "Rest done" : "Rest"}
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{label}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{expired ? "Tap to dismiss" : "Tap to skip"}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </div>
          </button>
          {expanded ? (
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
              {!expired ? (
                <button
                  onClick={addFifteen}
                  className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                >
                  +15s
                </button>
              ) : null}
              <button
                onClick={dismiss}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {expired ? "Dismiss" : "Skip"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
