import axios from "axios";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";

const API_KEY = "26c65059-f062-4a91-a973-b8a38fedf562";

const CITY_COORDS: Record<string, string> = {
  "алматы": "76.889,43.238",
  "астана": "71.449,51.169",
  "караганда": "73.088,49.802",
  "шымкент": "69.590,42.341",
  "актобе": "57.926,50.283",
  "павлодар": "76.931,52.287",
};

function parsePrice(text: string): number {
  const n = text.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const m = n.match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : 0;
}

/**
 * 2GIS Provider — ищет клиники через 2GIS Places API
 * API: https://catalog.api.2gis.com/3.0/items
 * Документация: https://docs.2gis.com/api/search/places/overview
 */
export class DgisProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-dgis", "2GIS Парсер");
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];

    const coords = CITY_COORDS[city.toLowerCase().trim()];
    if (!coords) {
      return this.result(tariffs, startTime, city, false, `Unknown city: ${city}`);
    }

    try {
      // Search for medical clinics in the city
      const queries = ["медицинский центр", "клиника", "лаборатория", "больница", "поликлиника"];

      for (const q of queries) {
        if (tariffs.length > 100) break;
        try {
          const res = await axios.get("https://catalog.api.2gis.com/3.0/items", {
            params: { q, location: coords, key: API_KEY, limit: 50 },
            timeout: 15000,
          });

          const items = res.data?.result?.items || [];
          for (const item of items) {
            if (!item.name) continue;

            // Check for duplicates within this run
            if (tariffs.some(t => t.clinicName === item.name)) continue;

            const address = item.address_name || "";
            const fullAddress = item.full_name || `${city}, ${address}`;
            const phone = item.contact_groups?.[0]?.items?.[0]?.value || "";

            tariffs.push({
              clinicName: item.name,
              rawServiceName: "Медицинские услуги",
              priceKzt: 0,
              osmsEligible: false,
              phone,
              address: fullAddress,
            });
          }
        } catch {}
      }

      return this.result(tariffs, startTime, city, true);
    } catch (err: any) {
      return this.result(tariffs, startTime, city, false, err.message);
    }
  }

  private result(t: IngestionResult["tariffs"], start: number, city: string, ok: boolean, err?: string) {
    return {
      sourceName: "2GIS",
      parsedAt: new Date().toISOString(),
      city,
      extractedRecordsCount: t.length,
      tariffs: t,
      telemetry: { ingestDurationMs: Date.now() - start, isSuccessful: ok, errorMessage: err },
    } as IngestionResult;
  }
}
