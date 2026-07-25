/**
 * generate_artifacts.mjs — Offline discovery-report generator.
 *
 * Reproduces the app's DETERMINISTIC pipeline directly from the CSV so
 * submission metrics can be regenerated without running the Next.js server:
 *   npm run generate:note
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const legend = JSON.parse(readFileSync(join(ROOT, "lib", "theme-legend.json"), "utf8"));
const PRODUCT = "Blinkit";

// ---------- CSV ----------
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
    review_id: r[ix("review_id")] || `R${String(i + 1).padStart(4, "0")}`,
    rating: Number(r[ix("rating")]) || 0,
    title: redact(r[ix("title")] || ""),
    text: redact(r[ix("text")] || ""),
    date: r[ix("date")] || "",
    source: (r[ix("source")] || "google_play").trim(),
    helpful_count: Number(r[ix("helpful_count")]) || 0,
  })).filter((r) => r.text.trim().length > 0);
}

// ---------- themes ----------
function kwScore(text, keywords) {
  let s = 0;
  for (const kw of keywords) {
    if (kw.includes(" ")) { if (text.includes(kw)) s += 2; }
    else { const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"); if (re.test(text)) s += 1; }
  }
  return s;
}
function classify(r) {
  const text = `${r.title} ${r.text}`.toLowerCase();
  let bestId = legend.fallback.id, best = 0;
  for (const t of legend.themes) {
    const s = kwScore(text, t.keywords);
    if (s > best) { best = s; bestId = t.id; }
  }
  return bestId;
}
function pickQuotes(reviews, themeName, keywords, n) {
  const scored = reviews.map((r) => {
    const text = r.text.trim(), len = text.length, kw = kwScore(text.toLowerCase(), keywords);
    let score = kw * 3;
    if (len >= 40 && len <= 240) score += 4; else if (len > 240 && len <= 360) score += 1; else score -= 3;
    if (/\[(email|phone|pan|id|number)\]/.test(text)) score -= 2;
    if (r.helpful_count > 0) score += Math.min(r.helpful_count, 3);
    return { r, score, len };
  }).filter((x) => x.len >= 20 && x.len <= 360).sort((a, b) => b.score - a.score || b.r.date.localeCompare(a.r.date));
  const out = [], seen = new Set();
  for (const { r } of scored) {
    const key = r.text.slice(0, 40).toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    out.push({ text: r.text.trim(), rating: r.rating, date: r.date, theme: themeName, source: r.source });
    if (out.length >= n) break;
  }
  return out;
}
function summarise(reviews) {
  const by = new Map();
  for (const r of reviews) { const id = classify(r); (by.get(id) || by.set(id, []).get(id)).push(r); }
  const categorised = reviews.length - (by.get(legend.fallback.id)?.length || 0);
  const out = [];
  for (const t of legend.themes) {
    const g = by.get(t.id) || []; if (!g.length) continue;
    out.push({ id: t.id, name: t.name, blurb: t.blurb, count: g.length,
      share: categorised ? g.length / categorised : 0,
      avgRating: g.reduce((a, r) => a + r.rating, 0) / g.length,
      sampleQuotes: pickQuotes(g, t.name, t.keywords, 3) });
  }
  return out.sort((a, b) => b.count - a.count);
}

// ---------- main ----------
const generatedAt = new Date().toISOString().slice(0, 10);
const reviews = loadReviews();
const allThemes = summarise(reviews);
const dates = reviews.map(r => r.date).filter(Boolean).sort();
const windowStart = dates[0];
const windowEnd = dates[dates.length - 1];

const json = JSON.stringify({
  product: PRODUCT,
  generatedAt,
  windowStart,
  windowEnd,
  totalReviews: reviews.length,
  themes: allThemes
}, null, 2);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts", "themes_summary.json"), json, "utf8");

console.log(`Analysed ${reviews.length} multi-source reviews (${windowStart} → ${windowEnd}).`);
console.log(`Themes found: ${allThemes.map((t) => `${t.name}(${t.count})`).join(", ")}`);
console.log(`Wrote artifacts/themes_summary.json`);
