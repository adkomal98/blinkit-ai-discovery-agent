import type { ThemeSummary } from "@/types";
import { cx } from "@/lib/utils";

function ratingTone(avg: number): string {
  if (avg >= 4) return "bg-emerald-50 text-emerald-700";
  if (avg >= 3) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

const THEME_ICONS: Record<string, string> = {
  trust_risk: "🛡️",
  habit_formation: "🔁",
  price_sensitivity: "🏷️",
  discovery_ux_gaps: "🔍",
  category_signals: "📦",
};

export function ThemeCard({ theme, rank }: { theme: ThemeSummary; rank: number }) {
  const icon = THEME_ICONS[theme.id] || "📊";
  return (
    <div className="card p-4">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blinkit-300 text-sm font-bold text-blinkit-ink">
              {rank}
            </span>
            <span className="text-base">{icon}</span>
            <h3 className="font-semibold text-gray-800">{theme.name}</h3>
          </div>
          <span className={cx("pill shrink-0", ratingTone(theme.avgRating))}>{theme.avgRating.toFixed(1)}★ avg</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">{theme.blurb}</p>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">{theme.count}</span> reviews
        <span className="text-gray-300">·</span>
        <span>{Math.round(theme.share * 100)}% of categorised</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-blinkit-500" style={{ width: `${Math.round(theme.share * 100)}%` }} />
      </div>
    </div>
  );
}
