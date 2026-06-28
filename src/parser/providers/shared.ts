import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";

/**
 * Helper: extract numeric price from various Kazakh price formats:
 *   "2 500 ₸", "2500тг", "1 200,50 ₸", "от 3 000 тенге"
 */
export function parsePrice(text: string): number {
  // Remove spaces between digits first ("1 900" -> "1900"), then extract number
  const cleaned = text
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.round(parseFloat(match[1])) : 0;
}

/**
 * Helper: introduce delay between requests to avoid rate limiting.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export { BaseMedicalProvider };
export type { IngestionResult };
