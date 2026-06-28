import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice } from "./shared";

/**
 * Olymp Medical Center Parser — scrapes https://olymp.kz
 */
export class OlympProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-olymp", "Олимп Медцентр Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      const html = await this.fetchPage(targetUrl);
      const $ = cheerio.load(html);

      $(".price-list li, .service-block, .med-service, tr, [class*=service]").each((_, el) => {
        try {
          const serviceName = $(el).find(".name, .title, .service-name, td:first-child, a").text().trim();
          const priceText = $(el).find(".price, .cost, td:last-child, [class*=price]").text().trim();
          const price = parsePrice(priceText);
          if (serviceName && price > 0) {
            tariffs.push({
              clinicName: "Медицинский центр Олимп",
              rawServiceName: serviceName,
              priceKzt: price,
              osmsEligible: false,
            });
          }
        } catch (innerErr: any) {
          console.warn("[OlympProvider] Broken row layout or empty cell:", innerErr.message);
        }
      });

      return {
        sourceName: `Olymp[${new URL(targetUrl).hostname}]`,
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
        sourceName: `Olymp[${new URL(targetUrl).hostname}]`,
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

  private async fetchPage(url: string): Promise<string> {
    try {
      const axios = (await import("axios")).default;
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        timeout: 15000,
      });
      return response.data;
    } catch {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        return await page.content();
      } finally {
        await browser.close();
      }
    }
  }
}
