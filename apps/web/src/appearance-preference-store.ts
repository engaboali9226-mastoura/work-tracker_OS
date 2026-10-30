export type NoorAppearance = "noor" | "light" | "dark";
const APPEARANCE_KEY = "noor:appearance:v1";
export function readAppearance(): NoorAppearance {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(APPEARANCE_KEY) : null;
    return saved === "light" || saved === "dark" ? saved : "noor";
  } catch { return "noor"; }
}
export function saveAppearance(value: NoorAppearance): void {
  if (value !== "noor" && value !== "light" && value !== "dark") return;
  try { window.localStorage.setItem(APPEARANCE_KEY, value); } catch { /* Appearance still works in memory. */ }
}
