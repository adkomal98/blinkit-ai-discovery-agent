import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blinkit — Cross-Category Discovery Engine",
  description:
    "AI-powered discovery engine that analyses user feedback to surface cross-category exploration opportunities for Blinkit. Top themes, real quotes, growth ideas, and email drafts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
