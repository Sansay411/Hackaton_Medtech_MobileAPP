import axios from "axios";
import { getDb } from "../../lib/mongodb";

const DGIS_KEY = "26c65059-f062-4a91-a973-b8a38fedf562";
const YANDEX_KEY = "6f4c8d9a-a6e8-49ea-8545-29bed81dd318";

const CITY_COORDS: Record<string, string> = {
  "алматы": "76.889,43.238", "астана": "71.449,51.169", "шымкент": "69.590,42.341",
  "караганда": "73.088,49.802", "актобе": "57.926,50.283", "павлодар": "76.931,52.287",
};

async function geocodeYandex(query: string): Promise<{ lat?: number; lng?: number }> {
  try {
    const res = await axios.get("https://geocode-maps.yandex.ru/1.x/", {
      params: { format: "json", geocode: query, apikey: YANDEX_KEY },
      timeout: 10000,
    });
    const member = res.data?.response?.GeoObjectCollection?.featureMember;
    if (member?.length > 0) {
      const pos = member[0]?.GeoObject?.Point?.pos;
      if (pos) {
        const [lng, lat] = pos.split(" ").map(Number);
        if (lat && lng) return { lat, lng };
      }
    }
  } catch {}
  return {};
}

export class GeoEnricher {
  async enrichClinic(name: string, city: string, address?: string): Promise<{ lat?: number; lng?: number; phone?: string; workingHours?: string }> {
    const cityCoord = CITY_COORDS[city.toLowerCase().trim()] || CITY_COORDS["алматы"];

    // Try 2GIS first
    try {
      const res = await axios.get("https://catalog.api.2gis.com/3.0/items", {
        params: { q: `${name} ${city}`, location: cityCoord, key: DGIS_KEY, limit: 1, type: "branch" },
        timeout: 10000,
      });
      const item = res.data?.result?.items?.[0];
      if (item?.point) {
        return {
          lat: item.point.lat, lng: item.point.lon,
          phone: item.contact_groups?.[0]?.items?.[0]?.value || "",
          workingHours: item.schedule?.[0]?.text || "",
        };
      }
    } catch {}

    // Fallback: Yandex Geocoder
    const geoQuery = address || `${name}, ${city}`;
    const coords = await geocodeYandex(geoQuery);
    return coords;
  }

  async enrichAllUngeocoded() {
    const db = await getDb();
    const pipeline = [
      { $match: { lat: { $exists: false } } },
      { $group: { _id: { clinicName: "$clinicName", city: "$city" }, address: { $first: "$address" } } },
    ];
    const uniqueClinics = await db.collection("rawTariffs").aggregate(pipeline).toArray();
    console.log(`[GeoEnricher] Found ${uniqueClinics.length} clinics without coordinates`);

    let success = 0;
    for (let i = 0; i < uniqueClinics.length; i++) {
      const { _id, address } = uniqueClinics[i] as any;
      const { clinicName, city } = _id;
      console.log(`[GeoEnricher] [${i + 1}/${uniqueClinics.length}] Geocoding: "${clinicName}" in "${city}"`);

      const result = await this.enrichClinic(clinicName, city, address);
      if (result.lat && result.lng) {
        await db.collection("rawTariffs").updateMany(
          { clinicName, city, lat: { $exists: false } },
          { $set: { lat: result.lat, lng: result.lng, phone: result.phone || "", workingHours: result.workingHours || "" } }
        );
        success++;
        console.log(`[GeoEnricher] Updated: "${clinicName}" -> (${result.lat}, ${result.lng})`);
      }
      await new Promise(r => setTimeout(r, 800));
    }
    console.log(`[GeoEnricher] Done. ${success}/${uniqueClinics.length} geocoded.`);
  }
}
