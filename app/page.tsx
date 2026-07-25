"use client";
import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/types";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeCard } from "@/components/ThemeCard";
import { QuoteCard } from "@/components/QuoteCard";
import { ChatBot } from "@/components/ChatBot";

export default function Home() {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError("Could not load analysis."));
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* LEFT HALF */}
      <main className="w-1/2 overflow-y-auto border-r border-gray-200 bg-white p-6">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blinkit-300 text-lg font-black text-blinkit-ink">B</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blinkit — Cross-Category Discovery Engine</h1>
              <p className="text-sm text-gray-500">AI-powered insights from public user reviews</p>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-500">
            Goal: Increase % of MACs purchasing from ≥1 new category/month · Facts only from public reviews · No PII · Themes capped at 7 · Note ≤ 250 words
          </p>
        </header>

        {error && <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</Card>}

        {!data && !error && (
          <Card className="text-center text-sm text-gray-500">Analysing multi-source Blinkit reviews for cross-category discovery signals…</Card>
        )}

        {data && (
          <div className="space-y-8">
            <Card className="p-4 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Discovery Pulse</h2>
              <p className="text-sm text-gray-600">{data.note.headline}</p>
              <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <span>{data.note.totalReviews} reviews analysed</span>
                <span>Avg rating: {data.note.avgRating}★</span>
              </div>
            </Card>

            {/* <section>
              <SectionTitle>Data Sources</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {data.sourceBreakdown.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs">
                    <span className="font-medium text-gray-700">{s.label}</span>
                    <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">{s.count}</span>
                  </div>
                ))}
              </div>
            </section> */}

            <section>
              <SectionTitle>All Discovery Themes</SectionTitle>
              <div className="grid gap-3">
                {data.note.themes.map((t, i) => (
                  <ThemeCard key={t.id} theme={t} rank={i + 1} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>What Users Are Saying — 1 Real Quote Per Theme</SectionTitle>
              <div className="grid gap-3">
                {data.note.quotes.map((q, i) => (
                  <QuoteCard key={i} quote={q} />
                ))}
              </div>
            </section>

            <footer className="border-t border-gray-200 pt-4 text-xs text-gray-400">
              Source: Multi-source analysis (Google Play, App Store, Reddit, Social). Usernames and any PII removed.
              This tool reports facts only and does not make product recommendations.
            </footer>
          </div>
        )}
      </main>

      {/* RIGHT HALF */}
      <aside className="w-1/2 h-full flex flex-col bg-gray-50">
        {data && (
          <div className="flex h-full flex-col p-6">
            <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
              <ChatBot />
            </div>
            <footer className="text-xs text-gray-400">
              <strong>Facts only.</strong> Answers are derived directly from theme classification and keyword analysis of user reviews across 6 sources.
            </footer>
          </div>
        )}
      </aside>
    </div>
  );
}
