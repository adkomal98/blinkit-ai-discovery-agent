/** Prompt builders for the optional Claude pass — adapted for Blinkit cross-category discovery. */
import type { ThemeSummary } from "@/types";

export const SYSTEM_PROMPT = `You are a product analyst on the Growth Team at Blinkit, writing a weekly cross-category discovery pulse.
Your goal: surface insights about why users stick to the same categories and how to increase cross-category exploration.
Tone: concise, neutral, factual, decision-useful for Product/Growth/Marketing. No hype, no emojis.
Rules:
- Use ONLY the theme data and quotes provided. Do not invent numbers, features, or quotes.
- Never include any personal data (names, emails, phone numbers, IDs). If a quote contains a redaction token like [email] or [number], leave it as-is.
- Action ideas must be specific, concrete and shippable — name the lever (a flow, a nudge, a category, a discount mechanic), not a platitude.
- Each action idea should directly address increasing cross-category adoption.
- Keep everything tight. The final note must read in under 30 seconds.
Return STRICT JSON only, no prose around it.`;

export function buildUserPrompt(opts: {
  product: string;
  windowStart: string;
  windowEnd: string;
  totalReviews: number;
  avgRating: number;
  topThemes: ThemeSummary[];
}): string {
  const themes = opts.topThemes.map((t, i) => {
    const quotes = t.sampleQuotes.slice(0, 3).map((q) => `    - (${q.rating}★, ${q.date}) "${q.text}"`).join("\n");
    return `${i + 1}. ${t.name} — ${t.count} reviews, ${Math.round(t.share * 100)}% of categorised, avg ${t.avgRating.toFixed(2)}★\n   blurb: ${t.blurb}\n   quotes:\n${quotes}`;
  }).join("\n");

  return `Product: ${opts.product} (quick commerce)
Strategic goal: Increase % of MACs who purchase from ≥1 new category every month.
Window: ${opts.windowStart} to ${opts.windowEnd}
Reviews analysed: ${opts.totalReviews}, overall avg rating: ${opts.avgRating.toFixed(2)}★

Top discovery themes (already computed deterministically — do not re-rank):
${themes}

Produce JSON with this exact shape:
{
  "headline": "one sentence (<= 20 words) summarising this week's cross-category discovery signals",
  "actionIdeas": ["idea 1", "idea 2", "idea 3"]
}
Exactly 3 action ideas, each <= 30 words, each tied to one of the themes above. Each must be a concrete lever to increase cross-category exploration.`;
}
