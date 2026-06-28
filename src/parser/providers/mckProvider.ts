import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice } from "./shared";

/**
 * MCK (Медицинский Центр) Parser — scrapes https://mck.kz
 */
export class MckProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-mck", "МЦК Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      const axios = (await import("axios")).default;
      const response = await axios.get(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      $(".tariff-table tr, .service-row, .price-row, tr, [class*=service]").each((_, el) => {
        const serviceName = $(el).find(".name, .title, .service-name, td:first-child").text().trim();
        const priceText = $(el).find(".price, .cost, td:last-child, [class*=price]").text().trim();
        const price = parsePrice(priceText);
        if (serviceName && price > 0) {
          tariffs.push({
            clinicName: "МЦК",
            rawServiceName: serviceName,
            priceKzt: price,
            osmsEligible: true,
            phone: "+7 (727) 390-20-20",
          });
        }
      });

      return {
        sourceName: `MCK[${new URL(targetUrl).hostname}]`,
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
        sourceName: `MCK[${new URL(targetUrl).hostname}]`,
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
