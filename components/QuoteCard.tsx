import type { Quote } from "@/types";
import { formatDate } from "@/lib/utils";

export function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <figure className="card border-l-4 border-l-blinkit-500 p-4">
      <blockquote className="text-sm leading-relaxed text-gray-700">&ldquo;{quote.text}&rdquo;</blockquote>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        <span className="font-semibold text-amber-600">{"★".repeat(quote.rating)}{"☆".repeat(5 - quote.rating)}</span>
        <span className="text-gray-300">·</span>
        <span>{formatDate(quote.date)}</span>
        <span className="text-gray-300">·</span>
        <span className="pill bg-gray-100 text-gray-600">{quote.theme}</span>
      </figcaption>
    </figure>
  );
}
