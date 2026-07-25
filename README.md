# Blinkit Discovery Engine 🚀

An AI-powered dashboard and insight engine built to answer one critical product question for Blinkit: **How do we increase the percentage of Monthly Active Customers (MACs) purchasing from at least one *new* category per month?**

This project aggregates, classifies, and analyzes thousands of cross-platform user reviews (Google Play, App Store, Reddit) to surface actionable friction points preventing users from exploring non-grocery categories (like Electronics, Beauty, and Pet Supplies).

## ✨ Features

- **Automated Data Pipeline**: Scrapes public reviews from Google Play, App Store, and social platforms, parsing out PII and standardizing the schema.
- **Hybrid Theme Classification**: A dual-engine classifier that uses Groq/Llama 3.1 LLM for nuanced classification of a 500-review sample, with deterministic keyword matching as fallback for all 20,000+ reviews. Categorizes into 5 strategic discovery themes.
- **Discovery Pulse Dashboard**: A beautifully designed 50/50 split UI that presents a weekly summary of themes alongside real verbatim user quotes.
- **AI FAQ Assistant (Gemini)**: An integrated chatbot that answers questions strictly based on the extracted offline dataset, preventing hallucinations and ensuring facts-only insights.

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router), React 18
- **Styling:** Tailwind CSS (with Typography plugin)
- **AI Integration:** Google Gemini (`@google/generative-ai`)
- **Data Scraping:** `google-play-scraper`, `app-store-scraper`, Puppeteer

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API key:
```env
GEMINI_API_KEY="your_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
```

### 3. Fetch Data & Generate Insights
Before running the app, you need to populate the data.

Fetch the latest reviews (this will pull up to 20,000 reviews from Google Play/App Store and merge manual web data):
```bash
npm run fetch:reviews
```

Categorize those reviews into the 5 strategic themes (runs LLM classifier first, then generates `artifacts/themes_summary.json`):
```bash
npm run generate:note
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## 📁 Project Structure

- `/app` - Next.js App Router pages and API routes (including the Chatbot API).
- `/components` - Reusable UI components (Theme Cards, ChatBot, Quotes).
- `/lib` - Core logic for categorization, noise-filtering, and AI prompts.
- `/scripts` - Offline Node.js scripts for scraping and data generation.
- `/data` - Raw and compiled `.csv` review datasets.
- `/artifacts` - Generated JSON summaries that power the frontend UI.

## 📈 The 5 Strategic Themes
The engine specifically hunts for reviews matching these strategic buckets:
1. **Trust & Risk**: Quality concerns, unfamiliar brands, and return/refund worries.
2. **Habit Formation**: Re-ordering lock-in, time-scarcity, and cognitive overload.
3. **Price Sensitivity**: New categories perceived as expensive, lack of first-time deals.
4. **Discovery & UX Gaps**: Bad search, hidden categories, poor browsing, missing product info.
5. **Category Signals**: Latent demand for non-core categories (Pet, Baby, Electronics, etc.).

## 🤝 Deployment
This app is designed to be statically deployed on platforms like **Vercel** or **Netlify**. For automated production updates, set up a GitHub Action cron job to run `fetch:reviews` and `generate:note` weekly.
