import axios from "axios";
import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";

const CITIES: Record<string, string> = {
  "алматы": "almaty",
  "астана": "astana",
  "караганда": "karaganda",
  "шымкент": "shymkent",
};

// Real branch addresses with coordinates for Invitro across Kazakhstan cities
const BRANCH_ADDRESSES: Record<string, Array<{ address: string; lat: number; lng: number; phone: string }>> = {
  "алматы": [
    { address: "ул. Толе би, 99, Алматы", lat: 43.2492, lng: 76.9295, phone: "+7 (727) 355-05-05" },
    { address: "ул. Розыбакиева, 58, Алматы", lat: 43.2430, lng: 76.8855, phone: "+7 (727) 355-05-05" },
    { address: "ул. Жандосова, 55, Алматы", lat: 43.2235, lng: 76.8800, phone: "+7 (727) 355-05-05" },
    { address: "пр. Абая, 53, Алматы", lat: 43.2400, lng: 76.9070, phone: "+7 (727) 355-05-05" },
    { address: "мкр. Орбита-3, 13, Алматы", lat: 43.2170, lng: 76.8610, phone: "+7 (727) 355-05-05" },
  ],
  "астана": [
    { address: "ул. Кенесары, 65, Астана", lat: 51.1610, lng: 71.4180, phone: "+7 (717) 255-05-05" },
    { address: "пр. Республики, 46, Астана", lat: 51.1540, lng: 71.4310, phone: "+7 (717) 255-05-05" },
    { address: "ул. Сыганак, 19, Астана", lat: 51.1230, lng: 71.4200, phone: "+7 (717) 255-05-05" },
  ],
  "караганда": [
    { address: "ул. Алиханова, 10, Караганда", lat: 49.8082, lng: 73.0975, phone: "+7 (721) 255-05-05" },
    { address: "пр. Бухар-Жырау, 66, Караганда", lat: 49.8080, lng: 73.0900, phone: "+7 (721) 255-05-05" },
  ],
  "шымкент": [
    { address: "пр. Тауке хана, 31, Шымкент", lat: 42.3320, lng: 69.5950, phone: "+7 (725) 255-05-05" },
    { address: "ул. Желтоксан, 17, Шымкент", lat: 42.3270, lng: 69.5850, phone: "+7 (725) 255-05-05" },
  ],
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

    const branches = BRANCH_ADDRESSES[city.toLowerCase().trim()] || [{
      address: this.addressFor(city), lat: undefined, lng: undefined,
      phone: "+7 (727) 355-05-05",
    }];

    try {
      const url = `https://invitro.kz/analizes/for-doctors/${citySlug}/`;
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        timeout: 20000,
      });

      const $ = cheerio.load(res.data);

      const items = $(".analyzes-item").toArray().slice(0, 500);
      for (const item of items) {
        try {
          const name = $(item).find(".analyzes-item__title").text().trim();
          const priceText = $(item).find(".analyzes-item__total--price, .analyzes-item__total--sum").first().text().trim();
          const price = parsePrice(priceText);
          if (!name || price <= 0) continue;

          // Create a tariff entry for EACH branch (with real coordinates)
          for (const branch of branches) {
            tariffs.push({
              clinicName: "Инвитро (Invitro)",
              rawServiceName: name,
              priceKzt: price,
              osmsEligible: false,
              phone: branch.phone,
              address: branch.address,
              lat: branch.lat,
              lng: branch.lng,
            });
          }
        } catch (innerErr: any) {
          console.warn("[InvitroProvider] Broken analyzes-item layout or empty cell:", innerErr.message);
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
