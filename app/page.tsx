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
  const [isClassifying, setIsClassifying] = useState(false);

  const [method, setMethod] = useState<"keyword" | "llm">("keyword");

  const loadAnalysis = async (m: "keyword" | "llm") => {
    try {
      const r = await fetch(`/api/analyze?method=${m}`);
      const d = await r.json();
      if (d.error) setError(d.error);
      else setData(d);
    } catch {
      setError("Could not load analysis.");
    }
  };

  useEffect(() => {
    setData(null);
    setError(null);
    loadAnalysis(method);
  }, [method]);

  async function triggerLlmClassification() {
    setIsClassifying(true);
    setError(null);
    try {
      const res = await fetch("/api/classify-llm", { method: "POST" });
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      setMethod("llm");
      await loadAnalysis("llm");
    } catch (e: any) {
      setError(e.message || "Failed to run LLM classification.");
    } finally {
      setIsClassifying(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* LEFT HALF */}
      <main className="w-1/2 overflow-y-auto border-r border-gray-200 bg-white p-6">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blinkit-300 text-lg font-black text-blinkit-ink">B</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blinkit — Cross-Category Discovery Engine</h1>
              <p className="text-sm text-gray-500">AI-powered insights from public user reviews</p>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-500">
            Goal: Increase % of MACs purchasing from ≥1 new category/month
          </p>

        </header>

        {error && <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700 mb-4">{error}</Card>}

        {(!data && !error) || isClassifying ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50/50 p-12 border border-gray-200">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blinkit-500 mb-4"></div>
            <p className="text-sm font-medium text-gray-600 text-center animate-pulse">
              {isClassifying
                ? "Classifying 100 reviews... This will take ~20s"
                : "Analysing multi-source Blinkit reviews for cross-category discovery signals…"}
            </p>
          </div>
        ) : null}

        {data && !isClassifying && (
          <div className="space-y-4">
            <Card className="!p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Discovery Pulse</h2>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="rounded-full bg-gray-200/50 px-2.5 py-0.5">{data.note.totalReviews} reviews analysed</span>
                  <span className="rounded-full bg-blinkit-100/50 px-2.5 py-0.5 text-blinkit-600">Avg rating: {data.note.avgRating}★</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{data.note.headline}</p>
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

            <div className="mt-4 flex gap-2">
              <Button
                variant={method === "keyword" ? "primary" : "secondary"}
                onClick={() => setMethod("keyword")}
                className="flex-1"
              >
                📊 Full Dataset (Keyword Algorithm)
              </Button>
              <Button
                variant={method === "llm" ? "primary" : "secondary"}
                onClick={triggerLlmClassification}
                className="flex-1"
                disabled={isClassifying}
              >
                {isClassifying ? "🧠 Running LLM (Wait 20s)..." : "🧠 Sample Dataset (Live API)"}
              </Button>
            </div>

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
        <div className="flex h-full flex-col p-6">
          <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
            <ChatBot method={method} disabled={!data || isClassifying} />
          </div>
          <footer className="text-xs text-gray-400">
            <strong>Facts only.</strong> Answers are derived directly from theme classification and keyword analysis of user reviews across 6 sources.
          </footer>
        </div>
      </aside>
    </div>
  );
}
