import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadReviews } from "@/lib/reviews";
import { summariseThemes } from "@/lib/themes";
import { generateChatAnswer } from "@/lib/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { question, method = "keyword" } = (await req.json()) as { question: string; method?: string };
    
    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Missing question." }, { status: 400 });
    }
    
    let reviews = loadReviews();

    if (method === "llm") {
      const llmPath = join(process.cwd(), "data", "llm_classified_sample.json");
      if (existsSync(llmPath)) {
        const data = JSON.parse(readFileSync(llmPath, "utf8"));
        reviews = data.reviews;
      }
    }

    const allThemes = summariseThemes(reviews);
    
    // Generate AI response
    const response = await generateChatAnswer(question, allThemes);
    
    return NextResponse.json(response);
  } catch (e) {
    console.error("chatbot failed:", e);
    return NextResponse.json({ error: "Failed to process question." }, { status: 500 });
  }
}
