/**
 * Optional Claude pass — runs ONLY server-side (API route). The app works fully
 * without it; when ANTHROPIC_API_KEY + USE_AI=true are set, Claude polishes the
 * headline and action ideas. No SDK dependency: we call the Messages API via fetch.
 */
import type { ThemeSummary } from "@/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import { redactPII } from "@/lib/safety";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function isAIEnabled(): boolean {
  return process.env.USE_AI === "true" && !!process.env.ANTHROPIC_API_KEY;
}

export interface ClaudeRefinement {
  headline: string;
  actionIdeas: string[];
}

export async function refineNote(input: {
  product: string;
  windowStart: string;
  windowEnd: string;
  totalReviews: number;
  avgRating: number;
  topThemes: ThemeSummary[];
}): Promise<ClaudeRefinement | null> {
  if (!isAIEnabled()) return null;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      }),
    });

    if (!res.ok) {
      console.warn("Claude call failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const text: string = (data?.content || []).map((b: any) => b?.text || "").join("").trim();
    const json = extractJSON(text);
    if (!json) return null;

    const headline = redactPII(String(json.headline || "")).slice(0, 200);
    const actionIdeas = Array.isArray(json.actionIdeas)
      ? json.actionIdeas.slice(0, 3).map((s: unknown) => redactPII(String(s)).slice(0, 280))
      : [];
    if (!headline || actionIdeas.length < 3) return null;
    return { headline, actionIdeas };
  } catch (e) {
    console.warn("Claude refinement error:", (e as Error)?.message);
    return null;
  }
}

/** Pull the first JSON object out of a model response (handles code fences). */
function extractJSON(text: string): any | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
