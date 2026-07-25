/**
 * llm-classifier.mjs — LLM-powered theme classification via Groq (Llama 3.1 8B).
 *
 * Pipeline:
 *   1. Load all reviews from CSV
 *   2. Remove noise (too short, only emojis, PII-heavy, etc.)
 *   3. Sample 50 clean reviews
 *   4. Send 1 batch of 50 to Groq for classification
 *   5. If LLM succeeds → save to data/llm_classified_sample.json (no keyword fallback)
 *   6. If LLM fails → fall back to keyword classification for those 50
 *
 * Usage:  CLASSIFICATION_API_KEY=... node scripts/llm-classifier.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------- Load env from .env.local ----------
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

const GROQ_API_KEY = process.env.CLASSIFICATION_API_KEY;
if (!GROQ_API_KEY) {
  console.error("ERROR: CLASSIFICATION_API_KEY not found in environment or .env.local");
  process.exit(1);
}

const MODEL = "llama-3.1-8b-instant";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SAMPLE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 4000;

// ---------- Load theme legend ----------
const legend = JSON.parse(readFileSync(join(ROOT, "lib", "theme-legend.json"), "utf8"));
const THEME_IDS = legend.themes.map(t => t.id);
const FALLBACK_ID = legend.fallback.id;

// ---------- CSV parser ----------
function parseCSV(content) {
  const rows = []; let field = "", row = [], inQ = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQ) {
      if (c === '"') { if (content[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && content[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const PII = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]"],
  [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[pan]"],
  [/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[id]"],
  [/(\+?91[\-\s]?)?[6-9]\d{9}\b/g, "[phone]"],
  [/\b\d{9,18}\b/g, "[number]"],
];
const redact = (t) => { let s = (t || "").replace(/\s+/g, " ").trim(); for (const [re, r] of PII) s = s.replace(re, r); return s; };

function loadReviews() {
  const rows = parseCSV(readFileSync(join(ROOT, "data", "blinkit_reviews.csv"), "utf8"));
  const h = rows[0].map((x) => x.trim());
  const ix = (n) => h.indexOf(n);
  return rows.slice(1).filter((r) => r.length > 1).map((r, i) => ({
    index: i,
    review_id: r[ix("review_id")] || `R${i}`,
    rating: Number(r[ix("rating")]) || 0,
    title: redact(r[ix("title")] || ""),
    text: redact(r[ix("text")] || ""),
    date: r[ix("date")] || "",
    source: (r[ix("source")] || "google_play").trim(),
    helpful_count: Number(r[ix("helpful_count")]) || 0,
  })).filter((r) => r.text.trim().length > 0);
}

// ---------- Noise filter ----------
function isClean(review) {
  const text = review.text.trim();
  if (text.length < 20) return false;
  if (/^[\p{Emoji}\s\p{P}]+$/u.test(text)) return false;
  const redactionCount = (text.match(/\[(email|phone|pan|id|number)\]/g) || []).length;
  if (redactionCount >= 3) return false;
  if (text.split(/\s+/).length <= 3) return false;
  return true;
}

// ---------- Keyword fallback classifier ----------
function kwScore(text, keywords) {
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

function keywordClassify(review) {
  const text = `${review.title} ${review.text}`.toLowerCase();
  let bestId = FALLBACK_ID, best = 0;
  for (const t of legend.themes) {
    const s = kwScore(text, t.keywords);
    if (s > best) { best = s; bestId = t.id; }
  }
  return bestId;
}

// ---------- Groq API call with retries ----------
async function callGroq(prompt, attempt = 1) {
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
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
        console.warn(`  ⏳ Rate limited. Retrying in ${wait / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, wait));
        return callGroq(prompt, attempt + 1);
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
  } catch (e) {
    if (attempt <= MAX_RETRIES && !e.message.includes("max retries")) {
      const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`  ⚠️  Error: ${e.message}. Retrying in ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      return callGroq(prompt, attempt + 1);
    }
    throw e;
  }
}

// ---------- Build classification prompt ----------
function buildPrompt(batch) {
  const themeDescriptions = legend.themes
    .map(t => `- "${t.id}": ${t.name} — ${t.blurb}`)
    .join("\n");

  const reviewList = batch
    .map((r, i) => `[${i}] "${r.title} ${r.text}"`)
    .join("\n");

  return `Classify each review below into exactly ONE of these theme IDs:

${themeDescriptions}
- "${FALLBACK_ID}": General Feedback — does not match any theme above

Reviews:
${reviewList}

Return a JSON array of objects: [{"i": 0, "theme": "theme_id"}, {"i": 1, "theme": "theme_id"}, ...].
Use ONLY the exact theme IDs listed above. Return ONLY the JSON array, nothing else.`;
}

// ---------- Deterministic sampling ----------
function sampleReviews(cleanReviews, n) {
  const shuffled = [...cleanReviews];
  let seed = 42;
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

// ---------- Main ----------
async function main() {
  console.log("🧠 LLM Theme Classifier (Groq / Llama 3.1 8B)");
  console.log("================================================\n");

  // Step 1: Load reviews
  const allReviews = loadReviews();
  console.log(`📄 Loaded ${allReviews.length} total reviews from CSV`);

  // Step 2: Remove noise
  const cleanReviews = allReviews.filter(isClean);
  console.log(`🧹 After noise removal: ${cleanReviews.length} clean reviews`);

  // Step 3: Sample 50
  const sample = sampleReviews(cleanReviews, SAMPLE_SIZE);
  console.log(`🎯 Sampled ${sample.length} reviews for LLM classification\n`);

  // Step 4: Send 1 batch of 50 to Groq
  let classificationMethod = "keyword_fallback";
  const classifiedReviews = [];

  console.log(`🔄 Sending batch of ${sample.length} reviews to Groq...`);
  try {
    const prompt = buildPrompt(sample);
    const results = await callGroq(prompt);

    if (!Array.isArray(results)) throw new Error("LLM did not return an array");

    // LLM succeeded — use LLM classifications
    classificationMethod = "llm";
    for (const item of results) {
      const idx = item.i;
      const themeId = item.theme;
      if (idx >= 0 && idx < sample.length && (THEME_IDS.includes(themeId) || themeId === FALLBACK_ID)) {
        const r = sample[idx];
        const themeDef = legend.themes.find(t => t.id === themeId);
        classifiedReviews.push({
          review_id: r.review_id,
          rating: r.rating,
          title: r.title,
          text: r.text,
          date: r.date,
          source: r.source,
          theme_id: themeId,
          theme_name: themeDef?.name || legend.fallback.name,
          method: "llm",
        });
      }
    }

    // Fill any missing indices with LLM fallback
    for (let j = 0; j < sample.length; j++) {
      if (!classifiedReviews.find(cr => cr.review_id === sample[j].review_id)) {
        const themeId = keywordClassify(sample[j]);
        const themeDef = legend.themes.find(t => t.id === themeId);
        classifiedReviews.push({
          review_id: sample[j].review_id,
          rating: sample[j].rating,
          title: sample[j].title,
          text: sample[j].text,
          date: sample[j].date,
          source: sample[j].source,
          theme_id: themeId,
          theme_name: themeDef?.name || legend.fallback.name,
          method: "keyword_gap_fill",
        });
      }
    }

    console.log(`  ✅ LLM classification succeeded!`);

  } catch (e) {
    // LLM failed — fall back to keyword classification for all 50
    console.warn(`  ❌ LLM failed: ${e.message}`);
    console.log(`  🔧 Falling back to keyword classification...`);
    classificationMethod = "keyword_fallback";

    for (const r of sample) {
      const themeId = keywordClassify(r);
      const themeDef = legend.themes.find(t => t.id === themeId);
      classifiedReviews.push({
        review_id: r.review_id,
        rating: r.rating,
        title: r.title,
        text: r.text,
        date: r.date,
        source: r.source,
        theme_id: themeId,
        theme_name: themeDef?.name || legend.fallback.name,
        method: "keyword_fallback",
      });
    }
  }

  // Step 5: Save to separate file
  const output = {
    generatedAt: new Date().toISOString(),
    model: classificationMethod === "llm" ? MODEL : "keyword_fallback",
    method: classificationMethod,
    totalClassified: classifiedReviews.length,
    reviews: classifiedReviews,
  };

  const outPath = join(ROOT, "data", "llm_classified_sample.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

  // Print summary
  const dist = {};
  for (const r of classifiedReviews) {
    dist[r.theme_name] = (dist[r.theme_name] || 0) + 1;
  }

  console.log(`\n================================================`);
  console.log(`✅ Classification complete! (Method: ${classificationMethod})`);
  console.log(`   Total: ${classifiedReviews.length} reviews`);
  console.log(`   Saved to: ${outPath}`);
  console.log(`\n📊 Theme distribution:`);
  for (const [name, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${name}: ${count}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
