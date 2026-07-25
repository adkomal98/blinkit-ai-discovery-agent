# Demo Script — Blinkit Cross-Category Discovery Engine

## Setup (one-time)

```bash
npm install
npm run fetch:reviews   # pulls real Blinkit reviews and merges manual data
npm run dev             # starts the app at http://localhost:3000
```

## Walkthrough (~3 minutes)

### 1. Landing / Sources (0:00 – 0:30)

Open http://localhost:3000.

**Point out:**
- Blinkit branding (yellow/green) and the strategic goal banner.
- The new **Data Sources** breakdown showing reviews aren't just from Google Play, but also Apple App Store, Reddit, Twitter, and Community Forums.

### 2. Top 3 Discovery Themes & Quotes (0:30 – 1:15)

Scroll through the themes and quotes.

**Point out:**
- Each theme is specifically designed to surface cross-category exploration barriers.
- Progress bars show share of categorised reviews.
- Each quote is a real, PII-free review, tagged with its source (e.g. reddit, google_play).

### 3. Cross-Category Growth Ideas (1:15 – 1:45)

Scroll to "3 Cross-Category Growth Ideas."

**Point out:**
- Each idea is a concrete, shippable lever for the Growth Team tied directly to the data.

### 4. Interactive FAQ Chatbot (1:45 – 2:30)

Scroll to the **Discovery FAQ Assistant**.

**Action:**
1. Click the chip: *"Why do users repeatedly buy from the same categories?"*
2. Wait for the thinking animation.
3. Show how the bot answers using the `Habitual Reordering` theme data, appending real quotes and a source badge.
4. Type a free-text question: *"What frustrations emerge repeatedly?"*
5. Show how the bot dynamically calculates the lowest-rated themes and surfaces them.
6. Type: *"Should I buy HDFC stock?"* to show the refusal guardrail (OUTSIDE SCOPE badge).

### 5. Markdown Report & Re-run (2:30 – 3:00)

- Click "View" on the markdown section to show the ≤250-word note with the word budget badge.
- Explain that `npm run fetch:reviews` and `npm run generate:note` refresh everything offline.
