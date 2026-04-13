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
