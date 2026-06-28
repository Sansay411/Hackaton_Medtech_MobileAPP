import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { parsePrice } from "./shared";

/**
 * МЕДЭЛ Parser — scrapes https://medel.kz
 */
export class MedelProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-medel", "МЕДЭЛ Парсер");
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

      $(".price-table tr, .service-row, .med-service, [class*=price] tr, li").each((_, el) => {
        const serviceName = $(el).find(".name, .title, .service-name, td:first-child, strong").text().trim();
        const priceText = $(el).find(".price, .cost, td:last-child, [class*=price]").text().trim();
        const price = parsePrice(priceText);
        if (serviceName && price > 0) {
          tariffs.push({
            clinicName: "МЕДЭЛ",
            rawServiceName: serviceName,
            priceKzt: price,
            osmsEligible: false,
            phone: "+7 (727) 390-00-90",
          });
        }
      });

      return {
        sourceName: `MedEl[${new URL(targetUrl).hostname}]`,
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
        sourceName: `MedEl[${new URL(targetUrl).hostname}]`,
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
