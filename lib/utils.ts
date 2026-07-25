/** Small framework-agnostic helpers. */

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  // YYYY-MM-DD -> e.g. "28 Mar 2026"
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

export function countWords(text: string): number {
  return (text.trim().match(/\S+/g) || []).length;
}

/** Concatenate class names, dropping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
