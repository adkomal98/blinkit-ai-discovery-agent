# Blinkit — Cross-Category Discovery Engine · Submission

## Product Chosen

**Blinkit** (quick-commerce platform). Android package: `com.grofers.customerapp`. iOS ID: `com.grofers.customerapp`.

## Strategic Goal

Increase the percentage of Monthly Active Customers who purchase products from at least one new category every month.

## Prototype

- Stack: Next.js (App Router) + TypeScript + Tailwind, deployable to Vercel.
- Local run: `npm install && npm run dev` → http://localhost:3000
- Deployed link: _add your Vercel URL here after deploying._

## The workflow (5 Phases)

### Phase 1 & 2: Data Gathering & Raw Data Compilation
`scripts/fetch_reviews.mjs` pulls real Blinkit reviews from **Google Play** and **Apple App Store** automatically,
and merges them with a curated multi-source dataset from **Reddit, Forums, and Social Media**.
The script strips **all PII** and writes a redacted CSV to `data/blinkit_reviews.csv` with a `source` column.

### Phase 3: Thematic Analysis & Discovery
Each review is classified into **≤ 5 discovery themes** by keyword match (`lib/theme-legend.json`,
the single source of truth). Themes are designed specifically for cross-category discovery analysis:
1. Habitual Reordering & Routine
2. Category Discovery & Browsing
3. Product Range & Availability
4. Pricing, Offers & Value
5. Delivery, Trust & Experience

### Phase 4: Insights & Opportunity Mapping
`lib/note.ts` builds the discovery pulse: top 3 themes, 3 representative real quotes,
3 concrete cross-category growth ideas, hard-capped at **250 words**.

### Phase 5: Validation Check
An **Interactive FAQ Chatbot** (`components/ChatBot.tsx`) lets product managers query the discovery insights directly.
Following the FAQ assistant pattern, it uses regex-based pattern matching on the thematic analysis data to answer questions about barriers, behaviors, and segments — supporting its answers with real user quotes and source metrics.

## Discovery Questions Addressed

| Question | How the engine addresses it |
| --- | --- |
| Why do users repeatedly buy from the same categories? | Chatbot KB ("Habitual Reordering & Routine") quantifies habit-loop signals |
| What prevents users from exploring new categories? | Chatbot KB ("Pricing" + "Trust") surfaces barriers |
| How do users discover products today? | Chatbot KB ("Category Discovery") measures current discovery satisfaction |
| What role do habits play in shopping behavior? | Chatbot KB ("Habitual Reordering" keywords + quotes) reveals routine intensity |
| What information do users need before trying a new category? | Chatbot KB cross-theme quotes surface trust, price, and quality concerns |
| What frustrations emerge repeatedly? | Chatbot KB dynamically highlights themes with lowest avg ratings |
| Which user segments are more likely to experiment? | Chatbot KB ("Category Discovery" positive reviews) reveals exploration-ready users |
| What unmet needs emerge consistently? | Chatbot KB ("Product Range & Availability" gaps) points to unfulfilled demand |

## Constraints honoured

- **Public review exports only** — Play Store, App Store, public forums; nothing behind a login.
- **Max 5 themes** — enforced by a fixed legend.
- **Notes scannable, ≤ 250 words** — hard word-budget trim in `lib/note.ts`.
- **No PII** — usernames + review IDs dropped; emails/phones/PAN/Aadhaar/account numbers redacted at extraction and again at runtime.

## Optional Claude support

Controlled by deployment env vars; the app works fully without them.

```
USE_AI=true
ANTHROPIC_API_KEY=your-claude-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

## Deliverables map

| Brief deliverable | This repo |
| --- | --- |
| Working prototype link / demo video | Next.js app (Vercel) + `submission/demo_script.md` |
| Discovery pulse report (PDF/Doc/MD) | `artifacts/discovery_report.md` |
| Chatbot interface for Q&A | `components/ChatBot.tsx` + `lib/chatbot.ts` |
| Reviews CSV used (sample/redacted) | `data/blinkit_reviews.csv` (includes source tracking) |
| README (re-run, theme legend) | `README.md` + `docs/theme-legend.md` |

## Re-run for a new week

```bash
npm run fetch:reviews     # fresh window of reviews
npm run generate:note     # regenerate note artifact
```
