import { BaseMedicalProvider, IngestionResult } from "../../lib/providers";
import axios from "axios";

/**
 * Firecrawl Provider — uses Firecrawl API with JS rendering + AI extraction
 * Extracts: serviceName, priceKzt, clinicName, address, logoUrl from ANY medical site.
 */
export class FirecrawlProvider extends BaseMedicalProvider {
  private siteName: string;
  private fc: (url: string, opts?: any) => Promise<any>;

  constructor(siteName: string = "DoQ.kz") {
    super(`provider-firecrawl-${siteName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`, `Firecrawl ${siteName}`);
    this.siteName = siteName;
    this.fc = FirecrawlProvider.api();
  }

  private inferSiteName(url: string): string {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host.includes("invitro") ? "Инвитро" : host.includes("topdoc") ? "TopDoc.kz" : host.split(".")[0].toUpperCase() || this.siteName;
    } catch { return this.siteName; }
  }

  static api() {
    const key = process.env.FIRECRAWL_API_KEY || "";
    return async (url: string, opts: any = {}) => {
      return axios.post("https://api.firecrawl.dev/v1/scrape", {
        url,
        formats: opts.formats || ["markdown"],
        onlyMainContent: opts.onlyMainContent ?? true,
        waitFor: opts.waitFor ?? 3000,
        ...opts,
      }, {
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        timeout: opts.timeout || 60000,
      });
    };
  }

  public async ingest(targetUrl: string, city: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const baseUrl = targetUrl;
    const tariffs: IngestionResult["tariffs"] = [];
    let logoUrl = "";

    try {
      // Auto-detect clinic name from URL
      this.siteName = this.inferSiteName(baseUrl);
      console.log(`[Firecrawl] Scraping ${baseUrl} for ${city}...`);

      // Step 1: Scrape page with JS rendering (wait 3s for dynamic content)
      const res = await this.fc(baseUrl, {
        formats: ["markdown", "screenshot"],
        waitFor: 3000,
        timeout: 40000,
      });

      const markdown: string = res.data?.data?.markdown || "";
      console.log(`[Firecrawl] Markdown: ${(markdown.length / 1024).toFixed(0)}KB`);

      // Step 2: Extract logo from HTML/metadata using 2nd request with full HTML
      try {
        const logoRes = await this.fc(baseUrl, {
          formats: ["rawHtml"],
          onlyMainContent: false,
          waitFor: 2000,
          timeout: 15000,
        });
        const html: string = logoRes.data?.data?.rawHtml?.slice(0, 50000) || "";
        // Find logo URLs in HTML
        const logoPatterns = [
          /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
          /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
          /<img[^>]*src=["']([^"']*logo[^"']*)["']/i,
          /<img[^>]*src=["']([^"']*\.(?:svg|png|jpg|webp))["'][^>]*alt=["'][^"]*logo/i,
        ];
        for (const pattern of logoPatterns) {
          const m = html.match(pattern);
          if (m?.[1]) {
            logoUrl = m[1].startsWith("http") ? m[1] : `https://${new URL(baseUrl).hostname}${m[1].startsWith("/") ? "" : "/"}${m[1]}`;
            break;
          }
        }
      } catch {}

      // Step 3: Extract prices from markdown — simple & robust
      if (markdown) {
        // Find ALL price patterns first: "1 234 ₸" or "1 390 ₸"
        const priceIndexes: { idx: number; price: number }[] = [];
        const pricePat = /(\d{1,3}(?:\s?\d{3})*)\s*(?:₸|тг|тенге|KZT)/gi;
        let m;
        while ((m = pricePat.exec(markdown)) !== null) {
          const price = parseInt(m[1].replace(/\s/g, ""));
          if (price > 50 && price < 500000) {
            priceIndexes.push({ idx: m.index, price });
          }
        }
        console.log(`[Firecrawl] Found ${priceIndexes.length} price tokens in markdown`);

        // Extract context before each price as the service name
        for (const p of priceIndexes) {
          const before = markdown.substring(Math.max(0, p.idx - 120), p.idx).trim();
          // Parse the name — take content after last newline/bullet
          const lines = before.split("\n");
          const line = lines[lines.length - 1]?.trim() || "";
          // Remove bullets, pipes, dashes
          let name = line.replace(/^[\s•\-–—*|>]+/, "").trim();
          // If name is too short, include previous line
          if (name.length < 10 && lines.length > 1) {
            const prev = lines[lines.length - 2]?.trim() || "";
            name = (prev + " " + name).replace(/^[\s•\-–—*|>]+/, "").trim();
          }
          // Clean up
          name = name.replace(/[|:–—"']/g, " ").replace(/\s+/g, " ").trim();
          name = name.substring(0, 150).trim();

          if (name.length >= 8 && !name.match(/^[\d\s.]+$/) && !tariffs.some(t => t.priceKzt === p.price && t.rawServiceName === name)) {
            tariffs.push({
              clinicName: this.siteName,
              rawServiceName: name,
              priceKzt: p.price,
              osmsEligible: false,
              address: `г. ${city}`,
            });
          }
        }
      }

      console.log(`[Firecrawl] Extracted ${tariffs.length} prices from ${baseUrl}${logoUrl ? " + logo" : ""}`);
      if (tariffs.length === 0) {
        console.log(`[Firecrawl] 0 prices — trying AI extraction...`);
        // Step 4: AI extraction via Firecrawl LLM
        try {
          const aiRes = await this.fc(baseUrl, {
            formats: ["markdown"],
            extract: {
              prompt: `Извлеки все медицинские услуги с ценами. Для каждой верни: serviceName (название), priceKzt (цена в тенге числом), clinicName (клиника). Ответ JSON массив.`,
            },
            waitFor: 5000,
            timeout: 60000,
          });
          const extractData = aiRes.data?.data?.extract || {};
          const services = extractData.services || extractData.products || extractData.items || [];
          if (Array.isArray(services)) {
            for (const s of services) {
              const name = s.serviceName || s.service_name || s.name || s.title || "";
              const price = Number(s.priceKzt || s.price_kzt || s.price || 0);
              if (name && price > 50 && price < 500000) {
                tariffs.push({
                  clinicName: s.clinicName || s.clinic_name || this.siteName,
                  rawServiceName: name,
                  priceKzt: price,
                  osmsEligible: false,
                  address: `г. ${city}`,
                });
              }
            }
          }
          console.log(`[Firecrawl] AI extraction found ${tariffs.length} prices`);
        } catch (aiErr: any) {
          console.warn(`[Firecrawl] AI extraction failed:`, aiErr.message);
        }
      }

      return {
        sourceName: `Firecrawl[${this.siteName}]`,
        parsedAt: new Date().toISOString(),
        city,
        extractedRecordsCount: tariffs.length,
        tariffs,
        telemetry: {
          ingestDurationMs: Date.now() - startTime,
          targetUrl: baseUrl,
          isSuccessful: tariffs.length > 0,
        },
      };
    } catch (err: any) {
      console.error(`[Firecrawl] Failed ${baseUrl}:`, err.message);
      return {
        sourceName: `Firecrawl[${this.siteName}]`,
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
}
