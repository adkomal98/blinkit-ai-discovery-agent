/** Load and parse the redacted reviews CSV (server-side only). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Review, ReviewSource, SourceBreakdown } from "@/types";
import { redactPII } from "@/lib/safety";

const SOURCE_LABELS: Record<ReviewSource, string> = {
  google_play: "Google Play Store",
  app_store: "Apple App Store",
  reddit: "Reddit Discussions",
  twitter: "Social Media (X/Twitter)",
  forum: "Community Forums",
  product_review: "Product Review Sites",
  mouthshut: "MouthShut Reviews",
  trustpilot: "Trustpilot Reviews",
};

/** Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, escaped quotes). */
export function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && content[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export function parseReviews(content: string): Review[] {
  const rows = parseCSV(content);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const out: Review[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2) continue;
    const sourceRaw = (r[idx("source")] || "google_play").trim().toLowerCase();
    const validSources: ReviewSource[] = ["google_play", "app_store", "reddit", "twitter", "forum", "product_review"];
    const source: ReviewSource = validSources.includes(sourceRaw as ReviewSource) ? sourceRaw as ReviewSource : "google_play";
    out.push({
      review_id: r[idx("review_id")] || `R${i}`,
      rating: Number(r[idx("rating")]) || 0,
      title: redactPII(r[idx("title")] || ""),
      text: redactPII(r[idx("text")] || ""),
      date: r[idx("date")] || "",
      app_version: r[idx("app_version")] || "",
      helpful_count: Number(r[idx("helpful_count")]) || 0,
      source,
    });
  }
  return out;
}

let cached: Review[] | null = null;

/** Load reviews from data/blinkit_reviews.csv (cached per server process). */
export function loadReviews(): Review[] {
  if (cached) return cached;
  const path = join(process.cwd(), "data", "blinkit_reviews.csv");
  const content = readFileSync(path, "utf8");
  cached = parseReviews(content).filter((r) => r.text.trim().length > 0);
  return cached;
}

export function reviewStats(reviews: Review[]) {
  const rated = reviews.filter((r) => r.rating > 0);
  const avg = rated.reduce((a, r) => a + r.rating, 0) / (rated.length || 1);
  const dates = reviews.map((r) => r.date).filter(Boolean).sort();
  return {
    total: reviews.length,
    avgRating: avg,
    windowStart: dates[0] || "",
    windowEnd: dates[dates.length - 1] || "",
  };
}

/** Compute how many reviews came from each source. */
export function getSourceBreakdown(reviews: Review[]): SourceBreakdown[] {
  const counts = new Map<ReviewSource, number>();
  for (const r of reviews) {
    counts.set(r.source, (counts.get(r.source) || 0) + 1);
  }
  const breakdown: SourceBreakdown[] = [];
  for (const [source, count] of counts) {
    breakdown.push({ source, label: SOURCE_LABELS[source] || source, count });
  }
  return breakdown.sort((a, b) => b.count - a.count);
}
