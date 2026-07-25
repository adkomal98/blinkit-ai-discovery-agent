# Test Cases — Blinkit Cross-Category Discovery Engine

## 1. Data Import (Phase 1 & 2)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1.1 | Run `npm run fetch:reviews` | Creates/overwrites `data/blinkit_reviews.csv` | ☐ |
| 1.2 | Multi-source tracking | CSV contains `source` column with multiple types | ☐ |
| 1.3 | CSV contains expected columns | `review_id,rating,title,text,date,app_version,helpful_count,source` | ☐ |
| 1.4 | No PII in CSV | Grep for emails, phones, PAN — none found | ☐ |

## 2. Theme Classification (Phase 3)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 2.1 | Review mentioning "reorder", "same items" | Classified as `habitual_reordering` | ☐ |
| 2.2 | Review mentioning "explore", "new product" | Classified as `category_discovery` | ☐ |
| 2.3 | Review mentioning "out of stock", "brand" | Classified as `product_range` | ☐ |
| 2.4 | ≤ 5 themes in output | Theme count never exceeds 5 | ☐ |

## 3. Discovery Report (Phase 4)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 3.1 | Note word count ≤ 250 | `countWords(stripMd(markdown)) <= 250` | ☐ |
| 3.2 | Exactly 3 top themes | `topThemes.length === 3` (or fewer if data sparse) | ☐ |
| 3.3 | Exactly 3 quotes | `quotes.length === 3` | ☐ |
| 3.4 | Exactly 3 action ideas | `actionIdeas.length === 3` | ☐ |

## 4. Chatbot (Phase 5)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 4.1 | Click chip "Why do users repeatedly buy..." | Bot answers using `habitual_reordering` data | ☐ |
| 4.2 | Free-text: "what frustrations emerge" | Bot highlights lowest-rated themes | ☐ |
| 4.3 | Free-text: "should I buy blinkit stock" | Bot refuses request with OUTSIDE SCOPE badge | ☐ |
| 4.4 | Send empty message | Send button disabled, no API call made | ☐ |
| 4.5 | Bot answer includes source info | Answer has "Source:" badge and real quotes | ☐ |

## 5. Offline Artifacts

| # | Test | Expected | Status |
|---|------|----------|--------|
| 5.1 | Run `npm run generate:note` | Creates `artifacts/discovery_report.md` | ☐ |
| 5.2 | Offline artifacts match web output | Content is identical (deterministic mode) | ☐ |

## 6. UI / UX

| # | Test | Expected | Status |
|---|------|----------|--------|
| 6.1 | Source Breakdown displayed | Shows Google Play, App Store, Reddit, etc. counts | ☐ |
| 6.2 | Blinkit branding visible | Yellow (#F8CB46) and green (#0C831F) accents | ☐ |
| 6.3 | Mobile responsive | Layout adapts on narrow screens | ☐ |
| 6.4 | Download .md works | Downloads `discovery_report.md` | ☐ |
