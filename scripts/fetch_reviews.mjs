/**
 * fetch_reviews.mjs — Reproducible Blinkit review extractor (Multi-source).
 *
 * Pulls reviews from Google Play and Apple App Store (public data),
 * and merges them with a pre-compiled dataset of Reddit, Twitter, and forum discussions.
 *
 * Re-run for a new week:
 *   npm run fetch:reviews
 * Tune the window / volume with env vars:
 *   WEEKS=12 TARGET=900 npm run fetch:reviews
 *
 * Output columns: review_id,rating,title,text,date,app_version,helpful_count,source
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import gplay from "google-play-scraper";
import appStore from "app-store-scraper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const APP_ID = process.env.APP_ID || "com.grofers.customerapp"; // Blinkit Play
const IOS_APP_ID = Number(process.env.IOS_APP_ID || 1116666498); // Blinkit App Store numeric ID
const WEEKS = Number(process.env.WEEKS || 12);
const TARGET = Number(process.env.TARGET || 600); // reduced target per store to keep CSV small
const HARD_CAP = Number(process.env.HARD_CAP || 4000);
const COUNTRY = process.env.COUNTRY || "in";
const LANG = process.env.LANG || "en";
const OUT = join(ROOT, "data", "blinkit_reviews.csv");
const MANUAL_DATA = join(ROOT, "data", "web_reviews.csv");

const cutoff = new Date(Date.now() - WEEKS * 7 * 24 * 60 * 60 * 1000);

const PII_PATTERNS = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]"],
  [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[pan]"],
  [/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[id]"],
  [/(\+?91[\-\s]?)?[6-9]\d{9}\b/g, "[phone]"],
  [/\b\d{9,18}\b/g, "[number]"],
];

function redact(text) {
  let t = (text || "").replace(/\s+/g, " ").trim();
  for (const [re, rep] of PII_PATTERNS) t = t.replace(re, rep);
  return t;
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCSV(content) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && content[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchGooglePlay() {
  console.log(`\nFetching Google Play reviews...`);
  let collected = [];
  let token = undefined;
  let stop = false;
  let pages = 0;

  while (!stop && collected.length < HARD_CAP) {
    try {
      const res = await gplay.reviews({
        appId: APP_ID,
        sort: gplay.sort.NEWEST,
        country: COUNTRY,
        lang: LANG,
        num: 150,
        paginate: true,
        nextPaginationToken: token,
      });
      const batch = res.data || [];
      if (batch.length === 0) break;
      pages++;

      for (const r of batch) {
        const when = r.date ? new Date(r.date) : null;
        if (when && when < cutoff) { stop = true; break; }
        collected.push(r);
        if (collected.length >= HARD_CAP) break;
      }
      token = res.nextPaginationToken;
      if (!token) break;
      if (pages % 5 === 0) console.log(`  ...${collected.length} fetched (${pages} pages)`);
    } catch (e) {
      console.warn("  Google Play fetch error:", e.message);
      break;
    }
  }

  // Sort newest -> oldest.
  collected.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (collected.length > TARGET) {
    const stride = collected.length / TARGET;
    const sampled = [];
    for (let i = 0; i < TARGET; i++) sampled.push(collected[Math.floor(i * stride)]);
    collected = sampled;
  }

  return collected.map((r) => ({
    rating: r.score ?? "",
    title: redact(r.title || ""),
    text: redact(r.text || ""),
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
    app_version: r.version || "",
    helpful_count: r.thumbsUp ?? 0,
    source: "google_play"
  })).filter((r) => r.text.length > 0);
}

async function fetchAppStore() {
  console.log(`\nFetching App Store reviews...`);
  let collected = [];
  try {
    // Fetch up to 10 pages of App Store reviews
    for (let page = 1; page <= 10; page++) {
      const res = await appStore.reviews({
        id: IOS_APP_ID,
        sort: appStore.sort.RECENT,
        country: COUNTRY,
        page,
      });
      if (!res || res.length === 0) break;
      
      let hitCutoff = false;
      for (const r of res) {
        const when = r.updated ? new Date(r.updated) : new Date();
        if (when < cutoff) { hitCutoff = true; break; }
        collected.push({
          rating: r.score ?? "",
          title: redact(r.title || ""),
          text: redact(r.text || ""),
          date: when.toISOString().slice(0, 10),
          app_version: r.version || "",
          helpful_count: 0,
          source: "app_store"
        });
      }
      if (hitCutoff) break;
      console.log(`  ...page ${page}: ${collected.length} App Store reviews so far`);
    }
  } catch (e) {
    console.warn("  App Store fetch error:", e.message);
  }
  
  console.log(`  Total App Store reviews: ${collected.length}`);
  return collected;
}

function loadManualData() {
  console.log(`\nLoading manual multi-source data from ${MANUAL_DATA}`);
  if (!existsSync(MANUAL_DATA)) {
    console.warn("  File not found.");
    return [];
  }
  const content = readFileSync(MANUAL_DATA, "utf8");
  const rows = parseCSV(content);
  if (rows.length < 2) return [];
  
  const header = rows[0].map(h => h.trim());
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    out.push({
      rating: Number(r[header.indexOf("rating")]) || "",
      title: r[header.indexOf("title")] || "",
      text: r[header.indexOf("text")] || "",
      date: r[header.indexOf("date")] || "",
      app_version: r[header.indexOf("app_version")] || "",
      helpful_count: Number(r[header.indexOf("helpful_count")]) || 0,
      source: (r[header.indexOf("source")] || "google_play").trim()
    });
  }
  return out;
}

async function main() {
  console.log(`Blinkit Multi-Source Discovery Data Fetcher`);
  console.log(`Window: since ${cutoff.toISOString().slice(0, 10)}\n`);

  const playData = await fetchGooglePlay();
  const iosData = await fetchAppStore();
  const manualData = loadManualData();

  const allRows = [...playData, ...iosData, ...manualData];
  
  // Sort all by date desc
  allRows.sort((a, b) => new Date(b.date) - new Date(a.date));

  const header = "review_id,rating,title,text,date,app_version,helpful_count,source";
  const lines = allRows.map((r, i) => {
    const id = "R" + String(i + 1).padStart(4, "0");
    return [id, r.rating, r.title, r.text, r.date, r.app_version, r.helpful_count, r.source]
      .map(csvCell)
      .join(",");
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, header + "\n" + lines.join("\n") + "\n", "utf8");

  const counts = {};
  allRows.forEach(r => { counts[r.source] = (counts[r.source] || 0) + 1; });

  console.log(`\nWrote ${allRows.length} total reviews -> ${OUT}`);
  console.log("Source Breakdown:", counts);
}

main().catch((e) => {
  console.error("Fetch failed:", e?.message || e);
  process.exit(1);
});
