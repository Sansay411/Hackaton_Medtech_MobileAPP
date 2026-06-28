import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Database, Play, Terminal, AlertTriangle, CheckCircle2, 
  RefreshCw, ListFilter, Trash2, Mail, Bell, Sparkles, 
  Plus, Edit2, ArrowRight, ArrowUpRight, Check, CheckCircle, Info, HelpCircle,
  Search, Heart, Eye, Star, User, Table, Edit3, BarChart3, Lock, Key, 
  Play as PlayIcon, Loader2, Folder, File, Layers, Settings, BookOpen, AlertCircle, Upload
} from "lucide-react";
import { SERVICES_CATALOG, NormalizedService } from "../data/servicesCatalog";
import { db, collection, getDocs, setDoc, doc, addDoc, deleteDoc, onSnapshot, writeBatch } from "../lib/dbBridge";
import { BlogPost } from "../types";
import Logo from "./Logo";

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
  currentCity = "Алматы", 
  onAddLogMessage 
}: { 
  currentCity?: string;
  onAddLogMessage?: (msg: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"parser" | "catalog" | "unmatched" | "alerts" | "blog">("parser");
  const [city, setCity] = useState(currentCity);
  
  // Blog states
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogCategory, setBlogCategory] = useState("Лайфхаки ОСМС");
  const [blogCity, setBlogCity] = useState("Все");
  const [blogAuthor, setBlogAuthor] = useState("MedTariff Аналитика");
  const [blogImageUrl, setBlogImageUrl] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [isBlogSaving, setIsBlogSaving] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // System States
  const [logs, setLogs] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [services, setServices] = useState<NormalizedService[]>(SERVICES_CATALOG);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [rawItems, setRawItems] = useState<ScrapedRawItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [unmatchedQueue, setUnmatchedQueue] = useState<UnmatchedItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<PriceSubscription[]>([]);
  const [parsingSources, setParsingSources] = useState<any[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceDomain, setNewSourceDomain] = useState("");

  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubService, setNewSubService] = useState("Общий анализ крови (ОАК)");
  const [newSubClinic, setNewSubClinic] = useState("КДЛ Олимп");
  const [newSubPrice, setNewSubPrice] = useState("2000");

  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<string>("");
  const [targetNormalizeServiceId, setTargetNormalizeServiceId] = useState<string>("");

  const [isSyncing, setIsSyncing] = useState(false);
  const dataLoadedRef = useRef(false);

  const loadBlogPosts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const list: BlogPost[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as BlogPost);
      });
      setBlogPosts(list);
    } catch (e) {
      console.error("Failed to load blog posts:", e);
    }
  };

  useEffect(() => {
    if (activeSubTab === "blog") {
      loadBlogPosts();
    }
  }, [activeSubTab]);

  const handleGenerateCover = () => {
    if (!blogTitle.trim()) return;
    setIsGeneratingCover(true);
    setTimeout(() => {
      const keywords = blogTitle.toLowerCase();
      let url = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80";
      if (keywords.includes("очеред") || keywords.includes("осмс") || keywords.includes("врач")) {
        url = "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80";
      } else if (keywords.includes("анализ") || keywords.includes("олимп") || keywords.includes("кров")) {
        url = "https://images.unsplash.com/photo-1579154204601-01588f351166?auto=format&fit=crop&w=800&q=80";
      } else if (keywords.includes("цена") || keywords.includes("деньг") || keywords.includes("сравн")) {
        url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80";
      } else if (keywords.includes("мозг") || keywords.includes("мрт") || keywords.includes("узи")) {
        url = "https://images.unsplash.com/photo-1526253038957-b254ffb31420?auto=format&fit=crop&w=800&q=80";
      }
      setBlogImageUrl(url);
      setIsGeneratingCover(false);
    }, 1500);
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) return;
    setIsBlogSaving(true);
    try {
      const postId = selectedPost ? selectedPost.id : `art-${Date.now()}`;
      const postData: Omit<BlogPost, "id"> = {
        title: blogTitle,
        summary: blogSummary,
        category: blogCategory,
        city: blogCity,
        author: blogAuthor,
        imageUrl: blogImageUrl || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
        content: blogContent,
        publishedAt: selectedPost ? selectedPost.publishedAt : new Date().toISOString(),
        views: selectedPost ? selectedPost.views : 0,
        likes: selectedPost ? selectedPost.likes : 0
      };

      await setDoc(doc(db, "blogs", postId), postData);
      
      setBlogTitle("");
      setBlogSummary("");
      setBlogCategory("Лайфхаки ОСМС");
      setBlogCity("Все");
      setBlogAuthor("MedTariff Аналитика");
      setBlogImageUrl("");
      setBlogContent("");
      setSelectedPost(null);
      
      await loadBlogPosts();
    } catch (err) {
      console.error("Error saving blog post:", err);
    } finally {
      setIsBlogSaving(false);
    }
  };

  const handleEditBlogPost = (post: BlogPost) => {
    setSelectedPost(post);
    setBlogTitle(post.title);
    setBlogSummary(post.summary);
    setBlogCategory(post.category);
    setBlogCity(post.city || "Все");
    setBlogAuthor(post.author || "MedTariff Аналитика");
    setBlogImageUrl(post.imageUrl);
    setBlogContent(post.content);
  };

  const handleDeleteBlogPost = async (postId: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту статью?")) return;
    try {
      await deleteDoc(doc(db, "blogs", postId));
      await loadBlogPosts();
    } catch (err) {
      console.error("Error deleting blog post:", err);
    }
  };

  // load all data from MongoDB
  const loadAllFromMongoDB = useCallback(async () => {
    if (dataLoadedRef.current) return;
    setIsLoadingData(true);
    setLogs(["[СИСТЕМА] Загрузка данных из MongoDB MongoDB..."]);
    try {
      // 1. Load parsed tariffs
      const tariffSnap = await getDocs(collection(db, "parsedTariffs"));
      const tariffs: ScrapedRawItem[] = [];
      tariffSnap.forEach((d) => tariffs.push({ id: d.id, ...d.data() } as ScrapedRawItem));

      // 2. Load parser logs
      const logsSnap = await getDocs(collection(db, "parserErrorLogs"));
      const errLogs: ErrorLog[] = [];
      logsSnap.forEach((d) => errLogs.push({ id: d.id, ...d.data() } as ErrorLog));

      // 3. Load unmatched queue
      const unmSnap = await getDocs(collection(db, "unmatchedQueue"));
      const unm: UnmatchedItem[] = [];
      unmSnap.forEach((d) => unm.push({ id: d.id, ...d.data() } as UnmatchedItem));

      // 4. Load subscriptions
      const subSnap = await getDocs(collection(db, "priceSubscriptions"));
      const subs: PriceSubscription[] = [];
      subSnap.forEach((d) => subs.push({ id: d.id, ...d.data() } as PriceSubscription));

      // 5. Load parsing sources
      const sourcesSnap = await getDocs(collection(db, "parsingSources"));
      const srcList: any[] = [];
      sourcesSnap.forEach((d) => srcList.push({ id: d.id, ...d.data() }));

      // If all collections are empty — seed initial data
      if (tariffs.length === 0 && errLogs.length === 0 && unm.length === 0 && srcList.length === 0) {
        setLogs(prev => [...prev, "[СИСТЕМА] MongoDB коллекции пусты. Создание начальных данных..."]);
        await seedInitialData();
        dataLoadedRef.current = true;
        setIsLoadingData(false);
        return;
      }

      setRawItems(tariffs);
      setErrorLogs(errLogs);
      setUnmatchedQueue(unm);
      setSubscriptions(subs);
      setParsingSources(srcList);

      setLogs(prev => [
        ...prev,
        `[БАЗА ДАННЫХ] Загружено ${tariffs.length} тарифов, ${errLogs.length} логов, ${unm.length} неразмеченных, ${subs.length} подписок, ${srcList.length} источников парсинга.`,
        "[ОЖИДАНИЕ] Парсер готов к запуску."
      ]);

      dataLoadedRef.current = true;
    } catch (err) {
      console.error("MongoDB load error:", err);
      setLogs(prev => [...prev, `[ОШИБКА] Не удалось загрузить данные: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const seedInitialData = async () => {
    const initialTariffs: Omit<ScrapedRawItem, "id">[] = [
      { source: "kdlolymp.kz", rawName: "Общий анализ крови (ОАК) с лейкоцитарной формулой + СОЭ", price: 2250, currency: "KZT", parsedAt: "2026-06-27 10:14", durationDays: 1, city: "Алматы", category: "лаборатория", isActive: true },
      { source: "invitro.kz", rawName: "Общий анализ мочи по Нечипоренко с седиментацией", price: 1400, currency: "KZT", parsedAt: "2026-06-27 09:42", durationDays: 1, city: "Астана", category: "лаборатория", isActive: true },
      { source: "doq.kz", rawName: "Прием кардиолога высшей категории", price: 12000, currency: "KZT", parsedAt: "2026-06-27 11:02", durationDays: 0, city: "Караганда", category: "приём врача", isActive: true },
      { source: "orhun.kz", rawName: "МРТ головного мозга на томографе Philips 1.5 Тесла", price: 19500, currency: "KZT", parsedAt: "2026-06-27 08:15", durationDays: 1, city: "Алматы", category: "диагностика", isActive: true },
      { source: "helix.kz", rawName: "Гликозилированный гемоглобин комплексный тест", price: 3400, currency: "KZT", parsedAt: "2026-06-27 07:30", durationDays: 2, city: "Шымкент", category: "лаборатория", isActive: true },
    ];
    const initialUnmatched: Omit<UnmatchedItem, "id">[] = [
      { source: "invitro.kz", rawName: "CBC-Blood Test (ОАК с тромбоцитами)", price: 2400, category: "лаборатория" },
      { source: "doq.kz", rawName: "Консультация педиатра К.М.Н.", price: 11500, category: "приём врача" },
      { source: "orhun.kz", rawName: "УЗИ сердца и сосудов (кардиовизор)", price: 8000, category: "диагностика" },
    ];
    const initialLogs: Omit<ErrorLog, "id">[] = [
      { source: "helix.kz", timestamp: "2026-06-27 07:30", status: "success", message: "Парсинг HTML завершен успешно. Извлечено 42 позиции." },
      { source: "invitro.kz", timestamp: "2026-06-27 05:44", status: "success", message: "Спарсено 110 анализов. Обновление тарифов в БД." },
    ];
    const initialSources = [
      { id: "kdlolymp", domain: "kdlolymp.kz", name: "КДЛ Олимп", isActive: true },
      { id: "invitro", domain: "invitro.kz", name: "Инвитро", isActive: true },
      { id: "doq", domain: "doq.kz", name: "DOQ.kz", isActive: true },
      { id: "helix", domain: "helix.kz", name: "Helix", isActive: true },
      { id: "orhun", domain: "orhun.kz", name: "Orhun Medical", isActive: true }
    ];

    try {
      const batch = writeBatch(db);
      const newTariffs: ScrapedRawItem[] = [];
      const newUnm: UnmatchedItem[] = [];
      const newLogs: ErrorLog[] = [];
      const newSrcs: any[] = [];

      for (const t of initialTariffs) {
        const ref = doc(collection(db, "parsedTariffs"));
        batch.set(ref, t);
        newTariffs.push({ id: ref.id, ...t });
      }
      for (const u of initialUnmatched) {
        const ref = doc(collection(db, "unmatchedQueue"));
        batch.set(ref, u);
        newUnm.push({ id: ref.id, ...u });
      }
      for (const l of initialLogs) {
        const ref = doc(collection(db, "parserErrorLogs"));
        batch.set(ref, l);
        newLogs.push({ id: ref.id, ...l });
      }
      for (const s of initialSources) {
        const ref = doc(db, "parsingSources", s.id);
        batch.set(ref, s);
        newSrcs.push(s);
      }

      await batch.commit();

      setRawItems(newTariffs);
      setUnmatchedQueue(newUnm);
      setErrorLogs(newLogs);
      setParsingSources(newSrcs);
      setLogs(prev => [
        ...prev,
        `[БАЗА ДАННЫХ] Начальные данные созданы: ${newTariffs.length} тарифов, ${newUnm.length} неразмеченных, ${newLogs.length} логов.`,
        "[ОЖИДАНИЕ] Парсер готов к запуску."
      ]);
    } catch (err) {
      console.error("Seed error:", err);
    }
  };

  useEffect(() => {
    loadAllFromMongoDB();
  }, [loadAllFromMongoDB]);

  const handleSyncToMongoDB = async () => {
    if (rawItems.length === 0) return;
    setIsSyncing(true);
    setLogs(prev => [...prev, "[БАЗА ДАННЫХ] Начало синхронизации сырого слоя с MongoDB..."]);
    
    try {
      let count = 0;
      for (const item of rawItems) {
        const clinicId = `clinic-${item.source.replace(/\./g, "-")}-${item.city.toLowerCase()}`;
        const clinicDocData = {
          id: clinicId,
          name: item.source.replace(".kz", "").toUpperCase(),
          price: item.price,
          address: item.city === "Алматы" ? "ул. Толе би 59, Алматы" : "ул. Кабанбай батыра 42, Астана",
          district: "Медеуский",
          distance: `${(1.2 + (count % 3) * 0.4).toFixed(1)} км`,
          osms: count % 2 === 0,
          updated: new Date().toLocaleDateString("ru-RU"),
          phone: "+7 (701) 777-11-22",
          rating: parseFloat((4.2 + (count % 5) * 0.2).toFixed(1)),
          city: item.city,
          parsedAt: item.parsedAt
        };
        
        await setDoc(doc(db, "clinics", clinicId), clinicDocData);
        count++;
      }
      
      await addDoc(collection(db, "parserLogs"), {
        timestamp: new Date().toISOString(),
        message: `Успешная ручная синхронизация из админки. Импортировано ${count} записей.`,
        recordsSynced: count,
        city: city
      });

      setLogs(prev => [
        ...prev,
        `[БАЗА ДАННЫХ] УСПЕХ: Синхронизировано ${count} клиник в MongoDB!`,
        `[БАЗА ДАННЫХ] Логи парсера сохранены в коллекции /parserLogs.`
      ]);
    } catch (err) {
      console.error("Failed to sync with MongoDB:", err);
      setLogs(prev => [...prev, `[ОШИБКА БАЗЫ] Не удалось выполнить запись: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  const startManualParsing = async () => {
    if (isParsing) return;
    setIsParsing(true);
    setLogs(["[ИНИЦИАЛИЗАЦИЯ] Запуск парсера MedServicePrice через серверный API..."]);
    
    try {
      const activeSources = parsingSources.filter(s => s.isActive !== false);
      const response = await fetch("/api/run-parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, sources: activeSources })
      });
      
      const data = await response.json();
      
      if (data.logs && Array.isArray(data.logs)) {
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise(r => setTimeout(r, 200));
          setLogs(prev => [...prev, data.logs[i]]);
        }
      }

      if (data.items && data.items.length > 0) {
        setLogs(prev => [...prev, "[MongoDB] Сохранение результатов парсинга в MongoDB..."]);
        const batch = writeBatch(db);
        const newItems: ScrapedRawItem[] = [];
        
        for (const item of data.items) {
          const ref = doc(collection(db, "parsedTariffs"));
          const { id, ...itemData } = item;
          batch.set(ref, itemData);
          newItems.push({ ...item, id: ref.id });
        }
        
        await batch.commit();
        setRawItems(prev => [...newItems, ...prev]);
        setLogs(prev => [...prev, `[MongoDB] Сохранено ${newItems.length} записей в коллекцию parsedTariffs.`]);
      }

      if (data.errorLogs && data.errorLogs.length > 0) {
        const logBatch = writeBatch(db);
        const newLogs: ErrorLog[] = [];
        for (const log of data.errorLogs) {
          const ref = doc(collection(db, "parserErrorLogs"));
          const { id, ...logData } = log;
          logBatch.set(ref, logData);
          newLogs.push({ ...log, id: ref.id });
        }
        await logBatch.commit();
        setErrorLogs(prev => [...newLogs, ...prev]);
      }

      setLogs(prev => [...prev, `[УСПЕХ] Парсинг завершен. ${data.items?.length || 0} записей сохранены в MongoDB.`]);
      if (onAddLogMessage) onAddLogMessage("Парсинг успешно завершен!");
    } catch (err) {
      console.error("Parser API error:", err);
      setLogs(prev => [...prev, `[ОШИБКА] Сбой парсера: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleMapUnmatched = async (unmId: string, normId: string) => {
    if (!unmId || !normId) return;
    const unmatched = unmatchedQueue.find(u => u.id === unmId);
    const normalized = services.find(s => s.id === normId);
    if (!unmatched || !normalized) return;

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

    try {
      await deleteDoc(doc(db, "unmatchedQueue", unmId));
    } catch (err) {
      console.error("Failed to delete unmatched item from MongoDB:", err);
    }
    setUnmatchedQueue(prev => prev.filter(u => u.id !== unmId));
    
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    setLogs(prev => [
      ...prev,
      `[РУЧНАЯ РАЗМЕТКА] Связано: "${unmatched.rawName}" -> "${normalized.name}"`
    ]);

    const newRawData = {
      source: unmatched.source,
      rawName: unmatched.rawName,
      price: unmatched.price,
      currency: "KZT",
      parsedAt: nowStr,
      durationDays: 1,
      city: city,
      category: unmatched.category,
      isActive: true
    };

    try {
      const ref = await addDoc(collection(db, "parsedTariffs"), newRawData);
      setRawItems(prev => [{ id: ref.id, ...newRawData }, ...prev]);
    } catch (err) {
      console.error("Failed to add parsed tariff to MongoDB:", err);
      setRawItems(prev => [{ id: `raw-${Date.now()}`, ...newRawData }, ...prev]);
    }

    setSelectedUnmatchedId("");
    setTargetNormalizeServiceId("");
  };

  const handleAddParsingSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceDomain.trim()) return;

    const docId = newSourceDomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newSource = {
      name: newSourceName.trim(),
      domain: newSourceDomain.trim().toLowerCase(),
      isActive: true
    };

    try {
      await setDoc(doc(db, "parsingSources", docId), newSource);
      setParsingSources(prev => [...prev, { id: docId, ...newSource }]);
      setNewSourceName("");
      setNewSourceDomain("");
      setLogs(prev => [...prev, `[ИСТОЧНИКИ] Добавлен новый источник: ${newSource.name} (${newSource.domain})`]);
    } catch (err) {
      console.error("Failed to add parsing source to MongoDB:", err);
      setParsingSources(prev => [...prev, { id: docId, ...newSource }]);
      setNewSourceName("");
      setNewSourceDomain("");
    }
  };

  const handleToggleParsingSource = async (sourceId: string, currentActive: boolean) => {
    const updatedActive = !currentActive;
    try {
      await setDoc(doc(db, "parsingSources", sourceId), {
        isActive: updatedActive
      }, { merge: true });
      
      setParsingSources(prev => prev.map(s => s.id === sourceId ? { ...s, isActive: updatedActive } : s));
      setLogs(prev => [...prev, `[ИСТОЧНИКИ] Источник ${sourceId} ${updatedActive ? "активирован" : "деактивирован"}`]);
    } catch (err) {
      console.error("Failed to toggle parsing source in MongoDB:", err);
      setParsingSources(prev => prev.map(s => s.id === sourceId ? { ...s, isActive: updatedActive } : s));
    }
  };

  const handleDeleteParsingSource = async (sourceId: string) => {
    try {
      await deleteDoc(doc(db, "parsingSources", sourceId));
      setParsingSources(prev => prev.filter(s => s.id !== sourceId));
      setLogs(prev => [...prev, `[ИСТОЧНИКИ] Источник ${sourceId} удален из базы`]);
    } catch (err) {
      console.error("Failed to delete parsing source from MongoDB:", err);
      setParsingSources(prev => prev.filter(s => s.id !== sourceId));
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail.trim()) return;
    
    const newSubData = {
      email: newSubEmail,
      serviceName: newSubService,
      clinicName: newSubClinic,
      targetPrice: parseInt(newSubPrice, 10) || 2000,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    try {
      const ref = await addDoc(collection(db, "priceSubscriptions"), newSubData);
      setSubscriptions(prev => [{ id: ref.id, ...newSubData }, ...prev]);
      setNewSubEmail("");
      setLogs(prev => [...prev, `[ПОДПИСКА] Создана подписка для ${newSubEmail} на ${newSubService} в ${newSubClinic}.`]);
    } catch (err) {
      console.error("Failed to save subscription to MongoDB:", err);
      setSubscriptions(prev => [{ id: `sub-${Date.now()}`, ...newSubData }, ...prev]);
      setNewSubEmail("");
    }
  };

  const filteredCatalog = services.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchCatalog.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchCatalog.toLowerCase()) ||
                          item.synonyms.some(s => s.toLowerCase().includes(searchCatalog.toLowerCase()));
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f7fc] font-sans text-slate-800 w-full text-left antialiased">
      
      {/* 1. FLOATING LEFT SIDEBAR PANEL — Beautiful light ice-blue card with slate-blue icons */}
      <div className="w-80 shrink-0 p-5 flex">
        <aside className="flex-1 bg-white rounded-3xl flex flex-col justify-between overflow-y-auto no-scrollbar border border-blue-100/80 shadow-md">
          
          {/* Top portion: Logo + Nav */}
          <div className="p-6 space-y-8">

            {/* Logo Brand Header */}
            <div className="flex items-center gap-3 select-none">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                {/* Vertical bar — saturated blue */}
                <div className="absolute w-[10px] h-10 bg-blue-800 rounded-md shadow-sm"></div>
                {/* Horizontal bar — translucent sky blue */}
                <div className="absolute w-10 h-[10px] bg-sky-400/80 rounded-md mix-blend-multiply"></div>
                {/* AI dots network intersection */}
                <div className="absolute w-2.5 h-2.5 bg-blue-900 rounded-full flex items-center justify-center opacity-60">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="leading-none">
                <span className="text-[17px] font-black tracking-tight text-slate-900">Med<span className="text-blue-600">Tariff</span></span>
                <span className="block text-[8px] font-extrabold uppercase tracking-[0.18em] text-blue-500 mt-1">Панель Управления</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {[
                { id: "parser", label: "Автоматический Парсер", icon: Database },
                { id: "catalog", label: "Справочник Услуг", icon: ListFilter },
                { id: "unmatched", label: "Очередь Разметки", icon: AlertTriangle, count: unmatchedQueue.length },
                { id: "alerts", label: "Подписки на Тарифы", icon: Bell, count: subscriptions.length },
                { id: "blog", label: "Дайджест & CMS", icon: Sparkles }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSubTab(item.id as any);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold tracking-wide transition-all duration-300 cursor-pointer group ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10 border-t border-blue-400/20" 
                        : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive ? "bg-white/20" : "bg-slate-100 border border-slate-200/40 group-hover:bg-blue-100/50"
                      }`}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"}`} />
                      </div>
                      <span className={`font-semibold text-[11.5px] transition-colors duration-200 ${isActive ? "text-white" : "text-slate-650 group-hover:text-slate-900"}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[9px] font-black min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center ${
                        isActive ? "bg-white/25 text-white" : "bg-blue-500 text-white"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Card — Quick link to client part */}
          <div className="p-5">
            <div className="relative bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-3xl p-5 overflow-hidden">
              <div className="flex items-center gap-3.5 mb-3 relative z-10">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">MedTariff.kz</p>
                  <p className="text-[9px] text-blue-500 font-semibold mt-1">Клиентская часть</p>
                </div>
              </div>

              <p className="text-[9px] text-slate-500 font-medium leading-relaxed mb-4 relative z-10">
                Вернитесь к основному B2C поиску тарифов в один клик.
              </p>

              <a
                href="/"
                className="relative z-10 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <span>Открыть поиск</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc]">
        
        {/* Top Header Row — translucent glassmorphism */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-blue-50/80 py-5 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Панель управления MedTariff
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Администратор системы • Модуль контроля и нормализации цен РК
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* City Selector */}
            <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-2xl px-4 py-2 shrink-0 shadow-xs">
              <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider">Город:</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-bold outline-none border-none cursor-pointer pr-1"
              >
                <option value="Алматы">Алматы</option>
                <option value="Астана">Астана</option>
                <option value="Шымкент">Шымкент</option>
                <option value="Караганда">Караганда</option>
                <option value="Усть-Каменогорск">Усть-Каменогорск</option>
              </select>
            </div>

            {/* Search filter in header */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по панели..."
                className="bg-slate-50 border border-slate-200/60 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium w-64 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs ring-2 ring-blue-100 shadow-md">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Panels */}
        <div className="p-8 space-y-6 flex-1">
          
          {/* Top Row KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { label: "Спарсено тарифов", val: rawItems.length, unit: "строк", detail: "Сырой слой Raw Layer", accent: "bg-blue-500 shadow-blue-500/20", text: "text-blue-600" },
              { label: "Справочник услуг", val: services.length, unit: "позиций", detail: "Классификатор МЗ РК", accent: "bg-sky-500 shadow-sky-500/20", text: "text-sky-600" },
              { label: "Очередь разметки", val: unmatchedQueue.length, unit: "записей", detail: "Требуют нормализации", accent: unmatchedQueue.length > 0 ? "bg-rose-500 shadow-rose-500/20" : "bg-slate-400 shadow-slate-400/20", text: unmatchedQueue.length > 0 ? "text-rose-600" : "text-slate-500" },
              { label: "Активные подписки", val: subscriptions.length, unit: "пользователей", detail: "Email / SMS оповещения", accent: "bg-emerald-500 shadow-emerald-500/20", text: "text-emerald-600" }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-blue-50/80 p-5 text-left flex flex-col gap-2 hover:border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${kpi.accent} shadow-md`}></div>
                </div>
                <h3 className={`text-2xl font-black ${kpi.text}`}>
                  {kpi.val} <span className="text-xs text-slate-400 font-semibold">{kpi.unit}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">{kpi.detail}</p>
              </div>
            ))}
          </div>

          {/* TAB SUB 2: AUTOMATED CRAWLER & ERROR LOGS */}
          {activeSubTab === "parser" && (
            <div className="space-y-6">
              
              {/* Parser Controller */}
              <div className="bg-white p-6 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Автоматический парсинг и сбор данных</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Headless парсер сайтов медицинских клиник РК</p>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={startManualParsing}
                      disabled={isParsing || isSyncing}
                      className={`px-4 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition duration-300 cursor-pointer shadow-sm ${
                        isParsing 
                          ? "bg-slate-100 text-slate-400 border border-slate-200/50" 
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                      }`}
                    >
                      {isParsing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isParsing ? "Выполняется..." : "Запуск вручную"}</span>
                    </button>

                    <button
                      onClick={handleSyncToMongoDB}
                      disabled={isParsing || isSyncing || rawItems.length === 0}
                      className={`px-4 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition duration-300 cursor-pointer border border-blue-100 shadow-sm ${
                        isSyncing
                          ? "bg-slate-100 text-slate-400"
                          : rawItems.length === 0
                          ? "bg-slate-50 text-slate-350 cursor-not-allowed border-transparent"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                      }`}
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      <span>{isSyncing ? "Синхронизация..." : "Синхронизировать с MongoDB"}</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Cyber Terminal */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner space-y-1.5 max-h-56 overflow-y-auto font-mono text-[10px] text-emerald-400 select-all">
                  <div className="flex items-center gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2 shrink-0">
                    <Terminal className="w-4 h-4" />
                    <span className="font-black uppercase tracking-wider">MedServicePrice Headless Crawler Shell v1.0.4</span>
                  </div>
                  {logs.map((log, idx) => {
                    if (!log) return null;
                    let color = "text-emerald-400";
                    if (log.includes("[СИСТЕМА]")) color = "text-blue-300";
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

              {/* Parsing Sources Manager */}
              <div className="bg-white p-6 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Источники парсинга цен</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Управление медицинскими клиниками и порталами сбора тарифов</p>
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                    {parsingSources.length} источников
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {parsingSources.map((src) => (
                    <div key={src.id} className="p-4 rounded-2xl border border-blue-50/50 bg-[#fbfdff] hover:bg-blue-50/20 transition flex items-center justify-between gap-3 text-left">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${src.isActive !== false ? "bg-emerald-500 shadow-sm" : "bg-slate-300"}`} />
                          <h4 className="font-extrabold text-[12px] text-slate-800 truncate" title={src.name}>{src.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5 font-mono">{src.domain}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleParsingSource(src.id, src.isActive !== false)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            src.isActive !== false
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : "bg-slate-100 border-slate-200/60 text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteParsingSource(src.id)}
                          className="p-1.5 rounded-lg border border-rose-100 text-rose-500 bg-rose-50/30 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add parsing source inline form */}
                <form onSubmit={handleAddParsingSource} className="bg-[#fbfdff] border border-blue-50 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Название источника / клиники</label>
                    <input
                      type="text"
                      placeholder="Например: Керуен-Med"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 font-semibold text-slate-700"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Доменное имя (domain)</label>
                    <input
                      type="text"
                      placeholder="Например: keruen.kz"
                      value={newSourceDomain}
                      onChange={(e) => setNewSourceDomain(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 font-semibold text-slate-700"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 inline" />
                    <span>Добавить источник</span>
                  </button>
                </form>
              </div>

              {/* Error logging Audit log */}
              <div className="bg-white p-5 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Журнал Ошибок Парсера (Audit Log)</h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {errorLogs.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-2xl border text-xs font-medium flex gap-3 items-start ${
                        item.status === "error" 
                          ? "bg-rose-50 border-rose-100 text-rose-800" 
                          : item.status === "warning" 
                          ? "bg-amber-50 border-amber-100 text-amber-800" 
                          : "bg-emerald-50 border-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.status === "error" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : item.status === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex gap-2.5 items-center">
                          <strong className="text-[10.5px] uppercase tracking-wide font-black">{item.source}</strong>
                          <span className="text-[8.5px] text-slate-400 font-bold">{item.timestamp}</span>
                        </div>
                        <p className="leading-tight text-slate-600 font-semibold">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Database layer table */}
              <div className="bg-white p-5 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Сырой Слой Данных (Raw Layer Table)</h3>
                    <p className="text-[9.5px] text-slate-400 font-bold mt-0.5">Временное хранение необработанных прайсов клиник РК (до 90 дней)</p>
                  </div>
                  <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
                    {rawItems.length} строк
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white max-h-[450px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[10px] font-semibold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider text-[8px] font-black">
                        <th className="p-3">Источник</th>
                        <th className="p-3">Название (Raw)</th>
                        <th className="p-3 text-right">Тариф</th>
                        <th className="p-3">Время сбора</th>
                        <th className="p-3 text-center">Срок (дн)</th>
                        <th className="p-3">Город</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {rawItems.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition duration-200">
                          <td className="p-3 font-bold text-blue-600 font-mono">{item.source}</td>
                          <td className="p-3 truncate max-w-[200px] text-slate-800" title={item.rawName}>{item.rawName}</td>
                          <td className="p-3 text-right font-black text-slate-900 font-mono">{item.price.toLocaleString()} {item.currency}</td>
                          <td className="p-3 text-slate-400 font-mono">{item.parsedAt}</td>
                          <td className="p-3 text-center font-mono">{item.durationDays}</td>
                          <td className="p-3">{item.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB SUB 3: SERVICES DIRECTORY CATALOG */}
          {activeSubTab === "catalog" && (
            <div className="space-y-6">
              
              {/* Search and control */}
              <div className="bg-white p-5 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Единый справочник нормализованных услуг</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Официальный классификатор тарифов РК. Содержит стандартизированный код МЗ РК, имя услуги и ключевые слова (синонимы) для автоматического маппинга и поиска.
                </p>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Поиск по классификатору (Код, Название, ТТГ, ОАК...)"
                      value={searchCatalog}
                      onChange={(e) => setSearchCatalog(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs outline-none focus:border-blue-500 font-semibold transition"
                    />
                  </div>
                  
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 transition cursor-pointer text-slate-600"
                  >
                    <option value="all">Все категории</option>
                    <option value="лаборатория">Лаборатория</option>
                    <option value="приём врача">Приём врача</option>
                    <option value="диагностика">Диагностика</option>
                    <option value="процедура">Процедура</option>
                  </select>
                </div>
              </div>

              {/* Catalog list grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 text-left">
                {filteredCatalog.length === 0 ? (
                  <div className="col-span-2 p-10 text-center bg-white border border-slate-100 rounded-3xl text-slate-400 font-bold text-xs shadow-xs">
                    Ничего не найдено в справочнике
                  </div>
                ) : (
                  filteredCatalog.map((service) => (
                    <div key={service.id} className="bg-white p-5 rounded-3xl border border-blue-50/80 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between gap-4 shadow-xs">
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8.5px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono">
                            Код: {service.code}
                          </span>
                          <span className="text-[8.5px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                            {service.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-[13px] text-slate-800 leading-snug">{service.name}</h4>
                      </div>

                      {/* Synonyms */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-100">
                        <span className="text-[8.5px] text-slate-450 font-bold uppercase tracking-wider block">Синонимы (Теги ИИ-сопоставления):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {service.synonyms.map((syn, sidx) => (
                            <span key={sidx} className="bg-slate-50 border border-slate-100 text-slate-650 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-[#fcfdfe] p-2.5 rounded-xl border border-blue-50">
                        <span>Ориентировочная базовая цена РК:</span>
                        <strong className="text-blue-600 text-xs font-black font-mono">~ {service.basePrice.toLocaleString()} ₸</strong>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB SUB 4: UNMATCHED QUEUE MAPPING */}
          {activeSubTab === "unmatched" && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-3xl border border-blue-50/80 space-y-2 text-left shadow-xs">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Очередь ручной и ИИ разметки</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Нераспознанные парсером сырые строки услуг из прайсов клиник. Выберите элемент слева, чтобы привязать его к справочнику МЗ РК вручную или с помощью умных ИИ-предложений.
                </p>
              </div>

              {unmatchedQueue.length === 0 ? (
                <div className="p-16 text-center bg-white border border-blue-50/85 rounded-3xl text-blue-600 font-black text-xs space-y-3 shadow-md">
                  <CheckCircle className="w-10 h-10 mx-auto text-blue-500" />
                  <p className="uppercase tracking-wider">Все данные нормализованы!</p>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xs mx-auto">Очередь разметки пуста. Каждому тарифу в агрегаторе сопоставлен соответствующий код МЗ РК.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  
                  {/* Left Column: Raw unmatched items */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">Нераспознанные строки тарифов ({unmatchedQueue.length})</span>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {unmatchedQueue.map((item) => {
                        const isSelected = selectedUnmatchedId === item.id || (!selectedUnmatchedId && unmatchedQueue[0].id === item.id);
                        return (
                          <div 
                            key={item.id}
                            onClick={() => {
                              setSelectedUnmatchedId(item.id);
                              setTargetNormalizeServiceId("");
                            }}
                            className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer relative shadow-xs ${
                              isSelected
                                ? "bg-blue-50/30 border-blue-500 shadow-md ring-1 ring-blue-100"
                                : "bg-white border-blue-50 hover:border-blue-100"
                            }`}
                          >
                            <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">Ожидает сопоставления</span>
                            <h4 className="font-sans font-black text-xs text-slate-800 leading-snug mt-2">"{item.rawName}"</h4>

                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-t border-slate-100 mt-3 pt-2.5">
                              <span>Источник: {item.source} • {item.category}</span>
                              <strong className="text-blue-600 font-black font-mono">{item.price.toLocaleString()} ₸</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: AI Match Recommendations */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">ИИ-ассистент маппинга (Gemini / Qwen)</span>
                    
                    {(() => {
                      const activeItem = unmatchedQueue.find(u => u.id === selectedUnmatchedId) || unmatchedQueue[0];
                      if (!activeItem) return null;

                      // Simulated matching scores
                      const rawLower = activeItem.rawName.toLowerCase();
                      const suggestions = services
                        .filter(s => s.category === activeItem.category)
                        .map(s => {
                          let confidence = 15;
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
                        <div className="bg-white p-5 rounded-3xl border border-blue-50/80 space-y-5 shadow-xs">
                          
                          <div>
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Выбранный элемент прайс-листа:</span>
                            <h4 className="font-extrabold text-slate-800 text-xs mt-1 leading-snug">"{activeItem.rawName}"</h4>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                              Провайдер: <span className="font-bold text-slate-700">{activeItem.source}</span> • Тариф: <span className="font-black text-blue-600 font-mono">{activeItem.price.toLocaleString()} ₸</span>
                            </span>
                          </div>

                          {/* Suggestions list */}
                          <div className="space-y-3">
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">ИИ-рекомендации по кодам МЗ РК:</span>
                            
                            {suggestions.map(({ service, confidence }) => (
                              <div key={service.id} className="border border-blue-50/60 rounded-2xl p-4 bg-slate-50 hover:bg-blue-50/20 transition flex items-center justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono">
                                      Код: {service.code}
                                    </span>
                                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      confidence >= 80 
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                        : confidence >= 50 
                                        ? "bg-amber-50 text-amber-600 border-amber-100" 
                                        : "bg-rose-50 text-rose-600 border-rose-100"
                                    }`}>
                                      {confidence}% Уверенность
                                    </span>
                                  </div>
                                  <h5 className="font-sans font-black text-[12px] text-slate-800 leading-snug truncate">{service.name}</h5>
                                </div>

                                <button
                                  onClick={() => handleMapUnmatched(activeItem.id, service.id)}
                                  className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
                                >
                                  Связать
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Manual override selection */}
                          <div className="pt-4 border-t border-slate-100 space-y-2">
                            <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Ручной маппинг в справочник:</label>
                            <div className="flex gap-2">
                              <select 
                                value={targetNormalizeServiceId}
                                onChange={(e) => setTargetNormalizeServiceId(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-slate-700 cursor-pointer"
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
                                className={`px-4 py-2 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition shrink-0 cursor-pointer ${
                                  targetNormalizeServiceId ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-100 text-slate-350 cursor-not-allowed"
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

          {/* TAB SUB 5: PRICE SUBSCRIPTIONS ALERTS */}
          {activeSubTab === "alerts" && (
            <div className="bg-white p-6 rounded-3xl border border-blue-50/80 space-y-4 text-left shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Подписки на снижение цен (Мониторинг)</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Активные оповещения пользователей веб/мобильного приложения при достижении целевых тарифов</p>
                </div>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                  {subscriptions.length} подписок
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {subscriptions.length === 0 ? (
                  <div className="col-span-2 py-12 text-center bg-slate-50 border border-slate-100 rounded-3xl text-slate-400 font-bold text-xs">
                    Нет активных подписок пользователей в БД
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-blue-50/40 flex justify-between items-start gap-3 hover:border-blue-100 transition duration-200">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex gap-2 items-center">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-extrabold text-[12px] text-slate-700 truncate">{sub.email}</span>
                        </div>
                        
                        <p className="text-[12px] text-slate-800 font-bold leading-tight truncate">
                          {sub.serviceName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono">Клиника: <span className="text-slate-750 font-bold">{sub.clinicName}</span> • {sub.createdAt}</p>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end justify-between gap-3">
                        <div>
                          <span className="text-[8.5px] text-slate-400 block uppercase font-black">Порог цены</span>
                          <strong className="text-emerald-600 text-xs font-black font-mono">{sub.targetPrice.toLocaleString()} ₸</strong>
                        </div>
                        
                        <button
                          onClick={async () => {
                            try {
                              await deleteDoc(doc(db, "priceSubscriptions", sub.id));
                              setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
                            } catch (e) {
                              setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100/50 text-rose-600 rounded-lg border border-rose-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB SUB 6: CMS BLOGS CMS */}
          {activeSubTab === "blog" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              
              {/* Left Column: Grid list of posts */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-blue-50/80 flex justify-between items-center shadow-xs">
                  <div>
                    <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Публикации в блоге</h3>
                    <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Медицинский дайджест MedTariff.kz</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedPost(null);
                      setBlogTitle("");
                      setBlogSummary("");
                      setBlogCategory("Лайфхаки ОСМС");
                      setBlogCity("Все");
                      setBlogAuthor("MedTariff Аналитика");
                      setBlogImageUrl("");
                      setBlogContent("");
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Новая статья</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {blogPosts.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl text-slate-400 font-bold text-xs shadow-xs">
                      <BookOpen className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                      <p>В блоге пока нет статей</p>
                    </div>
                  ) : (
                    blogPosts.map((post) => (
                      <div 
                        key={post.id}
                        className={`bg-white rounded-3xl border p-4 shadow-xs transition-all duration-300 flex flex-col gap-3 hover:border-blue-100 ${
                          selectedPost?.id === post.id ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-50/60"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">
                              {post.category}
                            </span>
                            <h4 className="font-extrabold text-[12.5px] text-slate-800 leading-snug truncate mt-1">{post.title}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal mt-0.5">{post.summary}</p>
                          </div>
                          
                          {post.imageUrl && (
                            <img 
                              src={post.imageUrl} 
                              alt={post.title} 
                              className="w-14 h-14 object-cover rounded-2xl border border-blue-50 shrink-0" 
                            />
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                          <div className="flex items-center gap-3 font-mono">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likes || 0}</span>
                            {post.city && post.city !== "Все" && (
                              <span className="bg-rose-50 text-rose-600 text-[8.5px] font-black px-1.5 py-0.2 rounded border border-rose-100">
                                {post.city}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditBlogPost(post)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg border border-slate-200/60 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBlogPost(post.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Edit / Create Post */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-blue-50/80 space-y-4 shadow-xs">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>{selectedPost ? "Редактирование публикации" : "Создать публикацию"}</span>
                </h3>

                <form onSubmit={handleSaveBlogPost} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Заголовок статьи</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Например: Поликлиники Астаны — как пройти врачей быстрее"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Краткое лид-описание</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Краткое интригующее содержание для превью..."
                      value={blogSummary}
                      onChange={(e) => setBlogSummary(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] outline-none focus:border-blue-500 text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Категория</label>
                      <select
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-bold outline-none focus:border-blue-500 text-slate-650 cursor-pointer"
                      >
                        <option value="Лайфхаки ОСМС">Лайфхаки ОСМС</option>
                        <option value="Права пациентов">Права пациентов</option>
                        <option value="Анализ цен">Анализ цен</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Город таргетирования</label>
                      <select
                        value={blogCity}
                        onChange={(e) => setBlogCity(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-bold outline-none focus:border-blue-500 text-slate-650 cursor-pointer"
                      >
                        <option value="Все">Все города</option>
                        <option value="Алматы">Алматы</option>
                        <option value="Астана">Астана</option>
                        <option value="Караганда">Караганда</option>
                        <option value="Шымкент">Шымкент</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Автор статьи</label>
                      <input 
                        type="text" 
                        required
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:border-blue-500 text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Ссылка на изображение обложки</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="https://images.unsplash.com/..."
                        value={blogImageUrl}
                        onChange={(e) => setBlogImageUrl(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-700"
                      />
                      
                      <label className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer active:scale-95 text-slate-700">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Загрузить</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setBlogImageUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleGenerateCover}
                        disabled={isGeneratingCover || !blogTitle.trim()}
                        className={`px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition border cursor-pointer ${
                          isGeneratingCover 
                            ? "bg-slate-100 text-slate-400 border-slate-200" 
                            : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-md active:scale-95"
                        }`}
                      >
                        {isGeneratingCover ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>AI Обложка</span>
                      </button>
                    </div>
                  </div>

                  {blogImageUrl && (
                    <img 
                      src={blogImageUrl} 
                      alt="Обложка превью" 
                      className="w-full h-40 object-cover rounded-2xl border border-blue-100 animate-fade-in" 
                    />
                  )}

                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-400 font-black uppercase tracking-wider block pl-1">Тело статьи</label>
                    <textarea 
                      required
                      rows={8}
                      placeholder="Напишите text вашей статьи здесь..."
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-700 leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={isBlogSaving}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-300 shadow-md cursor-pointer active:scale-98"
                    >
                      {isBlogSaving ? "Сохранение..." : "Сохранить статью"}
                    </button>
                    
                    {selectedPost && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPost(null);
                          setBlogTitle("");
                          setBlogSummary("");
                          setBlogCategory("Лайфхаки ОСМС");
                          setBlogCity("Все");
                          setBlogAuthor("MedTariff Аналитика");
                          setBlogImageUrl("");
                          setBlogContent("");
                        }}
                        className="px-4 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-650 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition active:scale-98"
                      >
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
