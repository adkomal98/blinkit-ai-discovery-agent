/** Shared domain types for the Blinkit Cross-Category Discovery Engine. */

export type ReviewSource = "google_play" | "app_store" | "reddit" | "twitter" | "forum" | "product_review" | "mouthshut" | "trustpilot";

export interface Review {
  review_id: string;
  rating: number;
  title: string;
  text: string;
  date: string; // YYYY-MM-DD
  app_version: string;
  helpful_count: number;
  source: ReviewSource;
}

export interface ThemeDef {
  id: string;
  name: string;
  blurb: string;
  question?: string;
  keywords: string[];
  actions?: string[];
}

export interface ThemeLegend {
  version: string;
  note: string;
  themes: ThemeDef[];
  fallback: { id: string; name: string; blurb: string };
}

export interface Quote {
  text: string;
  rating: number;
  date: string;
  theme: string; // theme name
  source?: ReviewSource;
}

export interface ThemeSummary {
  id: string;
  name: string;
  blurb: string;
  count: number;
  share: number; // 0..1 of categorised reviews
  avgRating: number;
  sampleQuotes: Quote[];
}

export interface WeeklyNote {
  product: string;
  generatedAt: string; // ISO date
  windowStart: string;
  windowEnd: string;
  totalReviews: number;
  avgRating: number;
  aiMode: "claude" | "deterministic";
  headline: string;
  themes: ThemeSummary[];
  quotes: Quote[];
}

export interface SourceBreakdown {
  source: ReviewSource;
  label: string;
  count: number;
}

export interface AnalyzeResponse {
  note: WeeklyNote;
  allThemes: ThemeSummary[];
  sourceBreakdown: SourceBreakdown[];
}

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  quotes?: Quote[];
  themeData?: { name: string; count: number; share: number; avgRating: number }[];
  sourceInfo?: string;
  isRefusal?: boolean;
}

export interface ChatResponse {
  answer: string;
  quotes?: Quote[];
  themeData?: { name: string; count: number; share: number; avgRating: number }[];
  sourceInfo: string;
  isRefusal?: boolean;
}
