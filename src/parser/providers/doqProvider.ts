import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice, delay } from "./shared";

/**
 * DoQ.kz Parser — tries to extract prices from the site.
 * DoQ is a clinic aggregator with price data embedded in service pages.
 */
export class DoqProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-doq", "DoQ.kz Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      // Try Playwright to render the page and find prices
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();

        // Try city-specific search for procedures
        const searchUrls = [
          `${targetUrl}/${city.toLowerCase()}/procedures`,
          `${targetUrl}/${city.toLowerCase()}/analyses`,
          `${targetUrl}/${city.toLowerCase()}/services`,
          `${targetUrl}/search?q=анализ+крови&city=${encodeURIComponent(city)}`,
        ];

        for (const url of searchUrls) {
          if (tariffs.length > 20) break;
          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

            // Extract price cards
            const items = await page.$$eval(
              "[class*=card], [class*=price], [class*=service], [data-price], [itemprop=price]",
              (els, baseUrl) =>
                els.map(el => {
                  const text = (el as HTMLElement).innerText?.trim() || "";
                  const dataPrice = (el as HTMLElement).getAttribute("data-price") || "";
                  const priceMeta = (el as HTMLElement).getAttribute("content") || "";
                  return { text, dataPrice, priceMeta };
                })
                .filter(i => i.text.includes("₸") || i.text.includes("тг") || i.dataPrice || /\d{4,}\s*₸/.test(i.text)),
              targetUrl
            );

            for (const item of items) {
              const price = parsePrice(item.dataPrice || item.priceMeta || item.text);
              if (price > 0) {
                const nameLine = item.text.split("\n").find(l => /[а-яА-Я]/.test(l) && l.length > 5) || "";
                tariffs.push({
                  clinicName: "",
                  rawServiceName: nameLine,
                  priceKzt: price,
                  osmsEligible: false,
                });
              }
            }
          } catch {
            continue;
          }
        }

      } finally {
        await browser.close();
      }

      return {
        sourceName: `DoQ[${new URL(targetUrl).hostname}]`,
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: tariffs.length,
        tariffs,
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          targetUrl,
          isSuccessful: true,
        },
      };
    } catch (err: any) {
      return {
        sourceName: `DoQ[${new URL(targetUrl).hostname}]`,
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: 0,
        tariffs: [],
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          targetUrl,
          isSuccessful: false,
          errorMessage: err.message,
        },
      };
    }
  }
}
