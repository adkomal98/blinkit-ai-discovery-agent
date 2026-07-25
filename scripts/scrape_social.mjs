import puppeteer from 'puppeteer';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "data", "web_reviews.csv");

function csvCell(v) {
  const s = String(v ?? "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function scrapeReddit() {
  console.log("Launching Puppeteer for Reddit scraping...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  console.log("Navigating to Reddit search...");
  await page.goto("https://www.reddit.com/search/?q=Blinkit&sort=new", { waitUntil: 'networkidle2' });
  
  console.log("Extracting posts...");
  // Wait for post elements (can vary by Reddit's A/B testing UI)
  await new Promise(r => setTimeout(r, 3000));
  
  const posts = await page.evaluate(() => {
    // Attempt to grab post elements in Reddit's modern redesign
    const postEls = Array.from(document.querySelectorAll('shreddit-post, .Post'));
    return postEls.map(el => {
      const title = el.getAttribute('post-title') || el.querySelector('h3, [slot="title"]')?.innerText || "";
      let text = el.querySelector('[slot="text-body"], .RichTextJSON-root')?.innerText || "";
      const upvotes = parseInt(el.getAttribute('score') || "0") || 0;
      
      // Filter out empty posts
      if (!title) return null;
      
      return { title, text, upvotes };
    }).filter(p => p !== null);
  });
  
  await browser.close();
  console.log(`Found ${posts.length} Reddit posts.`);
  
  return posts.map(p => ({
    rating: "",
    title: p.title,
    text: p.text,
    date: new Date().toISOString().slice(0, 10), // approximate
    app_version: "",
    helpful_count: p.upvotes,
    source: "reddit"
  }));
}

async function scrapeTwitter() {
  console.log("Attempting Twitter/X scrape (Note: Likely blocked without auth)...");
  return [];
}

async function main() {
  const redditData = await scrapeReddit();
  const twitterData = await scrapeTwitter();
  const allRows = [...redditData, ...twitterData];
  
  if (allRows.length === 0) {
    console.log("No data found to append.");
    return;
  }
  
  let headerWritten = existsSync(OUT);
  if (!headerWritten) {
    writeFileSync(OUT, "rating,title,text,date,app_version,helpful_count,source\n", "utf8");
  }
  
  const lines = allRows.map(r => {
    return [r.rating, r.title, r.text, r.date, r.app_version, r.helpful_count, r.source]
      .map(csvCell)
      .join(",");
  });
  
  appendFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log(`Successfully appended ${allRows.length} new records to ${OUT}`);
}

main().catch(console.error);
