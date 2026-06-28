import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import { SERVICES_CATALOG } from "../../data/servicesCatalog";
import { parsePrice, delay } from "./shared";

/**
 * KDL Olymp Parser — uses REST API at https://kdlolymp.kz
 * Sources:
 *   1. /api/analysis — catalog of all services (without prices)
 *   2. /api/site-offer — promotions with real prices (50+ offers)
 *   3. Fallback: base prices from the normalized catalog (servicesCatalog.ts)
 */
export class KdlProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-kdl-olymp", "КДЛ Олимп Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const baseUrl = "https://kdlolymp.kz";
    const tariffs: IngestionResult["tariffs"] = [];

    try {
      // Step 1: Fetch all analyses
      const analyses = await this.fetchJson<any[]>(`${baseUrl}/api/analysis?per_page=200`);
      console.log(`[KdlProvider] ${analyses.length} analyses from API`);

      // Step 2: Fetch promotions with real prices
      const offers = await this.fetchJson<any[]>(`${baseUrl}/api/site-offer?per_page=100`);
      const offerPrices = new Map<string, number>();
      for (const o of offers) {
        if (o.new_cost && o.translation?.title) {
          offerPrices.set(o.translation.title.toLowerCase(), o.new_cost);
        }
      }
      console.log(`[KdlProvider] ${offerPrices.size} promotions with prices`);

      // Step 3: Build catalog price lookup by keyword matching
      const catalogKeywords = new Map<string, number>();
      for (const s of SERVICES_CATALOG) {
        const words = s.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 4)
          .concat(s.synonyms.map(syn => syn.toLowerCase()));
        for (const w of words) {
          catalogKeywords.set(w, s.basePrice);
        }
      }

      // Step 4: Match and build tariff list
      for (const a of analyses) {
        if (!a.translation?.title) continue;
        const title = a.translation.title;
        const lower = title.toLowerCase();

        // Price priority: promotion match > catalog keyword match > 0
        let price = 0;

        // Check promotions (exact + partial)
        for (const [offerName, offerPrice] of offerPrices) {
          if (lower.includes(offerName) || offerName.includes(lower)) {
            price = offerPrice;
            break;
          }
        }

        // Fallback: catalog keyword matching
        if (price === 0) {
          const words = lower.split(/[\s,()]+/);
          for (const w of words) {
            if (w.length > 4 && catalogKeywords.has(w)) {
              price = catalogKeywords.get(w)!;
              break;
            }
          }
        }

        // Second fallback: price from similar services by word overlap
        if (price === 0) {
          let bestScore = 0;
          for (const s of SERVICES_CATALOG) {
            // Check synonyms
            const synMatch = s.synonyms.some(syn => lower.includes(syn.toLowerCase()));
            // Count overlapping meaningful words between KDL name and catalog name
            const catWords = new Set(s.name.toLowerCase().split(/[\s,()\-+]+/).filter(w => w.length > 3));
            const kdlWords = lower.split(/[\s,()\-+]+/).filter(w => w.length > 3);
            const overlap = [...catWords].filter(w => kdlWords.includes(w)).length;
            const score = overlap / Math.max(catWords.size, 1);

            if (synMatch && score > bestScore) {
              bestScore = score;
              price = s.basePrice;
            } else if (score >= 0.3) {
              bestScore = score;
              price = s.basePrice;
            }
          }
        }

        // Third fallback: any word match in catalog keywords
        if (price === 0) {
          const words = lower.split(/[\s,()]+/).filter(w => w.length > 4);
          for (const s of SERVICES_CATALOG) {
            const allTerms = [s.name.toLowerCase(), ...s.synonyms.map(x => x.toLowerCase())].join(" ");
            if (words.some(w => allTerms.includes(w))) {
              price = s.basePrice;
              break;
            }
          }
        }

        tariffs.push({
          clinicName: "КДЛ Олимп",
          rawServiceName: title,
          priceKzt: price,
          osmsEligible: false,
          phone: "+7 (702) 052-8585",
          address: this.defaultAddress(city),
        });

        if (tariffs.length >= 150) break;
      }

      return {
        sourceName: `KDL[${baseUrl}]`,
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: tariffs.length,
        tariffs,
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          targetUrl: baseUrl,
          isSuccessful: true,
        },
      };
    } catch (err: any) {
      console.error(`[KdlProvider] Failed:`, err.message);
      return {
        sourceName: `KDL[${baseUrl}]`,
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: 0,
        tariffs: [],
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          targetUrl: baseUrl,
          isSuccessful: false,
          errorMessage: err.message,
        },
      };
    }
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const axios = (await import("axios")).default;
    const res = await axios.get(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    });
    return res.data?.data || [];
  }

  private defaultAddress(city: string): string {
    const addrs: Record<string, string> = {
      Алматы: "пр. Назарбаева, 120",
      Астана: "пр. Республики, 19",
      Шымкент: "пр. Тауке хана, 84",
    };
    return addrs[city] || "г. Алматы, пр. Назарбаева, 120";
  }
}
