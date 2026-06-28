import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "../lib/mongodb";

export async function collectLogos(): Promise<void> {
  const db = await getDb();
  console.log("[LogoFetcher] Starting logo collection task...");
  
  const uniqueClinicNames = await db.collection("rawTariffs").distinct("clinicName");
  console.log(`[LogoFetcher] Found ${uniqueClinicNames.length} unique clinic names in database.`);

  for (const name of uniqueClinicNames) {
    if (!name) continue;
    const nameTrimmed = name.trim();
    const clinicId = `clinic-${nameTrimmed.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`;

    // Check if already has a valid logo URL in clinicLogos
    const existing = await db.collection("clinicLogos").findOne({ clinicName: nameTrimmed });
    if (existing?.logoUrl) {
      console.log(`[LogoFetcher] Logo already exists for: "${nameTrimmed}". Skipping.`);
      continue;
    }

    let logoUrl = "";
    let logoSource = "";

    const nameLower = nameTrimmed.toLowerCase();

    // 1. Hardcoded major networks (logo URLs verified as of 2026-06)
    if (nameLower.includes("олимп") || nameLower.includes("olymp")) {
      logoUrl = "https://kdlolymp.kz/favicons/android-chrome-512x512.png";
      logoSource = "kdl";
    } else if (nameLower.includes("инвитро") || nameLower.includes("invitro")) {
      logoUrl = "https://invitro.kz/local/templates/invitro_main/src/image/icons/footer/logo.svg";
      logoSource = "invitro";
    } else if (nameLower.includes("инвиво") || nameLower.includes("invivo")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=invivo.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("сункар") || nameLower.includes("sunkar")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=sunkar.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("орхун") || nameLower.includes("orhun")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=orhunmedical.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("керуен") || nameLower.includes("keruen")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=keruen.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("хак") || nameLower.includes("hak")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=hakmedical.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("эскулап") || nameLower.includes("aesculap")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=aesculap.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("dau-med") || nameLower.includes("дау")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=daumed.kz&sz=128";
      logoSource = "favicon";
    } else if (nameLower.includes("поликлиника") && nameLower.includes("4")) {
      logoUrl = "https://www.google.com/s2/favicons?domain=gov.kz&sz=128";
      logoSource = "favicon";
    }

    // 2. 2GIS Catalog API search — look up by clinic name + get logo
    if (!logoUrl) {
      try {
        // Find the city for this clinic from rawTariffs to use correct location
        const clinicRecord = await db.collection("rawTariffs").findOne({ clinicName: nameTrimmed });
        const clinicCity = clinicRecord?.city?.toLowerCase() || "";
        const cityCoords: Record<string, string> = {
          "алматы": "76.889,43.238", "астана": "71.449,51.169",
          "шымкент": "69.590,42.341", "караганда": "73.088,49.802",
        };
        const location = cityCoords[clinicCity] || "76.889,43.238";

        console.log(`[LogoFetcher] Querying 2GIS for: "${nameTrimmed}" in ${clinicCity || "KZ"}`);
        const dgisRes = await axios.get("https://catalog.api.2gis.com/3.0/items", {
          params: {
            q: nameTrimmed,
            location,
            key: "26c65059-f062-4a91-a973-b8a38fedf562",
            limit: 1,
            fields: "items.external_content,items.contact_groups,items.address_name",
          },
          timeout: 5000,
        });
        const item = dgisRes.data?.result?.items?.[0];
        if (item?.external_content?.logo?.url) {
          logoUrl = item.external_content.logo.url;
          logoSource = "2gis";
        }
        if (!logoUrl) {
          const site = item?.contact_groups?.[0]?.items?.find((i: any) => i.type === "website")?.value || "";
          if (site) {
            const domain = site.replace(/^https?:\/\//i, "").split("/")[0];
            logoUrl = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
            logoSource = "favicon";
          }
        }
      } catch (dgisErr) {
        console.warn(`[LogoFetcher] 2GIS request failed for "${nameTrimmed}":`, dgisErr instanceof Error ? dgisErr.message : dgisErr);
      }
    }

    // 3. TopDoc.kz lookup fallback
    if (!logoUrl) {
      try {
        console.log(`[LogoFetcher] Querying TopDoc for: "${nameTrimmed}"`);
        const tdRes = await axios.get(`https://www.topdoc.kz/search?q=${encodeURIComponent(nameTrimmed)}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          timeout: 5000
        });
        const $ = cheerio.load(tdRes.data);
        const img = $('img[src*="Company"]').first().attr('src');
        if (img) {
          logoUrl = img.startsWith('http') ? img : `https://www.topdoc.kz${img}`;
          logoSource = "topdoc";
        }
      } catch (tdErr) {
        console.warn(`[LogoFetcher] TopDoc request failed for "${nameTrimmed}":`, tdErr instanceof Error ? tdErr.message : tdErr);
      }
    }

    // 4. Guessed favicon domains
    if (!logoUrl) {
      let guessedDomain = "";
      if (nameLower.includes("сункар") || nameLower.includes("sunkar")) guessedDomain = "sunkar.kz";
      else if (nameLower.includes("орхун") || nameLower.includes("orhun")) guessedDomain = "orhunmedical.kz";
      else if (nameLower.includes("хак") || nameLower.includes("hak")) guessedDomain = "hakmedical.kz";
      else if (nameLower.includes("керуен") || nameLower.includes("keruen")) guessedDomain = "keruen.kz";
      else if (nameLower.includes("эскулап") || nameLower.includes("aesculap")) guessedDomain = "aesculap.kz";
      else if (nameLower.includes("dau") || nameLower.includes("дау")) guessedDomain = "daumed.kz";

      if (guessedDomain) {
        logoUrl = `https://www.google.com/s2/favicons?sz=128&domain=${guessedDomain}`;
        logoSource = "favicon";
      }
    }

    // Write logo results
    if (logoUrl) {
      console.log(`[LogoFetcher] Resolved logo for "${nameTrimmed}" -> ${logoUrl} (${logoSource})`);
      await db.collection("clinicLogos").updateOne(
        { clinicName: nameTrimmed },
        { $set: { clinicName: nameTrimmed, logoUrl, source: logoSource } },
        { upsert: true }
      );
      // Keep clinics collection in sync
      await db.collection("clinics").updateOne(
        { clinicId },
        { $set: { clinicId, name: nameTrimmed, logoUrl, logoSource } },
        { upsert: true }
      );
    } else {
      console.log(`[LogoFetcher] Could not resolve logo for "${nameTrimmed}".`);
    }

    // Rate limit delay
    await new Promise(r => setTimeout(r, 800));
  }
  console.log("[LogoFetcher] Logo gathering process finished successfully.");
}
