import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice } from "./shared";

/**
 * Helix Parser — scrapes https://helix.kz
 * Simpler static HTML structure.
 */
export class HelixProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-helix", "Helix Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      const axios = (await import("axios")).default;
      const response = await axios.get(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      $(".price-row, .service-item, .analysis-card, tr").each((_, el) => {
        const serviceName = $(el).find(".name, .title, td:first-child, .service-title").text().trim();
        const priceText = $(el).find(".price, .cost, td:last-child, [class*=price]").text().trim();
        const price = parsePrice(priceText);
        if (serviceName && price > 0) {
          tariffs.push({
            clinicName: "Helix",
            rawServiceName: serviceName,
            priceKzt: price,
            osmsEligible: false,
            phone: "+7 (727) 356-06-06",
          });
        }
      });

      return {
        sourceName: `Helix[${new URL(targetUrl).hostname}]`,
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
        sourceName: `Helix[${new URL(targetUrl).hostname}]`,
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
