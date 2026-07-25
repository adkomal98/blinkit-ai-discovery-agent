import { NextResponse } from "next/server";
import { loadReviews } from "@/lib/reviews";
import { summariseThemes } from "@/lib/themes";
import { generateChatAnswer } from "@/lib/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { question } = (await req.json()) as { question: string };
    
    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Missing question." }, { status: 400 });
    }
    
    // In a real production app, we would cache this analysis
    // For this prototype, we load and summarise per request to keep it stateless
    const reviews = loadReviews();
    const allThemes = summariseThemes(reviews);
    
    // Generate AI response
    const response = await generateChatAnswer(question, allThemes);
    
    return NextResponse.json(response);
  } catch (e) {
    console.error("chatbot failed:", e);
    return NextResponse.json({ error: "Failed to process question." }, { status: 500 });
  }
}
