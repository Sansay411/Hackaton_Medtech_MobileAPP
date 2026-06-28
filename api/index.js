// MedTariff.kz — Vercel Serverless API (ESM)
import express from "express";
import { MongoClient } from "mongodb";
const app = express();
app.use(express.json());

// Reconstruct original URL from Vercel rewrite query parameter
app.use((req, res, next) => {
  const apiPath = req.query.path;
  if (apiPath) {
    req.url = "/api/" + apiPath + (req.url.includes("?") ? "?" + req.url.split("?").slice(1).join("?") : "");
    delete req.query.path;
  }
  next();
});

// ── MongoDB ────────────────────────────────────────────────────────────
let _db = null, _client = null;
async function getDb() {
  if (_db) return _db;
  const uri = process.env.MONGODB_URI || "";
  if (!uri) throw new Error("MONGODB_URI not configured");
  _client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  await _client.connect();
  _db = _client.db();
  return _db;
}

// ── Constants ──────────────────────────────────────────────────────────
const CITY_CENTERS = {
  "алматы": { lat: 43.238, lng: 76.889 },
  "астана": { lat: 51.169, lng: 71.449 },
  "шымкент": { lat: 42.341, lng: 69.590 },
  "караганда": { lat: 49.802, lng: 73.088 },
};

// ── Utils ───────────────────────────────────────────────────────────────
function getDistanceStr(lat, lng, city) {
  if (!lat || !lng || !city) return "";
  const c = CITY_CENTERS[city.toLowerCase().trim()];
  if (!c) return "";
  const R = 6371;
  const dLat = (lat - c.lat) * Math.PI / 180, dLon = (lng - c.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(c.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1) + " км";
}

function getUpdatedStr(ts) {
  if (!ts) return "сегодня";
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "вчера";
  try { return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }); } catch { return "сегодня"; }
}

function normalizeClinicName(name) {
  const l = name.toLowerCase().trim();
  if (l.includes("инвитро") || l.includes("invitro") || l.includes("инвиво") || l.includes("invivo")) return "Инвитро (Invitro)";
  if (l.includes("олимп") || l.includes("olymp") || l.includes("кдл")) return "КДЛ Олимп";
  if (l.includes("сункар") || l.includes("sunkar")) return "Сункар";
  return name.trim();
}

// ── Shared search ───────────────────────────────────────────────────────
async function searchRawTariffs(query, city, allowCrossCity) {
  const db = await getDb();
  const words = query.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  const searchWords = words.length > 0 ? words : [query.trim().toLowerCase()];

  const dbCities = await db.collection("rawTariffs").distinct("city");
  const canonicalCity = dbCities.find(c => c.toLowerCase() === city.toLowerCase()) || city;
  const cityFilter = { city: canonicalCity };

  let items = [];
  const orClauses = searchWords.flatMap(w => [
    { serviceNameRaw: { $regex: w, $options: "i" } },
    { serviceNameNorm: { $regex: w, $options: "i" } },
    { clinicName: { $regex: w, $options: "i" } },
    { address: { $regex: w, $options: "i" } },
  ]);
  items = await db.collection("rawTariffs").find({ ...cityFilter, $or: orClauses }).limit(300).toArray();

  if (items.length < 8 && searchWords.some(w => w.length > 4)) {
    const prefixClauses = searchWords.filter(w => w.length > 4).flatMap(w => {
      const p = w.substring(0, Math.max(3, w.length - 2));
      return [{ serviceNameRaw: { $regex: p, $options: "i" } }, { serviceNameNorm: { $regex: p, $options: "i" } }, { clinicName: { $regex: p, $options: "i" } }];
    });
    const more = await db.collection("rawTariffs").find({ ...cityFilter, $or: prefixClauses }).limit(200).toArray();
    const seen = new Set(items.map(r => r._id?.toString()));
    for (const it of more) { if (!seen.has(it._id?.toString())) { items.push(it); seen.add(it._id?.toString()); } }
  }

  let fromOther = false;
  if (items.length === 0 && allowCrossCity && searchWords.length > 0) {
    items = await db.collection("rawTariffs").find({ $or: orClauses }).limit(100).toArray();
    fromOther = items.length > 0;
  }
  return { items, fromOtherCities: fromOther };
}

async function getLogoMap(db) {
  const m = new Map();
  try {
    for (const l of await db.collection("clinicLogos").find({}).toArray()) {
      if (l.logoUrl) m.set(normalizeClinicName(l.clinicName || l.name || "").toLowerCase(), l.logoUrl);
    }
    for (const c of await db.collection("clinics").find({}).toArray()) {
      if (c.logoUrl) m.set(normalizeClinicName(c.name || "").toLowerCase(), c.logoUrl);
    }
  } catch {}
  return m;
}

