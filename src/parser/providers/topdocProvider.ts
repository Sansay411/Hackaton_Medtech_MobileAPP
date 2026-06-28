import axios from "axios";
import * as cheerio from "cheerio";
import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";

function parsePrice(text: string): number {
  const n = text.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const m = n.match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : 0;
}

export class TopdocProvider extends BaseMedicalProvider {
  constructor() {
    super("provider-topdoc", "TopDoc.kz Парсер");
  }

  public async ingest(_targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const tariffs: IngestionResult["tariffs"] = [];
    const baseUrl = "https://www.topdoc.kz";
    const slug = ({ алматы: "almaty", астана: "astana", караганда: "karaganda", шымкент: "shymkent" })[city.toLowerCase().trim()] || city.toLowerCase();
    const pages = [`${baseUrl}/${slug}/laboratories/`, `${baseUrl}/${slug}/clinics/`];

    for (const url of pages) {
      if (tariffs.length > 200) break;
      try {
        const records = await this.parsePage(url);
        tariffs.push(...records);
      } catch {}
    }

    return {
      sourceName: "TopDoc.kz",
      parsedAt: new Date().toISOString(),
      city,
      extractedRecordsCount: tariffs.length,
      tariffs,
      telemetry: { ingestDurationMs: Date.now() - startTime, targetUrl: baseUrl, isSuccessful: true },
    };
  }

  private async parsePage(url: string): Promise<IngestionResult["tariffs"]> {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      timeout: 15000, maxRedirects: 5,
    });

    const $ = cheerio.load(res.data);
    const result: IngestionResult["tariffs"] = [];

    $("section.companyInfo").each((_, sec) => {
      const secHtml = $(sec).html() || "";
      const sec$ = cheerio.load(secHtml);

      const clinicName = sec$(".title").first().text().trim();
      if (!clinicName) return;

      const fullText = sec$.text();
      const addr = fullText.match(/([^,\n]+,\s*(?:Алматы|Астана|Шымкент|Караганда))/);
      const phone = fullText.match(/\+7\s?\(?\d{3}\)?\s?\d{3}\s?\d{2}\s?\d{2}/)?.[0] || "";

      sec$("div.price").each((_, el) => {
        const price = parsePrice(sec$(el).text());
        if (price === 0) return;
        const name = sec$(el).prevAll("a").first().text().trim() || "";
        if (name) result.push({ clinicName, rawServiceName: name, priceKzt: price, osmsEligible: false, phone, address: addr?.[1]?.trim() || "" });
      });
    });

    return result;
  }
}
