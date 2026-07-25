"use client";
import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ChatResponse, ThemeSummary } from "@/types";
import { cx, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const SAMPLE_QUESTIONS = [
  "What triggers cross-category adoption?",
  "Which user segments are more likely to experiment?",
  "Why do users repeatedly buy from the same categories?",
  "What prevents users from exploring new categories?",
  "What information is needed before trying a new category?",
  "What frustrations emerge repeatedly?",
  "What unmet needs emerge consistently across discussions?"
];

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  async function handleSend(q: string) {
    if (!q.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: "user", text: q.trim() }]);
    setInput("");
    setIsTyping(true);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q.trim() })
      });

      const data = await res.json() as ChatResponse;

      // Artificial delay for UI feel (like the FAQ assistant)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "bot",
          text: data.answer,
          quotes: data.quotes,
          themeData: data.themeData,
          sourceInfo: data.sourceInfo,
          isRefusal: data.isRefusal
        }]);
        setIsTyping(false);
      }, 650);

    } catch (e) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "bot",
          text: "Sorry, I encountered an error connecting to the discovery engine.",
          sourceInfo: "System Error"
        }]);
        setIsTyping(false);
      }, 650);
    }
  }

  return (
    <div className="flex h-full flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blinkit-500 text-white shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div className="font-semibold">Discovery Insights Assistant</div>
          <div className="text-xs text-gray-500">Ask questions about cross-category shopping behavior</div>
        </div>
      </div>



      {/* Suggested Chips Accordion */}
      <details ref={detailsRef} className="group border-b border-gray-100 bg-white">
        <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-xs font-semibold uppercase tracking-wide text-blinkit-600 transition-colors hover:bg-gray-50/50">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blinkit-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blinkit-500"></span>
            </span>
            Suggested Questions
          </span>
          <span className="transition group-open:rotate-180">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </summary>
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs font-medium text-gray-600 transition hover:border-blinkit-500 hover:bg-blinkit-50 hover:text-blinkit-700"
            >
              {q}
            </button>
          ))}
        </div>
      </details>

      {/* Chat History */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-gray-50/50 p-4">
        {messages.length === 0 && (
          <div className="m-auto text-center text-sm text-gray-400">
            Select a question above or type your own to explore user insights.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cx("flex flex-col max-w-[90%]", m.role === "user" ? "self-end" : "self-start")}>
            <div className={cx(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
              m.role === "user" ? "bg-blinkit-500 text-white rounded-tr-sm" :
                m.isRefusal ? "bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-sm" :
                  "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
            )}>
              {m.isRefusal && <span className="mb-2 inline-block rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">OUTSIDE SCOPE</span>}
              <div className={cx("prose prose-sm max-w-none", m.role === "user" ? "prose-invert text-white" : "prose-slate text-gray-800")}>
                <ReactMarkdown>
                  {m.text}
                </ReactMarkdown>
              </div>

              {m.themeData && m.themeData.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-2">
                  {m.themeData.map((t, idx) => (
                    <div key={idx} className="rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                      <strong>{t.name}</strong> · {t.count} reviews ({Math.round(t.share * 100)}%) · {t.avgRating.toFixed(1)}★
                    </div>
                  ))}
                </div>
              )}

              {m.quotes && m.quotes.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {m.quotes.map((q, idx) => (
                    <div key={idx} className="border-l-2 border-blinkit-400 pl-2 text-xs italic text-gray-500">
                      "{q.text}" — {q.rating}★, {formatDate(q.date)} ({q.source || "google_play"})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {m.sourceInfo && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 pl-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blinkit-400"></span>
                {m.sourceInfo}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex max-w-[80%] self-start flex-col">
            <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blinkit-500"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blinkit-500" style={{ animationDelay: "0.2s" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blinkit-500" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] relative z-10">
        <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white p-1.5 shadow-sm transition-all focus-within:border-black hover:border-black cursor-text">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => { if (detailsRef.current) detailsRef.current.open = false; }}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask a question about cross-category discovery..."
            className="w-full bg-transparent px-3 py-1 text-sm outline-none placeholder:text-gray-500 text-black font-medium"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blinkit-500 text-white transition hover:bg-blinkit-600 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
