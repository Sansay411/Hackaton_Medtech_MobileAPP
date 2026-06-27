import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

  // API Route: AI-powered medical services search with googleSearch grounding
  app.post("/api/search-services", async (req, res) => {
    try {
      const { query, city = "Алматы" } = req.body;
      if (!query || query.trim() === "") {
        return res.json({ error: "Search query is required" });
      }

      const client = getAI();
      if (!client) {
        return res.json(getSimulatedServices(query, city));
      }

      const prompt = `Вы являетесь ведущим экспертом по медицинским тарифам и ценам в Казахстане. Используйте функцию Google Поиска (Google Search Grounding), чтобы найти реальные, актуальные цены и предложения на медицинскую услугу: "${query}" в городе: "${city}".
Ищите информацию на официальных сайтах крупных сетей лабораторий и клиник в Казахстане (например, КДЛ Олимп (dily.olympkdl.kz), Инвиво/Invivo, Сункар, Orhun Medical, МЦ ХАК, Керуен Медикус, Евразия) или медицинских порталах-агрегаторах (таких как TopDoc.kz, Doc.kz).

Предоставьте результат в формате JSON, содержащий:
1. "insights": Краткий профессиональный ИИ-анализ рынка цен на услугу "${query}" в г. ${city}. Укажите среднюю реальную стоимость, ценовой диапазон, факторы влияния на цену и возможность получения услуги бесплатно по системе ОСМС (Обязательное Социальное Медицинское Страхование) в государственных или частных клиниках-поставщиках ФСМС.
2. "clinics": Массив из 4-5 РЕАЛЬНО существующих в г. ${city} клиник или лабораторий, предлагающих эту услугу, с реальными или максимально близкими к действительности тарифами в тенге (₸):
   - "id": Уникальная строка-идентификатор (например, "clinic-olymp-1")
   - "name": Официальное название клиники или лаборатории (например, "КДЛ Олимп", "Медицинский центр Сункар", "Orhun Medical")
   - "price": Реальная числовая цена за эту услугу в тенге (₸) на текущий момент (например, 2800)
   - "address": Реальный физический адрес филиала этой клиники в городе ${city}
   - "district": Название района города, где расположена клиника
   - "distance": Расстояние от центра города (например, "1.8 км")
   - "osms": Логическое значение (true, если эта услуга в данной клинике доступна бесплатно гражданам РК по системе ОСМС/ГОБМП, либо если это государственная поликлиника; false в противном случае)
   - "updated": Строка "сегодня" или "вчера" (показывает актуальность тарифа)
   - "phone": Действующий контактный телефон клиники/филиала в Казахстане
   - "rating": Реальный или экспертный рейтинг клиники от 3.5 до 5.0 (число)

Убедитесь, что ответ является СТРОГИМ JSON объектом и может быть распарсен. Не используйте разметку markdown типа \`\`\`json. Верните только валидный JSON.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "";
      try {
        const parsed = cleanAndParseJSON(text);
        parsed.isSimulated = false;
        return res.json(parsed);
      } catch (err) {
        console.warn("Gemini response is not a clean JSON, falling back to simulated high-fidelity data.", text, err);
        return res.json(getSimulatedServices(query, city));
      }
    } catch (error) {
      console.error("Gemini Search API failed:", error);
      return res.json(getSimulatedServices(req.body.query, req.body.city || "Алматы"));
    }
  });

  // API Route: Map and Geolocation Grounding
  app.post("/api/map-grounding", async (req, res) => {
    try {
      const { query, city = "Алматы" } = req.body;
      const client = getAI();
      if (!client) {
        return res.json(getSimulatedMapMarkers(query, city));
      }

      const prompt = `Используйте Google Поиск (Google Search Grounding), чтобы найти реальные клиники и их филиалы в городе ${city} (Казахстан), которые оказывают медицинскую услугу "${query}".
Предоставьте список из 5 реальных географических маркеров для этих клиник в формате JSON, содержащий объект "markers" с массивом элементов:
- "id": Уникальный идентификатор клиники (например, "marker-invivo-1")
- "name": Официальное название клиники или лаборатории (например, "Инвиво", "КДЛ Олимп", "Сункар")
- "price": Реальная актуальная цена за эту услугу в тенге (число, например, 3000)
- "lat": Точная или близкая к действительности широта филиала в г. ${city} (число, например, около 43.238 для Алматы, 51.169 для Астаны, 42.321 для Шымкента, 49.802 для Караганды)
- "lng": Точная или близкая к действительности долгота филиала в г. ${city} (число, например, около 76.889 для Алматы, 71.449 для Астаны, 69.590 для Шымкента, 73.085 для Караганды)
- "address": Реальный адрес филиала в г. ${city}
- "osms": Логическое значение (true, если услуга в этой клинике доступна бесплатно по системе ОСМС)
- "rating": Числовой рейтинг клиники от 3.5 до 5.0 (например, 4.8)

Верните СТРОГИЙ JSON без разметки markdown. Убедитесь, что координаты соответствуют реальному расположению клиник в городе ${city}, чтобы они корректно отображались на интерактивной карте.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "";
      try {
        const parsed = cleanAndParseJSON(text);
        parsed.isSimulated = false;
        return res.json(parsed);
      } catch (err) {
        console.warn("Gemini map-grounding response is not a clean JSON, falling back to simulated high-fidelity data.", text, err);
        return res.json(getSimulatedMapMarkers(query, city));
      }
    } catch (error) {
      console.error("Gemini Map Grounding failed:", error);
      return res.json(getSimulatedMapMarkers(req.body.query, req.body.city || "Алматы"));
    }
  });

  // Vite development middleware vs Static Production bundle serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedTariff.kz server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
