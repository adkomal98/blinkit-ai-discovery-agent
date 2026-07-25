import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadReviews, getSourceBreakdown } from "@/lib/reviews";
import { summariseThemes } from "@/lib/themes";
import { buildWeeklyNote } from "@/lib/note";
import type { AnalyzeResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const method = url.searchParams.get("method") || "keyword";

    let reviews = loadReviews();

    if (method === "llm") {
      const llmPath = join(process.cwd(), "data", "llm_classified_sample.json");
      if (existsSync(llmPath)) {
        const data = JSON.parse(readFileSync(llmPath, "utf8"));
        reviews = data.reviews;
      } else {
        return NextResponse.json({ error: "LLM sample data not found. Run npm run classify:llm first." }, { status: 404 });
      }
    }

    const generatedAt = new Date().toISOString().slice(0, 10);
    const note = await buildWeeklyNote(reviews, generatedAt);
    const allThemes = summariseThemes(reviews);
    const sourceBreakdown = getSourceBreakdown(reviews);
    const payload: AnalyzeResponse = { note, allThemes, sourceBreakdown };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("analyze failed:", e);
    return NextResponse.json({ error: "Failed to analyse reviews." }, { status: 500 });
  }
}
