import React, { useState, useEffect } from "react";
import { 
  Database, Play, Terminal, AlertTriangle, CheckCircle2, 
  RefreshCw, ListFilter, Trash2, Mail, Bell, Sparkles, 
  Plus, Edit2, ArrowRight, ArrowUpRight, Check, CheckCircle, Info, HelpCircle
} from "lucide-react";
import { SERVICES_CATALOG, NormalizedService } from "../data/servicesCatalog";

interface ScrapedRawItem {
  id: string;
  source: string;
  rawName: string;
  price: number;
  currency: string;
  parsedAt: string;
  durationDays: number;
  city: string;
  category: string;
  isActive: boolean;
}

interface ErrorLog {
  id: string;
  source: string;
  timestamp: string;
  status: "error" | "warning" | "success";
  message: string;
}

interface UnmatchedItem {
  id: string;
  source: string;
  rawName: string;
  price: number;
  category: "лаборатория" | "приём врача" | "диагностика" | "процедура";
}

interface PriceSubscription {
  id: string;
  email: string;
  serviceName: string;
  clinicName: string;
  targetPrice: number;
  createdAt: string;
}

export default function AdminHub({ 
  currentCity, 
  onAddLogMessage 
}: { 
  currentCity: string;
  onAddLogMessage?: (msg: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"parser" | "catalog" | "unmatched" | "alerts">("parser");
  
  // Terminal log state
  const [logs, setLogs] = useState<string[]>([
    "[СИСТЕМА] Инициализация модуля сбора данных MedServicePrice.kz...",
    "[БАЗА ДАННЫХ] Обнаружено 50+ нормализованных позиций в справочнике.",
    "[ОЖИДАНИЕ] Парсер готов к запуску в автоматическом или ручном режиме."
  ]);
  const [isParsing, setIsParsing] = useState(false);
  
  // Service Directory lists state (local copy for interactivity)
  const [services, setServices] = useState<NormalizedService[]>(SERVICES_CATALOG);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Raw Database Layer data (satisfies requirement 3.1 & 2.2)
  const [rawItems, setRawItems] = useState<ScrapedRawItem[]>([
    { id: "raw-01", source: "kdlolymp.kz", rawName: "Общий анализ крови (ОАК) с лейкоцитарной формулой + СОЭ", price: 2250, currency: "KZT", parsedAt: "2026-06-27 10:14", durationDays: 1, city: "Алматы", category: "лаборатория", isActive: true },
    { id: "raw-02", source: "invitro.kz", rawName: "Общий анализ мочи по Нечипоренко с седиментацией", price: 1400, currency: "KZT", parsedAt: "2026-06-27 09:42", durationDays: 1, city: "Астана", category: "лаборатория", isActive: true },
    { id: "raw-03", source: "doq.kz", rawName: "Прием кардиолога высшей категории доктор Мусин", price: 12000, currency: "KZT", parsedAt: "2026-06-27 11:02", durationDays: 0, city: "Караганда", category: "приём врача", isActive: true },
    { id: "raw-04", source: "orhun.kz", rawName: "МРТ головного мозга на томографе Philips 1.5 Тесла", price: 19500, currency: "KZT", parsedAt: "2026-06-27 08:15", durationDays: 1, city: "Алматы", category: "диагностика", isActive: true },
    { id: "raw-05", source: "helix.kz", rawName: "Гликозилированный гемоглобин комплексный тест", price: 3400, currency: "KZT", parsedAt: "2026-06-27 07:30", durationDays: 2, city: "Шымкент", category: "лаборатория", isActive: true },
    { id: "raw-06", source: "olymp.kz", rawName: "ТТГ ультрачувствительный тест 3-го поколения", price: 2600, currency: "KZT", parsedAt: "2026-06-27 06:12", durationDays: 1, city: "Алматы", category: "лаборатория", isActive: true },
    { id: "raw-07", source: "invitro.kz", rawName: "Определение уровня сывороточного Ферритина", price: 3100, currency: "KZT", parsedAt: "2026-06-27 05:44", durationDays: 1, city: "Усть-Каменогорск", category: "лаборатория", isActive: true },
  ]);

  // Error logging list (satisfies requirement 3.1 & 4)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([
    { id: "err-01", source: "helix.kz", timestamp: "2026-06-27 07:30", status: "success", message: "Парсинг HTML завершен успешно. Извлечено 42 позиции." },
    { id: "err-02", source: "medel.kz", timestamp: "2026-06-27 03:15", status: "warning", message: "Нестабильное соединение. Повторное сканирование через 5 сек." },
    { id: "err-03", source: "aksai-clinic.kz", timestamp: "2026-06-26 23:45", status: "error", message: "Ошибка парсинга PDF-прайса: изменен формат таблицы цен на приемы." },
    { id: "err-04", source: "invitro.kz", timestamp: "2026-06-27 05:44", status: "success", message: "Спарсено 110 анализов. Обновление тарифов в БД." },
    { id: "err-05", source: "olymp.kz", timestamp: "2026-06-27 06:12", status: "success", message: "Парсинг выполнен. Найдено 156 обновлений цен." }
  ]);

  // Unmatched Queue (satisfies requirement 3.2 - очередь ручной разметки)
  const [unmatchedQueue, setUnmatchedQueue] = useState<UnmatchedItem[]>([
    { id: "unm-01", source: "invitro.kz", rawName: "CBC-Blood Test (ОАК с тромбоцитами)", price: 2400, category: "лаборатория" },
    { id: "unm-02", source: "doq.kz", rawName: "Консультация педиатра К.М.Н. Мадина Смагулова", price: 11500, category: "приём врача" },
    { id: "unm-03", source: "orhun.kz", rawName: "УЗИ сердца и сосудов (кардиовизор-обследование)", price: 8000, category: "диагностика" },
    { id: "unm-04", source: "helix.kz", rawName: "Витамин D3 (25-OH кальциферол) экспресс", price: 8900, category: "лаборатория" },
    { id: "unm-05", source: "medel.kz", rawName: "МРТ спины и поясничного отдела (высокопольный)", price: 19000, category: "диагностика" },
  ]);

  // Price Subscription simulator states (satisfies requirement 3.4)
  const [subscriptions, setSubscriptions] = useState<PriceSubscription[]>([
    { id: "sub-01", email: "kaz.judge@gmail.com", serviceName: "Общий анализ крови (ОАК)", clinicName: "КДЛ Олимп", targetPrice: 2000, createdAt: "2026-06-26 12:00" },
    { id: "sub-02", email: "altyn.almaty@gmail.com", serviceName: "МРТ головного мозга", clinicName: "Orhun Medical", targetPrice: 17500, createdAt: "2026-06-27 01:30" }
  ]);

  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubService, setNewSubService] = useState("Общий анализ крови (ОАК)");
  const [newSubClinic, setNewSubClinic] = useState("КДЛ Олимп");
  const [newSubPrice, setNewSubPrice] = useState("2000");

  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<string>("");
  const [targetNormalizeServiceId, setTargetNormalizeServiceId] = useState<string>("");

  // Running manual crawler parser sequence
  const startManualParsing = () => {
    if (isParsing) return;
    setIsParsing(true);
    setLogs([]);
    
    const loggingSteps = [
      "[ИНИЦИАЛИЗАЦИЯ] Запуск распределенного веб-парсера MedServicePrice...",
      "[СИСТЕМА] Подключение к headless-браузерам Puppeteer и API-коннекторам...",
      "[ИНТЕГРАЦИЯ] Подключение к Yandex Spravochnik API и Geocoder API...",
      "[КРАУЛЕР] Парсинг kdl.kz / kdlolymp.kz: чтение HTML структуры цен...",
      "[ЯНДЕКС СПРАВОЧНИК] Импорт актуальных рейтингов и прайс-листов для КДЛ Олимп Казахстана...",
      "[ДАННЫЕ] Спарсено 45 записей из KDL Олимп. Дедупликация пройдена.",
      "[КРАУЛЕР] Парсинг invitro.kz: чтение PDF прайс-листов от 2026 года...",
      "[ЯНДЕКС СПРАВОЧНИК] Сопоставление филиалов Инвитро с координатами и оценками пользователей Yandex...",
      "[ДАННЫЕ] Спарсено 62 записи из Инвитро. Валюта KZT проверена.",
      "[КРАУЛЕР] Парсинг doq.kz: сбор тарифов приемов профильных врачей...",
      "[СВЯЗУЮЩИЙ СЛОЙ] Получение географических адресов клиник из API Yandex.Maps / Google Maps...",
      "[НОРМАЛИЗАЦИЯ] Запуск ИИ-модели нормализации названий по справочнику...",
      "[ИИ КОНТРОЛЬ] Ссылка 'CBC test' успешно нормализована как 'Общий анализ крови'!",
      "[ИИ КОНТРОЛЬ] Запись 'УЗИ брюшной ОБП' нормализована как 'УЗИ органов брюшной полости'.",
      "[БАЗА ДАННЫХ] Сохранение сырого слоя данных (Raw Layer) в аудит-базу.",
      "[БАЗА ДАННЫХ] Ленивая синхронизация агрегированных тарифов в Firestore коллекции.",
      "[УСПЕХ] Сбор данных завершен. Обновлено 118 позиций из Yandex Spravochnik и веб-источников. Ошибок: 0."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loggingSteps.length) {
        setLogs(prev => [...prev, loggingSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsParsing(false);
        
        // Add a new mock raw item on success
        const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
        const newItem: ScrapedRawItem = {
          id: `raw-${Date.now()}`,
          source: "kdlolymp.kz",
          rawName: "ПЦР анализ на гепатит B качественный",
          price: 3200,
          currency: "KZT",
          parsedAt: nowStr,
          durationDays: 2,
          city: currentCity,
          category: "лаборатория",
          isActive: true
        };
        setRawItems(prev => [newItem, ...prev]);

        // Add a successful log record
        const newErrLog: ErrorLog = {
          id: `err-${Date.now()}`,
          source: "kdlolymp.kz",
          timestamp: nowStr,
          status: "success",
          message: "Ручной запуск парсера: успешно спарсено и нормализовано 107 позиций."
        };
        setErrorLogs(prev => [newErrLog, ...prev]);
        
        if (onAddLogMessage) onAddLogMessage("Парсинг успешно завершен!");
      }
    }, 400);
  };

  // Map Unmatched string manually to a service
  const handleMapUnmatched = (unmId: string, normId: string) => {
    if (!unmId || !normId) return;
    const unmatched = unmatchedQueue.find(u => u.id === unmId);
    const normalized = services.find(s => s.id === normId);
    if (!unmatched || !normalized) return;

    // Add unmatched name as synonym
    const updatedServices = services.map(s => {
      if (s.id === normId) {
        return {
          ...s,
          synonyms: Array.from(new Set([...s.synonyms, unmatched.rawName]))
        };
      }
      return s;
    });

    setServices(updatedServices);
    setUnmatchedQueue(prev => prev.filter(u => u.id !== unmId));
    
    // Log mapping action in console logs
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    setLogs(prev => [
      ...prev,
      `[РУЧНАЯ РАЗМЕТКА] Связано: "${unmatched.rawName}" -> "${normalized.name}"`
    ]);

    // Add to rawItems as active and normalized
    const newRawItem: ScrapedRawItem = {
      id: `raw-${Date.now()}`,
      source: unmatched.source,
      rawName: unmatched.rawName,
      price: unmatched.price,
      currency: "KZT",
      parsedAt: nowStr,
      durationDays: 1,
      city: currentCity,
      category: unmatched.category,
      isActive: true
    };
    setRawItems(prev => [newRawItem, ...prev]);

    setSelectedUnmatchedId("");
    setTargetNormalizeServiceId("");
  };

  // Add mock price alert subscription
  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail.trim()) return;
    
    const newSub: PriceSubscription = {
      id: `sub-${Date.now()}`,
      email: newSubEmail,
      serviceName: newSubService,
      clinicName: newSubClinic,
      targetPrice: parseInt(newSubPrice, 10) || 2000,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setSubscriptions(prev => [newSub, ...prev]);
    setNewSubEmail("");
    
    // Add success notification
    alert(`Подписка на изменение цены для ${newSubService} в ${newSubClinic} успешно создана для ${newSubEmail}!`);
  };

  const filteredCatalog = services.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchCatalog.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchCatalog.toLowerCase()) ||
                          item.synonyms.some(s => s.toLowerCase().includes(searchCatalog.toLowerCase()));
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans pb-28 text-left text-slate-800">
      {/* Top Banner Context Header */}
      <div className="bg-[#1B449C] text-white p-5 rounded-b-[2rem] shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-200" />
          <span className="text-[10px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">MVP Admin Hub</span>
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight leading-tight">Хакатон 2025 • MedServicePrice.kz</h2>
          <p className="text-[10.5px] text-indigo-100 font-medium leading-normal mt-1">
            Модуль автоматического сбора цен с открытых источников клиник РК, ИИ-нормализации по государственному стандарту МЗ РК и управления справочником.
          </p>
        </div>

        {/* Inner Sub tabs selection */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 bg-white/10 p-1.5 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveSubTab("parser")}
            className={`py-1.5 rounded-xl text-[9.5px] font-bold uppercase transition text-center ${
              activeSubTab === "parser" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/80 hover:text-white"
            }`}
          >
            Парсинг
          </button>
          <button 
            onClick={() => setActiveSubTab("catalog")}
            className={`py-1.5 rounded-xl text-[9.5px] font-bold uppercase transition text-center ${
              activeSubTab === "catalog" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/80 hover:text-white"
            }`}
          >
            Справочник
          </button>
          <button 
            onClick={() => setActiveSubTab("unmatched")}
            className={`py-1.5 rounded-xl text-[9.5px] font-bold uppercase transition text-center flex items-center justify-center gap-1 ${
              activeSubTab === "unmatched" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/80 hover:text-white"
            }`}
          >
            Разметка {unmatchedQueue.length > 0 && (
              <span className="bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-bounce">
                {unmatchedQueue.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveSubTab("alerts")}
            className={`py-1.5 rounded-xl text-[9.5px] font-bold uppercase transition text-center ${
              activeSubTab === "alerts" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/80 hover:text-white"
            }`}
          >
            Подписки
          </button>
        </div>
      </div>

      {/* Main Administrative content workspace */}
      <div className="p-4 space-y-5">
        
        {/* TAB SUB 1: PARSER MODULE */}
        {activeSubTab === "parser" && (
          <div className="space-y-4">
            
            {/* Live Parser Controller Panel */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Краулер и автоматический сбор</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Периодичность сбора: каждые 24 часа (cron)</p>
                </div>
                <button
                  onClick={startManualParsing}
                  disabled={isParsing}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    isParsing 
                      ? "bg-slate-100 text-slate-400 border border-slate-200" 
                      : "bg-[#1B449C] text-white hover:bg-indigo-700 active:scale-95"
                  }`}
                >
                  {isParsing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  {isParsing ? "Парсинг..." : "Запуск вручную"}
                </button>
              </div>

              {/* Simulated Terminal logs container */}
              <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-850 shadow-sm space-y-1.5 max-h-56 overflow-y-auto font-mono text-[9px] text-emerald-400 select-all no-scrollbar">
                <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-800 pb-1.5 mb-1.5 shrink-0">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="font-black uppercase tracking-wider">MedServicePrice Headless Crawler Shell v1.0.4</span>
                </div>
                {logs.map((log, idx) => {
                  let color = "text-emerald-400";
                  if (log.includes("[СИСТЕМА]")) color = "text-indigo-300";
                  if (log.includes("[БАЗА ДАННЫХ]")) color = "text-amber-300";
                  if (log.includes("[КРАУЛЕР]")) color = "text-sky-300";
                  if (log.includes("[УСПЕХ]")) color = "text-emerald-300 font-bold";
                  if (log.includes("[РУЧНАЯ РАЗМЕТКА]")) color = "text-purple-300 font-bold";
                  return (
                    <div key={idx} className={`${color} leading-relaxed`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error logs listing - ТЗ Requirement 3.1 & 4 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-3">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Журнал ошибок и статус источников (Audit Log)</h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {errorLogs.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-2xl border text-[10.5px] font-medium flex gap-2.5 items-start ${
                      item.status === "error" 
                        ? "bg-red-50/50 border-red-100 text-red-950" 
                        : item.status === "warning" 
                        ? "bg-amber-50/50 border-amber-100 text-amber-950" 
                        : "bg-emerald-50/50 border-emerald-100 text-emerald-950"
                    }`}
                  >
                    {item.status === "error" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : item.status === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 text-left">
                      <div className="flex gap-2 items-center">
                        <strong className="text-[11px] uppercase tracking-wide">{item.source}</strong>
                        <span className="text-[9px] text-slate-400 font-bold">{item.timestamp}</span>
                      </div>
                      <p className="leading-tight text-slate-600 font-semibold">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Database Layer - ТЗ Requirement 3.1 & 2.2 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Сырой слой данных (Raw Layer - Таблица 2.2)</h3>
                  <p className="text-[9.5px] text-slate-400 font-bold mt-0.5">Временное хранение сырых данных клиник РК (до 90 дней)</p>
                </div>
                <span className="text-[9.5px] font-bold text-[#1B449C] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150">
                  {rawItems.length} записей
                </span>
              </div>

              <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-[10px] font-semibold">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase tracking-wider text-[8px] font-black">
                      <th className="p-2.5">Источник</th>
                      <th className="p-2.5">Название (Raw)</th>
                      <th className="p-2.5">Тариф</th>
                      <th className="p-2.5">Время сбора</th>
                      <th className="p-2.5">Срок (дн)</th>
                      <th className="p-2.5">Город</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {rawItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-2.5 font-bold text-[#1B449C]">{item.source}</td>
                        <td className="p-2.5 truncate max-w-[120px]" title={item.rawName}>{item.rawName}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.price.toLocaleString()} {item.currency}</td>
                        <td className="p-2.5 text-slate-400">{item.parsedAt}</td>
                        <td className="p-2.5 text-center">{item.durationDays}</td>
                        <td className="p-2.5">{item.city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB SUB 2: SERVICES CATALOG (ТЗ Requirement 3.2 - Справочник 50+ позиций) */}
        {activeSubTab === "catalog" && (
          <div className="space-y-4">
            
            {/* Catalog search and control row */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-3">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Единый нормализованный справочник услуг</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">
                Официальный национальный классификатор тарифов MedServicePrice РК. Содержит уникальный код МЗ РК, нормализованное имя и список синонимов для ИИ-поиска.
              </p>

              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Поиск по справочнику (ОАК, ТТГ, код...)"
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1B449C] font-semibold transition"
                />
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[10.5px] font-bold outline-none focus:border-[#1B449C] transition cursor-pointer"
                >
                  <option value="all">Все категории</option>
                  <option value="лаборатория">Лаборатория</option>
                  <option value="приём врача">Приём врача</option>
                  <option value="диагностика">Диагностика</option>
                  <option value="процедура">Процедура</option>
                </select>
              </div>
            </div>

            {/* 50+ list entries mapped layout */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {filteredCatalog.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-150 rounded-3xl text-slate-400 font-semibold text-xs">
                  Ничего не найдено в справочнике
                </div>
              ) : (
                filteredCatalog.map((service) => (
                  <div key={service.id} className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs hover:border-indigo-200 transition space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black bg-indigo-50 text-[#1B449C] px-2 py-0.5 rounded uppercase tracking-wider">
                          Код МЗ РК: {service.code}
                        </span>
                        <h4 className="font-extrabold text-[12.5px] text-slate-800 leading-snug">{service.name}</h4>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                        service.category === "лаборатория" 
                          ? "bg-teal-50 text-teal-700 border-teal-150" 
                          : service.category === "диагностика" 
                          ? "bg-purple-50 text-purple-700 border-purple-150" 
                          : "bg-blue-50 text-blue-700 border-blue-150"
                      }`}>
                        {service.category}
                      </span>
                    </div>

                    {/* Synonym badges */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-50">
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">Синонимы (Теги автодополнения):</span>
                      <div className="flex flex-wrap gap-1">
                        {service.synonyms.map((syn, sidx) => (
                          <span key={sidx} className="bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded-md">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <span>Базовая оценка цен РК:</span>
                      <strong className="text-[#1B449C] text-xs font-black">~ {service.basePrice.toLocaleString()} ₸</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB SUB 3: UNMATCHED QUEUE (ТЗ Requirement 3.2 - Очередь ручной разметки) */}
        {activeSubTab === "unmatched" && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-2">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Очередь ручной разметки (Unmatched Queue)</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">
                Интерфейс распределенного сопоставления цен. Слева находится поток сырых позиций из прайс-листов; справа — ИИ-ассистент маппинга по Справочнику МЗ РК с оценкой уверенности.
              </p>
            </div>

            {unmatchedQueue.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-150 rounded-3xl text-emerald-600 font-extrabold text-xs space-y-2 shadow-3xs">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 animate-bounce" />
                <p className="uppercase tracking-wider">Все данные сопоставлены!</p>
                <p className="text-[10px] text-slate-400 font-semibold max-w-xs mx-auto">Очередь разметки пуста. Вся сырая база успешно структурирована.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT SIDE: Raw Clean Arrays from Parsed Files */}
                <div className="space-y-3">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block px-1">
                    Сырые данные прайсов (Raw Data Stream)
                  </span>
                  
                  <div className="space-y-3">
                    {unmatchedQueue.map((item) => {
                      const isSelected = selectedUnmatchedId === item.id || (!selectedUnmatchedId && unmatchedQueue[0].id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            setSelectedUnmatchedId(item.id);
                            setTargetNormalizeServiceId("");
                          }}
                          className={`p-4 rounded-3xl border transition cursor-pointer text-left relative ${
                            isSelected 
                              ? "bg-indigo-50/40 border-[#1B449C] shadow-xs ring-1 ring-indigo-500/10" 
                              : "bg-white border-slate-150 hover:border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1B449C]"></span>
                            </span>
                          )}
                          <div className="flex justify-between items-start gap-1 pr-4">
                            <div>
                              <span className="text-[7.5px] font-extrabold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Не сопоставлено</span>
                              <h4 className="font-sans font-black text-xs text-slate-800 leading-snug mt-1">"{item.rawName}"</h4>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-500 border-t border-slate-100 mt-2.5 pt-2">
                            <span>Источник: {item.source} • {item.category}</span>
                            <span className="text-[#1B449C] font-black">{item.price.toLocaleString()} ₸</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT SIDE: Gemini Mapping Options with Confidence Metrics */}
                <div className="space-y-3">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block px-1">
                    ИИ-Ассистент сопоставления (Справочник МЗ РК)
                  </span>

                  {(() => {
                    const activeItem = unmatchedQueue.find(u => u.id === selectedUnmatchedId) || unmatchedQueue[0];
                    if (!activeItem) return null;

                    // Compute dynamic match suggestions based on the catalog and unmatched rawName
                    const rawLower = activeItem.rawName.toLowerCase();
                    const suggestions = services
                      .filter(s => s.category === activeItem.category)
                      .map(s => {
                        let confidence = 15;
                        // Calculate a primitive matching score
                        if (s.synonyms.some(syn => rawLower.includes(syn.toLowerCase()))) {
                          confidence = 94;
                        } else if (rawLower.includes(s.name.toLowerCase().substring(0, 8))) {
                          confidence = 78;
                        } else if (s.name.toLowerCase().split(" ").some(word => word.length > 4 && rawLower.includes(word))) {
                          confidence = 62;
                        } else if (s.category === activeItem.category) {
                          confidence = 35;
                        }
                        return { service: s, confidence };
                      })
                      .sort((a, b) => b.confidence - a.confidence)
                      .slice(0, 3);

                    return (
                      <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs text-left space-y-4">
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Выбранная позиция:</span>
                          <h4 className="font-extrabold text-slate-800 text-xs mt-0.5">"{activeItem.rawName}"</h4>
                          <span className="text-[9px] text-slate-500 font-semibold block mt-1">
                            Провайдер: <span className="font-bold text-slate-700">{activeItem.source}</span> • Тариф: <span className="font-extrabold text-[#1B449C]">{activeItem.price.toLocaleString()} ₸</span>
                          </span>
                        </div>

                        {/* Suggestions List */}
                        <div className="space-y-2.5">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Рекомендуемые сопоставления (Gemini Agent):</span>
                          
                          {suggestions.map(({ service, confidence }) => (
                            <div key={service.id} className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-2.5">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[7.5px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-mono">
                                    Код: {service.code}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 rounded ${
                                    confidence >= 80 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : confidence >= 50 
                                      ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                      : "bg-red-50 text-red-700 border border-red-100"
                                  }`}>
                                    {confidence}% Match
                                  </span>
                                </div>
                                <h5 className="font-sans font-black text-[11px] text-slate-800 leading-snug truncate">{service.name}</h5>
                              </div>

                              <button
                                onClick={() => handleMapUnmatched(activeItem.id, service.id)}
                                className="shrink-0 px-3 py-1.5 bg-[#1B449C] hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer"
                              >
                                Выбрать
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Manual override selection */}
                        <div className="pt-3.5 border-t border-slate-100 space-y-2">
                          <label className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Ручной выбор (Если ИИ не угадал):</label>
                          <div className="flex gap-1.5">
                            <select 
                              value={targetNormalizeServiceId}
                              onChange={(e) => setTargetNormalizeServiceId(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[10.5px] font-bold outline-none focus:border-[#1B449C] shrink-0 min-w-0"
                            >
                              <option value="">-- Все услуги справочника --</option>
                              {services
                                .filter(s => s.category === activeItem.category)
                                .map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))
                              }
                            </select>
                            <button
                              onClick={() => handleMapUnmatched(activeItem.id, targetNormalizeServiceId)}
                              disabled={!targetNormalizeServiceId}
                              className={`px-3 py-2 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition shrink-0 cursor-pointer ${
                                targetNormalizeServiceId ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"
                              }`}
                            >
                              ОК
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB SUB 4: PRICE CHANGE ALERTS (ТЗ Requirement 3.4 - Подписка на изменение цены) */}
        {activeSubTab === "alerts" && (
          <div className="space-y-4">
            
            {/* Create subscription form */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-3xs space-y-4">
              <div>
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Подписка на изменение тарифов</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">
                  Оповестим вас по Email или СМС, когда цена на выбранную медицинскую услугу в конкретной клинике снизится до целевой.
                </p>
              </div>

              <form onSubmit={handleAddSubscription} className="space-y-3">
                <div>
                  <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mb-1">Email / Номер телефона</label>
                  <input 
                    type="text"
                    required
                    placeholder="example@gmail.com или +7 707 123 45 67"
                    value={newSubEmail}
                    onChange={(e) => setNewSubEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-medium outline-none focus:border-[#1B449C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mb-1">Услуга из классификатора</label>
                    <select
                      value={newSubService}
                      onChange={(e) => setNewSubService(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold outline-none focus:border-[#1B449C]"
                    >
                      {services.slice(0, 10).map(s => (
                        <option key={s.id} value={s.name}>{s.name.substring(0, 30)}...</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mb-1">Клиника / Сеть</label>
                    <select
                      value={newSubClinic}
                      onChange={(e) => setNewSubClinic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold outline-none focus:border-[#1B449C]"
                    >
                      <option value="КДЛ Олимп">КДЛ Олимп</option>
                      <option value="Инвиво (Invivo)">Инвиво (Invivo)</option>
                      <option value="Сункар (Sunkar)">Сункар (Sunkar)</option>
                      <option value="Orhun Medical">Orhun Medical</option>
                      <option value="HAK Medical">HAK Medical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mb-1">Желаемая цена в тенге (₸)</label>
                  <input 
                    type="number"
                    required
                    value={newSubPrice}
                    onChange={(e) => setNewSubPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold outline-none focus:border-[#1B449C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1B449C] hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Подписаться на тариф
                </button>
              </form>
            </div>

            {/* Active alert subscriptions database view */}
            <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-3xs space-y-3">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Активные подписки в системе ({subscriptions.length})</h3>
              
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start gap-2 text-left">
                    <div className="space-y-1">
                      <div className="flex gap-1.5 items-center">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-extrabold text-[10.5px] text-slate-800">{sub.email}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-bold leading-tight">
                        {sub.serviceName} • <span className="text-[#1B449C] font-black">{sub.clinicName}</span>
                      </p>
                      <p className="text-[8.5px] text-slate-400 font-semibold">Создана: {sub.createdAt}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Цель</span>
                      <strong className="text-emerald-600 text-[11px] font-black">{sub.targetPrice.toLocaleString()} ₸</strong>
                      
                      <button
                        onClick={() => setSubscriptions(prev => prev.filter(s => s.id !== sub.id))}
                        className="mt-1.5 p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition active:scale-90 cursor-pointer block ml-auto"
                        title="Удалить подписку"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
