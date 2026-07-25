import { NextResponse } from "next/server";
import { loadReviews, getSourceBreakdown } from "@/lib/reviews";
import { summariseThemes } from "@/lib/themes";
import { buildWeeklyNote } from "@/lib/note";
import type { AnalyzeResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = loadReviews();
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
