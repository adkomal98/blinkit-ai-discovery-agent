/** Weekly Discovery Pulse Builder (Server-side) */
import type { Review, Quote, ThemeSummary, WeeklyNote } from "@/types";
import { summariseThemes } from "./themes";
import legend from "./theme-legend.json";

const PRODUCT = "Blinkit";
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

export async function buildWeeklyNote(reviews: Review[], generatedAt: string): Promise<WeeklyNote> {
  const rated = reviews.filter((r) => r.rating > 0);
  const avgRating = rated.reduce((a, r) => a + r.rating, 0) / (rated.length || 1);
  const dates = reviews.map((r) => r.date).filter(Boolean).sort();
  
  const allThemes = summariseThemes(reviews);
  
  // We need exactly 1 quote from each of the 5 themes (if available)
  const quotes: Quote[] = [];
  for (const t of allThemes) {
    if (t.sampleQuotes.length > 0) {
      quotes.push(t.sampleQuotes[0]);
    }
  }

  const headline = allThemes.length > 0 
    ? `Overall ${round(avgRating, 2)}★; cross-category discovery signals this week centre on ${allThemes.slice(0, 2).map((t) => t.name).join(" and ")}.`
    : `${PRODUCT} reviews are stable this week.`;

  return {
    product: PRODUCT,
    generatedAt,
    windowStart: dates[0] || "",
    windowEnd: dates[dates.length - 1] || "",
    totalReviews: reviews.length,
    avgRating: round(avgRating, 2),
    aiMode: "deterministic",
    headline,
    themes: allThemes, // All 5 themes
    quotes,
  };
}
