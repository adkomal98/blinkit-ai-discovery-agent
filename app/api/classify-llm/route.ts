import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadReviews } from "@/lib/reviews";

const MODEL = "llama-3.1-8b-instant";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SAMPLE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 4000;

function isClean(review: any) {
  const text = review.text.trim();
  if (text.length < 20) return false;
  if (/^[\p{Emoji}\s\p{P}]+$/u.test(text)) return false;
  const redactionCount = (text.match(/\[(email|phone|pan|id|number)\]/g) || []).length;
  if (redactionCount >= 3) return false;
  if (text.split(/\s+/).length <= 3) return false;
  return true;
}

function sampleReviews(cleanReviews: any[], n: number) {
  const shuffled = [...cleanReviews];
  let seed = Date.now();
  function seededRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

// Simple deterministic fallback scoring
function kwScore(text: string, keywords: string[]) {
  let s = 0;
  for (const kw of keywords) {
    if (kw.includes(" ")) { if (text.includes(kw)) s += 2; }
    else {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) s += 1;
    }
  }
  return s;
}

function keywordClassify(review: any, legend: any) {
  const text = `${review.title} ${review.text}`.toLowerCase();
  let bestId = legend.fallback.id, best = 0;
  for (const t of legend.themes) {
    const s = kwScore(text, t.keywords);
    if (s > best) { best = s; bestId = t.id; }
  }
  return bestId;
}

async function callGroq(prompt: string, groqApiKey: string, attempt = 1): Promise<any> {
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a review classifier. Respond ONLY with valid JSON. No markdown, no code fences, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 2048,
      }),
    });

    if (res.status === 429) {
      if (attempt <= MAX_RETRIES) {
        const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, wait));
        return callGroq(prompt, groqApiKey, attempt + 1);
      }
      throw new Error("Rate limit exceeded after max retries");
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response from Groq");

    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch (e: any) {
    if (attempt <= MAX_RETRIES && !e.message.includes("max retries")) {
      const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, wait));
      return callGroq(prompt, groqApiKey, attempt + 1);
    }
    throw e;
  }
}

export async function POST() {
  try {
    const groqApiKey = process.env.CLASSIFICATION_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "CLASSIFICATION_API_KEY not configured on server" }, { status: 500 });
    }

    const root = process.cwd();
    const legend = JSON.parse(readFileSync(join(root, "lib", "theme-legend.json"), "utf8"));
    const THEME_IDS = legend.themes.map((t: any) => t.id);
    const FALLBACK_ID = legend.fallback.id;

    const allReviews = loadReviews();
    const cleanReviews = allReviews.filter(isClean);
    const sample = sampleReviews(cleanReviews, SAMPLE_SIZE);

    const themeDescriptions = legend.themes
      .map((t: any) => `- "${t.id}": ${t.name} — ${t.blurb}`)
      .join("\n");

    const reviewList = sample
      .map((r, i) => `[${i}] "${r.title} ${r.text}"`)
      .join("\n");

    const prompt = `Classify each review below into exactly ONE of these theme IDs:

${themeDescriptions}
- "${FALLBACK_ID}": General Feedback — does not match any theme above

Reviews:
${reviewList}

Return a JSON array of objects: [{"i": 0, "theme": "theme_id"}, {"i": 1, "theme": "theme_id"}, ...].
Use ONLY the exact theme IDs listed above. Return ONLY the JSON array, nothing else.`;

    let classificationMethod = "keyword_fallback";
    const classifiedReviews: any[] = [];

    try {
      const results = await callGroq(prompt, groqApiKey);
      if (!Array.isArray(results)) throw new Error("LLM did not return an array");

      classificationMethod = "llm";
      for (const item of results) {
        const idx = item.i;
        const themeId = item.theme;
        if (idx >= 0 && idx < sample.length && (THEME_IDS.includes(themeId) || themeId === FALLBACK_ID)) {
          const r = sample[idx];
          const themeDef = legend.themes.find((t: any) => t.id === themeId);
          classifiedReviews.push({
            ...r,
            theme_id: themeId,
            theme_name: themeDef?.name || legend.fallback.name,
            method: "llm",
          });
        }
      }

      for (let j = 0; j < sample.length; j++) {
        if (!classifiedReviews.find(cr => cr.review_id === sample[j].review_id)) {
          const themeId = keywordClassify(sample[j], legend);
          const themeDef = legend.themes.find((t: any) => t.id === themeId);
          classifiedReviews.push({
            ...sample[j],
            theme_id: themeId,
            theme_name: themeDef?.name || legend.fallback.name,
            method: "keyword_gap_fill",
          });
        }
      }

    } catch (e: any) {
      console.warn("LLM failed in API route:", e.message);
      classificationMethod = "keyword_fallback";
      for (const r of sample) {
        const themeId = keywordClassify(r, legend);
        const themeDef = legend.themes.find((t: any) => t.id === themeId);
        classifiedReviews.push({
          ...r,
          theme_id: themeId,
          theme_name: themeDef?.name || legend.fallback.name,
          method: "keyword_fallback",
        });
      }
    }

    const output = {
      generatedAt: new Date().toISOString(),
      model: classificationMethod === "llm" ? MODEL : "keyword_fallback",
      method: classificationMethod,
      totalClassified: classifiedReviews.length,
      reviews: classifiedReviews,
    };

    const isVercel = process.env.VERCEL === "1";
    const outPath = isVercel 
      ? "/tmp/llm_classified_sample.json" 
      : join(root, "data", "llm_classified_sample.json");
      
    writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

    return NextResponse.json({ success: true, method: classificationMethod });
  } catch (e: any) {
    console.error("API error during classify-llm:", e);
    return NextResponse.json({ error: e.message || "Failed to run LLM classification" }, { status: 500 });
  }
}
