import axios from "axios";
import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";

const CITIES: Record<string, string> = {
  "алматы": "almaty",
  "астана": "astana",
  "караганда": "karaganda",
  "шымкент": "shymkent",
};

function parsePrice(text: string): number {
  const n = text.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const m = n.match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : 0;
}

/**
 * Invitro Parser — uses public HTML page at /analizes/for-doctors/{city}/
 * Real structure:
 *   <div class="analyzes-item">
 *     <div class="analyzes-item__title">Название анализа</div>
 *     <div class="analyzes-item__total--price">1 200 ₸</div>
 *   </div>
 */
export class InvitroProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-invitro", "Инвитро Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    const citySlug = CITIES[city.toLowerCase().trim()];
    if (!citySlug) {
      return this.result(tariffs, startTime, city, false, `Unknown city: ${city}`);
    }

    try {
      const url = `https://invitro.kz/analizes/for-doctors/${citySlug}/`;
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        timeout: 20000,
      });

      const $ = cheerio.load(res.data);

      const items = $(".analyzes-item").toArray().slice(0, 500);
      for (const item of items) {
        const name = $(item).find(".analyzes-item__title").text().trim();
        const priceText = $(item).find(".analyzes-item__total--price, .analyzes-item__total--sum").first().text().trim();
        const price = parsePrice(priceText);
        if (name && price > 0) {
          tariffs.push({
            clinicName: "Инвиво (Invivo)",
            rawServiceName: name,
            priceKzt: price,
            osmsEligible: false,
            phone: "+7 (727) 355-05-05",
            address: this.addressFor(city),
          });
        }
      }

      return this.result(tariffs, startTime, city, true);
    } catch (err: any) {
      return this.result(tariffs, startTime, city, false, err.message);
    }
  }

  private addressFor(city: string): string {
    const map: Record<string, string> = {
      "алматы": "ул. Толе би, 99, Алматы",
      "астана": "ул. Кенесары, 65, Астана",
      "караганда": "ул. Алиханова, 10, Караганда",
      "шымкент": "пр. Тауке хана, 31, Шымкент",
    };
    return map[city.toLowerCase().trim()] || "";
  }

  private result(t: IngestionResult["tariffs"], start: number, city: string, ok: boolean, err?: string) {
    return {
      sourceName: "Invitro",
      parsedAt: new Date().toISOString(),
      city,
      extractedRecordsCount: t.length,
      tariffs: t,
      telemetry: { ingestDurationMs: Date.now() - start, isSuccessful: ok, errorMessage: err },
    } as IngestionResult;
  }
}
