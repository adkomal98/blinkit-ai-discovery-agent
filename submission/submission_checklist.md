# Submission Checklist

## Core Requirements

- [x] AI-powered system that analyses user feedback at scale
- [x] Multi-source data (Google Play, App Store, Reddit, Forums, Social)
- [x] Discovery themes focused on cross-category exploration
- [x] Real user quotes selected deterministically
- [x] Concrete, shippable action ideas for the Growth Team
- [x] All PII removed (names, emails, phones, IDs)
- [x] Interactive FAQ Chatbot for querying insights

## Discovery Engine — 5 Phases

- [x] **Phase 1: Data Gathering** — `scripts/fetch_reviews.mjs` fetches and merges multi-source data
- [x] **Phase 2: Raw Data Compilation** — `data/blinkit_reviews.csv` (redacted, sourced)
- [x] **Phase 3: Thematic Analysis** — 5 discovery themes in `lib/theme-legend.json`
- [x] **Phase 4: Insights & Opportunity Mapping** — Discovery pulse report
- [x] **Phase 5: Validation Check** — Interactive Chatbot replacing static email

## Deliverables

- [x] Working prototype (Next.js app)
- [x] Discovery pulse report (`artifacts/discovery_report.md`)
- [x] Chatbot implementation (`components/ChatBot.tsx`, `lib/chatbot.ts`)
- [x] Reviews CSV (`data/blinkit_reviews.csv`)
- [x] README with re-run instructions
- [x] Theme legend documentation (`docs/theme-legend.md`)
- [x] Demo script (`submission/demo_script.md`)
- [x] Test cases (`submission/test_cases.md`)

## Technical Constraints

- [x] ≤ 5 themes
- [x] Note ≤ 250 words (hard budget)
- [x] No PII in any artifact
- [x] Optional Claude support (works fully without it)
- [x] Re-runnable for a new week (`npm run fetch:reviews && npm run generate:note`)
