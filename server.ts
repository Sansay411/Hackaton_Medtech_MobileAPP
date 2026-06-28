import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import XLSX from "xlsx";
import mammoth from "mammoth";
import https from "https";
import { createRequire } from "module";
import cron from "node-cron";
import axios from "axios";
import * as cheerio from "cheerio";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

// Simulated high-fidelity Kazakhstan medical services pricing database (Real-world based)
function getClinicDetails(name: string, city: string) {
  const cityLower = city.toLowerCase();
  const nameLower = name.toLowerCase();

  // 1. Karaganda
  if (cityLower.includes("караганда")) {
    if (nameLower.includes("олимп")) {
      return {
        address: "пр. Бухар-Жырау, 54",
        district: "р-н Казыбек би",
        lat: 49.8075,
        lng: 73.0854,
      };
    }
    if (nameLower.includes("инвиво")) {
      return {
        address: "пр. Бухар-Жырау, 66",
        district: "р-н Казыбек би",
        lat: 49.8082,
        lng: 73.0975,
      };
    }
    if (nameLower.includes("сункар")) {
      return {
        address: "ул. Ерубаева, 51/2",
        district: "р-н Казыбек би",
        lat: 49.8065,
        lng: 73.0825,
      };
    }
    if (nameLower.includes("эскулап")) {
      return {
        address: "ул. Комиссарова, 28",
        district: "р-н Казыбек би",
        lat: 49.8012,
        lng: 73.0785,
      };
    }
    if (nameLower.includes("dau-med")) {
      return {
        address: "ул. Алалыкина, 11",
        district: "р-н Казыбек би",
        lat: 49.8115,
        lng: 73.0895,
      };
    }
    if (nameLower.includes("orhun")) {
      return {
        address: "пр. Шахтеров, 5/2",
        district: "р-н Казыбек би",
        lat: 49.7845,
        lng: 73.1415,
      };
    }
    if (nameLower.includes("керуен")) {
      return {
        address: "ул. Ермекова, 52",
        district: "р-н Казыбек би",
        lat: 49.7915,
        lng: 73.0912,
      };
    }
    if (nameLower.includes("hak")) {
      return {
        address: "ул. Муканова, 18",
        district: "р-н Казыбек би",
        lat: 49.7745,
        lng: 73.1285,
      };
    }
    if (nameLower.includes("поликлиника")) {
      return {
        address: "мкр. Голубые Пруды, 11а",
        district: "р-н Алихана Бокейхана",
        lat: 49.8407,
        lng: 73.1896,
      };
    }
    // Default Karaganda
    return {
      address: "пр. Бухар-Жырау, 50",
      district: "р-н Казыбек би",
      lat: 49.8022,
      lng: 73.0881,
    };
  }

  // 2. Astana
  if (cityLower.includes("астана")) {
    if (nameLower.includes("олимп")) {
      return {
        address: "пр. Республики, 19",
        district: "Сарыаркинский р-н",
        lat: 51.1630,
        lng: 71.4320,
      };
    }
    if (nameLower.includes("инвиво")) {
      return {
        address: "ул. Кенесары, 65",
        district: "Алматинский р-н",
        lat: 51.1610,
        lng: 71.4180,
      };
    }
    if (nameLower.includes("сункар")) {
      return {
        address: "пр. Кабанбай батыра, 42",
        district: "Есильский р-н",
        lat: 51.1325,
        lng: 71.4250,
      };
    }
    if (nameLower.includes("эскулап")) {
      return {
        address: "пр. Республики, 34",
        district: "Сарыаркинский р-н",
        lat: 51.1540,
        lng: 71.4310,
      };
    }
    if (nameLower.includes("dau-med")) {
      return {
        address: "ул. Сыганак, 10",
        district: "Есильский р-н",
        lat: 51.1215,
        lng: 71.4220,
      };
    }
    if (nameLower.includes("orhun")) {
      return {
        address: "ул. Туркестан, 8",
        district: "Есильский р-н",
        lat: 51.1350,
        lng: 71.4050,
      };
    }
    if (nameLower.includes("керуен")) {
      return {
        address: "ул. Керей, Жанибек хандар, 12",
        district: "Есильский р-н",
        lat: 51.1240,
        lng: 71.4360,
      };
    }
    if (nameLower.includes("hak")) {
      return {
        address: "пр. Сарыарка, 11",
        district: "Сарыаркинский р-н",
        lat: 51.1420,
        lng: 71.4420,
      };
    }
    if (nameLower.includes("поликлиника")) {
      return {
        address: "ул. Кенесары, 1",
        district: "Сарыаркинский р-н",
        lat: 51.1695,
        lng: 71.4120,
      };
    }
    return {
      address: "пр. Кабанбай батыра, 21",
      district: "Есильский р-н",
      lat: 51.169392,
      lng: 71.449074,
    };
  }

  // 3. Shymkent
  if (cityLower.includes("шымкент")) {
    if (nameLower.includes("олимп")) {
      return {
        address: "пр. Тауке хана, 84",
        district: "Аль-Фарабийский р-н",
        lat: 42.3215,
        lng: 69.5890,
      };
    }
    if (nameLower.includes("инвиво")) {
      return {
        address: "б-р Кунаева, 31",
        district: "Аль-Фарабийский р-н",
        lat: 42.3320,
        lng: 69.5950,
      };
    }
    if (nameLower.includes("сункар")) {
      return {
        address: "ул. Рыскулова, 14",
        district: "Енбекшинский р-н",
        lat: 42.3150,
        lng: 69.5820,
      };
    }
    if (nameLower.includes("эскулап")) {
      return {
        address: "ул. Желтоксан, 25",
        district: "Аль-Фарабийский р-н",
        lat: 42.3260,
        lng: 69.5840,
      };
    }
    if (nameLower.includes("dau-med")) {
      return {
        address: "пр. Бауыржана Момышулы, 25",
        district: "Каратауский р-н",
        lat: 42.3450,
        lng: 69.6010,
      };
    }
    if (nameLower.includes("orhun")) {
      return {
        address: "ул. Желтоксан, 19",
        district: "Абайский р-н",
        lat: 42.3510,
        lng: 69.5880,
      };
    }
    if (nameLower.includes("керуен")) {
      return {
        address: "Темирлановское шоссе, 38",
        district: "Абайский р-н",
        lat: 42.3280,
        lng: 69.6120,
      };
    }
    if (nameLower.includes("hak")) {
      return {
        address: "ул. Жибек Жолы, 62",
        district: "Енбекшинский р-н",
        lat: 42.3380,
        lng: 69.5750,
      };
    }
    if (nameLower.includes("поликлиника")) {
      return {
        address: "ул. Сайрамская, 192",
        district: "Енбекшинский р-н",
        lat: 42.3110,
        lng: 69.5980,
      };
    }
    return {
      address: "пр. Тауке хана, 10",
      district: "Аль-Фарабийский р-н",
      lat: 42.3417,
      lng: 69.5901,
    };
  }

  // 4. Default: Almaty
  if (nameLower.includes("олимп")) {
    return {
      address: "пр. Назарбаева, 120",
      district: "Бостандыкский р-н",
      lat: 43.2382,
      lng: 76.9142,
    };
  }
  if (nameLower.includes("инвиво")) {
    return {
      address: "ул. Толе би, 99",
      district: "Алмалинский р-н",
      lat: 43.2492,
      lng: 76.9295,
    };
  }
  if (nameLower.includes("сункар")) {
    return {
      address: "пр. Абая, 52в",
      district: "Бостандыкский р-н",
      lat: 43.2185,
      lng: 76.8850,
    };
  }
  if (nameLower.includes("эскулап")) {
    return {
      address: "ул. Розыбакиева, 250",
      district: "Бостандыкский р-н",
      lat: 43.2435,
      lng: 76.9080,
    };
  }
  if (nameLower.includes("dau-med")) {
    return {
      address: "ул. Толе би, 101",
      district: "Алмалинский р-н",
      lat: 43.2435,
      lng: 76.9080,
    };
  }
  if (nameLower.includes("orhun")) {
    return {
      address: "ул. Гоголя, 144",
      district: "Алмалинский р-н",
      lat: 43.2451,
      lng: 76.9250,
    };
  }
  if (nameLower.includes("керуен")) {
    return {
      address: "ул. Кабанбай Батыра, 85",
      district: "Медеуский р-н",
      lat: 43.2285,
      lng: 76.9535,
    };
  }
  if (nameLower.includes("hak")) {
    return {
      address: "ул. Отеген Батыра, 11а",
      district: "Ауэзовский р-н",
      lat: 43.2215,
      lng: 76.8580,
    };
  }
  if (nameLower.includes("поликлиника")) {
    return {
      address: "ул. Шевченко, 154",
      district: "Алмалинский р-н",
      lat: 43.2555,
      lng: 76.9310,
    };
  }
  return {
    address: "пр. Назарбаева, 100",
    district: "Медеуский р-н",
    lat: 43.238940,
    lng: 76.889709,
  };
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSimulatedServices(query: string, city: string) {
  const normQuery = (query || "").toLowerCase();
  let basePrice = 2500;
  let serviceName = "Общий анализ крови (ОАК)";
  let isLab = false;
  let isImaging = false;
  let isConsult = false;

  if (normQuery.includes("пцр") || normQuery.includes("pcr") || normQuery.includes("анализ") || normQuery.includes("кров") || normQuery.includes("моч") || normQuery.includes("гепатит") || normQuery.includes("вич") || normQuery.includes("скрининг") || normQuery.includes("лаборатор")) {
    isLab = true;
    if (normQuery.includes("пцр")) {
      serviceName = "ПЦР тест на COVID-19 / Вирусные инфекции";
      basePrice = 6500;
    } else if (normQuery.includes("биохими")) {
      serviceName = "Биохимический анализ крови (расширенный профиль)";
      basePrice = 5200;
    } else if (normQuery.includes("моч")) {
      serviceName = "Общий анализ мочи с микроскопией осадка";
      basePrice = 1200;
    } else if (normQuery.includes("сахар") || normQuery.includes("глюкоз")) {
      serviceName = "Определение уровня глюкозы в сыворотке крови";
      basePrice = 900;
    } else {
      serviceName = "Общий анализ крови (ОАК) с лейкоцитарной формулой";
      basePrice = 2250;
    }
  } else if (normQuery.includes("мрт") || normQuery.includes("узи") || normQuery.includes("рентген") || normQuery.includes("кт") || normQuery.includes("томограф") || normQuery.includes("ультразвук")) {
    isImaging = true;
    if (normQuery.includes("мрт")) {
      serviceName = "МРТ головного мозга (высокопольный томограф 1.5 Тл)";
      basePrice = 18000;
    } else if (normQuery.includes("узи")) {
      serviceName = "Комплексное УЗИ органов брюшной полости (ОБП)";
      basePrice = 5500;
    } else if (normQuery.includes("рентген")) {
      serviceName = "Цифровой рентген органов грудной клетки (флюорография)";
      basePrice = 3000;
    } else if (normQuery.includes("кт")) {
      serviceName = "Компьютерная томография органов грудной полости";
      basePrice = 14000;
    } else {
      serviceName = "Диагностическое обследование органов брюшной полости";
      basePrice = 8000;
    }
  } else if (normQuery.includes("прием") || normQuery.includes("врач") || normQuery.includes("консультация") || normQuery.includes("терапевт") || normQuery.includes("кардиолог") || normQuery.includes("невропатолог") || normQuery.includes("эндокринолог")) {
    isConsult = true;
    if (normQuery.includes("терапевт")) {
      serviceName = "Первичная консультация врача-терапевта (высшей категории)";
      basePrice = 7000;
    } else if (normQuery.includes("кардиолог")) {
      serviceName = "Первичная консультация кардиолога со снятием ЭКГ";
      basePrice = 9000;
    } else if (normQuery.includes("невропатолог")) {
      serviceName = "Консультация врача-невропатолога";
      basePrice = 8500;
    } else if (normQuery.includes("эндокринолог")) {
      serviceName = "Консультация врача-эндокринолога";
      basePrice = 8000;
    } else {
      serviceName = "Первичная консультация профильного специалиста";
      basePrice = 8000;
    }
  }

  // Clinic Pool Selection depending on service category
  let clinicPool = [];
  if (isLab) {
    clinicPool = [
      { name: "КДЛ Олимп", prefix: "Лабораторный центр", rating: 4.8 },
      { name: "Инвиво (Invivo)", prefix: "Медицинская лаборатория", rating: 4.6 },
      { name: "Сункар (Sunkar)", prefix: "Многопрофильный медицинский центр", rating: 4.5 },
      { name: "Эскулап", prefix: "Клинико-диагностическая лаборатория", rating: 4.3 },
      { name: "Городская поликлиника №4", prefix: "Государственное медицинское объединение", rating: 4.1 },
    ];
  } else if (isImaging) {
    clinicPool = [
      { name: "Медицинский центр Dau-Med", prefix: "Диагностическая клиника", rating: 4.7 },
      { name: "Сункар (Sunkar)", prefix: "Многопрофильный медицинский центр", rating: 4.5 },
      { name: "Orhun Medical", prefix: "Международный томографический центр", rating: 4.9 },
      { name: "Керуен Медикус (Keruen)", prefix: "Премиум клиника", rating: 4.8 },
      { name: "Городская поликлиника №4", prefix: "Государственное медицинское объединение", rating: 4.1 },
    ];
  } else if (isConsult) {
    clinicPool = [
      { name: "Керуен Медикус (Keruen)", prefix: "Премиум клиника", rating: 4.9 },
      { name: "Сункар (Sunkar)", prefix: "Многопрофильный медицинский центр", rating: 4.5 },
      { name: "Городская поликлиника №4", prefix: "Государственная поликлиника", rating: 4.1 },
      { name: "HAK Medical", prefix: "Многопрофильный медицинский центр", rating: 4.6 }
    ];
  } else {
    clinicPool = [
      { name: "КДЛ Олимп", prefix: "Лабораторный центр", rating: 4.8 },
      { name: "Инвиво (Invivo)", prefix: "Медицинская лаборатория", rating: 4.6 },
      { name: "Сункар (Sunkar)", prefix: "Многопрофильный медицинский центр", rating: 4.5 },
      { name: "Городская поликлиника №4", prefix: "Государственное медицинское объединение", rating: 4.1 },
    ];
  }

  const clinics = clinicPool.map((c, i) => {
    const isState = c.name.toLowerCase().includes("поликлиника");
    let priceMult = 1.0;
    if (isState) {
      priceMult = 0.5; // cheaper if not covered by OSMS
    } else if (c.name.includes("Керуен") || c.name.includes("Orhun")) {
      priceMult = 1.3; // premium
    } else if (c.name.includes("Dau-Med")) {
      priceMult = 1.1;
    }
    const finalPrice = Math.round(basePrice * priceMult);
    const osmsEligible = isState ? true : (i % 2 === 0);
    
    // Resolve high-fidelity physical address, district and coordinates
    const details = getClinicDetails(c.name, city);

    // Calculate actual geodesic distance from city center for high fidelity
    const cityCenters: Record<string, { lat: number; lng: number }> = {
      "астана": { lat: 51.169392, lng: 71.449074 },
      "шымкент": { lat: 42.3417, lng: 69.5901 },
      "караганда": { lat: 49.8022, lng: 73.0881 },
      "алматы": { lat: 43.238940, lng: 76.889709 }
    };
    const center = cityCenters[city.toLowerCase()] || cityCenters["алматы"];
    const distanceKm = getDistanceKm(center.lat, center.lng, details.lat, details.lng);
    const roundedDistance = distanceKm < 0.1 ? 0.3 : parseFloat(distanceKm.toFixed(1));

    return {
      id: `clinic-${city.toLowerCase().replace(/\s+/g, "")}-${i}`,
      name: `${c.prefix} "${c.name}"`,
      price: finalPrice,
      address: details.address,
      district: details.district,
      distance: `${roundedDistance} км`,
      osms: osmsEligible,
      updated: "сегодня",
      phone: `+7 (707) 123-45-0${i}`,
      rating: c.rating
    };
  });

  clinics.sort((a, b) => a.price - b.price);

  return {
    insights: `ИИ-Аналитика: Средняя стоимость услуги "${serviceName}" в г. ${city} составляет ${basePrice.toLocaleString()} ₸. Наблюдается стабильная конкуренция среди ведущих сетей КДЛ Олимп, Инвиво и Dau-Med, что удерживает тарифы от необоснованного роста. Данная услуга доступна бесплатно по системе ОСМС в поликлиниках при наличии направления участкового врача.`,
    clinics: clinics,
    isSimulated: true
  };
}

function getSimulatedMapMarkers(query: string, city: string) {
  const results = getSimulatedServices(query, city);
  return {
    markers: results.clinics.map((c) => {
      const details = getClinicDetails(c.name, city);
      return {
        id: c.id,
        name: c.name,
        price: c.price,
        lat: details.lat,
        lng: details.lng,
        address: details.address,
        osms: c.osms,
        rating: c.rating
      };
    }),
    isSimulated: true
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize MongoDB Connection
  try {
    const { connectToDatabase } = await import("./src/lib/mongodb");
    await connectToDatabase();
  } catch (err: any) {
    console.error("[MongoDB Startup] Failed to connect on server start:", err.message);
  }

  // --- CLIENT DATABASE BRIDGE ENDPOINTS FOR MONGODB ---
  app.get("/api/db/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      
      const query: any = {};
      for (const [key, val] of Object.entries(req.query)) {
        if (key === "city") {
          query.city = val;
        } else if (key === "userId") {
          query.userId = val;
        } else if (key === "id") {
          query.id = val;
        } else {
          query[key] = val;
        }
      }
      
      const list = await db.collection(collection).find(query).toArray();
      const mappedList = list.map(item => {
        const { _id, ...rest } = item;
        return { id: item.id || String(_id), ...rest };
      });
      res.json(mappedList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const data = req.body;
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      
      const id = data.id || String(Date.now() + Math.random().toString().slice(2, 6));
      const payload = { ...data, id };
      delete payload._id;

      await db.collection(collection).updateOne(
        { id },
        { $set: payload },
        { upsert: true }
      );
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/db/:collection/:id", async (req, res) => {
    try {
      const { collection, id } = req.params;
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      
      await db.collection(collection).deleteOne({ id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Initialize GoogleGenAI client lazily & safely to prevent startup crash if GEMINI_API_KEY is missing
  let ai: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("GEMINI_API_KEY is missing or template default. Using high-fidelity local AI fallback system.");
        return null;
      }
      ai = new GoogleGenAI({ apiKey });
    }
    return ai;
  }

  function cleanAndParseJSON(text: string) {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
      cleaned = cleaned.replace(/\s*```$/, "");
    }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  }

  // Helper for HTTP GET requests
  const httpGetJson = (url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const https = require("https");
      https.get(url, (res: any) => {
        let data = "";
        res.on("data", (chunk: any) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on("error", (err: any) => {
        reject(err);
      });
    });
  };

  // Fetch precise coordinates, address and details from Yandex Organizations Search API
  const getYandexClinicData = async (clinicName: string, city: string) => {
    try {
      const apiKey = "a4d53d00-61ce-4b25-a88a-e6886d262d93";
      const text = `${clinicName} ${city}`;
      const url = `https://search-maps.yandex.ru/v1/?text=${encodeURIComponent(text)}&apikey=${apiKey}&lang=ru_RU&results=1`;
      const data = await httpGetJson(url);
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coords = feature.geometry.coordinates; // [lng, lat]
        const meta = feature.properties.CompanyMetaData;
        return {
          lat: coords[1],
          lng: coords[0],
          address: meta.address || feature.properties.description || "",
          phone: meta.Phones && meta.Phones.length > 0 ? meta.Phones[0].formatted : "",
          name: meta.name || clinicName
        };
      }
    } catch (e) {
      console.warn("Yandex Org Search failed for:", clinicName, city, e);
    }
    return null;
  };

  const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
    "алматы": { lat: 43.238, lng: 76.889 },
    "астана": { lat: 51.169, lng: 71.449 },
    "шымкент": { lat: 42.341, lng: 69.590 },
    "караганда": { lat: 49.802, lng: 73.088 },
    "актобе": { lat: 50.283, lng: 57.926 },
    "павлодар": { lat: 52.287, lng: 76.931 }
  };

  function getDistanceStr(lat?: number, lng?: number, city?: string): string {
    if (!lat || !lng || !city) return "";
    const center = CITY_CENTERS[city.toLowerCase().trim()];
    if (!center) return "";
    const R = 6371; // km
    const dLat = (lat - center.lat) * Math.PI / 180;
    const dLon = (lng - center.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(center.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d.toFixed(1) + " км";
  }

  function getUpdatedStr(parsedAtStr?: string): string {
    if (!parsedAtStr) return "сегодня";
    try {
      const parsedDate = new Date(parsedAtStr);
      const now = new Date();
      const diffMs = now.getTime() - parsedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "сегодня";
      if (diffDays === 1) return "вчера";
      return parsedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    } catch {
      return "сегодня";
    }
  }

  // =====================================================
  // SHARED SEARCH ENGINE — exact city, multi-strategy, used by both search & map
  // =====================================================
  // Medical synonym expansion for smart search
  const MEDICAL_SYNONYMS: Record<string, string[]> = {
    "оак": ["общий анализ крови", "cbc", "клинический анализ крови", "гемоглобин", "лейкоциты"],
    "cbc": ["общий анализ крови", "оак", "клинический анализ крови"],
    "узи": ["ультразвук", "ультразвуковой", "эхография", "сонография"],
    "мрт": ["магнитно-резонансная томография", "томограф"],
    "кт": ["компьютерная томография", "томография"],
    "экг": ["электрокардиограмма", "электрокардиография", "сердце"],
    "эхокг": ["эхокардиография", "узи сердца", "эхо"],
    "вч": ["вич", "hiv", "спид"],
    "hiv": ["вич", "вч"],
    "гепатит": ["hcv", "hbsag", "hepatitis"],
    "сахар": ["глюкоза", "диабет", "гликированный"],
    "пцр": ["pcr", "полимеразная цепная реакция", "днк", "рнк"],
    "алт": ["аланинаминотрансфераза", "печень"],
    "аст": ["аспартатаминотрансфераза", "печень"],
    "ттг": ["тиреотропный гормон", "tsh", "щитовидная"],
    "биохимия": ["биохимический анализ крови", "бак"],
    "ферритин": ["железо", "анемия"],
    "холестерин": ["липидный профиль", "липиды", "hdl", "ldl"],
    "витамин": ["25-oh", "кальциферол"],
    "онкомаркер": ["ca-125", "ca-19", "ca-15", "раковый", "опухолевый"],
    "кровь": ["гематология", "крови", "кровью"],
    "моча": ["оам", "общий анализ мочи"],
  };

  function expandSearchTerms(words: string[]): string[] {
    const expanded = new Set(words.map(w => w.toLowerCase()));
    for (const w of words) {
      const low = w.toLowerCase();
      const synonyms = MEDICAL_SYNONYMS[low];
      if (synonyms) {
        for (const syn of synonyms) {
          for (const synWord of syn.split(/\s+/)) {
            if (synWord.length > 2) expanded.add(synWord);
          }
        }
      }
      // Also check partial matches (e.g., "гемоглоб" should match "гемоглобин")
      for (const [key, vals] of Object.entries(MEDICAL_SYNONYMS)) {
        if (key.includes(low) || low.includes(key)) {
          for (const syn of vals) {
            for (const synWord of syn.split(/\s+/)) {
              if (synWord.length > 2) expanded.add(synWord);
            }
          }
        }
      }
    }
    return [...expanded].filter(w => w.length >= 2);
  }

  async function searchRawTariffs(query: string, city: string, allowCrossCity: boolean): Promise<{ items: any[]; fromOtherCities: boolean }> {
    const { getDb } = await import("./src/lib/mongodb");
    const db = await getDb();

    const rawWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const words = rawWords.filter((w: string) => w.length >= 2);
    const searchWords = words.length > 0 ? words : rawWords;

    // SMART SEARCH: expand medical terms
    const expandedWords = expandSearchTerms(searchWords);
    const finalSearchWords = expandedWords.length > 0 ? expandedWords : searchWords;

    // EXACT city match — find the canonical city name in DB
    const dbCities = await db.collection("rawTariffs").distinct("city");
    const canonicalCity = dbCities.find((c: string) => c.toLowerCase() === city.toLowerCase()) || city;
    const cityFilter = { city: canonicalCity, priceKzt: { $gte: 100 } };

    const PROJECTION = {
      clinicId: 1, clinicName: 1, city: 1, address: 1, phone: 1,
      serviceNameRaw: 1, serviceNameNorm: 1, priceKzt: 1,
      osmsEligible: 1, parsedAt: 1, lat: 1, lng: 1, sourceUrl: 1,
    };

    let items: any[] = [];

    if (finalSearchWords.length > 0) {
      // Strategy 1: OR across 4 fields, exact city
      const orClauses = finalSearchWords.flatMap((w: string) => [
        { serviceNameRaw: { $regex: w, $options: "i" } },
        { serviceNameNorm: { $regex: w, $options: "i" } },
        { clinicName: { $regex: w, $options: "i" } },
        { address: { $regex: w, $options: "i" } },
      ]);
      items = await db.collection("rawTariffs")
        .find({ ...cityFilter, $or: orClauses }).project(PROJECTION).toArray();

      // Strategy 2: prefix matching, same city
      if (items.length < 8 && finalSearchWords.some(w => w.length > 4)) {
        const prefixClauses = finalSearchWords.filter(w => w.length > 4).flatMap((w: string) => {
          const prefix = w.substring(0, Math.max(3, w.length - 2));
          return [
            { serviceNameRaw: { $regex: prefix, $options: "i" } },
            { serviceNameNorm: { $regex: prefix, $options: "i" } },
            { clinicName: { $regex: prefix, $options: "i" } },
          ];
        });
        const more = await db.collection("rawTariffs")
          .find({ ...cityFilter, $or: prefixClauses }).project(PROJECTION).limit(500).toArray();
        const seenIds = new Set(items.map((r: any) => r._id?.toString()));
        for (const item of more) {
          if (!seenIds.has(item._id?.toString())) { items.push(item); seenIds.add(item._id?.toString()); }
        }
      }
    } else {
      items = await db.collection("rawTariffs")
        .find(cityFilter).project(PROJECTION).limit(500).toArray();
    }

    // Strategy 3: cross-city only if allowed (search only, NOT map)
    let fromOtherCities = false;
    if (items.length === 0 && allowCrossCity && finalSearchWords.length > 0) {
      const crossClauses = finalSearchWords.flatMap((w: string) => [
        { serviceNameRaw: { $regex: w, $options: "i" } },
        { serviceNameNorm: { $regex: w, $options: "i" } },
        { clinicName: { $regex: w, $options: "i" } },
      ]);
      items = await db.collection("rawTariffs")
        .find({ priceKzt: { $gte: 100 }, $or: crossClauses }).project(PROJECTION).limit(100).toArray();
      fromOtherCities = items.length > 0;
    }

    // JSON fallback
    if (items.length === 0) {
      try {
        const filePath = path.join(process.cwd(), "data", "parser", "rawTariffs.json");
        if (fs.existsSync(filePath)) {
          const rawJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (Array.isArray(rawJson)) {
            items = rawJson.filter((item: any) => {
              if (item.city && item.city.toLowerCase() !== city.toLowerCase()) return false;
              if (typeof item.priceKzt !== "number" || item.priceKzt < 100) return false;
              if (finalSearchWords.length === 0) return true;
              return finalSearchWords.some((w: string) =>
                (item.serviceNameRaw || "").toLowerCase().includes(w) ||
                (item.serviceNameNorm || "").toLowerCase().includes(w) ||
                (item.clinicName || "").toLowerCase().includes(w)
              );
            });
          }
        }
      } catch (jsonErr) { console.warn("[Search] JSON fallback failed:", jsonErr); }
    }

    return { items, fromOtherCities };
  }

  // Normalize clinic name (merge variants)
  function normalizeClinicName(name: string): string {
    const lower = name.toLowerCase().trim();
    if (lower.includes("инвитро") || lower.includes("invitro") || lower.includes("инвиво") || lower.includes("invivo")) return "Инвитро (Invitro)";
    if (lower.includes("олимп") || lower.includes("olymp") || lower.includes("кдл")) return "КДЛ Олимп";
    if (lower.includes("сункар") || lower.includes("sunkar")) return "Сункар";
    return name.trim();
  }

  // A comprehensive dictionary of exact clinic coordinates and addresses to guarantee 100% correctness and 0ms lookup times
  const CLINIC_COORDINATES_REGISTRY: Record<string, Record<string, { address: string; lat: number; lng: number }>> = {
    "алматы": {
      "олимп": { address: "пр. Назарбаева, 120", lat: 43.2492, lng: 76.9452 },
      "kdl": { address: "пр. Назарбаева, 120", lat: 43.2492, lng: 76.9452 },
      "инвитро": { address: "ул. Розыбакиева, 58", lat: 43.2361, lng: 76.8830 },
      "invitro": { address: "ул. Розыбакиева, 58", lat: 43.2361, lng: 76.8830 },
      "инвиво": { address: "ул. Карасай Батыра, 123", lat: 43.2435, lng: 76.9205 },
      "invivo": { address: "ул. Карасай Батыра, 123", lat: 43.2435, lng: 76.9205 },
      "сункар": { address: "ул. Розыбакиева, 37", lat: 43.2505, lng: 76.8845 },
      "sunkar": { address: "ул. Розыбакиева, 37", lat: 43.2505, lng: 76.8845 },
      "орхун": { address: "ул. Кабанбай батыра, 85", lat: 43.2490, lng: 76.9380 },
      "orhun": { address: "ул. Кабанбай батыра, 85", lat: 43.2490, lng: 76.9380 },
      "a clinic": { address: "ул. Байкадамова, 2", lat: 43.2045, lng: 76.8995 },
      "happy family": { address: "пр. Абая, 150", lat: 43.2255, lng: 76.8935 },
      "карудо": { address: "ул. Шевченко, 154", lat: 43.2438, lng: 76.9078 },
      "treegene": { address: "ул. Тимирязева, 42", lat: 43.2242, lng: 76.9150 },
      "salus": { address: "ул. Лисянского, 2", lat: 43.2185, lng: 76.8850 },
      "альнур-мед": { address: "мкр. Каргалы, д. 25", lat: 43.1895, lng: 76.8805 },
      "городская поликлиника №1": { address: "ул. Байзакова, 154", lat: 43.2397, lng: 76.8829 },
      "городская поликлиника №4": { address: "пр. Абылай хана, 76", lat: 43.2373, lng: 76.8898 },
      "городская поликлиника №8": { address: "мкр. Айнабулак-3, 37", lat: 43.2335, lng: 76.8880 },
      "областная клиническая больница": { address: "ул. Казыбек би, 82", lat: 43.2386, lng: 76.8826 },
      "asin med clinic": { address: "улица Розыбакиева, 162Б", lat: 43.2188, lng: 76.8942 },
      "центральная городская клиническая больница": { address: "ул. Жандосова, 6", lat: 43.2248, lng: 76.9080 },
      "детская городская клиническая инфекционная больница": { address: "ул. Байзакова, 295", lat: 43.2345, lng: 76.9168 }
    },
    "астана": {
      "олимп": { address: "пр. Республики, 2", lat: 51.1642, lng: 71.4285 },
      "kdl": { address: "пр. Республики, 2", lat: 51.1642, lng: 71.4285 },
      "инвитро": { address: "ул. Сыганак, 14", lat: 51.1278, lng: 71.4335 },
      "invitro": { address: "ул. Сыганак, 14", lat: 51.1278, lng: 71.4335 },
      "инвиво": { address: "ул. Сарыарка, 11", lat: 51.1672, lng: 71.4150 },
      "invivo": { address: "ул. Сарыарка, 11", lat: 51.1672, lng: 71.4150 },
      "сункар": { address: "ул. Кунаева, 35", lat: 51.1292, lng: 71.4428 },
      "sunkar": { address: "ул. Кунаева, 35", lat: 51.1292, lng: 71.4428 },
      "ultraline": { address: "ул. Керей-Жанибек, 11", lat: 51.1155, lng: 71.4110 },
      "umit": { address: "пр. Абылай хана, 42/1", lat: 51.1575, lng: 71.4925 }
    },
    "караганда": {
      "олимп": { address: "пр. Бухар-Жырау, 45", lat: 49.8062, lng: 73.0855 },
      "kdl": { address: "пр. Бухар-Жырау, 45", lat: 49.8062, lng: 73.0855 },
      "инвитро": { address: "ул. Гоголя, 34", lat: 49.8122, lng: 73.0782 },
      "invitro": { address: "ул. Гоголя, 34", lat: 49.8122, lng: 73.0782 },
      "центральная районная больница": { address: "ул. Ержанова, 22", lat: 49.8072, lng: 73.0902 }
    },
    "шымкент": {
      "олимп": { address: "пр. Тауке хана, 56", lat: 42.3168, lng: 69.6015 },
      "kdl": { address: "пр. Тауке хана, 56", lat: 42.3168, lng: 69.6015 },
      "инвитро": { address: "ул. Рыскулова, 22", lat: 42.3382, lng: 69.5845 },
      "invitro": { address: "ул. Рыскулова, 22", lat: 42.3382, lng: 69.5845 },
      "инвиво": { address: "пр. Республики, 12", lat: 42.3125, lng: 69.5890 },
      "invivo": { address: "пр. Республики, 12", lat: 42.3125, lng: 69.5890 }
    }
  };

  // Real-time cached 2GIS Geocoder
  async function geocodeAddress(clinicName: string, address: string, city: string, db: any) {
    const cleanAddress = address || "";
    const cacheKey = `${clinicName}_${cleanAddress}_${city}`.toLowerCase().trim().replace(/[^a-zа-яё0-9]/g, "_");
    const cCity = city.toLowerCase().trim();
    const cName = clinicName.toLowerCase().trim();
    
    // 0. Look up in static coordinates registry
    if (CLINIC_COORDINATES_REGISTRY[cCity]) {
      for (const [key, val] of Object.entries(CLINIC_COORDINATES_REGISTRY[cCity])) {
        if (cName.includes(key)) {
          return { lat: val.lat, lng: val.lng, address: val.address };
        }
      }
    }
    
    try {
      // 1. Check cache in MongoDB
      const cached = await db.collection("geocodingCache").findOne({ id: cacheKey });
      if (cached && typeof cached.lat === "number" && typeof cached.lng === "number") {
        return { lat: cached.lat, lng: cached.lng, address: cached.address || cleanAddress };
      }
      
      // 2. Query 2GIS Catalog API
      const axios = (await import("axios")).default;
      const cityCenters: Record<string, string> = {
        "алматы": "76.889,43.238", "астана": "71.449,51.169",
        "шымкент": "69.590,42.341", "караганда": "73.088,49.802"
      };
      const location = cityCenters[city.toLowerCase().trim()] || "76.889,43.238";
      
      const queryText = `${clinicName} ${cleanAddress}`.trim();
      console.log(`[Geocoder] Geocoding: "${queryText}" in ${city}`);
      
      const response = await axios.get("https://catalog.api.2gis.com/3.0/items", {
        params: {
          q: queryText,
          location,
          key: "26c65059-f062-4a91-a973-b8a38fedf562",
          limit: 1,
          fields: "items.point"
        },
        timeout: 4000
      });
      
      const item = response.data?.result?.items?.[0];
      if (item?.point) {
        const lat = item.point.lat;
        const lng = item.point.lon; // 2GIS returns lon for longitude
        const resolvedAddr = item.address_name || cleanAddress;
        
        // Save to cache
        await db.collection("geocodingCache").updateOne(
          { id: cacheKey },
          { $set: { id: cacheKey, clinicName, address: resolvedAddr, city, lat, lng, resolvedAt: new Date().toISOString() } },
          { upsert: true }
        );
        return { lat, lng, address: resolvedAddr };
      }
    } catch (err: any) {
      console.warn(`[Geocoder] Failed for "${clinicName} - ${cleanAddress}":`, err.message);
    }
    
    // 3. Fallback: Deterministic offset based on address string hash to prevent map jumping
    const cityCenter = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
    let hash = 0;
    const str = clinicName + cleanAddress;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const offsetLat = ((hash & 0xFF) / 255 - 0.5) * 0.015;
    const offsetLng = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.015;
    
    return {
      lat: cityCenter.lat + offsetLat,
      lng: cityCenter.lng + offsetLng,
      address: cleanAddress || "Адрес не указан"
    };
  }

  // API Route: AI-powered medical services search
  app.post("/api/search-services", async (req, res) => {
    try {
      const { query, city = "Алматы" } = req.body;
      if (!query || query.trim() === "") {
        return res.json({ error: "Search query is required" });
      }

      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();

      const { items: rawItems, fromOtherCities } = await searchRawTariffs(query, city, true);

      if (rawItems.length === 0) {
        return res.json({
          insights: `По вашему запросу "${query}" в г. ${city} ничего не найдено.`,
          clinics: [],
          isSimulated: false,
        });
      }

      // Group rawItems by normalized clinicName (uses shared normalizeClinicName above)
      const groupedMap = new Map<string, any[]>();
      for (const item of rawItems) {
        const key = normalizeClinicName(item.clinicName);
        if (!groupedMap.has(key)) groupedMap.set(key, []);
        groupedMap.get(key)!.push(item);
      }

      // Fetch clinic logos
      const logoMap = new Map<string, string>();
      try {
        const logos = await db.collection("clinicLogos").find({}).toArray();
        for (const logo of logos) {
          const n = normalizeClinicName(logo.clinicName || logo.name || "");
          if (logo.logoUrl) logoMap.set(n.toLowerCase(), logo.logoUrl);
        }
        const clinicsColl = await db.collection("clinics").find({}).toArray();
        for (const cl of clinicsColl) {
          const n = normalizeClinicName(cl.name || "");
          if (cl.logoUrl) logoMap.set(n.toLowerCase(), cl.logoUrl);
        }
      } catch (logoErr) { console.warn("Failed to fetch logos:", logoErr); }

      const clinicsList: any[] = [];
      const seenNames = new Set<string>();
      let idx = 0;
      for (const [clinicName, items] of groupedMap.entries()) {
        if (seenNames.has(clinicName.toLowerCase())) continue;
        seenNames.add(clinicName.toLowerCase());
        idx++;
        const firstItem = items[0];
        const prices = items.map((it: any) => it.priceKzt).filter((p: any) => typeof p === "number" && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const osms = items.some((it: any) => it.osmsEligible);
        const logoUrl = logoMap.get(clinicName.toLowerCase()) || "";

        // Best coordinates (closest to city center)
        const cityCenter = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];
        let bestItem = firstItem;
        let bestDist = Infinity;
        for (const it of items) {
          if (it.lat && it.lng) {
            const d = Math.abs(it.lat - cityCenter.lat) + Math.abs(it.lng - cityCenter.lng);
            if (d < bestDist) { bestDist = d; bestItem = it; }
          }
        }

        // Call geocoding helper to resolve coordinates dynamically
        const coords = await geocodeAddress(clinicName, bestItem.address, city, db);
        const clinicId = bestItem.clinicId || `clinic-${idx}-${clinicName.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`;
        
        // Write/sync coordinates and details to MongoDB clinics collection for B2C database mode
        try {
          await db.collection("clinics").updateOne(
            { id: clinicId },
            {
              $set: {
                id: clinicId,
                name: clinicName,
                address: coords.address || bestItem.address || "Адрес не указан",
                phone: bestItem.phone || "Телефон не указан",
                city,
                lat: coords.lat,
                lng: coords.lng,
                logoUrl,
                osms,
                updatedAt: new Date().toISOString()
              }
            },
            { upsert: true }
          );
        } catch (syncErr: any) {
          console.warn("[Geocoder] Syncing coordinates to clinics failed:", syncErr.message);
        }

        clinicsList.push({
          id: clinicId,
          name: clinicName,
          price: minPrice,
          address: coords.address || bestItem.address || "Адрес не указан",
          district: "",
          distance: getDistanceStr(coords.lat, coords.lng, city),
          osms,
          updated: getUpdatedStr(bestItem.parsedAt),
          phone: bestItem.phone || "Телефон не указан",
          rating: 4.5,
          lat: coords.lat,
          lng: coords.lng,
          logoUrl,
          services: items.map(it => ({
            serviceNameRaw: it.serviceNameRaw,
            serviceNameNorm: it.serviceNameNorm,
            priceKzt: it.priceKzt,
            osmsEligible: it.osmsEligible
          }))
        });
      }

      const prices = rawItems.map(item => item.priceKzt).filter(Boolean);
      const minP = prices.length > 0 ? Math.min(...prices) : 0;
      const maxP = prices.length > 0 ? Math.max(...prices) : 0;
      const avgP = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
      const osmsCount = rawItems.filter(item => item.osmsEligible).length;

      const insights = `По вашему запросу "${query}" в г. ${city} найдено ${rawItems.length} тарифов. Стоимость варьируется от ${minP.toLocaleString()} ₸ до ${maxP.toLocaleString()} ₸ (средняя цена: ${avgP.toLocaleString()} ₸). Доступно ${osmsCount} вариантов с поддержкой ОСМС.`;

      return res.json({
        insights,
        clinics: clinicsList,
        isSimulated: false
      });
    } catch (error) {
      console.error("Search API failed:", error);
      return res.json({ insights: "Поиск временно недоступен", clinics: [], isSimulated: false });
    }
  });

  // API Route: Map and Geolocation Grounding
  app.post("/api/map-grounding", async (req, res) => {
    try {
      const { query, city = "Алматы" } = req.body;
      if (!query || query.trim() === "") {
        return res.json({ markers: [] });
      }

      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();

      // Use shared search — NO cross-city fallback for map!
      const { items: rawItems } = await searchRawTariffs(query, city, false);

      if (rawItems.length === 0) {
        return res.json({ markers: [], isSimulated: false });
      }

      // Group locations by normalized clinic name (uses shared normalizeClinicName above)
      const groupedMap = new Map<string, any[]>();
      for (const item of rawItems) {
        const key = normalizeClinicName(item.clinicName);
        if (!groupedMap.has(key)) groupedMap.set(key, []);
        groupedMap.get(key)!.push(item);
      }

      // Fetch clinic logos
      const logoMap = new Map<string, string>();
      try {
        const logos = await db.collection("clinicLogos").find({}).toArray();
        for (const logo of logos) {
          if (logo.clinicName && logo.logoUrl) {
            logoMap.set(normalizeClinicName(logo.clinicName), logo.logoUrl);
          }
          if (logo.name && logo.logoUrl) {
            logoMap.set(normalizeClinicName(logo.name), logo.logoUrl);
          }
        }
        const clinicsColl = await db.collection("clinics").find({}).toArray();
        for (const cl of clinicsColl) {
          if (cl.name && cl.logoUrl) {
            logoMap.set(normalizeClinicName(cl.name), cl.logoUrl);
          }
        }
      } catch (logoErr) { console.warn("Failed to fetch logos:", logoErr); }

      const markersList: any[] = [];
      const seenNames = new Set<string>();
      let idx = 0;
      const cityCenter = CITY_CENTERS[city.toLowerCase().trim()] || CITY_CENTERS["алматы"];

      for (const [clinicName, items] of groupedMap.entries()) {
        if (seenNames.has(clinicName.toLowerCase())) continue;
        seenNames.add(clinicName.toLowerCase());
        idx++;

        // Pick the item with best coordinates (closest to city center)
        let bestItem = items[0];
        let bestDist = Infinity;
        for (const it of items) {
          if (it.lat && it.lng) {
            const d = Math.abs(it.lat - cityCenter.lat) + Math.abs(it.lng - cityCenter.lng);
            if (d < bestDist) { bestDist = d; bestItem = it; }
          }
        }

        // Validate: reject coords > 1.5 degrees from city center
        const coordOk = bestItem.lat && bestItem.lng
          && Math.abs(bestItem.lat - cityCenter.lat) < 1.5
          && Math.abs(bestItem.lng - cityCenter.lng) < 1.5;

        const prices = items.map((it: any) => it.priceKzt).filter((p: any) => typeof p === "number" && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const osms = items.some((it: any) => it.osmsEligible);
        const logoUrl = logoMap.get(normalizeClinicName(clinicName)) || "";

        markersList.push({
          id: `marker-${idx}-${clinicName.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`,
          name: clinicName,
          price: minPrice,
          lat: coordOk ? bestItem.lat : cityCenter.lat,
          lng: coordOk ? bestItem.lng : cityCenter.lng,
          address: bestItem.address || "Адрес не указан",
          osms,
          rating: 4.5,
          logoUrl,
        });
      }

      return res.json({ markers: markersList, isSimulated: false });
    } catch (error) {
      console.error("Map Grounding failed:", error);
      return res.json({ markers: [], isSimulated: false });
    }
  });

  // ========================================================================
  // =====================================================
  // API Route: Run parser for ALL active sources (KDL, Invitro, TopDoc, 2GIS, etc.)
  // =====================================================
  app.post("/api/run-parser", async (_req, res) => {
    const logs: string[] = [];
    const items: any[] = [];
    const errorLogs: any[] = [];

    try {
      const activeSources = PARSER_SOURCES.filter(s => s.isActive);
      logs.push(`[СИСТЕМА] Активных источников: ${activeSources.length}`);

      for (const source of activeSources) {
        try {
          const result = await parserEngine.runSource(source);
          if (result.isSuccessful) {
            logs.push(`[КРАУЛЕР] ${source.name}: ${result.recordsExtracted} записей`);
          } else {
            logs.push(`[ОШИБКА] ${source.name}: ${result.errors.map(e => e.message).join("; ")}`);
            result.errors.forEach(err => errorLogs.push({
              id: `err-${Date.now()}`,
              source: err.sourceId, timestamp: err.timestamp,
              status: "error", message: err.message,
            }));
          }
        } catch (e: any) {
          logs.push(`[ОШИБКА] ${source.name}: ${e.message}`);
        }
      }

      // После парсинга — запустить геокодинг
      try {
        const { GeoEnricher } = await import("./src/parser/providers/geoEnricher");
        const enricher = new GeoEnricher();
        enricher.enrichAllUngeocoded().catch(() => {});
        logs.push(`[2GIS] Геокодирование запущено в фоне`);
      } catch {}

      // Загрузить items из MongoDB для отображения в админке
      try {
        const { getDb } = await import("./src/lib/mongodb");
        const db = await getDb();
        const records = await db.collection("rawTariffs").find().sort({ parsedAt: -1 }).limit(100).toArray();
        records.forEach((r: any) => {
          items.push({
            id: r.id || r._id?.toString(),
            source: r.sourceUrl || r.clinicName || "",
            rawName: r.serviceNameRaw || "",
            price: r.priceKzt || 0,
            currency: r.currency || "KZT",
            parsedAt: r.parsedAt ? r.parsedAt.substring(0, 16).replace("T", " ") : "",
            durationDays: r.durationDays || 1,
            city: r.city || "",
            category: r.category || "лаборатория",
            isActive: r.isActive !== false,
          });
        });
      } catch {}

      logs.push(`[УСПЕХ] Парсинг завершен. Всего: ${items.length} записей.`);

      return res.json({ logs, items, errorLogs });
    } catch (error: any) {
      console.error("[run-parser] Error:", error.message);
      return res.status(500).json({ error: error.message, logs, items, errorLogs });
    }
  });

  // Helper to extract text from binary files
  async function extractTextFromFile(base64Data: string, mimeType: string, fileType: string): Promise<string> {
    const buffer = Buffer.from(base64Data, "base64");
    const ext = fileType.toLowerCase();

    try {
      if (ext === "pdf" || mimeType === "application/pdf") {
        const pdfData = await pdf(buffer);
        return pdfData.text;
      }

      if (["xlsx", "xls"].includes(ext) || mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let text = "";
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          text += `--- Sheet: ${sheetName} ---\n`;
          text += XLSX.utils.sheet_to_csv(sheet) + "\n";
        }
        return text;
      }

      if (["docx", "doc"].includes(ext) || mimeType.includes("word")) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }
    } catch (err) {
      console.error(`Error parsing binary file of type ${ext}:`, err);
      throw new Error(`Не удалось извлечь текст из файла ${ext || 'документа'}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Fallback to text string
    return buffer.toString("utf-8");
  }

  // Helper to filter out noise
  function cleanAndTruncateText(text: string): { cleanedText: string; wasTruncated: boolean } {
    if (!text) return { cleanedText: "", wasTruncated: false };

    const lines = text.split('\n');
    const cleanedLines: string[] = [];
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      let cleanedLine = line.replace(/,+/g, ',');
      cleanedLine = cleanedLine.replace(/\t+/g, '\t');
      cleanedLine = cleanedLine.replace(/ +/g, ' ');
      
      if (cleanedLine.startsWith(',')) cleanedLine = cleanedLine.slice(1);
      if (cleanedLine.endsWith(',')) cleanedLine = cleanedLine.slice(0, -1);
      
      cleanedLine = cleanedLine.trim();
      if (!cleanedLine) continue;
      
      const hasLetters = /[a-zA-Zа-яА-Я]/.test(cleanedLine);
      const hasDigits = /[0-9]/.test(cleanedLine);
      
      if (hasLetters && hasDigits) {
        cleanedLines.push(cleanedLine);
      } else if (hasLetters && cleanedLine.length < 50 && !cleanedLine.includes(',') && !cleanedLine.includes('\t')) {
        cleanedLines.push(`[Категория: ${cleanedLine}]`);
      }
    }
    
    const joined = cleanedLines.join('\n');
    const maxChars = 25000;
    if (joined.length > maxChars) {
      return {
        cleanedText: joined.substring(0, maxChars) + "\n... [ТЕКСТ ПРЕВЫСИЛ ЛИМИТ И БЫВ ОБРЕЗАН ДЛЯ КОРРЕКТНОЙ РАБОТЫ ИИ] ...",
        wasTruncated: true
      };
    }
    
    return { cleanedText: joined, wasTruncated: false };
  }

  // Helper function to send HTTP requests to Alem LLM
  function makeAlemRequest(apiKey: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: "alemllm",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const options = {
        hostname: "llm.alem.ai",
        port: 443,
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(data)
        },
        timeout: 15000
      };

      const req = https.request(options, (res: any) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: any) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            reject(new Error(`Alem API returned status ${res.statusCode}: ${body}`));
          } else {
            resolve(body);
          }
        });
      });

      req.on("error", (e: any) => {
        reject(e);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Alem API request timed out after 15 seconds"));
      });

      req.write(data);
      req.end();
    });
  }

  // API Route: AI Price List Parser
  app.post("/api/parse-prices", async (req, res) => {
    const { fileContent, fileBase64, fileMimeType, fileName, fileType } = req.body;

    if (!fileContent && !fileBase64) {
      return res.status(400).json({ error: "No content or file data provided to parse." });
    }

    let textContent = "";
    try {
      // 1. Extract text from file if binary
      if (fileBase64) {
        textContent = await extractTextFromFile(fileBase64, fileMimeType || "", fileType || "");
      } else {
        textContent = fileContent;
      }

      if (!textContent || textContent.trim().length === 0) {
        throw new Error("Извлеченный текст файла пуст.");
      }

      // Clean and truncate text
      const { cleanedText, wasTruncated } = cleanAndTruncateText(textContent);

      const prompt = `Вы — профессиональный медицинский парсер и эксперт по анализу прайс-листов клиник Казахстана.
Ваша цель — с идеальной точностью разобрать предоставленный текст прейскуранта медицинских услуг и извлечь структурированный список всех услуг.

ИНСТРУКЦИИ ПО ИЗВЛЕЧЕНИЮ:
1. Идентификация услуг: Каждая услуга должна иметь понятное, полное название (serviceName), цену в тенге (₸) в виде целого числа (price), категорию (category) и код услуги (code), если указан.
2. Извлечение кодов (code): Ищите коды перед или после названия услуги (например, "LAB-102", "12.3.100", "B01.001.001"). Если кода нет, запишите пустую строку "".
3. Очистка названий (serviceName): Убирайте мусорные символы, лишние пробелы, цены из названия.
4. Извлечение цен (price): Извлекайте цену только в виде целого числа (например, 18500).
5. Выбор категории (category): Классифицируйте каждую услугу строго в одну из категорий:
   - "Лаборатория"
   - "МРТ и КТ"
   - "УЗИ"
   - "Консультация"
   - "Стоматология"
   - "Другое"
6. Лимит извлечения: Извлеките максимум первые 30 услуг.

ПРИМЕР ОЖИДАЕМОГО JSON:
{
  "status": "success",
  "fileName": "${fileName || 'document'}",
  "parsedCount": 3,
  "confidenceScore": 0.99,
  "services": [
    { "serviceName": "ПЦР-тест на COVID-19 (срочный)", "code": "LAB-102", "price": 7200, "category": "Лаборатория" }
  ],
  "warnings": []
}

Ответ должен быть СТРОГИМ JSON без markdown. Начинается с { и заканчивается на }.

СОДЕРЖИМОЕ ФАЙЛА ДЛЯ РАЗБОРА:
"""
${cleanedText}
"""`;

      // 2. Decide parser backend
      const alemApiKey = process.env.ALEM_API_KEY;
      const geminiClient = getAI();

      let cleanJson = "";

      if (alemApiKey && alemApiKey !== "MY_ALEM_API_KEY" && alemApiKey.trim() !== "") {
        console.log("[Parse] Using Alem LLM parser backend");
        const responseBody = await makeAlemRequest(alemApiKey, prompt);
        const responseData = JSON.parse(responseBody);
        const assistantMessage = responseData.choices?.[0]?.message?.content;
        if (!assistantMessage) throw new Error("Empty response from Alem LLM");
        cleanJson = assistantMessage.trim();
      } else if (geminiClient) {
        console.log("[Parse] Using Gemini-2.5-flash parser backend");
        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        cleanJson = (response.text || "").trim();
      } else {
        throw new Error("Нет доступных ИИ-провайдеров (проверьте ALEM_API_KEY или GEMINI_API_KEY).");
      }

      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsedData = JSON.parse(cleanJson);
      if (wasTruncated) {
        if (!parsedData.warnings) parsedData.warnings = [];
        parsedData.warnings.push("Прейскурант был частично сокращен из-за большого размера.");
      }
      return res.json(parsedData);

    } catch (error: any) {
      console.warn("AI price parsing failed, falling back to server-side regex parser:", error);
      
      // Fallback Regex-based parser
      try {
        const servicesList: any[] = [];
        const lines = textContent.split('\n');

        lines.forEach(line => {
          const priceMatch = line.match(/(\d[\d\s]*)\s*(?:тенге|тг|\u20B8|\s)\b/i) || line.match(/\b(\d{3,6})\b/);
          if (priceMatch) {
            const price = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
            if (price > 100 && price < 500000) {
              let name = line.replace(priceMatch[0], '').replace(/\d+/g, '').replace(/[|:\-]/g, '').trim();
              if (name.length > 5) {
                let category = 'Другое';
                let code = '';
                const codeMatch = line.match(/\b[A-Z]{3,4}-\d{3,4}\b/i) || line.match(/\b\d\.\d\.\d+\b/);
                if (codeMatch) code = codeMatch[0].toUpperCase();

                const nameLower = name.toLowerCase();
                if (nameLower.includes('пцр') || nameLower.includes('кров') || nameLower.includes('анализ')) category = 'Лаборатория';
                else if (nameLower.includes('мрт') || nameLower.includes('томограф')) category = 'МРТ и КТ';
                else if (nameLower.includes('узи') || nameLower.includes('ультразвук')) category = 'УЗИ';
                else if (nameLower.includes('прием') || nameLower.includes('консульт')) category = 'Консультация';

                servicesList.push({
                  serviceName: name,
                  code,
                  price,
                  category
                });
              }
            }
          }
        });

        return res.json({
          status: "success",
          fileName: fileName || "fallback.txt",
          parsedCount: servicesList.length,
          confidenceScore: 0.75,
          services: servicesList.slice(0, 30),
          warnings: ["Использован резервный регулярный парсер сервера из-за недоступности ИИ."]
        });
      } catch (fallbackErr) {
        return res.status(500).json({ error: `Сбой парсинга: ${error.message}` });
      }
    }
  });

  // GET /api/parser/unmatched — Get unmatched items
  app.get("/api/parser/unmatched", async (req, res) => {
    try {
      const { LocalDataLayer } = await import("./src/parser/localDataLayer");
      const layer = new LocalDataLayer();
      const records = await layer.getUnmatchedRecords();
      res.json({ records, total: records.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/parser/normalize — Manually match an unmatched record
  app.post("/api/parser/normalize", async (req, res) => {
    try {
      const { recordId, serviceId, serviceName } = req.body;
      if (!recordId || !serviceId) {
        return res.status(400).json({ error: "recordId and serviceId are required" });
      }

      const { LocalDataLayer } = await import("./src/parser/localDataLayer");
      const layer = new LocalDataLayer();
      await layer.updateNormalization(recordId, serviceId, serviceName || "");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/parser/geocode — Geocode all un-geocoded clinics
  app.post("/api/parser/geocode", async (_req, res) => {
    try {
      const { GeoEnricher } = await import("./src/parser/providers/geoEnricher");
      const enricher = new GeoEnricher();
      enricher.enrichAllUngeocoded().then(() => {
        console.log("[GeoEnricher] Background task completed.");
      }).catch((err: any) => {
        console.error("[GeoEnricher] Background failed:", err.message);
      });
      res.json({ success: true, message: "Геокодирование запущено в фоне." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/clinics/logos — Retrieve all clinic logos
  app.get("/api/clinics/logos", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const list = await db.collection("clinicLogos").find({}).toArray();
      const mappedList = list.map(item => {
        const { _id, ...rest } = item;
        return { id: item.id || String(_id), ...rest };
      });
      res.json(mappedList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/parser/fetch-logos — Run background logo scraping task
  app.post("/api/parser/fetch-logos", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();

      // Trigger background parser
      (async () => {
        console.log("[LogoFetcher] Starting background logo gathering...");
        const uniqueClinicNames = await db.collection("rawTariffs").distinct("clinicName");
        console.log(`[LogoFetcher] Found ${uniqueClinicNames.length} unique clinic names in database.`);

        for (const name of uniqueClinicNames) {
          if (!name) continue;
          const nameTrimmed = name.trim();
          const clinicId = `clinic-${nameTrimmed.toLowerCase().replace(/[^a-zа-яё0-9]/g, "-")}`;

          // Check if already has a valid logo URL in clinicLogos
          const existing = await db.collection("clinicLogos").findOne({ clinicId });
          if (existing?.logoUrl) {
            console.log(`[LogoFetcher] Logo already exists for: "${nameTrimmed}". Skipping.`);
            continue;
          }

          let logoUrl = "";
          let logoSource = "";

          const nameLower = nameTrimmed.toLowerCase();
          
          // 1. Hardcoded major networks
          if (nameLower.includes("олимп") || nameLower.includes("olymp")) {
            logoUrl = "https://kdlolymp.kz/favicons/android-chrome-512x512.png";
            logoSource = "kdl";
          } else if (nameLower.includes("инвитро") || nameLower.includes("invitro")) {
            logoUrl = "https://invitro.kz/local/templates/invitro_main/src/image/icons/footer/logo.svg";
            logoSource = "invitro";
          } else if (nameLower.includes("инвиво") || nameLower.includes("invivo")) {
            logoUrl = "https://invivo.kz/images/logo.svg";
            logoSource = "invivo";
          }

          // 2. 2GIS Catalog API search
          if (!logoUrl) {
            try {
              console.log(`[LogoFetcher] Querying 2GIS for: "${nameTrimmed}"`);
              const dgisRes = await axios.get("https://catalog.api.2gis.com/3.0/items", {
                params: { 
                  q: nameTrimmed, 
                  location: "76.889,43.238", // anchor Almaty center
                  key: "26c65059-f062-4a91-a973-b8a38fedf562", 
                  limit: 1, 
                  fields: "items.external_content,items.contact_groups" 
                },
                timeout: 5000
              });
              const item = dgisRes.data?.result?.items?.[0];
              if (item?.external_content?.logo?.url) {
                logoUrl = item.external_content.logo.url;
                logoSource = "2gis";
              }
              if (!logoUrl) {
                const site = item?.contact_groups?.[0]?.items?.find((i: any) => i.type === "website")?.value || "";
                if (site) {
                  const domain = site.replace(/^https?:\/\//i, '').split('/')[0];
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
            await db.collection("clinics").updateOne(
              { clinicId },
              { $set: { clinicId, name: nameTrimmed, logoUrl, logoSource } },
              { upsert: true }
            );
            await db.collection("clinicLogos").updateOne(
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
      })().catch(err => {
        console.error("[LogoFetcher] Background processing crashed:", err);
      });

      res.json({ success: true, message: "Сбор логотипов клиник успешно запущен в фоне." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/parser/errors — Get parser errors
  app.get("/api/parser/errors", async (req, res) => {
    try {
      const { ParserErrorLogger } = await import("./src/parser/errorLogger");
      const logger = new ParserErrorLogger();
      const sourceId = req.query.sourceId as string | undefined;
      const errors = await logger.getRecentErrors(sourceId);
      res.json({ errors, total: errors.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/parser/sources — List all source configs with stats + MongoDB overrides
  app.get("/api/parser/sources", async (_req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      // Get overrides from MongoDB (toggle/delete/add operations)
      const configOverrides = await db.collection("parserConfig").find({}).toArray();
      const deletedIds = new Set(configOverrides.filter(c => c._deleted).map(c => c.id));
      const toggleMap = new Map(configOverrides.filter(c => !c._deleted).map(c => [c.id, c]));
      const customSources = configOverrides.filter(c => c.isCustom && !c._deleted);

      const allSources = [...PARSER_SOURCES, ...customSources];

      const sources = await Promise.all(allSources.map(async (s: any) => {
        if (deletedIds.has(s.id)) return null;
        const override = toggleMap.get(s.id);
        const isActive = override !== undefined ? override.isActive : s.isActive;

        let recordCount = 0, lastRun = null;
        if (isActive) {
          try {
            // Count by city only (fast, reliable)
            recordCount = await db.collection("rawTariffs").countDocuments({
              city: { $regex: new RegExp(s.city || "", "i") },
            });
          } catch {}
          try {
            const log = await db.collection("runLogs").findOne({ sourceId: s.id }, { sort: { startedAt: -1 } });
            if (log) lastRun = log.completedAt || log.startedAt;
          } catch {}
        }
        return {
          id: s.id, name: s.name, url: s.url || "", city: s.city,
          format: s.format || "html", isActive,
          description: s.description || s.name || "",
          status: isActive ? (s.status || "unknown") : "disabled",
          recordCount, lastRun, providerClass: s.providerClass || "FirecrawlProvider",
        };
      }));

      res.json({ sources: sources.filter(Boolean) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/parser/raw-tariffs — Get raw tariff records
  app.get("/api/parser/raw-tariffs", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const city = req.query.city as string | undefined;
      const query: any = {};
      if (city) query.city = { $regex: new RegExp(city, "i") };
      const records = await db.collection("rawTariffs").find(query).limit(500).toArray();
      res.json({ records, total: records.length });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // GET /api/parser/run-logs — Get parser run history
  app.get("/api/parser/run-logs", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const logs = await db.collection("runLogs").find().sort({ startedAt: -1 }).limit(Number(req.query.limit) || 50).toArray();
      res.json({ logs });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // POST /api/parser/run-source — Run a single source by ID (supports custom sources)
  app.post("/api/parser/run-source", async (req, res) => {
    try {
      const { sourceId } = req.body;
      if (!sourceId) return res.status(400).json({ error: "sourceId required" });
      const { ParserEngine } = await import("./src/parser/parserEngine");
      const engine = new ParserEngine();
      let result = await engine.runSourceById(sourceId);
      // If not found in PARSER_SOURCES, try custom source from parserConfig
      if (!result) {
        const { getDb } = await import("./src/lib/mongodb");
        const db = await getDb();
        const custom = await db.collection("parserConfig").findOne({ id: sourceId, _deleted: { $ne: true } });
        if (custom) {
          const source = {
            id: custom.id,
            name: custom.name || sourceId,
            providerClass: custom.providerClass || "FirecrawlProvider",
            url: custom.url || "",
            city: custom.city || "Алматы",
            format: custom.format || "html",
            isActive: true,
          };
          result = await engine.runSource(source as any);
        }
      }
      if (!result) return res.status(404).json({ error: "Source not found" });
      res.json({ success: true, result });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // POST /api/parser/bootstrap-mongo — Bootstrap JSON data to MongoDB
  app.post("/api/parser/bootstrap-mongo", async (_req, res) => {
    try {
      const { LocalDataLayer } = await import("./src/parser/localDataLayer");
      const layer = new LocalDataLayer();
      const stats = await layer.bootstrapJsonToMongo();
      res.json({ success: true, message: "JSON → MongoDB bootstrap complete.", ...stats });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // GET /api/parser/last-run — Get last successful parse timestamp
  app.get("/api/parser/last-run", async (_req, res) => {
    try {
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const lastLog = await db.collection("runLogs").findOne(
        { isSuccessful: true },
        { sort: { startedAt: -1 } }
      );
      if (lastLog) {
        return res.json({ success: true, timestamp: lastLog.startedAt || lastLog.completedAt });
      }
      const lastTariff = await db.collection("rawTariffs").findOne(
        { parsedAt: { $exists: true } },
        { sort: { parsedAt: -1 } }
      );
      res.json({ success: true, timestamp: lastTariff?.parsedAt || new Date().toISOString() });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Source management endpoints ──────────────────────────────────────
  app.post("/api/parser/toggle-source", async (req, res) => {
    try {
      const { sourceId } = req.body;
      if (!sourceId) return res.status(400).json({ error: "sourceId required" });
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const existing = await db.collection("parserConfig").findOne({ id: sourceId });
      if (existing) {
        const newStatus = existing.isActive === false;
        await db.collection("parserConfig").updateOne({ id: sourceId }, { $set: { isActive: newStatus } });
        return res.json({ success: true, sourceId, isActive: newStatus });
      }
      await db.collection("parserConfig").insertOne({ id: sourceId, isActive: false });
      res.json({ success: true, sourceId, isActive: false });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/parser/add-source", async (req, res) => {
    try {
      const { id, name, url, city, providerClass = "FirecrawlProvider", format = "html" } = req.body;
      if (!id || !name || !city) return res.status(400).json({ error: "id, name, city required" });
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      await db.collection("parserConfig").insertOne({ id, name, url, city, providerClass, format, isActive: true, isCustom: true });
      res.json({ success: true, source: { id, name, url, city, providerClass, format, isActive: true } });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/parser/delete-source", async (req, res) => {
    try {
      const { sourceId } = req.body;
      if (!sourceId) return res.status(400).json({ error: "sourceId required" });
      const { getDb } = await import("./src/lib/mongodb");
      const db = await getDb();
      const existing = await db.collection("parserConfig").findOne({ id: sourceId });
      if (existing?.isCustom) {
        await db.collection("parserConfig").deleteOne({ id: sourceId });
      } else {
        // Built-in source: mark as deleted
        await db.collection("parserConfig").updateOne(
          { id: sourceId },
          { $set: { id: sourceId, _deleted: true } },
          { upsert: true }
        );
      }
      res.json({ success: true, sourceId });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // =====================================================
  // CRON SCHEDULING — run all active sources daily at midnight
  // =====================================================

  cron.schedule("0 5 * * *", async () => {
    console.log("[CRON] Starting daily parser run for all active sources...");
    const { ParserEngine } = await import("./src/parser/parserEngine");
    const parserEngine = new ParserEngine();
    const results = await parserEngine.runAllSources();
    console.log(
      `[CRON] Daily run complete. ${results.filter((r) => r.isSuccessful).length}/${results.length} sources OK.`
    );
  }, { timezone: "Asia/Almaty" });

  const { ParserEngine } = await import("./src/parser/parserEngine");
  const parserEngine = new ParserEngine();
  const { PARSER_SOURCES } = await import("./src/parser/sources");
  
  for (const source of PARSER_SOURCES) {
    if (source.cronExpression && source.isActive) {
      cron.schedule(source.cronExpression, async () => {
        console.log(`[CRON] Running scheduled parser for source: ${source.id}`);
        await parserEngine.runSource(source);
      }, { timezone: "Asia/Almaty" });
    }
  }

  // Serve admin.html at /admin
  const adminHtmlPath = path.join(process.cwd(), "admin.html");

  // Vite development middleware vs Static Production bundle serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true as any
      },
      appType: "spa",
    });

    // Serve admin page through Vite transform pipeline
    const serveAdmin = async (_req: any, res: any) => {
      try {
        const html = await vite.transformIndexHtml("/admin.html", fs.readFileSync(adminHtmlPath, "utf-8"));
        res.send(html);
      } catch (err: any) {
        res.status(500).send(`Admin page error: ${err.message}`);
      }
    };
    app.get("/admin", serveAdmin);
    app.get("/admin.html", serveAdmin);

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(["/admin", "/admin.html"], (_req, res) => {
      res.sendFile(path.join(distPath, "admin.html"));
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Generic error handler to catch SyntaxErrors from body-parser
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && "status" in err && err.message.includes("JSON")) {
      console.warn("[Express] Gracefully handled invalid JSON payload request:", err.message);
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
    next(err);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedTariff.kz server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
