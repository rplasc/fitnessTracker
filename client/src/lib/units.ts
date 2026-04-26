const KG_TO_LB = 2.20462;
const CM_TO_IN = 0.393701;

export function toDisplayWeight(kg: number, unit: string): number {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

export function toKg(value: number, unit: string): number {
  return unit === "lb" ? value / KG_TO_LB : value;
}

export function toDisplayHeight(cm: number, unit: string): number {
  return unit === "in" ? cm * CM_TO_IN : cm;
}

export function toCm(value: number, unit: string): number {
  return unit === "in" ? value / CM_TO_IN : value;
}

export function formatWeight(kg: number, unit: string): string {
  return `${toDisplayWeight(kg, unit).toFixed(1)} ${unit}`;
}

export function formatHeight(cm: number, unit: string): string {
  if (unit === "in") {
    const totalIn = cm * CM_TO_IN;
    const feet = Math.floor(totalIn / 12);
    const inches = (totalIn % 12).toFixed(0);
    return `${feet}'${inches}"`;
  }
  return `${Number(cm).toFixed(1)} cm`;
}

export function weightStep(unit: string): number {
  return unit === "lb" ? 1 : 0.1;
}

export function weightPlaceholder(unit: string): string {
  return unit === "lb" ? "e.g. 175" : "e.g. 80.5";
}

// Distance: km when weight is kg, mi when weight is lb.
const M_TO_MI = 0.000621371;
const M_TO_KM = 0.001;

export function distanceUnit(weightUnit: string): "km" | "mi" {
  return weightUnit === "lb" ? "mi" : "km";
}

export function toDisplayDistance(meters: number, weightUnit: string): number {
  return weightUnit === "lb" ? meters * M_TO_MI : meters * M_TO_KM;
}

export function toMeters(value: number, weightUnit: string): number {
  return weightUnit === "lb" ? value / M_TO_MI : value / M_TO_KM;
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const t = Math.round(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Pace stored as seconds-per-meter; display as min:ss per km or per mi.
export function formatPace(secondsPerMeter: number, weightUnit: string): string {
  if (!Number.isFinite(secondsPerMeter) || secondsPerMeter <= 0) return "—";
  const secondsPerUnit = weightUnit === "lb"
    ? secondsPerMeter / M_TO_MI
    : secondsPerMeter / M_TO_KM;
  return `${formatDuration(secondsPerUnit)} /${distanceUnit(weightUnit)}`;
}

// Parse "mm:ss" or "h:mm:ss" or seconds string into seconds.
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p.length === 0 || !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return null;
  if (nums.length === 1) return Math.round(nums[0]);
  if (nums.length === 2) return Math.round(nums[0] * 60 + nums[1]);
  if (nums.length === 3) return Math.round(nums[0] * 3600 + nums[1] * 60 + nums[2]);
  return null;
}
