# Blinkit Discovery Engine 🚀

An AI-powered dashboard and insight engine built to answer one critical product question for Blinkit: **How do we increase the percentage of Monthly Active Customers (MACs) purchasing from at least one *new* category per month?**

This project aggregates, classifies, and analyzes thousands of cross-platform user reviews (Google Play, App Store, Reddit) to surface actionable friction points preventing users from exploring non-grocery categories (like Electronics, Beauty, and Pet Supplies).

## ✨ Features

- **Automated Data Pipeline**: Scrapes public reviews from Google Play, App Store, and social platforms, parsing out PII and standardizing the schema.
- **Dual-Engine Classification**: Explore data through two distinct lenses:
  - **Keyword Deterministic**: Fast, regex-based fallback engine that classifies all 20,000+ reviews.
  - **Dynamic LLM Sampling**: An on-demand pipeline that hits Groq (Llama 3.1) to intelligently classify a random sample of 200 clean reviews, falling back gracefully on rate limits.
- **Discovery Pulse Dashboard**: A beautifully designed split UI that lets you instantly toggle between the Full Dataset and the LLM Sample Dataset to compare theme distribution and real verbatim quotes.
- **Context-Aware AI Assistant (Gemini)**: An integrated chatbot that answers questions strictly based on whichever dataset you currently have active, preventing hallucinations and ensuring facts-only insights.

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router), React 18
- **Styling:** Tailwind CSS (with Typography plugin)
- **AI Integration:** Google Gemini (`@google/generative-ai`), Groq (Llama 3.1 8B)
- **Data Scraping:** `google-play-scraper`, `app-store-scraper`, Puppeteer

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory and add your API keys:
```env
CHATBOT_API_KEY="your_api_key_here"
CLASSIFICATION_API_KEY="your_groq_api_key_here"
```

### 3. Fetch Data & Generate Insights
Before running the app, you need to populate the base data.

Fetch the latest reviews (this will pull up to 20,000 reviews from Google Play/App Store and merge manual web data):
```bash
npm run fetch:reviews
```

Categorize those reviews using the deterministic keyword engine (generates `artifacts/themes_summary.json`):
```bash
npm run generate:note
```

*(Note: The LLM classification for the 200-review sample is triggered dynamically from the UI via the Next.js API, or manually via `npm run classify:llm`).*

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
