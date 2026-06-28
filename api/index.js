// Vercel Serverless API — MedTariff.kz
const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB lazy connection ──────────────────────────────────────────
let _db = null;
let _client = null;
async function getDb() {
  if (_db) return _db;
  const { MongoClient } = require("mongodb");
  const uri = process.env.MONGODB_URI || "mongodb+srv://credox5_db_user:JN9tBLlPhAmdJItC@cluster0.6d5wurd.mongodb.net/test";
  _client = new MongoClient(uri);
  await _client.connect();
  _db = _client.db();
  console.log("[MongoDB] Connected");
  return _db;
}

// ── Constants ────────────────────────────────────────────────────────
const CITY_CENTERS = {
  "алматы": { lat: 43.238, lng: 76.889 },
  "астана": { lat: 51.169, lng: 71.449 },
  "шымкент": { lat: 42.341, lng: 69.590 },
  "караганда": { lat: 49.802, lng: 73.088 },
  "актобе": { lat: 50.283, lng: 57.926 },
  "павлодар": { lat: 52.287, lng: 76.931 }
};

// ── Utilities ────────────────────────────────────────────────────────
function getDistanceStr(lat, lng, city) {
  if (!lat || !lng || !city) return "";
  const center = CITY_CENTERS[city.toLowerCase().trim()];
  if (!center) return "";
  const R = 6371;
  const dLat = (lat - center.lat) * Math.PI / 180;
  const dLon = (lng - center.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(center.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1) + " км";
}

function getUpdatedStr(parsedAtStr) {
  if (!parsedAtStr) return "сегодня";
  try {
    const d = new Date(parsedAtStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "сегодня";
    if (diff === 1) return "вчера";
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  } catch { return "сегодня"; }
}

function normalizeClinicName(name) {
  const lower = name.toLowerCase().trim();
  if (lower.includes("инвитро") || lower.includes("invitro") || lower.includes("инвиво") || lower.includes("invivo")) return "Инвитро (Invitro)";
  if (lower.includes("олимп") || lower.includes("olymp") || lower.includes("кдл")) return "КДЛ Олимп";
  if (lower.includes("сункар") || lower.includes("sunkar")) return "Сункар";
  return name.trim();
}

// ── Shared Search Engine ─────────────────────────────────────────────
async function searchRawTariffs(query, city, allowCrossCity) {
  const db = await getDb();
  const rawWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const words = rawWords.filter(w => w.length >= 2);
  const searchWords = words.length > 0 ? words : rawWords;

  const dbCities = await db.collection("rawTariffs").distinct("city");
  const canonicalCity = dbCities.find(c => c.toLowerCase() === city.toLowerCase()) || city;
  const cityFilter = { city: canonicalCity };

  let items = [];
  if (searchWords.length > 0) {
    const orClauses = searchWords.flatMap(w => [
      { serviceNameRaw: { $regex: w, $options: "i" } },
      { serviceNameNorm: { $regex: w, $options: "i" } },
      { clinicName: { $regex: w, $options: "i" } },
      { address: { $regex: w, $options: "i" } },
    ]);
    items = await db.collection("rawTariffs").find({ ...cityFilter, $or: orClauses }).limit(300).toArray();

    if (items.length < 8 && searchWords.some(w => w.length > 4)) {
      const prefixClauses = searchWords.filter(w => w.length > 4).flatMap(w => {
        const prefix = w.substring(0, Math.max(3, w.length - 2));
        return [
          { serviceNameRaw: { $regex: prefix, $options: "i" } },
          { serviceNameNorm: { $regex: prefix, $options: "i" } },
          { clinicName: { $regex: prefix, $options: "i" } },
        ];
      });
      const more = await db.collection("rawTariffs").find({ ...cityFilter, $or: prefixClauses }).limit(200).toArray();
      const seenIds = new Set(items.map(r => r._id?.toString()));
      for (const it of more) { if (!seenIds.has(it._id?.toString())) { items.push(it); seenIds.add(it._id?.toString()); } }
    }
  } else {
    items = await db.collection("rawTariffs").find(cityFilter).limit(300).toArray();
  }

  let fromOtherCities = false;
  if (items.length === 0 && allowCrossCity && searchWords.length > 0) {
    const crossClauses = searchWords.flatMap(w => [
      { serviceNameRaw: { $regex: w, $options: "i" } },
      { serviceNameNorm: { $regex: w, $options: "i" } },
      { clinicName: { $regex: w, $options: "i" } },
    ]);
    items = await db.collection("rawTariffs").find({ $or: crossClauses }).limit(100).toArray();
    fromOtherCities = items.length > 0;
  }

  return { items, fromOtherCities };
}

// ── Logo helpers ─────────────────────────────────────────────────────
async function getLogoMap(db) {
  const map = new Map();
  try {
    const logos = await db.collection("clinicLogos").find({}).toArray();
    for (const l of logos) {
      const n = normalizeClinicName(l.clinicName || l.name || "");
      if (l.logoUrl) map.set(n.toLowerCase(), l.logoUrl);
    }
    const clinics = await db.collection("clinics").find({}).toArray();
    for (const c of clinics) {
      const n = normalizeClinicName(c.name || "");
      if (c.logoUrl) map.set(n.toLowerCase(), c.logoUrl);
    }
  } catch {}
  return map;
}

// ═══════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════════════

// ── Search ────────────────────────────────────────────────────────────
app.post("/api/search-services", async (req, res) => {
  try {
    const { query, city = "Алматы" } = req.body;
    if (!query || !query.trim()) return res.json({ error: "Search query is required" });

    const db = await getDb();
    const { items: rawItems, fromOtherCities } = await searchRawTariffs(query, city, true);

    if (rawItems.length === 0) {
      return res.json({ insights: `По запросу "${query}" в г. ${city} ничего не найдено.`, clinics: [], isSimulated: false });
    }

    const groupedMap = new Map();
    for (const item of rawItems) {
      const key = normalizeClinicName(item.clinicName);
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key).push(item);
    }

    const logoMap = await getLogoMap(db);
    const cityCenter = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
    const clinicsList = [];
    let idx = 0;

    for (const [clinicName, items] of groupedMap) {
      idx++;
      let bestItem = items[0], bestDist = Infinity;
      for (const it of items) {
        if (it.lat && it.lng) {
          const d = Math.abs(it.lat - cityCenter.lat) + Math.abs(it.lng - cityCenter.lng);
          if (d < bestDist) { bestDist = d; bestItem = it; }
        }
      }
      const prices = items.map(it => it.priceKzt).filter(p => typeof p === "number" && p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const logoUrl = logoMap.get(clinicName.toLowerCase()) || "";

      clinicsList.push({
        id: bestItem.clinicId || `clinic-${idx}-${clinicName.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`,
        name: clinicName, price: minPrice,
        address: bestItem.address || "Адрес не указан", district: "",
        distance: getDistanceStr(bestItem.lat, bestItem.lng, city),
        osms: items.some(it => it.osmsEligible),
        updated: getUpdatedStr(bestItem.parsedAt),
        phone: bestItem.phone || "Телефон не указан", rating: 4.5,
        lat: bestItem.lat, lng: bestItem.lng, logoUrl,
        services: items.map(it => ({
          serviceNameRaw: it.serviceNameRaw, serviceNameNorm: it.serviceNameNorm,
          priceKzt: it.priceKzt, osmsEligible: it.osmsEligible,
        })),
      });
    }

    const allPrices = rawItems.map(it => it.priceKzt).filter(Boolean);
    const minP = allPrices.length ? Math.min(...allPrices) : 0;
    const maxP = allPrices.length ? Math.max(...allPrices) : 0;
    const avgP = allPrices.length ? Math.round(allPrices.reduce((a,b)=>a+b,0)/allPrices.length) : 0;
    const osmsCount = rawItems.filter(it => it.osmsEligible).length;
    const locInfo = fromOtherCities ? " (показаны результаты из других городов)" : "";

    res.json({
      insights: `По запросу "${query}" в г. ${city} найдено ${rawItems.length} тарифов. Цены: ${minP.toLocaleString()}–${maxP.toLocaleString()} ₸ (средняя: ${avgP.toLocaleString()} ₸). ОСМС: ${osmsCount}${locInfo}.`,
      clinics: clinicsList, isSimulated: false,
    });
  } catch (error) { console.error("Search failed:", error); res.json({ insights: "Поиск временно недоступен", clinics: [], isSimulated: false }); }
});

// ── Map Grounding ─────────────────────────────────────────────────────
app.post("/api/map-grounding", async (req, res) => {
  try {
    const { query, city = "Алматы" } = req.body;
    if (!query || !query.trim()) return res.json({ markers: [] });

    const db = await getDb();
    const { items: rawItems } = await searchRawTariffs(query, city, false);
    if (rawItems.length === 0) return res.json({ markers: [], isSimulated: false });

    const groupedMap = new Map();
    for (const item of rawItems) {
      const key = normalizeClinicName(item.clinicName);
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key).push(item);
    }

    const logoMap = await getLogoMap(db);
    const cityCenter = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
    const markersList = [];
    const seenNames = new Set();
    let idx = 0;

    for (const [clinicName, items] of groupedMap) {
      if (seenNames.has(clinicName.toLowerCase())) continue;
      seenNames.add(clinicName.toLowerCase());
      idx++;

      let bestItem = items[0], bestDist = Infinity;
      for (const it of items) {
        if (it.lat && it.lng) {
          const d = Math.abs(it.lat - cityCenter.lat) + Math.abs(it.lng - cityCenter.lng);
          if (d < bestDist) { bestDist = d; bestItem = it; }
        }
      }

      const coordOk = bestItem.lat && bestItem.lng
        && Math.abs(bestItem.lat - cityCenter.lat) < 1.5
        && Math.abs(bestItem.lng - cityCenter.lng) < 1.5;
      const prices = items.map(it => it.priceKzt).filter(p => typeof p === "number" && p > 0);
      const logoUrl = logoMap.get(clinicName.toLowerCase()) || "";

      markersList.push({
        id: `marker-${idx}-${clinicName.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`,
        name: clinicName,
        price: prices.length > 0 ? Math.min(...prices) : 0,
        lat: coordOk ? bestItem.lat : cityCenter.lat,
        lng: coordOk ? bestItem.lng : cityCenter.lng,
        address: bestItem.address || "Адрес не указан",
        osms: items.some(it => it.osmsEligible),
        rating: 4.5, logoUrl,
      });
    }

    res.json({ markers: markersList, isSimulated: false });
  } catch (error) { console.error("Map failed:", error); res.json({ markers: [], isSimulated: false }); }
});

// ── Parser Sources ────────────────────────────────────────────────────
app.get("/api/parser/sources", async (_req, res) => {
  try {
    const PARSER_SOURCES = [
      { id: "kdl-olymp-almaty", name: "КДЛ Олимп (Алматы)", providerClass: "KdlProvider", url: "https://kdlolymp.kz", city: "Алматы", format: "html", isActive: true, description: "Лабораторные анализы KDL", status: "ok" },
      { id: "kdl-olymp-astana", name: "КДЛ Олимп (Астана)", providerClass: "KdlProvider", url: "https://kdlolymp.kz/astana", city: "Астана", format: "html", isActive: true, description: "Лабораторные анализы KDL", status: "ok" },
      { id: "kdl-olymp-shymkent", name: "КДЛ Олимп (Шымкент)", providerClass: "KdlProvider", url: "https://kdlolymp.kz/shymkent", city: "Шымкент", format: "html", isActive: true, description: "Лабораторные анализы KDL", status: "ok" },
      { id: "invitro-almaty", name: "Инвитро (Алматы)", providerClass: "InvitroProvider", url: "https://invitro.kz/analizes/for-doctors/almaty/", city: "Алматы", format: "html", isActive: true, description: "Лабораторные исследования Invitro", status: "ok" },
      { id: "invitro-astana", name: "Инвитро (Астана)", providerClass: "InvitroProvider", url: "https://invitro.kz/analizes/for-doctors/astana/", city: "Астана", format: "html", isActive: true, description: "Лабораторные исследования Invitro", status: "ok" },
      { id: "invitro-karaganda", name: "Инвитро (Караганда)", providerClass: "InvitroProvider", url: "https://invitro.kz/analizes/for-doctors/karaganda/", city: "Караганда", format: "html", isActive: true, description: "Лабораторные исследования Invitro", status: "ok" },
      { id: "invitro-shymkent", name: "Инвитро (Шымкент)", providerClass: "InvitroProvider", url: "https://invitro.kz/analizes/for-doctors/shymkent/", city: "Шымкент", format: "html", isActive: true, description: "Лабораторные исследования Invitro", status: "ok" },
      { id: "topdoc-almaty-laboratories", name: "TopDoc.kz (Лаб. Алматы)", providerClass: "TopdocProvider", url: "https://www.topdoc.kz/almaty/laboratories/", city: "Алматы", format: "html", isActive: true, description: "Агрегатор клиник", status: "ok" },
      { id: "topdoc-almaty-clinics", name: "TopDoc.kz (Клиники Алматы)", providerClass: "TopdocProvider", url: "https://www.topdoc.kz/almaty/clinics/", city: "Алматы", format: "html", isActive: true, description: "Медицинские центры", status: "ok" },
      { id: "topdoc-astana-laboratories", name: "TopDoc.kz (Лаб. Астана)", providerClass: "TopdocProvider", url: "https://www.topdoc.kz/astana/laboratories/", city: "Астана", format: "html", isActive: true, description: "Лаборатории Астаны", status: "ok" },
      { id: "dgis-almaty", name: "2GIS (Алматы)", providerClass: "DgisProvider", url: "", city: "Алматы", format: "json-api", isActive: true, description: "Клиники Алматы через 2GIS", status: "ok" },
      { id: "dgis-astana", name: "2GIS (Астана)", providerClass: "DgisProvider", url: "", city: "Астана", format: "json-api", isActive: true, description: "Клиники Астаны через 2GIS", status: "ok" },
      { id: "dgis-karaganda", name: "2GIS (Караганда)", providerClass: "DgisProvider", url: "", city: "Караганда", format: "json-api", isActive: true, description: "Клиники Караганды через 2GIS", status: "ok" },
      { id: "dgis-shymkent", name: "2GIS (Шымкент)", providerClass: "DgisProvider", url: "", city: "Шымкент", format: "json-api", isActive: true, description: "Клиники Шымкента через 2GIS", status: "ok" },
    ];
    const db = await getDb();
    const sources = await Promise.all(PARSER_SOURCES.map(async (s) => {
      let recordCount = 0, lastRun = null;
      if (s.isActive) {
        try { recordCount = await db.collection("rawTariffs").countDocuments({ city: { $regex: new RegExp(s.city, "i") } }); } catch {}
        try { const log = await db.collection("runLogs").findOne({ sourceId: s.id }, { sort: { startedAt: -1 } }); if (log) lastRun = log.completedAt || log.startedAt; } catch {}
      }
      return { id: s.id, name: s.name, url: s.url, city: s.city, format: s.format, isActive: s.isActive, description: s.description, status: s.status || (s.isActive ? "unknown" : "disabled"), recordCount, lastRun };
    }));
    res.json({ sources });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Raw Tariffs ──────────────────────────────────────────────────────
app.get("/api/parser/raw-tariffs", async (req, res) => {
  try {
    const db = await getDb();
    const city = req.query.city;
    const query = city ? { city: { $regex: new RegExp(city, "i") } } : {};
    const records = await db.collection("rawTariffs").find(query).limit(500).toArray();
    res.json({ records, total: records.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Run Logs ─────────────────────────────────────────────────────────
app.get("/api/parser/run-logs", async (req, res) => {
  try {
    const db = await getDb();
    const logs = await db.collection("runLogs").find().sort({ startedAt: -1 }).limit(Number(req.query.limit) || 50).toArray();
    res.json({ logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Last Run ─────────────────────────────────────────────────────────
app.get("/api/parser/last-run", async (_req, res) => {
  try {
    const db = await getDb();
    const lastLog = await db.collection("runLogs").findOne({ isSuccessful: true }, { sort: { startedAt: -1 } });
    if (lastLog) return res.json({ success: true, timestamp: lastLog.startedAt || lastLog.completedAt });
    const lastTariff = await db.collection("rawTariffs").findOne({ parsedAt: { $exists: true } }, { sort: { parsedAt: -1 } });
    res.json({ success: true, timestamp: lastTariff?.parsedAt || new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Clinic Logos ─────────────────────────────────────────────────────
app.get("/api/clinics/logos", async (_req, res) => {
  try {
    const db = await getDb();
    const list = await db.collection("clinicLogos").find({}).toArray();
    res.json(list.map(({ _id, ...r }) => ({ id: r.id || String(_id), ...r })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MongoDB CRUD bridge ──────────────────────────────────────────────
app.get("/api/db/:collection", async (req, res) => {
  try {
    const db = await getDb();
    const query = {};
    for (const [k, v] of Object.entries(req.query)) { if (v) query[k] = v; }
    const list = await db.collection(req.params.collection).find(query).toArray();
    res.json(list.map(({ _id, ...r }) => ({ id: r.id || String(_id), ...r })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/db/:collection", async (req, res) => {
  try {
    const db = await getDb();
    const data = req.body;
    const id = data.id || String(Date.now() + Math.random().toString(36).slice(2, 6));
    const { _id, ...payload } = { ...data, id };
    await db.collection(req.params.collection).updateOne({ id }, { $set: payload }, { upsert: true });
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ═══════════════════════════════════════════════════════════════════════
//  Export for Vercel (NO app.listen — Vercel handles the HTTP server)
// ═══════════════════════════════════════════════════════════════════════
module.exports = app;
