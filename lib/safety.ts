/**
 * PII safety — defence-in-depth redaction applied at runtime.
 *
 * The committed CSV is already redacted at extraction time (scripts/fetch_reviews.mjs),
 * but we redact again before any text is rendered, summarised, or sent to Claude so no
 * personal identifier can ever leak into an artifact (note, quote, email).
 */

const PII_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]"], // emails
  [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[pan]"], // PAN
  [/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[id]"], // Aadhaar-like 12-digit
  [/(\+?91[\-\s]?)?[6-9]\d{9}\b/g, "[phone]"], // Indian mobile
  [/\b\d{9,18}\b/g, "[number]"], // long digit runs (account / order ids)
];

export function redactPII(input: string): string {
  let t = (input || "").replace(/\s+/g, " ").trim();
  for (const [re, rep] of PII_PATTERNS) t = t.replace(re, rep);
  return t;
}

/** True if the text still contains an obvious raw PII pattern (used in tests). */
export function hasPII(input: string): boolean {
  return PII_PATTERNS.some(([re]) => {
    re.lastIndex = 0;
    return re.test(input || "");
  });
}
