/** Theme classification, theme summaries and representative-quote selection. */
import type { Review, ThemeLegend, ThemeSummary, Quote } from "@/types";
import legendJson from "@/lib/theme-legend.json";

export const legend = legendJson as ThemeLegend;

/** Count keyword hits for a theme in a piece of text (lowercased). */
function keywordScore(text: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    // word-ish boundary match; multiword keywords matched as substrings
    if (kw.includes(" ")) {
      if (text.includes(kw)) score += 2;
    } else {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) score += 1;
    }
  }
  return score;
}

/** Assign a review to the best-matching theme id, or the fallback id. */
export function classify(review: Review): string {
  const text = `${review.title} ${review.text}`.toLowerCase();
  let bestId = legend.fallback.id;
  let best = 0;
  for (const t of legend.themes) {
    const s = keywordScore(text, t.keywords);
    if (s > best) { best = s; bestId = t.id; }
  }
  return bestId;
}

/** Pick the most representative, quotable, PII-free reviews for a theme. */
function pickQuotes(reviews: Review[], themeName: string, keywords: string[], n: number): Quote[] {
  const scored = reviews
    .map((r) => {
      const text = r.text.trim();
      const len = text.length;
      const kw = keywordScore(text.toLowerCase(), keywords);
      // Favour clear, mid-length, on-theme reviews; penalise too short / too long.
      let score = kw * 3;
      if (len >= 40 && len <= 240) score += 4;
      else if (len > 240 && len <= 360) score += 1;
      else score -= 3;
      if (/\[(email|phone|pan|id|number)\]/.test(text)) score -= 2; // had redactions
      if (r.helpful_count > 0) score += Math.min(r.helpful_count, 3);
      return { r, score, len };
    })
    .filter((x) => x.len >= 20 && x.len <= 360)
    .sort((a, b) => b.score - a.score || b.r.date.localeCompare(a.r.date));

  const out: Quote[] = [];
  const seen = new Set<string>();
  for (const { r } of scored) {
    const key = r.text.slice(0, 40).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text: r.text.trim(), rating: r.rating, date: r.date, theme: themeName });
    if (out.length >= n) break;
  }
  return out;
}

/** Group reviews into themes and summarise each (sorted by count, desc). */
export function summariseThemes(reviews: Review[]): ThemeSummary[] {
  const byTheme = new Map<string, Review[]>();
  for (const r of reviews) {
    const id = classify(r);
    if (!byTheme.has(id)) byTheme.set(id, []);
    byTheme.get(id)!.push(r);
  }

  const categorised = reviews.length - (byTheme.get(legend.fallback.id)?.length || 0);
  const summaries: ThemeSummary[] = [];

  for (const t of legend.themes) {
    const group = byTheme.get(t.id) || [];
    if (group.length === 0) continue;
    const avg = group.reduce((a, r) => a + r.rating, 0) / group.length;
    summaries.push({
      id: t.id,
      name: t.name,
      blurb: t.blurb,
      count: group.length,
      share: categorised > 0 ? group.length / categorised : 0,
      avgRating: avg,
      sampleQuotes: pickQuotes(group, t.name, t.keywords, 3),
    });
  }

  return summaries.sort((a, b) => b.count - a.count);
}

/** Default deterministic action ideas for the given top themes (≤3). */
export function defaultActionIdeas(top: ThemeSummary[]): string[] {
  const ideas: string[] = [];
  for (const t of top) {
    const def = legend.themes.find((x) => x.id === t.id);
    if (def?.actions?.length) ideas.push(def.actions[0]);
    if (ideas.length >= 3) break;
  }
  // Top up from second-choice actions if fewer than 3 top themes.
  if (ideas.length < 3) {
    for (const t of top) {
      const def = legend.themes.find((x) => x.id === t.id);
      if (def?.actions?.[1]) ideas.push(def.actions[1]);
      if (ideas.length >= 3) break;
    }
  }
  return ideas.slice(0, 3);
}
