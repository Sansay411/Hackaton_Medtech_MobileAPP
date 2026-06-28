import React, { useState, useEffect } from "react";
import { MapPin, Search, Phone, ArrowRight, Chrome, CheckCircle2, ShieldCheck, ChevronLeft, Sparkles, Check } from "lucide-react";
import { auth, googleProvider, signInWithPopup, db, doc, setDoc, handleMongoDBError, OperationType } from "../lib/dbBridge";
import Logo from "./Logo";
import { OnboardingState } from "../types";

const KAZAKH_CITIES = [
  { name: "Алматы", region: "Almaty", code: "ALA", desc: "Южная столица, крупнейший мегаполис" },
  { name: "Астана", region: "Astana", code: "TSE", desc: "Столица Казахстана, административный центр" },
  { name: "Шымкент", region: "Shymkent", code: "CIT", desc: "Мегаполис на юге, индустриальный хаб" },
  { name: "Караганда", region: "Karaganda", code: "KGF", desc: "Центральный Казахстан, шахтерская столица" },
  { name: "Актобе", region: "Aktobe", code: "AKX", desc: "Западный Казахстан, промышленный центр" },
  { name: "Павлодар", region: "Pavlodar", code: "PWQ", desc: "Северный Казахстан, научный и технический узел" },
];

const INTENT_CATEGORIES = [
  { id: "lab", label: "Лаборатория", desc: "Анализы крови, ПЦР-тесты, биохимия, гормоны" },
  { id: "diag", label: "Диагностика", desc: "УЗИ, МРТ, КТ, Рентген, ЭКГ, Флюорография" },
  { id: "consult", label: "Приём врача", desc: "Терапевты, педиатры, гинекологи, узкие специалисты" },
  { id: "proc", label: "Процедуры", desc: "Капельницы, уколы, перевязки, физиотерапия" },
];

const ALL_SERVICES = [
  { category: "Лаборатория", name: "ПЦР тест на COVID-19", popular: true },
  { category: "Лаборатория", name: "Общий анализ крови (ОАК)", popular: true },
  { category: "Лаборатория", name: "Биохимический анализ крови", popular: false },
  { category: "Лаборатория", name: "Анализ на витамин D3", popular: false },
  { category: "Лаборатория", name: "Анализ на гормоны щитовидной железы", popular: false },
  { category: "Лаборатория", name: "Общий анализ мочи", popular: false },
  
  { category: "Диагностика", name: "МРТ головного мозга", popular: true },
  { category: "Диагностика", name: "УЗИ брюшной полости", popular: true },
  { category: "Диагностика", name: "КТ легких", popular: false },
  { category: "Диагностика", name: "Рентген грудной клетки", popular: false },
  { category: "Диагностика", name: "ЭКГ (Электрокардиограмма)", popular: false },
  { category: "Диагностика", name: "Флюорография", popular: false },
  
  { category: "Приём врача", name: "Прием терапевта", popular: true },
  { category: "Приём врача", name: "Прием педиатра", popular: false },
  { category: "Приём врача", name: "Консультация кардиолога", popular: false },
  { category: "Приём врача", name: "Прием гинеколога", popular: false },
  { category: "Приём врача", name: "Консультация невропатолога", popular: false },
  { category: "Приём врача", name: "Прием хирурга", popular: false },
  
  { category: "Процедуры", name: "Внутривенная капельница", popular: true },
  { category: "Процедуры", name: "Внутримышечный укол", popular: false },
  { category: "Процедуры", name: "Перевязка ран", popular: false },
  { category: "Процедуры", name: "Физиотерапия (УВЧ)", popular: false },
  { category: "Процедуры", name: "Ингаляция", popular: false }
];