// ═════════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═════════════════════════════════════════════════════════════════════════

app.post("/api/search-services", async (req, res) => {
  try {
    const { query, city = "Алматы" } = req.body;
    if (!query?.trim()) return res.json({ error: "Query required" });
    const db = await getDb();
    const { items: rawItems, fromOtherCities } = await searchRawTariffs(query, city, true);
    if (!rawItems.length) return res.json({ insights: `По запросу "${query}" в г. ${city} ничего не найдено.`, clinics: [], isSimulated: false });

    const groupedMap = new Map();
    for (const it of rawItems) {
      const k = normalizeClinicName(it.clinicName);
      if (!groupedMap.has(k)) groupedMap.set(k, []);
      groupedMap.get(k).push(it);
    }
    const logoMap = await getLogoMap(db);
    const center = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
    const clinicsList = [];
    for (const [name, items] of groupedMap) {
      let best = items[0], bestD = Infinity;
      for (const it of items) { if (it.lat && it.lng) { const d = Math.abs(it.lat-center.lat)+Math.abs(it.lng-center.lng); if (d < bestD) { bestD = d; best = it; } } }
      const prices = items.map(i => i.priceKzt).filter(p => typeof p === "number" && p > 0);
      clinicsList.push({
        id: best.clinicId || `c-${name.toLowerCase().replace(/[^a-zа-яё0-9]/g,"-")}`,
        name, price: prices.length ? Math.min(...prices) : 0,
        address: best.address || "", district: "",
        distance: getDistanceStr(best.lat, best.lng, city),
        osms: items.some(i => i.osmsEligible),
        updated: getUpdatedStr(best.parsedAt),
        phone: best.phone || "", rating: 4.5,
        lat: best.lat, lng: best.lng,
        logoUrl: logoMap.get(name.toLowerCase()) || "",
        services: items.map(i => ({ serviceNameRaw: i.serviceNameRaw, serviceNameNorm: i.serviceNameNorm, priceKzt: i.priceKzt, osmsEligible: i.osmsEligible })),
      });
    }
    const allP = rawItems.map(i => i.priceKzt).filter(Boolean);
    const locInfo = fromOtherCities ? " (показаны результаты из других городов)" : "";
    res.json({
      insights: `Найдено ${rawItems.length} тарифов. Цены: ${Math.min(...allP).toLocaleString()}–${Math.max(...allP).toLocaleString()} ₸ (ср: ${Math.round(allP.reduce((a,b)=>a+b,0)/allP.length).toLocaleString()} ₸)${locInfo}.`,
      clinics: clinicsList, isSimulated: false,
    });
  } catch (e) { console.error(e); res.json({ insights: "Ошибка поиска", clinics: [], isSimulated: false }); }
});

app.post("/api/map-grounding", async (req, res) => {
  try {
    const { query, city = "Алматы" } = req.body;
    if (!query?.trim()) return res.json({ markers: [] });
    const db = await getDb();
    const { items: rawItems } = await searchRawTariffs(query, city, false);
    if (!rawItems.length) return res.json({ markers: [], isSimulated: false });

    const groupedMap = new Map();
    for (const it of rawItems) {
      const k = normalizeClinicName(it.clinicName);
      if (!groupedMap.has(k)) groupedMap.set(k, []);
      groupedMap.get(k).push(it);
    }
    const logoMap = await getLogoMap(db);
    const center = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
    const markers = [];
    for (const [name, items] of groupedMap) {
      let best = items[0], bestD = Infinity;
      for (const it of items) { if (it.lat && it.lng) { const d = Math.abs(it.lat-center.lat)+Math.abs(it.lng-center.lng); if (d < bestD) { bestD = d; best = it; } } }
      const coordOk = best.lat && best.lng && Math.abs(best.lat-center.lat)<1.5 && Math.abs(best.lng-center.lng)<1.5;
      const prices = items.map(i => i.priceKzt).filter(p => typeof p === "number" && p > 0);
      markers.push({
        id: `m-${name.toLowerCase().replace(/[^a-zа-яё0-9]/g,"-")}`,
        name, price: prices.length ? Math.min(...prices) : 0,
        lat: coordOk ? best.lat : center.lat, lng: coordOk ? best.lng : center.lng,
        address: best.address || "", osms: items.some(i => i.osmsEligible),
        rating: 4.5, logoUrl: logoMap.get(name.toLowerCase()) || "",
      });
    }
    res.json({ markers, isSimulated: false });
  } catch (e) { console.error(e); res.json({ markers: [], isSimulated: false }); }
});

app.get("/api/parser/sources", async (_req, res) => {
  const src = [
    { id:"kdl-olymp-almaty",name:"КДЛ Олимп (Алматы)",url:"https://kdlolymp.kz",city:"Алматы",format:"html",isActive:true,status:"ok" },
    { id:"kdl-olymp-astana",name:"КДЛ Олимп (Астана)",url:"https://kdlolymp.kz/astana",city:"Астана",format:"html",isActive:true,status:"ok" },
    { id:"kdl-olymp-shymkent",name:"КДЛ Олимп (Шымкент)",url:"https://kdlolymp.kz/shymkent",city:"Шымкент",format:"html",isActive:true,status:"ok" },
    { id:"invitro-almaty",name:"Инвитро (Алматы)",url:"https://invitro.kz/analizes/for-doctors/almaty/",city:"Алматы",format:"html",isActive:true,status:"ok" },
    { id:"invitro-astana",name:"Инвитро (Астана)",url:"https://invitro.kz/analizes/for-doctors/astana/",city:"Астана",format:"html",isActive:true,status:"ok" },
    { id:"invitro-karaganda",name:"Инвитро (Караганда)",url:"https://invitro.kz/analizes/for-doctors/karaganda/",city:"Караганда",format:"html",isActive:true,status:"ok" },
    { id:"invitro-shymkent",name:"Инвитро (Шымкент)",url:"https://invitro.kz/analizes/for-doctors/shymkent/",city:"Шымкент",format:"html",isActive:true,status:"ok" },
    { id:"topdoc-almaty-lab",name:"TopDoc.kz (Алматы)",url:"https://www.topdoc.kz/almaty/laboratories/",city:"Алматы",format:"html",isActive:true,status:"ok" },
    { id:"topdoc-astana-lab",name:"TopDoc.kz (Астана)",url:"https://www.topdoc.kz/astana/laboratories/",city:"Астана",format:"html",isActive:true,status:"ok" },
    { id:"dgis-almaty",name:"2GIS (Алматы)",url:"",city:"Алматы",format:"json-api",isActive:true,status:"ok" },
    { id:"dgis-astana",name:"2GIS (Астана)",url:"",city:"Астана",format:"json-api",isActive:true,status:"ok" },
    { id:"dgis-karaganda",name:"2GIS (Караганда)",url:"",city:"Караганда",format:"json-api",isActive:true,status:"ok" },
    { id:"dgis-shymkent",name:"2GIS (Шымкент)",url:"",city:"Шымкент",format:"json-api",isActive:true,status:"ok" },
  ];
  try {
    const db = await getDb();
    const out = await Promise.all(src.map(async s => {
      let rc = 0, lr = null;
      try { rc = await db.collection("rawTariffs").countDocuments({ city: { $regex: new RegExp(s.city, "i") } }); } catch {}
      try { const log = await db.collection("runLogs").findOne({ sourceId: s.id }, { sort: { startedAt: -1 } }); if (log) lr = log.completedAt || log.startedAt; } catch {}
      return { ...s, description: s.name, recordCount: rc, lastRun: lr };
    }));
    res.json({ sources: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/parser/raw-tariffs", async (req, res) => {
  try { const db = await getDb(); const q = req.query.city ? { city: { $regex: new RegExp(req.query.city, "i") } } : {}; const r = await db.collection("rawTariffs").find(q).limit(500).toArray(); res.json({ records: r, total: r.length }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/parser/run-logs", async (req, res) => {
  try { const db = await getDb(); const logs = await db.collection("runLogs").find().sort({ startedAt: -1 }).limit(Number(req.query.limit) || 50).toArray(); res.json({ logs }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/parser/last-run", async (_req, res) => {
  try { const db = await getDb(); const l = await db.collection("runLogs").findOne({ isSuccessful: true }, { sort: { startedAt: -1 } }); if (l) return res.json({ success: true, timestamp: l.startedAt || l.completedAt }); const t = await db.collection("rawTariffs").findOne({ parsedAt: { $exists: true } }, { sort: { parsedAt: -1 } }); res.json({ success: true, timestamp: t?.parsedAt || new Date().toISOString() }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/clinics/logos", async (_req, res) => {
  try { const db = await getDb(); const list = await db.collection("clinicLogos").find({}).toArray(); res.json(list.map(({ _id, ...r }) => ({ id: r.id || String(_id), ...r }))); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/db/:collection", async (req, res) => {
  try { const db = await getDb(); const q = {}; for (const [k, v] of Object.entries(req.query)) { if (v) q[k] = v; } const list = await db.collection(req.params.collection).find(q).toArray(); res.json(list.map(({ _id, ...r }) => ({ id: r.id || String(_id), ...r }))); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/db/:collection", async (req, res) => {
  try { const db = await getDb(); const d = req.body; const id = d.id || String(Date.now() + Math.random().toString(36).slice(2,6)); const { _id, ...p } = { ...d, id }; await db.collection(req.params.collection).updateOne({ id }, { $set: p }, { upsert: true }); res.json({ success: true, id }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

export default app;