interface OnboardingProps {
  onComplete: (state: OnboardingState & { userEmail?: string; userName?: string }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<"welcome" | "city" | "intent" | "auth">("welcome");
  const [selectedCity, setSelectedCity] = useState("Алматы");
  const [selectedIntent, setSelectedIntent] = useState("Лаборатория");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Interactive search & autocomplete states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof ALL_SERVICES>([]);

  // Update suggestions based on category selection and search query input
  useEffect(() => {
    let result = ALL_SERVICES;
    
    // If a category is selected, filter suggestions to that category
    if (activeCategory) {
      result = result.filter(item => item.category === activeCategory);
    }
    
    // If search keyword is typed, filter suggestions
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.category.toLowerCase().includes(term)
      );
    } else if (!activeCategory) {
      // If nothing is selected and search is empty, show default popular items
      result = result.filter(item => item.popular);
    }
    
    setFilteredSuggestions(result);
  }, [searchTerm, activeCategory]);

  // MongoDB auth state
  const [MongoDBUser, setMongoDBUser] = useState<any>(null);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setStep("intent");
  };

  const handleIntentSelect = (intent: string) => {
    setSelectedIntent(intent);
    setStep("auth");
  };

  // Handle Google Sign-in with MongoDB
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setMongoDBUser(user);
      
      // Save initial user profile info
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          city: selectedCity,
          intent: selectedIntent,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      } catch (dbErr) {
        console.error("Failed to write user profile to MongoDB:", dbErr);
        handleMongoDBError(dbErr, OperationType.UPDATE, `users/${user.uid}`);
      }

    } catch (err: any) {
      console.error("MongoDB Google Sign-in failed:", err);
      setErrorMsg("Ошибка авторизации Google. Пожалуйста, попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    let formatted = "+7 (";
    if (cleaned.length > 1) {
      formatted += cleaned.substring(1, 4);
    } else {
      formatted += cleaned;
    }
    if (cleaned.length >= 5) {
      formatted += ") " + cleaned.substring(4, 7);
    }
    if (cleaned.length >= 8) {
      formatted += "-" + cleaned.substring(7, 9);
    }
    if (cleaned.length >= 10) {
      formatted += "-" + cleaned.substring(9, 11);
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const rawNum = input.replace(/\D/g, "");
    if (rawNum.length <= 11) {
      setPhoneNumber(formatPhoneNumber(input));
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 18) {
      setErrorMsg("Пожалуйста, введите корректный номер телефона +7 (7XX) XXX-XX-XX");
      return;
    }

    setIsLoading(true);
    const finalUser = MongoDBUser || { uid: "anon-" + Date.now(), displayName: "Гость", email: "guest@medtariff.kz" };
    try {
      await setDoc(doc(db, "users", finalUser.uid), {
        uid: finalUser.uid,
        email: finalUser.email,
        displayName: finalUser.displayName,
        phoneNumber: phoneNumber,
        city: selectedCity,
        intent: selectedIntent,
        onboardedAt: new Date().toISOString(),
      }, { merge: true });

      onComplete({
        city: selectedCity,
        intent: selectedIntent,
        phone: phoneNumber,
        isCompleted: true,
        userEmail: finalUser.email,
        userName: finalUser.displayName,
      });
    } catch (err) {
      console.error("Failed to write onboarding record to MongoDB:", err);
      try {
        handleMongoDBError(err, OperationType.UPDATE, `users/${finalUser.uid}`);
      } catch (MongoDBError) {
        // Fallback completion so guest usage isn't blocked even if rules or network fails
        onComplete({
          city: selectedCity,
          intent: selectedIntent,
          phone: phoneNumber,
          isCompleted: true,
          userName: "Пользователь",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const skipRegistration = () => {
    const mockPhone = "+7 (777) 777-77-77";
    onComplete({
      city: selectedCity,
      intent: selectedIntent,
      phone: mockPhone,
      isCompleted: true,
      userName: MongoDBUser ? MongoDBUser.displayName : "Гость",
      userEmail: MongoDBUser ? MongoDBUser.email : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[94vw] md:max-w-3xl bg-white border border-slate-200 shadow-2xl rounded-2xl md:rounded-[40px] overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[600px] my-auto">
        
        {/* Left branding panel */}
        <div className="hidden md:flex md:w-5/12 bg-slate-950 p-8 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="absolute inset-0 bg-radial-gradient from-blue-600/20 via-transparent to-transparent opacity-60" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <Logo className="text-white brightness-200" size="lg" />
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-sans font-black tracking-tight text-white leading-tight">
                Экономия на медицине — это реальность
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Интеллектуальный мониторинг MedTariff собирает и анализирует цены на анализы, УЗИ, МРТ и приемы врачей по всему Казахстану.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">
                  Поддержка ОСМС
                </span>
                <span className="text-xs text-slate-300 block">
                  Индикация бесплатных услуг
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right workspace form */}
        <div className="w-full md:w-7/12 p-5 md:p-8 flex flex-col justify-between bg-white overflow-y-auto max-h-[85vh] md:max-h-none">
          
          {/* Welcome Screen Option */}
          {step === "welcome" && (
            <div className="flex-1 flex flex-col justify-between py-1 text-center">
              {/* Serious Clean Branding */}
              <div className="flex flex-col items-center justify-center py-6 mb-4">
                <Logo className="text-blue-600 mb-4 scale-110" size="lg" />
              </div>

              {/* Text content block */}
              <div className="space-y-2 px-1 mb-3">
                <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 tracking-tight leading-snug">
                  Добро пожаловать в MedTariff
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  MedTariff позволяет легко находить лучшие цены на анализы, МРТ, УЗИ и приёмы врачей, сверять их по ОСМС и строить маршруты до клиник за несколько коротких шагов.
                </p>
              </div>

              {/* Page indicators */}
              <div className="flex justify-center gap-1.5 my-3 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 transition-all" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 transition-all" />
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={() => setStep("city")}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer touch-manipulation min-h-[44px]"
              >
                Начать обучение
              </button>
            </div>
          )}

          {/* Step indicators & Back Button */}
          {step !== "welcome" && (
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (step === "city") setStep("welcome");
                    if (step === "intent") setStep("city");
                    if (step === "auth") setStep("intent");
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition mr-1 cursor-pointer flex items-center justify-center min-h-[32px] min-w-[32px]"
                  title="Назад"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  {step === "city" && "Локация • Шаг 1 из 3"}
                  {step === "intent" && "Услуги • Шаг 2 из 3"}
                  {step === "auth" && "Профиль • Шаг 3 из 3"}
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className={`w-5 h-1.5 rounded-full transition-all ${step === "city" ? "bg-blue-600" : "bg-slate-200"}`} />
                <div className={`w-5 h-1.5 rounded-full transition-all ${step === "intent" ? "bg-blue-600" : "bg-slate-200"}`} />
                <div className={`w-5 h-1.5 rounded-full transition-all ${step === "auth" ? "bg-blue-600" : "bg-slate-200"}`} />
              </div>
            </div>
          )}

          {/* STEP A: CITY SELECTOR */}
          {step === "city" && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mb-1.5">
                Укажите ваш город
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
                Мы подберем локальные цены, адреса медицинских центров и рассчитаем дальность проезда.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] sm:max-h-[280px] overflow-y-auto pr-1">
                {KAZAKH_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleCitySelect(city.name)}
                    className="flex flex-col items-start p-2.5 sm:p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition text-left group min-h-[48px]"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-blue-900">
                        {city.name}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono leading-tight">
                      {city.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP B: INTENT CATEGORIES & INTERACTIVE SEARCH */}
          {step === "intent" && (
            <div className="flex-1 flex flex-col justify-center py-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mb-1">
                Какая услуга интересует?
              </h2>
              <p className="text-xs text-slate-500 mb-4 leading-normal">
                Начните вводить название услуги или воспользуйтесь быстрыми фильтрами категорий ниже.
              </p>

              {/* Centered Search Input Component */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchTerm.trim()) {
                    handleIntentSelect(searchTerm.trim());
                  }
                }}
                className="relative mb-3.5 shrink-0"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 w-4.5 h-4.5 text-blue-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Например: ПЦР, МРТ, УЗИ, приём терапевта..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10.5 pr-20 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all shadow-sm"
                  />
                  
                  {/* Action or Clear Buttons inside search input bar */}
                  <div className="absolute right-1.5 flex items-center gap-1">
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-1 font-bold transition cursor-pointer"
                      >
                        Очистить
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!searchTerm.trim()}
                      className={`p-1.5 rounded-lg transition-all ${
                        searchTerm.trim() 
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer" 
                          : "bg-slate-100 text-slate-300 pointer-events-none"
                      }`}
                      title="Продолжить"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Quick-Chip Category Filters */}
              <div className="mb-4 shrink-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Быстрые категории
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INTENT_CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.label;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(isSelected ? null : cat.label)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md border border-blue-600 scale-102"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Autocomplete Suggestions Panel */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 border border-slate-200/60 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-2 shrink-0 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {searchTerm.trim() || activeCategory ? "Найдено услуг" : "Популярные запросы"}
                  </span>
                  {activeCategory && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider transition cursor-pointer"
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[160px] sm:max-h-[200px] space-y-1.5 pr-1 no-scrollbar">
                  {filteredSuggestions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Sparkles className="w-5 h-5 text-slate-300 mx-auto mb-1.5 animate-pulse" />
                      <p className="text-[11px] font-bold text-slate-600">Нет точных совпадений</p>
                      <p className="text-[9px] mt-0.5">Нажмите стрелку в строке поиска, чтобы искать "{searchTerm}"</p>
                    </div>
                  ) : (
                    filteredSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleIntentSelect(item.name)}
                        className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-blue-50/55 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group min-h-[44px] cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 bg-slate-50 group-hover:bg-blue-100/60 text-slate-400 group-hover:text-blue-600 rounded-lg shrink-0 transition-all duration-200">
                            <Search className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-blue-900 transition-colors truncate">
                            {item.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 pl-1">
                          <span className="text-[8px] sm:text-[9px] font-bold bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-md uppercase tracking-wider transition-colors">
                            {item.category}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP C: AUTH CONTAINER WITH +7 PHONE & GOOGLE SIGN-IN */}
          {step === "auth" && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mb-1">
                Создайте профиль
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-4">
                Зарегистрируйтесь для сохранения истории поисков, сравнения цен и отслеживания ОСМС.
              </p>

              {errorMsg && (
                <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Google Sign In First (Optional but Recommended) */}
              {!MongoDBUser ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-3 mb-4 shadow-3xs">
                  <div className="flex justify-center">
                    {/* Beautiful, large, pixel-perfect Google Logo */}
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center p-2.5">
                      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Быстрый и безопасный вход</span>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                      Используйте единый аккаунт Google для безопасного доступа к MedTariff.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition font-extrabold text-xs shadow-2xs min-h-[44px] cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Войти через аккаунт Google
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-3.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Вход выполнен успешно!</span>
                    <span className="text-[10px] text-emerald-700 block opacity-90 truncate max-w-[180px] sm:max-w-none">
                      {MongoDBUser.email}
                    </span>
                  </div>
                </div>
              )}

              {/* Form container for Phone registration */}
              <form onSubmit={handleFinalSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Укажите ваш номер телефона
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="+7 (777) 123-45-67"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none rounded-xl text-xs sm:text-sm text-slate-800 transition min-h-[44px]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  {isLoading ? "Загрузка..." : "Завершить регистрацию"}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </form>

              <button
                onClick={skipRegistration}
                className="w-full text-center text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-600 mt-3 transition underline decoration-dotted"
              >
                Пропустить шаг и продолжить как гость
              </button>
            </div>
          )}

          {/* Bottom attribution */}
          <div className="text-center mt-4 pt-3 border-t border-slate-100 shrink-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
              MedTariff © 2026 • г. {selectedCity} • ОСМС Аккредитация
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
