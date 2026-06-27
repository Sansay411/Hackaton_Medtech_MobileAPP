import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Compass, 
  GitCompare, 
  History, 
  User as UserIcon, 
  Sparkles, 
  LogOut, 
  Check, 
  Bell,
  AlertCircle, 
  TrendingDown, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  Database,
  SlidersHorizontal, 
  Map as MapIcon, 
  List as ListIcon, 
  Star, 
  Trash2, 
  Pin, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle, 
  FileText,
  BadgeAlert,
  ArrowLeft,
  Navigation,
  Plus,
  Users,
  Download,
  UserPlus,
  AlertTriangle,
  Printer,
  BookOpen,
  Wallet,
  Briefcase,
  GraduationCap,
  Calendar,
  Sun,
  Heart,
  Clock,
  Award,
  Activity,
  Brain,
  Smile
} from "lucide-react";
import { onAuthStateChanged, auth, signOut, db, collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, setDoc, handleFirestoreError, OperationType, deleteDoc } from "./lib/firebase";
import { Clinic, MapMarker, OnboardingState } from "./types";
import Logo from "./components/Logo";
import Onboarding from "./components/Onboarding";
import MapPlaceholder from "./components/MapPlaceholder";
import ClinicCard from "./components/ClinicCard";
import ComparisonMatrix from "./components/ComparisonMatrix";
import AdminHub from "./components/AdminHub";

interface RecentItem {
  id: string;
  query: string;
  address: string;
  isPinned: boolean;
}

interface PromoCode {
  id: string;
  title: string;
  type: string;
  code: string;
  description: string;
  isActive: boolean;
}

export const BLOG_ARTICLES = [
  {
    id: "art-1",
    title: "Как не сдохнуть в очереди к терапевту: 5 лайфхаков для поликлиник",
    category: "Лайфхаки ОСМС",
    readTime: "4 мин",
    date: "25 Июня, 2026",
    excerpt: "Простые секреты от бывалого врача, как пройти нужного специалиста за 15 минут вместо 2 часов ожидания в душном коридоре.",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
    content: "Система поликлиник в Казахстане может казаться лабиринтом, но знание внутренних правил творит чудеса.\n\nВот 5 простых правил, которые сэкономят вам часы:\n1. Записывайтесь через мобильные приложения (Damumed или аналоги) ровно в 08:00 утра — именно тогда открываются новые слоты на день.\n2. Вы имеете право на бесплатный прием дежурного терапевта без предварительной записи, если у вас острая боль или температура.\n3. Пользуйтесь электронными рецептами и направлениями. Если врач обещал направить вас, проверьте статус направления прямо в приложении, не выходя из кабинета.\n4. Если нужного специалиста нет в вашей поликлинике, вас обязаны направить в частную клинику-партнер бесплатно по договору соисполнения. Требуйте такое направление у заведующего!\n5. Помните: по закону, если время вашего приема сдвинулось более чем на 30 минут по вине врача, вы можете обратиться к службе поддержки пациентов прямо в здании."
  },
  {
    id: "art-2",
    title: "Фальшивые приемы в Damumed: как найти скрытые приписки",
    category: "Права пациентов",
    readTime: "5 мин",
    date: "18 Июня, 2026",
    excerpt: "Пошаговая инструкция, как клиники зарабатывают миллионы тенге на вашем имени и как остановить медицинский фрод.",
    imageUrl: "https://images.unsplash.com/photo-1526253038957-b254ffb31420?auto=format&fit=crop&w=600&q=80",
    content: "Каждый месяц тысячи казахстанцев обнаруживают в Damumed записи о приемах, анализах и даже операциях, которых никогда не было. Это называется приписками — так недобросовестные клиники получают деньги от Фонда ОСМС за невыполненную работу.\n\nКак обнаружить фрод и защитить свои права:\n1. Зайдите в личный кабинет Damumed, найдите раздел «Мои записи» или историю приемов.\n2. Тщательно сверьте даты. Нашли прием стоматолога во время вашего отпуска? Это приписка.\n3. Нажмите кнопку «Жалоба» прямо в MedTariff. Мы автоматически сгенерируем текст обращения и отправим его в Фонд социального медстрахования.\n4. За каждую доказанную приписку клиника получает огромный штраф — до 300% стоимости услуги обратно в бюджет, а нарушителю грозит лишение лицензии."
  },
  {
    id: "art-3",
    title: "Битва цен: Олимп против Invivo. Где дешевле сдавать анализы?",
    category: "Анализ цен",
    readTime: "3 мин",
    date: "10 Июня, 2026",
    excerpt: "Мы сравнили стоимость 10 самых популярных анализов в Алматы и Астане и нашли скрытые комиссии. Результаты удивляют.",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351166?auto=format&fit=crop&w=600&q=80",
    content: "Лабораторная диагностика — весомая статья расходов при лечении. Но цены в крупнейших сетях лабораторий существенно различаются.\n\nНаш независимый аудит цен показал следующие результаты:\n- Общий анализ крови (ОАК) с лейкоцитарной формулой выгоднее сдавать в КДЛ Олимп (в среднем дешевле на 15%).\n- ПЦР-тесты на вирусы и инфекции, а также сложные гормоны щитовидной железы выгоднее в Invivo.\n- Забор крови оплачивается отдельно в обеих сетях (около 800–1000 ₸). Обязательно учитывайте эту сумму при расчете.\n- Лайфхак: при оформлении заказа онлайн через сайты лабораторий часто действует постоянная скидка 5-10%!"
  }
];

export const BEST_DOCTORS = [
  {
    id: "doc-1",
    name: "Д-р Аскар Ибраев",
    specialty: "Кардиолог высшей категории",
    rating: 5.0,
    reviews: 248,
    experience: "18 лет",
    clinic: "HAK Medical",
    price: 10000,
    avatarColor: "bg-teal-500",
    iin: "820315354921",
    bio: "Специализируется на лечении сложных нарушений ритма сердца, гипертонии и ишемической болезни. Прошел стажировку в Германии.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
    qualifications: "Доктор медицинских наук (Д.М.Н.), Высшая категория МЗ РК, Член Европейского общества кардиологов (ESC)",
    academicBackground: "Профессор кафедры внутренних болезней, Казахский Национальный Медицинский Университет им. С.Д. Асфендиярова",
    reviewsList: [
      { name: "Михаил Филиппов", text: "Доктор очень профессионален в своей работе и отзывчив. Проконсультировал, и моя проблема была решена.", rating: 5 },
      { name: "Аружан С.", text: "Очень вежливый доктор, выслушал все жалобы, назначил только нужные анализы без лишней траты денег.", rating: 5 }
    ]
  },
  {
    id: "doc-2",
    name: "Д-р Мадина Смагулова",
    specialty: "Педиатр, Детский пульмонолог",
    rating: 4.9,
    reviews: 190,
    experience: "12 лет",
    clinic: "Керуен Медикус (Keruen)",
    price: 8500,
    avatarColor: "bg-pink-500",
    iin: "900512450392",
    bio: "Ведущий эксперт по лечению обструктивных бронхитов и аллергических патологий у детей раннего возраста. Любимый доктор сотен малышей.",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
    qualifications: "Кандидат медицинских наук (К.М.Н.), Врач-педиатр высшей категории",
    academicBackground: "Доцент кафедры детских болезней, Научный центр педиатрии и детской хирургии РК",
    reviewsList: [
      { name: "Елена К.", text: "Мадина Смагулова — лучший педиатр! Всегда на связи, находит подход к ребенку с первых секунд. Очень рекомендую.", rating: 5 },
      { name: "Кайрат Мусин", text: "Отличный детский врач, быстро вылечили бронхит без лишних антибиотиков.", rating: 4 }
    ]
  },
  {
    id: "doc-3",
    name: "Д-р Руслан Нурланов",
    specialty: "Врач МРТ-диагностики, Радиолог",
    rating: 5.0,
    reviews: 312,
    experience: "15 лет",
    clinic: "Orhun Medical",
    price: 12000,
    avatarColor: "bg-blue-500",
    iin: "850904351122",
    bio: "Эксперт в области нейрорадиологии и ранней диагностики опухолей головного мозга с применением современных ИИ-моделей MedTariff.",
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
    qualifications: "MD, Врач лучевой диагностики высшей категории, Член Европейского общества радиологов (ESR)",
    academicBackground: "Бывший заведующий отделением МРТ Национального научного кардиохирургического центра",
    reviewsList: [
      { name: "Дамир Ахметов", text: "Делал МРТ головного мозга. Доктор Нурланов лично пояснил результаты снимков и дал ценные рекомендации. Настоящий профи.", rating: 5 },
      { name: "Алия Ш.", text: "Быстро, качественно, очень детальная расшифровка снимка, которая помогла невропатологу поставить верный диагноз.", rating: 5 }
    ]
  },
  {
    id: "doc-4",
    name: "Д-р Масуд Хан",
    specialty: "Психотерапевт, Специалист по ментальному здоровью",
    rating: 5.0,
    reviews: 142,
    experience: "10 лет",
    clinic: "Керуен Медикус (Keruen)",
    price: 15000,
    avatarColor: "bg-indigo-500",
    iin: "881023340512",
    bio: "Специализируется на лечении депрессивных состояний, панических атак, семейной терапии и выгорания. Бережный подход к каждому клиенту.",
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
    qualifications: "MBBS, BCS (Health), FCPS (Psychiatry), MD (Psychotherapy), CCD (KazMed)",
    academicBackground: "Профессор и декан факультета ментального здоровья, Медицинский Университет Астана",
    reviewsList: [
      { name: "Michael Filip", text: "Д-р Масуд очень профессионален в своей работе и отзывчив. Проконсультировал, и моя проблема была решена.", rating: 5 },
      { name: "Зарина Б.", text: "Замечательный терапевт, сессии проходят очень комфортно и продуктивно. Помог справиться с тревожностью.", rating: 5 }
    ]
  },
  {
    id: "doc-5",
    name: "Д-р Алина Смирнова",
    specialty: "Педиатр / Терапевт общей практики",
    rating: 4.9,
    reviews: 120,
    experience: "8 лет",
    clinic: "HAK Medical",
    price: 7500,
    avatarColor: "bg-purple-500",
    iin: "921105450192",
    bio: "Консультирует взрослых и детей по широкому спектру терапевтических вопросов. Специализируется на ОРВИ, сезонных аллергиях и вакцинации.",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
    qualifications: "Врач общей практики (ВОП) первой категории, Член ассоциации семейных врачей РК",
    academicBackground: "Ассистент кафедры семейной медицины, Алматинский государственный институт усовершенствования врачей",
    reviewsList: [
      { name: "Ольга В.", text: "Замечательный врач, очень спокойная и доброжелательная. Назначила правильное лечение ребенку без лишней паники.", rating: 5 }
    ]
  },
  {
    id: "doc-6",
    name: "Д-р Серик Байманов",
    specialty: "Кардиолог / Терапевт",
    rating: 4.8,
    reviews: 95,
    experience: "14 лет",
    clinic: "Сункар (Sunkar)",
    price: 8000,
    avatarColor: "bg-red-500",
    iin: "840411350811",
    bio: "Диагностика и лечение заболеваний сердечно-сосудистой системы. Специалист по холтеровскому мониторированию и стресс-эхокардиографии.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
    qualifications: "Кардиолог высшей категории, врач функциональной диагностики",
    academicBackground: "Старший ординатор отделения неотложной кардиологии, Городской кардиологический центр",
    reviewsList: [
      { name: "Бахытжан Т.", text: "Врач своего дела. Провел обследование, выровнял давление, подобрал лекарства, которые реально работают.", rating: 5 }
    ]
  },
  {
    id: "doc-7",
    name: "Д-р Мадина Оспанова",
    specialty: "Невропатолог высшей категории",
    rating: 4.9,
    reviews: 150,
    experience: "16 лет",
    clinic: "Orhun Medical",
    price: 9500,
    avatarColor: "bg-indigo-500",
    iin: "860812450399",
    bio: "Специалист по лечению головных болей, остеохондроза, невралгий и последствий сосудистых нарушений. Применяет современные методики реабилитации.",
    photo: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80",
    qualifications: "К.М.Н., Невропатолог высшей квалификационной категории",
    academicBackground: "Доцент кафедры неврологии, Институт неврологии и нейрохирургии Республики Казахстан",
    reviewsList: [
      { name: "Светлана Л.", text: "После назначенного Мадиной Оспановной курса массажа и физиопроцедур боли в спине прошли полностью. Огромная благодарность!", rating: 5 }
    ]
  }
];

export default function App() {
  // Onboarding & user profiling states
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    city: "Алматы",
    intent: "Лаборатория",
    phone: "",
    isCompleted: false,
  });
  const [userName, setUserName] = useState<string>("Гость");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // Bottom Navigation tabs: search, blog, compare, profile, admin
  const [activeTab, setActiveTab] = useState<"search" | "blog" | "compare" | "profile">("search");
  
  // Search query states
  const [searchQuery, setSearchQuery] = useState("ПЦР");
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [marketInsights, setMarketInsights] = useState("");
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:30");
  const [timePeriod, setTimePeriod] = useState<"morning" | "afternoon">("morning");
  const [searchMode, setSearchMode] = useState<"live" | "db">("live");
  
  // Lists & markers
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | undefined>(undefined);
  
  // Selected clinic details modal
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  // Selected tariff inside details
  const [selectedTariff, setSelectedTariff] = useState<"express" | "standard" | "premium">("standard");
  // Active route tracking state
  const [isRoutingActive, setIsRoutingActive] = useState(false);

  // Reset routing state if no active marker is present
  useEffect(() => {
    if (!activeMarkerId) {
      setIsRoutingActive(false);
    }
  }, [activeMarkerId]);

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  // Auto-collapse header when map view is entered, uncollapse for list view
  useEffect(() => {
    if (viewMode === "map") {
      setIsHeaderCollapsed(true);
    } else {
      setIsHeaderCollapsed(false);
    }
  }, [viewMode]);

  // Handle slide up/down drag gestures for collapsing/expanding the purple header
  useEffect(() => {
    if (dragStartY === null) return;

    const handleMove = (clientY: number) => {
      const diff = clientY - dragStartY;
      if (diff < -30) {
        setIsHeaderCollapsed(true);
        setDragStartY(null);
      } else if (diff > 30) {
        setIsHeaderCollapsed(false);
        setDragStartY(null);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const onMouseUp = () => setDragStartY(null);
    const onTouchEnd = () => setDragStartY(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragStartY]);

  // Sorting & filtering criteria
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "distance">("price-asc");
  const [osmsFilter, setOsmsFilter] = useState(false);

  // Selected comparisons
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  // Modern streamlined UI states
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showFamilySheet, setShowFamilySheet] = useState(false);
  const [showRecordsSheet, setShowRecordsSheet] = useState(false);
  const [showLabSheet, setShowLabSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<"cabinet" | "loyalty">("cabinet");
  const [showAlertsSheet, setShowAlertsSheet] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [newAlertService, setNewAlertService] = useState("");
  const [newAlertClinic, setNewAlertClinic] = useState("");
  const [newAlertPrice, setNewAlertPrice] = useState("");
  const [newAlertEmail, setNewAlertEmail] = useState("");
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  
  // Interactive purple metrics blocks states
  const [userBonuses, setUserBonuses] = useState(220);
  const [showOSMSBalanceSheet, setShowOSMSBalanceSheet] = useState(false);
  const [showQuizSheet, setShowQuizSheet] = useState(false);
  const [showEventsSheet, setShowEventsSheet] = useState(false);

  // History tracking from Firestore
  const [userHistory, setUserHistory] = useState<Array<{ id: string; query: string; city: string; timestamp: string; count: number }>>([]);

  useEffect(() => {
    if (showAlertsSheet) {
      const loadAlerts = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "priceSubscriptions"));
          const list = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setPriceAlerts(list);
        } catch (e) {
          console.error("Failed to load price alerts:", e);
        }
      };
      loadAlerts();
    }
  }, [showAlertsSheet]);

  // Auto-search suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Local state for "Недавнее" (Recent searches) - screen 2 / 5 of the reference
  const [recentSearches, setRecentSearches] = useState<RecentItem[]>([
    { id: "recent-1", query: "ПЦР тест на COVID-19", address: "ул. Кабанбай батыра 42, Астана", isPinned: false },
    { id: "recent-2", query: "МРТ головного мозга", address: "пр. Аль-Фараби 71, Алматы", isPinned: true },
    { id: "recent-3", query: "УЗИ брюшной полости", address: "ул. Толе би 59, Алматы", isPinned: false }
  ]);

  // Local state for "Акции" (Promo codes) - screen 1 of the reference
  const [promos, setPromos] = useState<PromoCode[]>([
    { id: "promo-1", title: "Воскресный день здоровья в КДЛ Олимп", type: "Скидка 10%", code: "OLYMP-SUN10", description: "Предоставляется скидка 10% на все лабораторные анализы по воскресеньям во всех филиалах КДЛ Олимп.", isActive: false },
    { id: "promo-2", title: "Комплексный чекап 'Забота о близких' в Invivo", type: "Скидка 15%", code: "INVIVO-CARE", description: "Скидка 15% на комплексные лабораторные исследования (печеночный и почечный профили) в лаборатории Invivo.", isActive: false },
    { id: "promo-3", title: "Определение витамина D3 бесплатно в МЦ Сункар", type: "Подарок", code: "SUNKAR-VITD", description: "При заказе комплексного обследования на сумму от 15 000 ₸, тест на уровень витамина D3 проводится бесплатно.", isActive: false },
    { id: "promo-4", title: "Онлайн-направление ОСМС в поликлиниках", type: "Бесплатно по ОСМС", code: "OSMS-ONLINE", description: "Запись на бесплатную консультацию дежурного терапевта по государственной системе медицинского страхования.", isActive: false }
  ]);

  // PM Feedback inspired state engines:
  // 1. "Моя семья и дети" (My Family & Children) management
  const [familyMembers, setFamilyMembers] = useState([
    { id: "fam-1", name: "Алиса Смагулова", relationship: "Дочь", age: 6, iin: "181024654321" },
    { id: "fam-2", name: "Карим Смагулов", relationship: "Сын", age: 12, iin: "120515543210" }
  ]);

  // 2. Active Records & Appointments, loaded dynamically from Firebase Firestore (No synthetic data)
  const [healthRecords, setHealthRecords] = useState<any[]>([]);

  // Booking process states (Production-grade sheet)
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);

  // Competitor Killer Features Sheets
  const [showBlogSheet, setShowBlogSheet] = useState(false);
  const [showBestDoctorSheet, setShowBestDoctorSheet] = useState(false);
  const [selectedBlogArticle, setSelectedBlogArticle] = useState<any | null>(null);
  const [selectedCat, setSelectedCat] = useState<"Все" | "Лайфхаки ОСМС" | "Права пациентов" | "Анализ цен">("Все");

  // OSMS status verification states
  const [iinInput, setIinInput] = useState("");
  const [checkingIin, setCheckingIin] = useState(false);
  const [iinStatus, setIinStatus] = useState<"idle" | "success" | "error" | "not_found">("idle");

  const handleCheckOSMS = () => {
    const cleaned = iinInput.replace(/[^\d]/g, "");
    if (cleaned.length !== 12) {
      setIinStatus("error");
      return;
    }
    setCheckingIin(true);
    setIinStatus("idle");
    setTimeout(() => {
      setCheckingIin(false);
      setIinStatus("success");
    }, 1200);
  };

  // 3. Laboratory Results History with downloadable simulated PDF blanks
  const [labResults, setLabResults] = useState([
    { id: "lab-1", patientName: "Алиса Смагулова (Дочь)", testName: "Общий анализ крови (ОАК)", labName: "КДЛ Олимп", date: "24.06.2026", status: "Готов", code: "OL-983422", items: [{ name: "Гемоглобин", value: "128 г/л", ref: "110-140" }, { name: "Эритроциты", value: "4.2 *10¹²/л", ref: "3.5-4.7" }, { name: "Лейкоциты", value: "6.5 *10⁹/л", ref: "4.5-10.0" }] },
    { id: "lab-2", patientName: "Серик Смагулов (Вы)", testName: "ПЦР тест на COVID-19", labName: "Инвиво (Invivo)", date: "21.06.2026", status: "Готов", code: "IN-445109", items: [{ name: "РНК SARS-CoV-2", value: "ОТРИЦАТЕЛЬНЫЙ", ref: "Отрицательный" }] },
    { id: "lab-3", patientName: "Карим Смагулов (Сын)", testName: "Определение Витамина D3", labName: "МЦ Сункар", date: "18.06.2026", status: "В обработке", code: "SK-200388", items: [] }
  ]);

  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamName, setNewFamName] = useState("");
  const [newFamRelation, setNewFamRelation] = useState("Дочь");
  const [newFamAge, setNewFamAge] = useState("");
  const [newFamIin, setNewFamIin] = useState("");

  // Monitor auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setUserEmail(user.email);
        setUserName(user.displayName || "Пользователь");
        fetchSearchHistory(user.uid);
        fetchAppointments(user.uid);
        
        // Try fetching phone and profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const loadedOnboarding = {
              city: data.city || "Алматы",
              intent: data.intent || "Лаборатория",
              phone: data.phone || data.phoneNumber || "",
              isCompleted: true,
              userName: user.displayName || "Пользователь"
            };
            setOnboarding(loadedOnboarding);
            localStorage.setItem(`medtariff_profile_${user.uid}`, JSON.stringify(loadedOnboarding));
          } else {
            // Check if we have a locally saved profile to restore
            const cachedProfile = localStorage.getItem(`medtariff_profile_${user.uid}`);
            if (cachedProfile) {
              try {
                setOnboarding(JSON.parse(cachedProfile));
              } catch (parseErr) {
                console.warn("Could not parse cached user profile:", parseErr);
              }
            }
          }
        } catch (e) {
          console.warn("Failed to load user profile from Firestore, falling back to local storage:", e);
          const cachedProfile = localStorage.getItem(`medtariff_profile_${user.uid}`);
          if (cachedProfile) {
            try {
              setOnboarding(JSON.parse(cachedProfile));
            } catch (parseErr) {
              console.warn("Could not parse cached user profile:", parseErr);
            }
          }
        }
      } else {
        setCurrentUserUid(null);
        setUserEmail(null);
        setUserName("Гость");
        fetchAppointments("guest-user");
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch search history for logged-in user
  const fetchSearchHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, "searchHistory"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const historyItems: any[] = [];
      querySnapshot.forEach((doc) => {
        historyItems.push({ id: doc.id, ...doc.data() });
      });
      setUserHistory(historyItems);
      // Synchronize back to local storage cache for instant sub-sequent offline loads
      localStorage.setItem(`medtariff_history_${uid}`, JSON.stringify(historyItems));
    } catch (e) {
      console.warn("Could not retrieve Firestore history, falling back to local storage:", e);
      handleFirestoreError(e, OperationType.LIST, "searchHistory");
      const localHist = localStorage.getItem(`medtariff_history_${uid}`);
      if (localHist) {
        try {
          setUserHistory(JSON.parse(localHist));
        } catch (parseErr) {
          console.warn("Stale or invalid local storage cache:", parseErr);
        }
      }
    }
  };

  // Fetch real appointments for logged-in user or guest from Firestore
  const fetchAppointments = async (uid: string) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const appts: any[] = [];
      querySnapshot.forEach((doc) => {
        appts.push({ id: doc.id, ...doc.data() });
      });
      setHealthRecords(appts);
      localStorage.setItem(`medtariff_appointments_${uid}`, JSON.stringify(appts));
    } catch (e) {
      console.warn("Could not retrieve Firestore appointments, falling back to local storage:", e);
      handleFirestoreError(e, OperationType.LIST, "appointments");
      const localAppts = localStorage.getItem(`medtariff_appointments_${uid}`);
      if (localAppts) {
        try {
          setHealthRecords(JSON.parse(localAppts));
        } catch (parseErr) {
          console.warn("Invalid local storage cache for appointments:", parseErr);
        }
      }
    }
  };

  useEffect(() => {
    if (currentUserUid) {
      fetchSearchHistory(currentUserUid);
    }
  }, [currentUserUid, onboarding.isCompleted]);

  // Initial lookup on onboarding completion
  useEffect(() => {
    if (onboarding.isCompleted) {
      const initialMapQuery = onboarding.intent === "Лаборатория" ? "ПЦР" : onboarding.intent;
      setSearchQuery(initialMapQuery);
      executeSearch(initialMapQuery, onboarding.city);
    }
  }, [onboarding.isCompleted, onboarding.city]);

  // Autocomplete dynamic suggestions
  useEffect(() => {
    const list = [
      "ПЦР тест на COVID-19",
      "УЗИ брюшной полости",
      "МРТ головного мозга",
      "Прием кардиолога",
      "Общий анализ крови",
      "Рентген легких",
      "Лечение кариеса",
      "ЭКГ сердца"
    ];
    if (autocompleteQuery.length > 0) {
      const matched = list.filter(item => item.toLowerCase().includes(autocompleteQuery.toLowerCase()));
      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  }, [autocompleteQuery]);

  // Lazy Write-Back: Saves parsed results to clinics & services collections in the background
  const saveSearchDataToFirestore = async (queryText: string, searchCity: string, clinicsList: Clinic[]) => {
    if (!clinicsList || clinicsList.length === 0) return;
    try {
      console.log("Lazy Write-Back: Starting background verification and synchronization with Firestore for:", queryText);
      const prices = clinicsList.map(c => c.price);
      const minPrice = Math.min(...prices);
      const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      
      for (const clinic of clinicsList) {
        const clinicRef = doc(db, "clinics", clinic.id);
        let logoUrl = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80";
        const cName = clinic?.name?.toLowerCase() || "";
        if (cName.includes("олимп")) {
          logoUrl = "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&w=150&q=80";
        } else if (cName.includes("инвиво") || cName.includes("invivo")) {
          logoUrl = "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=150&q=80";
        } else if (cName.includes("сункар") || cName.includes("sunkar")) {
          logoUrl = "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=150&q=80";
        } else if (cName.includes("orhun") || cName.includes("орхун")) {
          logoUrl = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=150&q=80";
        } else if (cName.includes("keruen") || cName.includes("керуен")) {
          logoUrl = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80";
        }
        
        const clinicDocData = {
          id: clinic.id,
          name: clinic.name,
          logoUrl,
          rating: clinic.rating || 4.5,
          address: clinic.address,
          district: clinic.district || "Центральный р-н",
          city: searchCity,
          phone: clinic.phone || "+7 (707) 123-45-00",
          osms: clinic.osms || false,
          updatedAt: new Date().toISOString()
        };
        await setDoc(clinicRef, clinicDocData, { merge: true });
      }

      const serviceId = `service-${queryText.toLowerCase().replace(/[^a-zа-я0-9]+/g, "-")}-${searchCity.toLowerCase().replace(/[^a-zа-я0-9]+/g, "-")}`;
      const serviceRef = doc(db, "services", serviceId);
      
      let officialCode = "А09.05.003";
      const qTextLower = queryText?.toLowerCase() || "";
      if (qTextLower.includes("пцр")) {
        officialCode = "А09.05.045";
      } else if (qTextLower.includes("мрт")) {
        officialCode = "А11.08.001";
      } else if (qTextLower.includes("кт") || qTextLower.includes("томограф")) {
        officialCode = "А06.09.005";
      } else if (qTextLower.includes("узи")) {
        officialCode = "А04.16.001";
      } else if (qTextLower.includes("моч")) {
        officialCode = "А09.05.004";
      } else if (qTextLower.includes("сахар") || qTextLower.includes("глюкоз")) {
        officialCode = "А09.05.023";
      } else if (qTextLower.includes("терапевт")) {
        officialCode = "В01.047.001";
      } else if (qTextLower.includes("кардиолог")) {
        officialCode = "В01.015.001";
      } else if (qTextLower.includes("невро")) {
        officialCode = "В01.024.001";
      }

      const serviceDocData = {
        id: serviceId,
        name: queryText,
        code: officialCode,
        city: searchCity,
        minPrice,
        averagePrice,
        clinicPrices: clinicsList.map(c => ({
          clinicId: c.id,
          clinicName: c.name,
          price: c.price,
          updated: c.updated || "сегодня"
        })),
        updatedAt: new Date().toISOString()
      };
      await setDoc(serviceRef, serviceDocData, { merge: true });
      console.log("Lazy Write-Back: Successfully aggregated, validated and synchronized data to Firestore for:", queryText);
    } catch (err) {
      console.warn("Lazy Write-Back background synchronization warning (graceful):", err);
    }
  };

  // Compute market median and identify anomalous pricing inflation (>50% above median) + parsedAt stamp
  const enrichWithInflationAndTimestamp = (list: Clinic[]) => {
    if (list.length === 0) return [];
    const prices = list.map(c => c.price).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    const nowStr = new Date().toISOString();
    return list.map(c => ({
      ...c,
      anomalous_inflation: c.price > median * 1.5,
      parsedAt: c.parsedAt || nowStr
    }));
  };

  // Mode 2: Static Database Search (DB-Mode)
  const executeStaticDBSearch = async (queryText: string, searchCity: string) => {
    try {
      console.log(`DB-Mode: Querying local Firestore database for: "${queryText}" in ${searchCity}`);
      const q = query(
        collection(db, "services"),
        where("city", "==", searchCity)
      );
      const querySnapshot = await getDocs(q);
      let matchedService: any = null;
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docNameLower = data?.name?.toLowerCase() || "";
        const queryTextLower = queryText?.toLowerCase() || "";
        if (docNameLower && queryTextLower && (docNameLower.includes(queryTextLower) || queryTextLower.includes(docNameLower))) {
          matchedService = data;
        }
      });

      if (matchedService) {
        console.log("DB-Mode: Match found in Firestore:", matchedService.name);
        const clinicsSnapshot = await getDocs(query(collection(db, "clinics"), where("city", "==", searchCity)));
        const dbClinicsMap: Record<string, any> = {};
        clinicsSnapshot.forEach(docSnap => {
          dbClinicsMap[docSnap.id] = docSnap.data();
        });

        const clinicsList: Clinic[] = matchedService.clinicPrices.map((cp: any) => {
          const fullClinic = dbClinicsMap[cp.clinicId];
          return {
            id: cp.clinicId,
            name: cp.clinicName,
            price: cp.price,
            address: fullClinic?.address || "ул. Кабанбай батыра, 21",
            district: fullClinic?.district || "Центральный р-н",
            distance: fullClinic?.distance || "2.1 км",
            osms: fullClinic?.osms || false,
            updated: cp.updated || "из базы данных",
            phone: fullClinic?.phone || "+7 (707) 123-45-00",
            rating: fullClinic?.rating || 4.5
          };
        });

        const enrichedClinics = enrichWithInflationAndTimestamp(clinicsList);
        setClinics(enrichedClinics);
        setMarketInsights(`ИИ-Аналитика (БД-Режим): На основе исторических данных в Firestore, минимальная цена на "${matchedService.name}" в г. ${searchCity} составляет ${matchedService.minPrice.toLocaleString()} ₸, средняя — ${matchedService.averagePrice.toLocaleString()} ₸. Услуга привязана к государственному коду МЗ РК ${matchedService.code}.`);
        setIsSimulatedMode(false);

        const getCityFallbackCoords = (city: string) => {
          const lower = city.toLowerCase();
          if (lower.includes("астана")) return { lat: 51.169392, lng: 71.449074 };
          if (lower.includes("шымкент")) return { lat: 42.3417, lng: 69.5901 };
          if (lower.includes("караганда")) return { lat: 49.8022, lng: 73.0881 };
          return { lat: 43.238940, lng: 76.889709 }; // Almaty default
        };
        const cityCenter = getCityFallbackCoords(searchCity);

        const resolvedMarkers: MapMarker[] = clinicsList.map((c, i) => {
          const fullClinic = dbClinicsMap[c.id];
          const latFallback = cityCenter.lat + (i - 2) * 0.007;
          const lngFallback = cityCenter.lng + (i - 2) * 0.009 * (Math.sin(i) || 1);
          return {
            id: c.id,
            name: c.name,
            price: c.price,
            lat: fullClinic?.lat || latFallback,
            lng: fullClinic?.lng || lngFallback,
            address: c.address,
            osms: c.osms,
            rating: c.rating || fullClinic?.rating || 4.5
          };
        });
        setMarkers(resolvedMarkers);
        if (clinicsList.length > 0) {
          setActiveMarkerId(clinicsList[0].id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn("DB-Mode: Error querying Firestore:", err);
      return false;
    }
  };

  // Mode 1: Self-Live Search (High Priority)
  const executeLiveSearch = async (queryText: string, searchCity: string) => {
    // 1. Fetch filtered clinics
    const resServices = await fetch("/api/search-services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText, city: searchCity }),
    });
    const servicesData = await resServices.json();

    setMarketInsights(servicesData.insights || "Анализ цен по вашему городу готов.");
    const fetchedClinics = servicesData.clinics || [];
    const enrichedClinics = enrichWithInflationAndTimestamp(fetchedClinics);
    setClinics(enrichedClinics);
    setIsSimulatedMode(servicesData.isSimulated || false);

    // 2. Fetch maps coordinates
    const resMap = await fetch("/api/map-grounding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText, city: searchCity }),
    });
    const mapData = await resMap.json();
    setMarkers(mapData.markers || []);

    if (fetchedClinics.length > 0) {
      setActiveMarkerId(fetchedClinics[0].id);
    }

    // Lazy write-back triggered in background
    saveSearchDataToFirestore(queryText, searchCity, fetchedClinics);
  };

  // Execute Search proxying server endpoints with Mode Selector
  const executeSearch = async (queryText: string, searchCity: string, overrideMode?: "live" | "db") => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setSearchQuery(queryText);
    setAutocompleteQuery("");
    
    const activeSearchMode = overrideMode || searchMode;
    console.log(`Executing search proxy with mode: ${activeSearchMode}`);

    try {
      if (activeSearchMode === "db") {
        const dbResult = await executeStaticDBSearch(queryText, searchCity);
        if (!dbResult) {
          console.log("DB search found nothing or failed. Falling back to Live search...");
          setSearchMode("live");
          await executeLiveSearch(queryText, searchCity);
        }
      } else {
        await executeLiveSearch(queryText, searchCity);
      }

      // Add search item to "Недавнее" list if not already there
      setRecentSearches(prev => {
        const exists = prev.some(item => item.query.toLowerCase() === queryText.toLowerCase());
        if (exists) return prev;
        const newItem: RecentItem = {
          id: "recent-" + Date.now(),
          query: queryText,
          address: "г. " + searchCity,
          isPinned: false
        };
        return [newItem, ...prev.slice(0, 5)];
      });

      // Persist search request to Firestore under searches/searchHistory
      const uid = currentUserUid || "anonymous";
      const newHistoryItem = {
        id: "hist-" + Date.now(),
        userId: uid,
        query: queryText,
        city: searchCity,
        timestamp: new Date().toISOString(),
        clinicsCount: clinics.length,
      };

      try {
        const localHistKey = `medtariff_history_${uid}`;
        const existingLocal = localStorage.getItem(localHistKey);
        const existingArray = existingLocal ? JSON.parse(existingLocal) : [];
        const updatedArray = [newHistoryItem, ...existingArray.filter((x: any) => x.query?.toLowerCase() !== queryText.toLowerCase())].slice(0, 10);
        localStorage.setItem(localHistKey, JSON.stringify(updatedArray));
        setUserHistory(updatedArray);
      } catch (localErr) {
        console.warn("Failed to write search history to local storage:", localErr);
      }

      try {
        await addDoc(collection(db, "searchHistory"), {
          userId: newHistoryItem.userId,
          query: newHistoryItem.query,
          city: newHistoryItem.city,
          timestamp: newHistoryItem.timestamp,
          clinicsCount: newHistoryItem.clinicsCount,
        });

        if (currentUserUid) {
          fetchSearchHistory(currentUserUid);
        }
      } catch (err) {
        console.warn("Failed to write search history to Firestore, fallback is active:", err);
      }

    } catch (e) {
      console.error("Search fetch failed, falling back gracefully:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOnboardingComplete = (data: OnboardingState & { userName?: string; userEmail?: string }) => {
    setOnboarding(data);
    if (data.userName) setUserName(data.userName);
    if (data.userEmail) setUserEmail(data.userEmail);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setOnboarding(prev => ({ ...prev, isCompleted: false }));
    } catch (e) {
      console.error("Signout error:", e);
    }
  };

  const handleToggleCompare = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert("Вы можете сравнивать до 4 клиник одновременно.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setSelectedCompareIds((prev) => prev.filter((item) => item !== id));
  };

  // Star / Pin recent item toggle
  const handleTogglePinRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => 
      prev.map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item)
    );
  };

  // Delete recent item from list
  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  // Toggle promo activation
  const handleTogglePromo = (id: string) => {
    setPromos(prev =>
      prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
    );
  };

  const getPriceNum = (priceVal: any): number => {
    if (typeof priceVal === "number") return priceVal;
    if (!priceVal) return 0;
    const cleanStr = String(priceVal).replace(/[^\d]/g, "");
    return parseInt(cleanStr, 10) || 0;
  };

  const getDistanceNum = (distVal: any): number => {
    if (typeof distVal === "number") return distVal;
    if (!distVal) return 0;
    const cleanStr = String(distVal).replace(/[^\d.]/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const getEffectivePrice = (clinic: Clinic) => {
    if (clinic.osms) return 0;
    return getPriceNum(clinic.price);
  };

  const sortedClinics = [...clinics]
    .filter((c) => !osmsFilter || c.osms)
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        const effA = getEffectivePrice(a);
        const effB = getEffectivePrice(b);
        if (effA !== effB) {
          return effA - effB;
        }
        return getPriceNum(a.price) - getPriceNum(b.price);
      }
      if (sortBy === "price-desc") {
        const effA = getEffectivePrice(a);
        const effB = getEffectivePrice(b);
        if (effA !== effB) {
          return effB - effA;
        }
        return getPriceNum(b.price) - getPriceNum(a.price);
      }
      
      const distA = getDistanceNum(a.distance);
      const distB = getDistanceNum(b.distance);
      return distA - distB;
    });

  const selectedClinicsToCompare = clinics.filter((c) => selectedCompareIds.includes(c.id));

  // Auto-synchronize active map marker when sorting or filtering changes
  useEffect(() => {
    if (sortedClinics.length > 0) {
      const activeExists = sortedClinics.some(c => c.id === activeMarkerId);
      if (!activeExists) {
        setActiveMarkerId(sortedClinics[0].id);
      }
    } else {
      setActiveMarkerId(undefined);
    }
  }, [sortBy, osmsFilter, clinics, activeMarkerId]);

  // Sort recent searches: pinned always at top
  const sortedRecentSearches = [...recentSearches].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col relative overflow-hidden w-full max-w-md mx-auto shadow-xl border-x border-slate-200">
      
      {/* Onboarding Overlay state gate */}
      {!onboarding.isCompleted && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Main comparative matrix overlay modal */}
      {showMatrix && (
        <ComparisonMatrix
          selectedClinics={selectedClinicsToCompare}
          onRemoveFromComparison={handleRemoveFromComparison}
          onClose={() => setShowMatrix(false)}
          serviceQuery={searchQuery}
          onBuildRoute={(clinic) => {
            setActiveTab("search");
            setViewMode("map");
            setActiveMarkerId(clinic.id);
            setShowMatrix(false);
          }}
        />
      )}

      {/* Dynamic App Content Body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
          
          {/* ========================================== */}
          {/* TAB 1: SEARCH & MAP SYSTEM (Поиск)         */}
          {/* ========================================== */}
          {activeTab === "search" && (
            <div className="flex-1 flex flex-col overflow-hidden font-sans">
              
              {/* Vibrant medical blue background block with the user profile context */}
              <div className={`bg-[#1B449C] text-white px-5 shadow-lg shrink-0 transition-all duration-300 relative ${
                isHeaderCollapsed 
                  ? "pt-4 pb-3 rounded-b-[1.8rem] space-y-2.5" 
                  : "pt-6 pb-5 rounded-b-[2.5rem] space-y-4"
              }`}>
                {/* Collapsible area: Top context row, OSMS status checker */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  isHeaderCollapsed 
                    ? "max-h-0 opacity-0 pointer-events-none mb-0" 
                    : "max-h-[350px] opacity-100 space-y-3.5 mb-2"
                }`}>
                  {/* Top Row: User context & Notification */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Round user profile image / friendly avatar */}
                      <img 
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" 
                        alt="Avatar" 
                        className="w-11 h-11 rounded-full border-2 border-white/40 shadow-sm shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'User')}`;
                        }}
                      />
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm tracking-tight leading-none text-white">{userName}</h3>
                        <button
                          type="button"
                          onClick={() => setShowCityModal(true)}
                          className="flex items-center gap-1.5 text-[10px] bg-white/12 border border-white/20 hover:bg-white/20 text-white font-extrabold py-0.5 px-2 rounded-lg transition mt-1.5 cursor-pointer shadow-3xs"
                        >
                          <MapPin className="w-3 h-3 text-sky-200 shrink-0" />
                          <span>{onboarding.city}</span>
                          <ChevronDown className="w-3 h-3 text-white/70 shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* Right action row: Bonus points & Bell */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/10 border border-white/10 px-2.5 py-1 rounded-full select-none shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span className="text-[10px] font-black font-mono text-white leading-none">{userBonuses}</span>
                      </div>
                      
                      <button 
                        onClick={() => alert("У вас нет новых уведомлений")}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition relative cursor-pointer shrink-0"
                      >
                        <Bell className="w-4 h-4 text-white" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      </button>
                    </div>
                  </div>


                </div>

                {/* Search Pill Input (Matching Reference exactly) */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input
                      type="text"
                      placeholder="Поиск врача, анализов, клиники..."
                      value={autocompleteQuery}
                      onChange={(e) => setAutocompleteQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          executeSearch(autocompleteQuery || searchQuery, onboarding.city);
                        }
                      }}
                      className="w-full pl-10 pr-20 py-3 bg-white text-slate-800 focus:bg-white border-0 focus:outline-none rounded-full text-xs font-semibold placeholder-slate-400 shadow-md transition-all duration-200"
                    />
                    
                    {autocompleteQuery.length > 0 && (
                      <button
                        onClick={() => {
                          setAutocompleteQuery("");
                          setSearchQuery("");
                          setClinics([]);
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] bg-slate-200/60 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase transition-colors"
                      >
                        Очистить
                      </button>
                    )}
                    {/* Autocomplete suggestions popover */}
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-50 text-left">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => executeSearch(s, onboarding.city)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 transition-all duration-150"
                          >
                            <div className="flex items-center gap-2">
                               <Search className="w-3.5 h-3.5 text-slate-400" />
                               <span>{s}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom details of header: compact List/Map switcher */}
                  <div className="flex items-center justify-center px-1.5 pt-0.5 gap-2 w-full">
                    {/* List/Map Switcher */}
                    <div className="bg-white/15 p-0.5 rounded-full flex items-center border border-white/10 shrink-0">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase flex items-center gap-1 transition-all duration-200 ${
                          viewMode === "list" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/90 hover:text-white"
                        }`}
                      >
                        Список
                      </button>
                      <button
                        onClick={() => setViewMode("map")}
                        className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase flex items-center gap-1 transition-all duration-200 ${
                          viewMode === "map" ? "bg-white text-[#1B449C] shadow-xs" : "text-white/90 hover:text-white"
                        }`}
                      >
                        Карта
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pull handle button for collapsing/expanding header for map view only */}
                {viewMode === "map" && (
                  <div className="flex justify-center pt-2 -mb-2">
                    <button
                      onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                      className="px-4 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/5 rounded-full flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{isHeaderCollapsed ? "Показать меню" : "Свернуть меню"}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isHeaderCollapsed ? "" : "rotate-180"}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Modern Scrollable Filter Chips Bar (Replaces overloaded parameters panel) */}
              <div className="bg-white px-4 py-2.5 border-b border-slate-100 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar select-none shadow-2xs">
                {/* OSMS Toggle Chip */}
                <button
                  onClick={() => setOsmsFilter(!osmsFilter)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all duration-200 flex items-center gap-1 border cursor-pointer ${
                    osmsFilter
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>ОСМС Бесплатно</span>
                </button>

                {/* Sort Cycling Chip (Cheap -> Expensive -> Near) */}
                <button
                  onClick={() => {
                    if (sortBy === "price-asc") setSortBy("price-desc");
                    else if (sortBy === "price-desc") setSortBy("distance");
                    else setSortBy("price-asc");
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all duration-200 flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>
                    Сорт: {sortBy === "price-asc" ? "Дешевле" : sortBy === "price-desc" ? "Дороже" : "Ближе"}
                  </span>
                </button>

                {/* AI Insights Expandable Toggle Chip */}
                {marketInsights && (
                  <button
                    onClick={() => setShowAiInsights(!showAiInsights)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all duration-200 flex items-center gap-1 border cursor-pointer ${
                      showAiInsights
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>ИИ-анализ</span>
                  </button>
                )}

                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0 ml-auto pl-2">
                  Клиник: {clinics.length}
                </span>
              </div>

              {/* Central Map canvas / Clinic list wrapper */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                
                {/* LIST VIEW */}
                {viewMode === "list" && (
                  <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">

                     {/* Gorgeous Reference-styled Home Dashboard (Visible only when NOT searching) */}
                     {!searchQuery ? (
                      <>
                        <div className="space-y-5 animate-fade-in select-none">
                        
                        {/* 1. Find Your Specialist (Основные категории) */}
                        <div className="space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Основные категории</span>
                            <button 
                              onClick={() => {
                                setAutocompleteQuery("Терапевт");
                                executeSearch("Терапевт", onboarding.city);
                              }}
                              className="text-[10px] font-bold text-[#1B449C] hover:underline"
                            >
                              Показать все
                            </button>
                          </div>
                          
                          {/* Horizontal scroll of beautiful pastel buttons */}
                          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {[
                              { title: "Терапевт", query: "Терапевт", icon: UserIcon, bg: "bg-[#F0F5FF] text-[#1B449C]" },
                              { title: "Кардиолог", query: "Прием кардиолога", icon: Heart, bg: "bg-[#FFF0F0] text-rose-500" },
                              { title: "Невропатолог", query: "Прием невропатолога", icon: Brain, bg: "bg-[#F3E8FF] text-indigo-500" },
                              { title: "Стоматолог", query: "Лечение кариеса", icon: Smile, bg: "bg-[#EAFBF3] text-emerald-500" },
                              { title: "Педиатр", query: "Прием педиатра", icon: Award, bg: "bg-[#FFF9E6] text-amber-500" },
                              { title: "Диагностика", query: "УЗИ брюшной полости", icon: Activity, bg: "bg-[#EBFDFF] text-cyan-500" },
                            ].map((cat, idx) => {
                              const IconComp = cat.icon;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setAutocompleteQuery(cat.title);
                                    executeSearch(cat.query, onboarding.city);
                                  }}
                                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:scale-95 transition-transform"
                                >
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${cat.bg} group-hover:scale-105 shadow-2xs`}>
                                    <IconComp className="w-6 h-6" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 block text-center leading-tight">
                                    {cat.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Carousel Active Doctor Banner (Dr. Masud Khan Card) */}
                        <div 
                          onClick={() => {
                            const found = BEST_DOCTORS.find(d => d.id === "doc-4");
                            if (found) setSelectedDoctor(found);
                          }}
                          className="bg-gradient-to-br from-[#1B449C] via-[#143B8A] to-[#0F2E6F] text-white rounded-[2rem] p-5 shadow-md relative overflow-hidden text-left cursor-pointer active:scale-98 transition-all"
                        >
                          {/* Pattern overlays */}
                          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />
                          
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2.5 max-w-[60%]">
                              <span className="text-[8px] font-black uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded-full">
                                Рекомендуемый доктор
                              </span>
                              <div>
                                <h3 className="font-extrabold text-base tracking-tight leading-none">Д-р Масуд Хан</h3>
                                <p className="text-[10px] text-sky-100 font-bold mt-1">Специалист по ментальному здоровью</p>
                              </div>
                              
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-sky-100 font-medium">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">г. {onboarding.city}, ул. Абая 45</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-sky-100 font-medium">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>Пн - Пт, 09:00 - 17:00</span>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const found = BEST_DOCTORS.find(d => d.id === "doc-4");
                                  if (found) setSelectedDoctor(found);
                                }}
                                className="mt-2 px-4 py-1.5 bg-white text-[#1B449C] font-extrabold text-[10px] rounded-full hover:bg-sky-50 transition active:scale-95 cursor-pointer shadow-sm block"
                              >
                                Подробнее
                              </button>
                            </div>

                            {/* Doctor cutout container */}
                            <div className="relative shrink-0 w-[110px] h-[120px] -mr-2">
                              <img 
                                src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=220&q=80" 
                                alt="Dr. Masud Khan"
                                className="absolute bottom-0 right-0 w-full h-full object-cover rounded-2xl border border-white/20 shadow-lg bg-[#E8F3FF]"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=Masud+Khan";
                                }}
                              />
                            </div>
                          </div>

                          {/* Dots Carousel Indicator */}
                          <div className="flex justify-center gap-1 mt-3">
                            <span className="w-3.5 h-1.5 bg-white rounded-full" />
                            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                          </div>
                        </div>

                        {/* 3. Top Rated Doctors Section */}
                        <div className="space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Популярные врачи в {onboarding.city}</span>
                            <button 
                              onClick={() => {
                                setAutocompleteQuery("Врач");
                                executeSearch("Терапевт", onboarding.city);
                              }}
                              className="text-[10px] font-bold text-[#1B449C] hover:underline"
                            >
                              Все врачи
                            </button>
                          </div>

                          {/* Horizontal doctors row */}
                          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {[
                              {
                                id: "doc-5",
                                name: "Д-р Алина Смирнова",
                                specialty: "Педиатр / Терапевт",
                                rate: "4.9",
                                reviews: "120",
                                img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80",
                              },
                              {
                                id: "doc-6",
                                name: "Д-р Серик Байманов",
                                specialty: "Кардиолог / Терапевт",
                                rate: "4.8",
                                reviews: "95",
                                img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80",
                              },
                              {
                                id: "doc-7",
                                name: "Д-р Мадина Оспанова",
                                specialty: "Невропатолог",
                                rate: "4.95",
                                reviews: "150",
                                img: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&q=80",
                              }
                            ].map((docItem, idx) => (
                              <div 
                                key={idx}
                                onClick={() => {
                                  const found = BEST_DOCTORS.find(d => d.id === docItem.id);
                                  if (found) setSelectedDoctor(found);
                                }}
                                className="bg-white border border-slate-150 rounded-2xl p-3 w-[150px] shrink-0 cursor-pointer active:scale-98 transition shadow-3xs text-left"
                              >
                                <div className="relative w-full h-[100px] rounded-xl overflow-hidden mb-2 bg-slate-50">
                                  <img 
                                    src={docItem.img} 
                                    alt={docItem.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(docItem.name)}`;
                                    }}
                                  />
                                  <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">
                                    ОСМС бесплатно
                                  </span>
                                </div>
                                <h4 className="font-bold text-[11px] text-slate-800 truncate leading-none">{docItem.name}</h4>
                                <p className="text-[9px] text-slate-400 font-semibold truncate mt-1">{docItem.specialty}</p>
                                
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                                  <div className="flex items-center gap-0.5 text-amber-500">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    <span className="text-[10px] font-black">{docItem.rate}</span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-bold">{docItem.reviews} отзывов</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Interactive Low-profile AI Insights widget */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                                ИИ-Аналитика Тарифов и ОСМС в {onboarding.city}
                              </span>
                            </div>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            ИИ отслеживает колебания цен в клиниках вашего региона. На данный момент стоимость общих анализов и УЗИ стабильна. Доступно 12 клиник-партнеров с бесплатными услугами по системе ОСМС.
                          </p>
                        </div>

                      </div>

                    {/* Recent list "Недавнее" - Screen 2 / 5 reference layout */}
                    {true && (
                      <div className="space-y-4 pt-1">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 text-left">
                            Недавние запросы
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {sortedRecentSearches.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => executeSearch(item.query, onboarding.city)}
                              className="bg-white border border-slate-200 hover:border-blue-300 p-3 rounded-xl flex items-center justify-between transition cursor-pointer group"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-blue-600">
                                  <History className="w-4 h-4" />
                                </div>
                                <div className="leading-tight">
                                  <span className="font-semibold text-slate-800 text-xs block group-hover:text-blue-900 transition-colors">
                                    {item.query}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {item.address}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => handleTogglePinRecent(item.id, e)}
                                  className={`p-1 rounded-md hover:bg-slate-50 transition ${item.isPinned ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}`}
                                  title="Закрепить"
                                >
                                  <Pin className="w-3.5 h-3.5 fill-current" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteRecent(item.id, e)}
                                  className="p-1 text-slate-300 hover:text-red-500 rounded-md hover:bg-slate-50 transition"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                      </>
                     ) : (
                      /* Clinics search results list (Visible only when searching) */
                      <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                          {searchQuery ? `Результаты поиска: ${searchQuery}` : `Клиники и предложения в ${onboarding.city}`}
                        </span>
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setAutocompleteQuery("");
                              setClinics([]);
                            }}
                            className="text-[10px] font-bold text-[#1B449C] hover:underline cursor-pointer"
                          >
                            Сбросить поиск
                          </button>
                        )}
                      </div>

                      {isSearching ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                          <div className="w-8 h-8 border-3 border-[#1B449C] border-t-transparent rounded-full animate-spin mb-3" />
                          <span className="text-xs font-semibold">Анализ цен по вашему городу...</span>
                        </div>
                      ) : clinics.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">Ничего не найдено</p>
                          <p className="text-[10px] mt-0.5">Введите новый запрос или сбросьте фильтр ОСМС.</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {sortedClinics.map((clinic) => (
                            <div 
                              key={clinic.id} 
                              onClick={() => {
                                setSelectedClinic(clinic);
                                setSelectedTariff("standard");
                              }}
                            >
                            <ClinicCard
                              clinic={clinic}
                              isSelectedForComparison={selectedCompareIds.includes(clinic.id)}
                              onToggleCompare={handleToggleCompare}
                              isActiveOnMap={activeMarkerId === clinic.id}
                              onCardClick={(id) => {
                                setActiveMarkerId(id);
                              }}
                              serviceQuery={searchQuery}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                     )}

                  </div>
                )}

                {/* MAP VIEW */}
                {viewMode === "map" && (
                  <div className="flex-1 relative">
                    <MapPlaceholder
                      markers={markers}
                      activeMarkerId={activeMarkerId}
                      onMarkerSelect={(id) => setActiveMarkerId(id)}
                      city={onboarding.city}
                      isRoutingActive={!!activeMarkerId}
                      onCloseRouting={() => setActiveMarkerId(undefined)}
                    />
                  </div>
                )}

              </div>
            </div>
          )}
          {/* ========================================== */}
          {/* TAB 2: MEDICAL BLOG & NOMINEES (Блог)     */}
          {/* ========================================== */}
          {activeTab === "blog" && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-28 space-y-5 bg-slate-50/50">
              {selectedBlogArticle ? (
                /* Full article detail view with Cover Photo */
                <div className="bg-white rounded-[2.2rem] p-6 border border-slate-100 shadow-xs space-y-4 text-left animate-fade-in">
                  <button
                    onClick={() => setSelectedBlogArticle(null)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-[#1B449C] uppercase tracking-widest hover:underline transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Назад в Блог
                  </button>

                  {selectedBlogArticle.imageUrl && (
                    <img
                      src={selectedBlogArticle.imageUrl}
                      alt={selectedBlogArticle.title}
                      className="w-full h-48 object-cover rounded-2xl border border-slate-100 shadow-3xs"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                  )}

                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-blue-50 text-[#1B449C] px-2.5 py-1 rounded-md font-black uppercase tracking-wider">
                        {selectedBlogArticle.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedBlogArticle.readTime}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {selectedBlogArticle.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{selectedBlogArticle.date}</span>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium whitespace-pre-line pt-1">
                    {selectedBlogArticle.content}
                  </p>
                </div>
              ) : (
                /* Main blog index with category filter & premium cover article lists */
                <>
                  {/* Screen Title Header */}
                  <div className="flex items-center justify-between py-1 shrink-0 text-left">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg tracking-tight">Полезная Лента</h3>
                      <span className="text-[9.5px] text-slate-400 font-mono block tracking-wider uppercase mt-0.5">
                        Лайфхаки ОСМС, анализы и советы экспертов
                      </span>
                    </div>
                  </div>

                  {/* USEFUL ARTICLES & GUIDE SECTION */}
                  <div className="space-y-3.5 pt-1">
                    {/* Horizontal sliding pill matrix for categories */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar select-none">
                        {(["Все", "Лайфхаки ОСМС", "Права пациентов", "Анализ цен"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCat(cat)}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                              selectedCat === cat
                                ? "bg-[#1B449C] text-white border-[#1B449C] shadow-xs"
                                : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {BLOG_ARTICLES.filter(
                          art => selectedCat === "Все" || art.category === selectedCat
                        ).map((article) => {
                          const tagColor = 
                            article.category === "Лайфхаки ОСМС" ? "bg-blue-50 text-[#1B449C] border-blue-100/45" :
                            article.category === "Права пациентов" ? "bg-emerald-50 text-emerald-700 border-emerald-100/45" : 
                            "bg-rose-50 text-rose-700 border-rose-100/45";

                          return (
                            <div
                              key={article.id}
                              onClick={() => setSelectedBlogArticle(article)}
                              className="bg-white border border-slate-200/70 rounded-[2rem] overflow-hidden shadow-3xs hover:shadow-2xs hover:border-blue-300 transition-all cursor-pointer text-left flex flex-col group"
                            >
                              {/* Cover photo with parallax hover effect */}
                              {article.imageUrl && (
                                <div className="h-44 w-full overflow-hidden relative border-b border-slate-100 bg-slate-50">
                                  <img
                                    src={article.imageUrl}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";
                                    }}
                                  />
                                  <div className="absolute top-3 left-3">
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-3xs ${tagColor}`}>
                                      {article.category}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="p-4.5 space-y-2 flex-1 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-[8px] text-slate-400 font-mono">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{article.date}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{article.readTime} чтение</span>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug group-hover:text-[#1B449C] transition-colors line-clamp-2">
                                    {article.title}
                                  </h4>
                                  
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2">
                                    {article.excerpt}
                                  </p>
                                </div>

                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[9px]">
                                  <span className="text-slate-350 font-medium">Казахстан, 2026</span>
                                  <span className="font-black text-[#1B449C] uppercase tracking-widest flex items-center gap-0.5 group-hover:text-blue-850">
                                    Читать полностью →
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CLINIC COMPARISONS (Сравнение)       */}
          {/* ========================================== */}
          {activeTab === "compare" && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-28 space-y-4">
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Сравнительный слот</h3>
                  <span className="text-[9px] text-slate-400 font-mono block">СРАВНЕНИЕ ЦЕН ВАШЕГО ГОРОДА</span>
                </div>
              </div>

              {selectedClinicsToCompare.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-white border border-dashed border-slate-200 rounded-2xl p-6">
                  <GitCompare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700">Нет выбранных предложений</p>
                  <p className="text-[10px] max-w-xs mx-auto mt-1 leading-normal text-slate-400">
                    Перейдите во вкладку "Поиск" и отметьте чекбокс "Сравнить" на карточках клиник.
                  </p>
                  <button
                    onClick={() => setActiveTab("search")}
                    className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  >
                    Перейти к поиску
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200/60 p-3 rounded-xl text-[10px] text-blue-800 leading-normal flex items-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Выбрано {selectedCompareIds.length} предложений. Откройте интерактивную матрицу сравнения для детального side-by-side сопоставления.
                    </span>
                  </div>

                  {/* Compact list of selected clinics for mobile */}
                  <div className="space-y-2.5">
                    {selectedClinicsToCompare.map((clinic) => (
                      <div key={clinic.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{clinic.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{clinic.address}</span>
                          <span className="text-[10px] font-extrabold text-blue-900 block mt-1">{clinic.price.toLocaleString()} ₸</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFromComparison(clinic.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition"
                          title="Исключить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowMatrix(true)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md"
                  >
                    Открыть Матрицу Сравнения
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: USER PROFILE & SETTINGS (Профиль)   */}
          {/* ========================================== */}
          {activeTab === "profile" && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-32 space-y-4 relative bg-slate-50/50">
              
              {/* Screen 4 Header */}
              <div className="flex items-center justify-between py-1 shrink-0">
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Настройки</h3>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Ваш кабинет</span>
              </div>

              {/* GORGEOUS PREMIUM DEEP INDIGO PROFILE HERO CARD */}
              <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-5 rounded-[2.2rem] text-white shadow-xl border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Circular Avatar Frame */}
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-indigo-300 border border-white/10 shadow-sm shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-white text-sm tracking-tight leading-none">
                      {userName || "Гость"}
                    </h4>
                    <span className="text-[10.5px] text-indigo-200/70 font-mono block mt-1">
                      {onboarding.phone || "+7 (777) 777-77-77"}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5 bg-white/10 border border-white/5 px-2 py-0.5 rounded-md w-max">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                      <span className="text-[9px] font-black font-mono text-indigo-100">220 MedTariff бонусов</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-1 rounded-lg block font-mono">
                    ОСМС+
                  </span>
                </div>
              </div>

              {/* Premium Sub-Tab Switcher for cabinet vs loyalty */}
              <div className="bg-slate-200/60 p-1 rounded-2xl flex items-center shrink-0 border border-slate-200/40">
                <button
                  onClick={() => setProfileSubTab("cabinet")}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-center transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    profileSubTab === "cabinet"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Кабинет</span>
                </button>
                <button
                  onClick={() => setProfileSubTab("loyalty")}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-center transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    profileSubTab === "loyalty"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Лояльность</span>
                </button>
              </div>

              {/* SUB-TAB 1: ORIGINAL CABINET SETTINGS */}
              {profileSubTab === "cabinet" && (
                <>
                  {/* Grouped settings list with hairline borders (Screen 4 style) */}
                  <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-2xs divide-y divide-slate-100/80">
                    
                    {/* Option 1: Edit Profile / City */}
                    <button
                      onClick={() => setShowSettingsSheet(true)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Изменить личные данные</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">г. {onboarding.city} • Уведомления</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Option 2: Family */}
                    <button
                      onClick={() => setShowFamilySheet(true)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Моя семья</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {familyMembers.length === 0 ? "Не добавлено" : `${familyMembers.length} привязано`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Option 3: Appointments & OSMS with Ghost tracking indicator */}
                    {(() => {
                      const hasGhost = healthRecords.some(r => r.isGhost && !r.isVerified);
                      return (
                        <button
                          onClick={() => setShowRecordsSheet(true)}
                          className={`w-full px-5 py-4 flex items-center justify-between text-left transition cursor-pointer active:scale-[0.99] ${
                            hasGhost ? "bg-red-50/55 hover:bg-red-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${hasGhost ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600"}`}>
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Записи и контроль ОСМС</span>
                              <span className={`text-[9px] block mt-0.5 ${hasGhost ? "text-red-700 font-extrabold" : "text-slate-400"}`}>
                                {hasGhost ? "Обнаружена фиктивная приписка!" : `${healthRecords.length} записей`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasGhost && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />}
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </button>
                      );
                    })()}

                    {/* Option 4: Lab Results */}
                    <button
                      onClick={() => setShowLabSheet(true)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Анализы & Бланки</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{labResults.length} бланков доступно</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Option 5: Push notification toggle row */}
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Разрешить отправку уведомлений</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">SMS & Push рассылки</span>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </div>

                    {/* Option 6: Helpdesk / Problem */}
                    <button
                      onClick={() => alert("Техническая поддержка уведомлена. Спасибо за обратную связь!")}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-blue-700 block">Сообщить о технической проблеме</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Прямая связь с разработчиками</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>

                  {/* Informational Help Desk */}
                  <div className="bg-blue-50/40 border border-blue-100/60 rounded-[1.8rem] p-4 space-y-1.5 select-none text-left">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest block">
                      Единая база тарифов MedTariff.kz
                    </span>
                    <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                      Мы собираем официальные прайсы медицинских центров и лабораторий РК (TopDoc.kz, КДЛ Олимп, Invivo) и сопоставляем их с перечнем бесплатных услуг ОСМС для вашей экономии.
                    </p>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-1 shrink-0">
                    <button
                      onClick={handleSignOut}
                      className="w-full py-3.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100/40 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти из аккаунта
                    </button>
                  </div>
                </>
              )}

              {/* SUB-TAB 2: LOYALTY PROGRAM & DISCOUNTS */}
              {profileSubTab === "loyalty" && (
                <div className="space-y-4 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">
                    Программа лояльности и скидки
                  </span>

                  {/* GORGEOUS REFERRAL CARD (Neon Lime Green) */}
                  <div className="bg-[#B0FF00] p-4.5 rounded-[2rem] text-slate-950 shadow-xs border border-lime-400 flex flex-col justify-between min-h-[115px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="relative z-10 max-w-[75%] leading-tight">
                      <span className="text-[8.5px] font-mono uppercase tracking-widest text-slate-950/60 font-black block">Реферальный промокод</span>
                      <h4 className="text-base font-black text-slate-950 tracking-tight mt-1 mb-0.5">
                        +250 бонусов за друга
                      </h4>
                      <p className="text-[9.5px] text-slate-900/80 font-medium leading-tight">
                        Пригласите друга в MedTariff и получите баллы после его первого приема.
                      </p>
                    </div>

                    <div className="relative z-10 mt-3.5 pt-3 border-t border-slate-950/10 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-950/60 font-black">КОД: ONVI250</span>
                      <button
                        onClick={() => {
                          alert("Реферальный промокод ONVI250 успешно скопирован в буфер обмена!");
                        }}
                        className="bg-slate-950 hover:bg-slate-900 text-white text-[8.5px] font-black uppercase px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                      >
                        Скопировать
                      </button>
                    </div>
                  </div>

                  {/* Promos cards list */}
                  <div className="space-y-2.5">
                    {promos.map((promo) => (
                      <div
                        key={promo.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between text-left"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[8.5px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100/40">
                              {promo.type}
                            </span>
                            <span className="font-mono text-[10px] font-black text-slate-700 select-all bg-slate-100 px-2 py-0.5 rounded">
                              {promo.code}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-800 text-xs">
                            {promo.title}
                          </h4>
                          <p className="text-[9.5px] text-slate-400 leading-normal mt-0.5">
                            {promo.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] text-emerald-700 font-extrabold flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Активен в {onboarding.city}
                          </span>
                          
                          <button
                            onClick={() => {
                              handleTogglePromo(promo.id);
                              alert(promo.isActive ? "Купон отключен" : `Купон ${promo.code} активирован! Предложение учтено при поиске.`);
                            }}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                              promo.isActive
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold"
                                : "bg-slate-900 hover:bg-black text-white shadow-2xs"
                            }`}
                          >
                            {promo.isActive ? "Активирован" : "Активировать"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}



              {/* ========================================================== */}
              {/* SLIDE-UP SHEET 1: MY FAMILY MEMBERS                        */}
              {/* ========================================================== */}
              {showFamilySheet && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
                  <div className="fixed inset-0" onClick={() => setShowFamilySheet(false)} />
                  <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-slate-800">Привязанные члены семьи</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">При записи ИИН подставится автоматически</p>
                      </div>
                      <button 
                        onClick={() => setShowFamilySheet(false)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
                          Моя семья и дети ({familyMembers.length})
                        </span>
                        <button
                          onClick={() => {
                            setShowAddFamilyModal(true);
                          }}
                          className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-full transition cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Добавить ребенка / члена
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        {familyMembers.map((member) => (
                          <div key={member.id} className="bg-white border border-slate-200/80 rounded-2xl p-3.5 relative flex flex-col justify-between shadow-2xs hover:border-slate-300 transition text-left">
                            <div>
                              <span className="text-[8px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                                {member.relationship}
                              </span>
                              <h5 className="font-extrabold text-slate-800 text-xs mt-2.5 truncate">
                                {member.name}
                              </h5>
                              <p className="text-[9.5px] text-slate-400 mt-1 font-mono">
                                Возраст: {member.age} лет
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                ИИН: {member.iin.slice(0, 6)}******
                              </p>
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Привязан
                              </span>
                              <button
                                onClick={() => setFamilyMembers(prev => prev.filter(m => m.id !== member.id))}
                                className="text-slate-300 hover:text-red-500 p-1.5 transition cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {familyMembers.length === 0 && (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <Users className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                          <p className="text-xs font-semibold">Список членов семьи пуст</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SLIDE-UP SHEET 2: HEALTH APPOINTMENTS & ANTI-GHOST WRITER  */}
              {/* ========================================================== */}
              {showRecordsSheet && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
                  <div className="fixed inset-0" onClick={() => setShowRecordsSheet(false)} />
                  <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-slate-800">Мои записи & Направления</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Встроенный мониторинг фиктивных приписок (Дамумед/ОСМС)</p>
                      </div>
                      <button 
                        onClick={() => setShowRecordsSheet(false)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {healthRecords.map((record) => (
                        <div 
                          key={record.id} 
                          className={`border p-3.5 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs transition text-left ${
                            record.isGhost 
                              ? "bg-red-50/40 border-red-200/60" 
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9.5px] font-extrabold text-slate-700 font-mono">
                                  Пациент: {record.patientName}
                                </span>
                                {record.isVerified ? (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    Верифицировано
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5 animate-pulse">
                                    <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                    Неизвестный источник
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-slate-800 text-xs mt-2">{record.serviceName}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 font-semibold">{record.clinicName} • {record.date}</p>
                            </div>
                          </div>

                          {record.isGhost && (
                            <div className="bg-red-50 border border-red-200/60 p-3 rounded-xl flex items-center justify-between gap-3 text-left">
                              <div className="leading-snug">
                                <span className="text-[9.5px] font-black text-red-800 uppercase block">Подозрение на приписку!</span>
                                <span className="text-[8.5px] text-red-600 block mt-1 font-medium leading-relaxed">Вы не посещали эту клинику? Клиника могла нечестно отчитаться перед МинЗдравом, чтобы обналичить средства ОСМС.</span>
                              </div>
                              <button
                                onClick={() => {
                                  const confirmReport = window.confirm(`Отправить официальную жалобу в Фонд Социального Медстрахования (ФСМС) РК о фальшивой записи на "${record.serviceName}" в "${record.clinicName}"?`);
                                  if (confirmReport) {
                                    alert("Жалоба успешно отправлена! Принята в обработку Министерством Здравоохранения РК. Регистрационный номер жалобы: MZ-94821. Против клиники инициировано внеплановое расследование по факту приписки (фиктивного приема).");
                                    setHealthRecords(prev => prev.filter(r => r.id !== record.id));
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl transition shrink-0 cursor-pointer shadow-2xs active:scale-95"
                              >
                                Пожаловаться
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {healthRecords.length === 0 && (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <ShieldCheck className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                          <p className="text-xs font-semibold">Активных записей не найдено</p>
                        </div>
                      )}

                      {/* Action to report a custom suspicious entry from Damumed for testing */}
                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            const testClinics = ["Городская больница №2", "ПП №10 Астана", "Районный Медпункт", "МЦ Олимп (Филиал Сейфуллина)"];
                            const testServices = ["УЗИ почек", "Прием кардиолога (Фейк)", "КТ органов малого таза", "Общий анализ мочи"];
                            const randomClinic = testClinics[Math.floor(Math.random() * testClinics.length)];
                            const randomService = testServices[Math.floor(Math.random() * testServices.length)];
                            
                            setIsBookingSubmitting(true);
                            try {
                              await addDoc(collection(db, "appointments"), {
                                userId: currentUserUid || "guest-user",
                                patientName: userName !== "Гость" ? `${userName} (Вы)` : "Серик Смагулов (Вы)",
                                serviceName: randomService,
                                clinicName: randomClinic,
                                clinicId: "test-ghost-1",
                                price: 0,
                                tariff: "standard",
                                date: "3 дня назад",
                                phone: onboarding.phone || "+7 (777) 777-77-77",
                                isVerified: false,
                                isGhost: true,
                                status: "active",
                                createdAt: new Date().toISOString()
                              });
                              await fetchAppointments(currentUserUid || "guest-user");
                            } catch (err) {
                              console.error("Error creating test ghost appointment:", err);
                            } finally {
                              setIsBookingSubmitting(false);
                            }
                          }}
                          disabled={isBookingSubmitting}
                          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {isBookingSubmitting ? "Регистрация приписки..." : "🚨 Добавить приписку из Damumed для теста"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SLIDE-UP SHEET 3: LAB RESULTS & PDF BLANKS                 */}
              {/* ========================================================== */}
              {showLabSheet && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
                  <div className="fixed inset-0" onClick={() => setShowLabSheet(false)} />
                  <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-slate-800">Результаты анализов и PDF-бланки</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Официальные верифицированные бланки сетей КДЛ Олимп, Invivo</p>
                      </div>
                      <button 
                        onClick={() => setShowLabSheet(false)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                      {labResults.map((result) => (
                        <div 
                          key={result.id}
                          onClick={() => {
                            if (result.status === "Готов") {
                              setSelectedResult(result);
                            }
                          }}
                          className={`bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between transition shadow-2xs text-left ${
                            result.status === "Готов" ? "hover:border-blue-300 cursor-pointer active:scale-98" : "opacity-75"
                          }`}
                        >
                          <div className="leading-tight">
                            <span className="text-[8px] font-bold text-slate-400 font-mono">
                              Код заказа: {result.code}
                            </span>
                            <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">{result.testName}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                              Пациент: {result.patientName} • {result.labName}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 block mt-1.5">Дата: {result.date}</span>
                          </div>
                          
                          <div>
                            {result.status === "Готов" ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                                  Готов
                                </span>
                                <span className="text-[8px] text-blue-600 font-black flex items-center gap-0.5 mt-1.5">
                                  <Download className="w-3 h-3 text-blue-500" />
                                  Бланк
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-wider animate-pulse">
                                В работе
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {labResults.length === 0 && (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <FileText className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                          <p className="text-xs font-semibold">Результатов анализов пока нет</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SLIDE-UP SHEET 4: APP SETTINGS                             */}
              {/* ========================================================== */}
              {showSettingsSheet && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
                  <div className="fixed inset-0" onClick={() => setShowSettingsSheet(false)} />
                  <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-slate-800">Настройки кабинета</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Управление профилем, уведомлениями и геолокацией</p>
                      </div>
                      <button 
                        onClick={() => setShowSettingsSheet(false)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 space-y-4">
                      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Разрешить отправку SMS и Push-уведомлений</span>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setOnboarding(prev => ({ ...prev, isCompleted: false }));
                            setShowSettingsSheet(false);
                          }}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
                        >
                          <span className="text-xs font-bold text-slate-700">Сменить город обслуживания</span>
                          <span className="text-[10px] text-blue-700 font-black bg-blue-50 px-2.5 py-1 rounded-md font-mono">
                            {onboarding.city}
                          </span>
                        </button>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">О системе MedTariff</span>
                          <span className="text-[10px] text-slate-400 font-mono">v1.5.0 • Мобильная версия</span>
                        </div>

                        <button 
                          onClick={() => alert("Техническая поддержка уведомлена. Спасибо за обратную связь!")}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
                        >
                          <span className="text-xs font-extrabold text-blue-700">Сообщить о технической проблеме</span>
                          <ChevronRight className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* ======================================================== */}
          {/* SLIDE-UP DETAILED SHEET (Screen 6 / 7 details simulator) */}
          {/* ======================================================== */}
          {selectedClinic && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              {/* Tap backdrop to close */}
              <div className="flex-1" onClick={() => setSelectedClinic(null)} />
              
              {/* Detailed Slide-up Container */}
              <div className="bg-white rounded-t-[32px] max-h-[90%] overflow-y-auto p-5 space-y-4 shadow-2xl border-t border-slate-200/80 animate-slide-up select-none">
                
                {/* Drag bar decoration */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" onClick={() => setSelectedClinic(null)} />

                {/* Main Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                      {searchQuery || "Медицинская услуга"}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1 leading-snug">
                      {selectedClinic.name}
                    </h3>
                  </div>
                  
                  {/* Status Badges */}
                  {selectedClinic.osms ? (
                    <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                      ОСМС Бесплатно
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                      Платная
                    </span>
                  )}
                </div>

                {/* Badges strip (Screen 6 details style with clean minimal text) */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                    бесплатная парковка
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                    купон активен
                  </span>
                </div>

                {/* Subtitle / Contacts */}
                <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedClinic.address} • <span className="font-semibold text-slate-700">{selectedClinic.district}</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedClinic.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      <span className="font-bold text-slate-700 text-xs">{selectedClinic.rating}</span>
                    </div>
                  </div>
                </div>

                {/* TARIFF / PRICE PACKAGES - Screen 6 / 8 details layout replica with horizontal selectors */}
                <div className="space-y-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Выберите тариф обслуживания
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-md">
                      3 варианта
                    </span>
                  </div>

                  {/* Horizontal Segmented Grid Selectors */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* TARIFF A: EXPRESS */}
                    <div
                      onClick={() => setSelectedTariff("express")}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 text-center cursor-pointer flex flex-col justify-between min-h-[90px] active:scale-95 ${
                        selectedTariff === "express"
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                          : "border-slate-100/80 bg-slate-50/50 text-slate-800 hover:border-slate-200"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedTariff === "express" ? "text-blue-100" : "text-slate-400"}`}>
                        Экспресс
                      </span>
                      <div className="my-1.5">
                        <span className="text-sm font-black tracking-tight block">
                          {Math.round(selectedClinic.price * 1.3).toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-bold ${selectedTariff === "express" ? "text-blue-100" : "text-slate-500"}`}>₸</span>
                      </div>
                      <span className={`text-[8px] font-semibold block ${selectedTariff === "express" ? "text-blue-200" : "text-slate-400"}`}>
                        3 часа
                      </span>
                    </div>

                    {/* TARIFF B: STANDARD */}
                    <div
                      onClick={() => setSelectedTariff("standard")}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 text-center cursor-pointer flex flex-col justify-between min-h-[90px] active:scale-95 ${
                        selectedTariff === "standard"
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                          : "border-slate-100/80 bg-slate-50/50 text-slate-800 hover:border-slate-200"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedTariff === "standard" ? "text-blue-100" : "text-slate-400"}`}>
                        Стандарт
                      </span>
                      <div className="my-1.5">
                        <span className="text-sm font-black tracking-tight block">
                          {selectedClinic.price.toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-bold ${selectedTariff === "standard" ? "text-blue-100" : "text-slate-500"}`}>₸</span>
                      </div>
                      <span className={`text-[8px] font-semibold block ${selectedTariff === "standard" ? "text-blue-200" : "text-slate-400"}`}>
                        24 часа
                      </span>
                    </div>

                    {/* TARIFF C: PREMIUM */}
                    <div
                      onClick={() => setSelectedTariff("premium")}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 text-center cursor-pointer flex flex-col justify-between min-h-[90px] active:scale-95 ${
                        selectedTariff === "premium"
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                          : "border-slate-100/80 bg-slate-50/50 text-slate-800 hover:border-slate-200"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedTariff === "premium" ? "text-blue-100" : "text-slate-400"}`}>
                        Премиум
                      </span>
                      <div className="my-1.5">
                        <span className="text-sm font-black tracking-tight block">
                          {Math.round(selectedClinic.price * 1.6).toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-bold ${selectedTariff === "premium" ? "text-blue-100" : "text-slate-500"}`}>₸</span>
                      </div>
                      <span className={`text-[8px] font-semibold block ${selectedTariff === "premium" ? "text-blue-200" : "text-slate-400"}`}>
                        12 часов
                      </span>
                    </div>
                  </div>

                  {/* Dynamic detailed explanation card */}
                  <div className="transition-all duration-300">
                    {selectedTariff === "express" && (
                      <div className="flex gap-3 bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl text-left shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 text-lg shadow-2xs">
                          ⚡
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-[10.5px] text-amber-900 uppercase tracking-wider">Тариф Экспресс</h4>
                          <p className="text-[10px] text-amber-800 leading-normal font-medium">
                            Срочное выполнение в приоритетной очереди. Полный протокол расшифровки будет отправлен по СМС и доступен в личном кабинете уже через 3 часа.
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedTariff === "standard" && (
                      <div className="flex gap-3 bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl text-left shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#007EFA] shrink-0 text-lg shadow-2xs">
                          📋
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-[10.5px] text-slate-800 uppercase tracking-wider">Тариф Стандарт</h4>
                          <p className="text-[10px] text-slate-600 leading-normal font-medium">
                            Оптимальный выбор. Классическое медицинское исследование в течение суток. Протокол заверен ведущим радиологом клиники.
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedTariff === "premium" && (
                      <div className="flex gap-3 bg-gradient-to-br from-violet-50 to-indigo-50/50 border border-violet-100 p-3.5 rounded-2xl text-left relative overflow-hidden shadow-2xs">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-violet-200/25 rounded-full blur-xl pointer-events-none" />
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 text-lg shadow-2xs relative z-10">
                          🤖
                        </div>
                        <div className="space-y-0.5 relative z-10">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-[10.5px] text-violet-950 uppercase tracking-wider">Тариф Премиум</h4>
                            <span className="text-[7.5px] bg-violet-600 text-white font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">ИИ-Решение</span>
                          </div>
                          <p className="text-[10px] text-slate-700 leading-normal font-medium">
                            Максимальная точность. Включает <span className="text-violet-900 font-extrabold">двойное чтение</span> снимка, детальное <span className="text-violet-900 font-extrabold">ИИ-распознавание патологий</span> и персональные рекомендации от профессора медицины.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTAs booking route */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => {
                      setIsRoutingActive(true);
                      setViewMode("map");
                      setActiveMarkerId(selectedClinic.id);
                      setSelectedClinic(null);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Маршрут ({selectedClinic.distance})
                  </button>
                  <button
                    onClick={() => {
                      // Pre-populate booking info
                      setBookingPatientName(userName !== "Гость" ? userName : "");
                      setBookingPhone(onboarding.phone || "");
                      
                      // Calculate default date (tomorrow at 10:00)
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(10, 0, 0, 0);
                      setBookingDate(tomorrow.toISOString().slice(0, 16));
                      
                      setBookingDoctor(null);
                      setBookingSuccessData(null);
                      setShowBookingSheet(true);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Записаться
                  </button>
                </div>

                {/* Dismiss details button */}
                <button
                  onClick={() => setSelectedClinic(null)}
                  className="w-full py-2 text-center text-[10px] text-slate-400 hover:text-slate-600 transition"
                >
                  Закрыть описание
                </button>

              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SLIDE-UP SHEET: BOOKING APPOINTMENT FORM (Firestore Write) */}
          {/* ========================================================== */}
          {showBookingSheet && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="fixed inset-0" onClick={() => setShowBookingSheet(false)} />
              <div className="bg-white w-full rounded-t-[32px] max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100 select-none">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-slate-800">Запись на прием</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {bookingDoctor 
                        ? `Специалист: ${bookingDoctor.name}` 
                        : selectedClinic 
                        ? `${selectedClinic.name} • Тариф "${selectedTariff === "express" ? "Экспресс" : selectedTariff === "premium" ? "Премиум" : "Стандарт"}"`
                        : "Оформление записи"
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowBookingSheet(false)}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {bookingSuccessData ? (
                    /* Beautiful Success Panel */
                    <div className="text-center py-6 space-y-4 animate-fade-in text-left">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 text-base">Вы успешно записаны!</h4>
                        <p className="text-xs text-slate-500 font-medium">Ваша запись внесена в государственную систему и сохранена в Firestore.</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2.5 text-left font-mono text-[10.5px] text-slate-700">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">Пациент:</span>
                          <span className="font-bold text-slate-800">{bookingSuccessData.patientName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">Услуга:</span>
                          <span className="font-bold text-slate-800">{bookingSuccessData.serviceName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">Место:</span>
                          <span className="font-bold text-slate-800 text-right max-w-[180px] truncate">{bookingSuccessData.clinicName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">Дата приема:</span>
                          <span className="font-bold text-slate-800">{new Date(bookingSuccessData.date).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Контакты:</span>
                          <span className="font-bold text-slate-800">{bookingSuccessData.phone}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/40 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-[10px] leading-relaxed font-semibold">
                        В ближайшие 15 минут с вами свяжется дежурный администратор медицинского учреждения для верификации и отправки СМС-талона.
                      </div>

                      <button
                        onClick={() => {
                          setShowBookingSheet(false);
                          setShowRecordsSheet(true);
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase transition shadow-md"
                      >
                        Перейти к моим записям
                      </button>
                    </div>
                  ) : (
                    /* Active booking form */
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!bookingPatientName || !bookingPhone || !bookingDate) {
                          alert("Пожалуйста, заполните все поля формы.");
                          return;
                        }
                        setIsBookingSubmitting(true);
                        try {
                          const serviceTitle = bookingDoctor 
                            ? `Прием врача: ${bookingDoctor.specialty}` 
                            : (searchQuery || "Консультация врача/Процедура");

                          const locationTitle = bookingDoctor 
                            ? bookingDoctor.clinic 
                            : (selectedClinic ? selectedClinic.name : "Медицинский центр");

                          const ticketData = {
                            userId: currentUserUid || "guest-user",
                            patientName: bookingPatientName,
                            serviceName: serviceTitle,
                            clinicName: locationTitle,
                            clinicId: selectedClinic ? selectedClinic.id : (bookingDoctor ? bookingDoctor.id : "unknown"),
                            price: bookingDoctor ? bookingDoctor.price : (selectedClinic ? selectedClinic.price : 0),
                            tariff: selectedTariff,
                            date: bookingDate,
                            phone: bookingPhone,
                            isVerified: true,
                            isGhost: false,
                            status: "active",
                            createdAt: new Date().toISOString()
                          };

                          // Write directly to Firebase Firestore collections
                          await addDoc(collection(db, "appointments"), ticketData);
                          
                          // Trigger silent refetch
                          await fetchAppointments(currentUserUid || "guest-user");

                          // Hide booking sheet immediately and open records sheet
                          setShowBookingSheet(false);
                          setShowRecordsSheet(true);
                          
                          // Reset booking specific states
                          setBookingDoctor(null);
                          setBookingSuccessData(null);

                          alert(`Вы успешно записаны на прием!\n\nСпециалист: ${ticketData.serviceName}\nМесто: ${ticketData.clinicName}\nДата: ${new Date(ticketData.date).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}\n\nЗапись сохранена в системе.`);
                        } catch (err) {
                          console.error("Booking write error:", err);
                          alert("Ошибка при сохранении записи. Пожалуйста, попробуйте снова.");
                        } finally {
                          setIsBookingSubmitting(false);
                        }
                      }}
                      className="space-y-4 text-left"
                    >
                      {/* Onboarding automatic sync banner */}
                      {onboarding.phone && (
                        <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-2xl flex items-center justify-between gap-3">
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold text-blue-800 block">Профиль синхронизирован</span>
                            <span className="text-[8.5px] text-blue-500 block mt-0.5">Данные ФИО и телефона подставлены автоматически</span>
                          </div>
                          <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Удобно
                          </span>
                        </div>
                      )}

                      {/* Input: FIO */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">ФИО Пациента</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Иванов Иван Иванович"
                            value={bookingPatientName}
                            onChange={(e) => setBookingPatientName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                          />
                          {userName !== "Гость" && bookingPatientName !== userName && (
                            <button
                              type="button"
                              onClick={() => setBookingPatientName(userName)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-slate-200/80 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-bold uppercase transition"
                            >
                              Своё ФИО
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Input: Phone */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Контактный телефон</label>
                        <input
                          type="tel"
                          required
                          placeholder="+7 (777) 777-77-77"
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      {/* Input: Date and Time */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Желаемая дата & время</label>
                        <input
                          type="datetime-local"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      {/* Diagnostic summary banner */}
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-1 select-none">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Правила верификации ОСМС</span>
                        <p className="text-[9.5px] leading-relaxed text-slate-500 font-medium">
                          Запись бронируется бесплатно. Клиника не имеет права взимать оплату, если вы имеете действующий статус ОСМС застрахованности и получили направление терапевта.
                        </p>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isBookingSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <Check className="w-4 h-4" />
                        {isBookingSubmitting ? "Отправка в Firestore..." : "Подтвердить запись"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SLIDE-UP SHEET: BLOG CORNER (Educational Content)        */}
          {/* ========================================================== */}
          {showBlogSheet && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="fixed inset-0" onClick={() => setShowBlogSheet(false)} />
              <div className="bg-slate-50 w-full rounded-t-[32px] max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100 select-none">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white">
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-slate-800">Блог & Лайфхаки ОСМС</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Полезные статьи о бесплатной медицине и ваших правах в РК</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowBlogSheet(false);
                      setSelectedBlogArticle(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Article Detailed or List scroll */}
                <div className="flex-1 overflow-y-auto p-5">
                  {selectedBlogArticle ? (
                    /* Detailed article view */
                    <div className="space-y-4 animate-fade-in text-left">
                      <button
                        type="button"
                        onClick={() => setSelectedBlogArticle(null)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition cursor-pointer active:scale-95"
                      >
                        ← Вернуться к списку
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">{selectedBlogArticle.category}</span>
                          <span className="text-[9px] text-slate-400 font-medium">{selectedBlogArticle.readTime} чтение</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-base leading-snug">{selectedBlogArticle.title}</h4>
                        <span className="text-[9px] text-slate-400 font-mono block">{selectedBlogArticle.date}</span>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed space-y-3 font-medium whitespace-pre-line border-t border-slate-100 pt-3">
                        {selectedBlogArticle.content}
                      </div>

                      <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 space-y-2 mt-4">
                        <span className="text-[9.5px] font-black text-blue-800 uppercase tracking-widest block">Совет MedTariff:</span>
                        <p className="text-[10px] leading-relaxed text-slate-600 font-semibold">
                          Используйте калькулятор ОСМС и карту бесплатных клиник на вкладке «Поиск», чтобы найти лучших партнеров Фонда Социального Медстрахования.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* List of articles */
                    <div className="space-y-3.5 text-left">
                      {BLOG_ARTICLES.map((article) => (
                        <div
                          key={article.id}
                          onClick={() => setSelectedBlogArticle(article)}
                          className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-2xl shadow-2xs transition cursor-pointer group hover:shadow-xs active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[8.5px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">{article.category}</span>
                            <span className="text-[8.5px] text-slate-400 font-semibold">{article.readTime} чтение</span>
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-xs leading-snug group-hover:text-blue-900 transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-50 text-[9.5px]">
                            <span className="text-slate-400 font-mono">{article.date}</span>
                            <span className="font-bold text-blue-600 group-hover:text-blue-800 flex items-center gap-0.5">Читать статью →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* PREMIUM DOCTOR PROFILE COMPONENT LAYER */}
          {/* ========================================================== */}
          {selectedDoctor && (() => {
            const docBrandColors = (clinicName: string) => {
              const lower = clinicName.toLowerCase();
              if (lower.includes("олимп") || lower.includes("olymp")) {
                return {
                  from: "from-emerald-500",
                  to: "to-teal-600",
                  bg: "bg-emerald-500",
                  text: "text-emerald-600",
                  light: "bg-emerald-50"
                };
              }
              if (lower.includes("инвиво") || lower.includes("invivo")) {
                return {
                  from: "from-cyan-400",
                  to: "to-indigo-500",
                  bg: "bg-cyan-500",
                  text: "text-indigo-600",
                  light: "bg-cyan-50"
                };
              }
              if (lower.includes("сункар") || lower.includes("sunkar")) {
                return {
                  from: "from-amber-400",
                  to: "to-orange-500",
                  bg: "bg-amber-500",
                  text: "text-orange-600",
                  light: "bg-amber-50"
                };
              }
              if (lower.includes("orhun") || lower.includes("орхун")) {
                return {
                  from: "from-rose-500",
                  to: "to-red-600",
                  bg: "bg-rose-500",
                  text: "text-rose-600",
                  light: "bg-rose-50"
                };
              }
              if (lower.includes("хак") || lower.includes("hak")) {
                return {
                  from: "from-blue-500",
                  to: "to-indigo-600",
                  bg: "bg-blue-600",
                  text: "text-indigo-600",
                  light: "bg-blue-50"
                };
              }
              if (lower.includes("керуен") || lower.includes("keruen")) {
                return {
                  from: "from-purple-500",
                  to: "to-fuchsia-600",
                  bg: "bg-purple-500",
                  text: "text-purple-600",
                  light: "bg-purple-50"
                };
              }
              return {
                from: "from-[#1B449C]",
                to: "to-indigo-700",
                bg: "bg-[#1B449C]",
                text: "text-[#1B449C]",
                light: "bg-indigo-50"
              };
            };

            const colors = docBrandColors(selectedDoctor.clinic);

            const daysOfWeekList = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const next7DaysList = Array.from({ length: 7 }, (_, idx) => {
              const d = new Date();
              d.setDate(d.getDate() + idx);
              return {
                dayName: daysOfWeekList[d.getDay()],
                dayNum: d.getDate(),
                dateString: d.toISOString().split("T")[0]
              };
            });

            const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
            const afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
            const activeSlots = timePeriod === "morning" ? morningSlots : afternoonSlots;

            return (
              <div className="fixed inset-0 bg-[#F4F7FE] z-50 flex flex-col overflow-y-auto no-scrollbar animate-fade-in text-left">
                {/* Header matching mock-up screen exactly */}
                <div className="sticky top-0 bg-[#F4F7FE]/90 backdrop-blur-md px-5 py-4 flex items-center justify-between z-10">
                  <button 
                    onClick={() => setSelectedDoctor(null)}
                    className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-3xs transition active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Doctor Details</span>
                  <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Main scrollable body */}
                <div className="flex-1 px-5 pb-28 space-y-6">
                  
                  {/* Photo Hero Banner Card with elegant cutout layout and transferred brand colors */}
                  <div className="relative bg-white rounded-[32px] p-6 shadow-sm border border-slate-100/60 overflow-hidden min-h-[220px] flex flex-col justify-center">
                    
                    {/* Background Soft Radial Gradient Accent carrying the brand colors */}
                    <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full filter blur-3xl opacity-20 bg-gradient-to-tr ${colors.from} ${colors.to}`} />
                    
                    <div className="relative z-10 max-w-[60%] space-y-3.5 pr-2">
                      {/* Premium Specialty Badge */}
                      <span className={`inline-block px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${colors.light} ${colors.text} border border-slate-100`}>
                        {selectedDoctor.specialty.split(",")[0].split(" ")[0]}
                      </span>

                      {/* Display big typography name */}
                      <h2 className="font-sans font-black text-slate-800 text-2xl tracking-tight leading-none">
                        {selectedDoctor.name}
                      </h2>

                      {/* Professional Price layout */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-800 font-mono">
                          {selectedDoctor.price.toLocaleString()} ₸
                        </span>
                        <span className="text-slate-400 text-[10px] font-bold">/Прием</span>
                      </div>
                    </div>

                    {/* Dr cutout absolute positioning to the right */}
                    <div className="absolute bottom-0 right-0 w-[42%] h-full flex items-end justify-center pointer-events-none z-0">
                      <img 
                        src={selectedDoctor.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80"} 
                        alt={selectedDoctor.name} 
                        className="h-[95%] w-auto object-contain object-bottom transition-all duration-300 scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedDoctor.name)}`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Rating & Stats Cards Grid (4 boxes like in the mockups) */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100/80 shadow-3xs text-center space-y-1">
                      <span className="text-[14px] font-black text-slate-800 block leading-none">
                        {selectedDoctor.experience.replace(/[^0-9]/g, "")}+
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight block">Стаж</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-100/80 shadow-3xs text-center space-y-1">
                      <span className="text-[14px] font-black text-slate-800 block leading-none">
                        {Math.floor(selectedDoctor.reviews * 4.5)}+
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight block">Пациенты</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-100/80 shadow-3xs text-center space-y-1">
                      <span className="text-[14px] font-black text-slate-800 block leading-none">
                        {selectedDoctor.reviews}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight block">Отзывы</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-100/80 shadow-3xs text-center space-y-1">
                      <span className="text-[14px] font-black text-amber-500 flex items-center justify-center gap-0.5 leading-none">
                        ★ {selectedDoctor.rating.toFixed(1)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight block">Рейтинг</span>
                    </div>
                  </div>

                  {/* Choose a Date (Interactive Horizontal Calendar Slider) */}
                  <div className="space-y-3">
                    <h3 className="font-sans font-black text-slate-800 text-sm tracking-tight">Choose a date</h3>
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                      {next7DaysList.map((day, dIdx) => {
                        const isDaySelected = selectedDayIndex === dIdx;
                        return (
                          <button
                            key={dIdx}
                            onClick={() => setSelectedDayIndex(dIdx)}
                            className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl shrink-0 transition-all duration-300 border ${
                              isDaySelected
                                ? `bg-gradient-to-b ${colors.from} ${colors.to} text-white shadow-md border-transparent scale-105`
                                : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50/50"
                            }`}
                          >
                            <span className={`text-[9.5px] uppercase font-black tracking-wider ${isDaySelected ? "text-white/80" : "text-slate-400"}`}>
                              {day.dayName}
                            </span>
                            <span className="text-base font-black font-mono leading-none mt-1.5">
                              {day.dayNum}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Choose a Suitable Time with morning/afternoon period selectors & hour buttons */}
                  <div className="space-y-3.5 bg-slate-100/60 p-4.5 rounded-[28px] border border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black text-slate-800">
                          {timePeriod === "morning" ? "Утро / День" : "После обеда"}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-black font-mono tracking-wider px-2 py-0.5 rounded-full uppercase ml-1">
                          • {activeSlots.length} слотов
                        </span>
                      </div>

                      {/* Period Switcher */}
                      <div className="bg-white p-0.5 rounded-xl flex items-center border border-slate-200 shrink-0">
                        <button
                          onClick={() => {
                            setTimePeriod("morning");
                            setSelectedTimeSlot("10:30");
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition ${
                            timePeriod === "morning" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Утро
                        </button>
                        <button
                          onClick={() => {
                            setTimePeriod("afternoon");
                            setSelectedTimeSlot("15:30");
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition ${
                            timePeriod === "afternoon" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Обед
                        </button>
                      </div>
                    </div>

                    {/* Hour buttons grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {activeSlots.map((slot) => {
                        const isSlotSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-3.5 rounded-2xl text-[11px] font-black font-mono transition-all duration-200 border ${
                              isSlotSelected
                                ? "bg-[#0D1B3E] text-white border-transparent scale-105 shadow-md shadow-slate-900/15"
                                : "bg-white hover:bg-slate-50 border-slate-100 text-slate-700"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* About and qualifications (below the scheduler) */}
                  <div className="bg-white p-5 rounded-[28px] border border-slate-100/60 shadow-3xs space-y-4">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight">О враче</h3>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-2xl">
                      {selectedDoctor.bio}
                    </p>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="font-bold text-[11.5px] text-slate-800 uppercase tracking-tight">Квалификация</h4>
                      <div className="space-y-2 text-[10.5px] text-slate-600 leading-relaxed font-medium">
                        <div className="flex gap-2.5 items-start">
                          <Award className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`} />
                          <p>{selectedDoctor.qualifications}</p>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <GraduationCap className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                          <p>{selectedDoctor.academicBackground}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient reviews */}
                  <div className="bg-white p-5 rounded-[28px] border border-slate-100/60 shadow-3xs space-y-4">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                      Отзывы пациентов ({selectedDoctor.reviewsList?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {(!selectedDoctor.reviewsList || selectedDoctor.reviewsList.length === 0) ? (
                        <p className="text-[10px] text-slate-400 font-medium text-center py-2">Пока нет отзывов.</p>
                      ) : (
                        selectedDoctor.reviewsList.map((review: any, rIdx: number) => (
                          <div key={rIdx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/60 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-[11px] text-slate-800">{review.name}</span>
                              <div className="flex gap-0.5 text-amber-500 text-[10px] font-bold">
                                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{review.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Sticky book now call-to-action button matching mockup */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100/60 p-4.5 z-20 max-w-md mx-auto rounded-t-[32px] shadow-lg">
                  <button 
                    onClick={() => {
                      setBookingPatientName(userName !== "Гость" ? userName : "");
                      setBookingPhone(onboarding.phone || "");
                      
                      // Combine selected day date and time slot 
                      const chosenDate = next7DaysList[selectedDayIndex].dateString;
                      setBookingDate(`${chosenDate}T${selectedTimeSlot}`);
                      
                      setBookingDoctor(selectedDoctor);
                      setBookingSuccessData(null);
                      setShowBookingSheet(true);
                    }}
                    className={`w-full py-4.5 bg-gradient-to-r ${colors.from} ${colors.to} hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg active:scale-98 transition flex items-center justify-center gap-2`}
                  >
                    <Calendar className="w-4 h-4" />
                    Записаться на {next7DaysList[selectedDayIndex].dayNum} {next7DaysList[selectedDayIndex].dayName} в {selectedTimeSlot}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ========================================================== */}
          {/* SLIDE-UP SHEET: BEST DOCTORS OF 2026 (Nominees Corner)  */}
          {/* ========================================================== */}
          {showBestDoctorSheet && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="fixed inset-0" onClick={() => setShowBestDoctorSheet(false)} />
              <div className="bg-slate-50 w-full rounded-t-[32px] max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slide-up shadow-2xl border-t border-slate-100 select-none">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white">
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-slate-800">Лучший доктор 2026</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ежегодная народная премия лучших специалистов клиник-партнеров</p>
                  </div>
                  <button 
                    onClick={() => setShowBestDoctorSheet(false)}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-200/60 hover:bg-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* List scroll */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {BEST_DOCTORS.map((docItem) => (
                    <div
                      key={docItem.id}
                      onClick={() => {
                        setSelectedDoctor(docItem);
                        setShowBestDoctorSheet(false);
                      }}
                      className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex flex-col gap-3 text-left hover:border-amber-300 transition cursor-pointer active:scale-98"
                    >
                      {/* Avatar and metadata */}
                      <div className="flex gap-3">
                        <div className={`w-11 h-11 ${docItem.avatarColor} text-white rounded-2xl flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm`}>
                          {docItem.name.split(" ").slice(1).map(n => n[0]).join("") || docItem.name[0]}
                        </div>
                        <div className="leading-snug">
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> Номинант 2026
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-xs mt-1">{docItem.name}</h4>
                          <p className="text-[9.5px] text-blue-700 font-bold">{docItem.specialty}</p>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {docItem.bio}
                      </p>

                      {/* Info grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold border-t border-b border-slate-100 py-2 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase font-bold">Опыт</span>
                          <span className="text-slate-700 font-extrabold">{docItem.experience}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase font-bold">Рейтинг</span>
                          <span className="text-amber-600 font-extrabold flex items-center justify-center gap-0.5">
                            ★ {docItem.rating.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase font-bold">Отзывы</span>
                          <span className="text-slate-700 font-extrabold">{docItem.reviews}</span>
                        </div>
                      </div>

                      {/* Footer booking action */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase font-bold">Стоимость приема</span>
                          <span className="font-black text-slate-800 text-sm">{docItem.price.toLocaleString()} ₸</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setBookingPatientName(userName !== "Гость" ? userName : "");
                            setBookingPhone(onboarding.phone || "");
                            
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(14, 0, 0, 0);
                            setBookingDate(tomorrow.toISOString().slice(0, 16));
                            
                            setBookingDoctor(docItem);
                            setBookingSuccessData(null);
                            setShowBookingSheet(true);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                        >
                          Записаться
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* City Switcher Modal Overlay */}
          {showCityModal && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="bg-white rounded-t-[2rem] p-6 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-100 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-sans font-black text-slate-800 text-sm">Выберите ваш город</h3>
                    <p className="text-[9px] text-slate-400 font-mono">АКТУАЛЬНЫЕ ТАРИФЫ КАЗАХСТАНА</p>
                  </div>
                  <button
                    onClick={() => setShowCityModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: "Алматы", desc: "Южная столица, крупнейший мегаполис" },
                    { name: "Астана", desc: "Столица Казахстана, административный центр" },
                    { name: "Шымкент", desc: "Мегаполис на юге, индустриальный хаб" },
                    { name: "Караганда", desc: "Центральный Казахстан, шахтерская столица" },
                    { name: "Актобе", desc: "Западный Казахстан, промышленный центр" },
                    { name: "Павлодар", desc: "Северный Казахстан, научный и технический узел" }
                  ].map((c) => {
                    const isSelected = onboarding.city === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => {
                          setOnboarding(prev => ({ ...prev, city: c.name }));
                          executeSearch(searchQuery, c.name);
                          setShowCityModal(false);
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 active:scale-98 cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/40 font-extrabold text-blue-900 ring-1 ring-blue-500/20"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">{c.name}</span>
                           <span className="text-[10px] text-slate-400 mt-0.5 block leading-none">{c.desc}</span>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Add Family Member Modal Overlay */}
          {showAddFamilyModal && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="bg-white rounded-t-[2rem] p-6 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-100 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-sans font-black text-slate-800 text-sm">Добавить члена семьи</h3>
                    <p className="text-[9px] text-slate-400 font-mono">ПРИВЯЗКА ИИН К МЕДИЦИНСКОЙ КАРТЕ</p>
                  </div>
                  <button
                    onClick={() => setShowAddFamilyModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ФИО родственника</label>
                    <input
                      type="text"
                      placeholder="Иванов Александр Сергеевич"
                      value={newFamName}
                      onChange={(e) => setNewFamName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Связь</label>
                      <select
                        value={newFamRelation}
                        onChange={(e) => setNewFamRelation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                      >
                        <option value="Дочь">Дочь</option>
                        <option value="Сын">Сын</option>
                        <option value="Супруг(а)">Супруг(а)</option>
                        <option value="Мама">Мама</option>
                        <option value="Папа">Папа</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Возраст (лет)</label>
                      <input
                        type="number"
                        placeholder="8"
                        value={newFamAge}
                        onChange={(e) => setNewFamAge(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ИИН (12 цифр)</label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="181024654321"
                      value={newFamIin}
                      onChange={(e) => setNewFamIin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newFamName || !newFamAge || !newFamIin) {
                        alert("Пожалуйста, заполните все поля!");
                        return;
                      }
                      if (newFamIin.length !== 12) {
                        alert("ИИН должен состоять ровно из 12 цифр!");
                        return;
                      }
                      setFamilyMembers(prev => [
                        ...prev,
                        {
                          id: `fam-${Date.now()}`,
                          name: newFamName,
                          relationship: newFamRelation,
                          age: parseInt(newFamAge),
                          iin: newFamIin
                        }
                      ]);
                      setNewFamName("");
                      setNewFamAge("");
                      setNewFamIin("");
                      setShowAddFamilyModal(false);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Привязать карту в 1 клик
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Laboratory PDF Blank Modal */}
          {selectedResult && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex flex-col justify-end">
              <div className="bg-white rounded-t-[2.5rem] p-6 max-h-[92vh] overflow-y-auto shadow-2xl border-t border-slate-200 flex flex-col justify-between space-y-4 animate-slide-up select-none animate-slide-up">
                
                {/* PDF Header with Clinical Branding */}
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                      {selectedResult.labName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xs font-sans uppercase tracking-tight">{selectedResult.labName}</h4>
                      <p className="text-[8px] text-slate-400 font-mono">РЕФЕРЕНСНЫЙ МЕДИЦИНСКИЙ ЛИСТ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Patient / Referral info metadata */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[10px] grid grid-cols-2 gap-y-1.5 gap-x-3 text-slate-600 font-medium">
                  <div>Пациент: <span className="text-slate-900 font-bold">{selectedResult.patientName}</span></div>
                  <div>Дата анализа: <span className="text-slate-900 font-bold">{selectedResult.date}</span></div>
                  <div>Код бланка: <span className="text-slate-900 font-bold font-mono text-[9px]">{selectedResult.code}</span></div>
                  <div>Статус: <span className="text-emerald-700 font-bold uppercase">ОФИЦИАЛЬНЫЙ • ОДОБРЕНО</span></div>
                </div>

                {/* Analytical Results Table */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-3 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100 pb-1.5 px-1 font-mono">
                    <span>Показатель</span>
                    <span className="text-center">Результат</span>
                    <span className="text-right">Референтные значения</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {selectedResult.items && selectedResult.items.map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-3 text-xs py-2 px-1 font-semibold text-slate-700">
                        <span>{item.name}</span>
                        <span className="text-center text-blue-900 font-extrabold">{item.value}</span>
                        <span className="text-right text-slate-400 font-mono">{item.ref}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stamped Clinical Verification Section */}
                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl flex items-center justify-between gap-3 pt-3">
                  <div className="space-y-0.5 leading-snug">
                    <span className="text-[9px] font-bold text-blue-900 block uppercase">Врач лабораторной диагностики</span>
                    <span className="text-[9px] text-slate-500 block font-semibold">Абишева Г.К.</span>
                    <span className="text-[8px] text-slate-400 block font-mono">Штрихкод зарегистрирован в МинЗдрав РК</span>
                  </div>
                  
                  {/* Wet stamp rendering simulated */}
                  <div className="w-16 h-16 rounded-full border-3 border-blue-500/60 flex flex-col items-center justify-center relative rotate-12 shrink-0">
                    <span className="text-[7px] font-black text-blue-500/70 uppercase text-center leading-[1.1] scale-90">
                      КДЛ ОЛИМП<br/>ДЛЯ СПРАВОК<br/>ОТДЕЛ №2
                    </span>
                    <div className="absolute inset-1.5 border border-dashed border-blue-500/40 rounded-full" />
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      alert("Документ успешно отправлен в очередь на печать. Проверьте ваш беспроводной принтер.");
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Распечатать
                  </button>
                  <button
                    onClick={() => {
                      alert(`Официальный медицинский бланк ${selectedResult.code}.pdf успешно сохранен на ваше устройство в папку Загрузки.`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Скачать PDF
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* BOTTOM NAV BAR (Menu bar)                  */}
        {/* ========================================== */}
        <div className="absolute bottom-4 left-0 right-0 px-2 z-40 select-none pointer-events-none">
          <div className="bg-white/85 backdrop-blur-lg border border-slate-200/50 shadow-lg px-4 py-2 rounded-full flex justify-between items-center pointer-events-auto max-w-[380px] mx-auto gap-0.5">
            
            {/* Tab 1: Поиск / Главная */}
            <button
              onClick={() => {
                setActiveTab("search");
                setSelectedClinic(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "search" 
                  ? "bg-indigo-600/10 text-indigo-700 font-extrabold" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Compass className="w-4.5 h-4.5 shrink-0" />
              {activeTab === "search" && <span className="text-[9px] uppercase tracking-wider font-black">Главная</span>}
            </button>

            {/* Tab 2: Сравнение */}
            <button
              onClick={() => {
                setActiveTab("compare");
                setSelectedClinic(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer relative ${
                activeTab === "compare" 
                  ? "bg-indigo-600/10 text-indigo-700 font-extrabold" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <GitCompare className="w-4.5 h-4.5 shrink-0" />
              {activeTab === "compare" && <span className="text-[9px] uppercase tracking-wider font-black">Сравнение</span>}
              {selectedCompareIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {selectedCompareIds.length}
                </span>
              )}
            </button>



            {/* Tab 4: Блог */}
            <button
              onClick={() => {
                setActiveTab("blog");
                setSelectedClinic(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer relative ${
                activeTab === "blog" 
                  ? "bg-indigo-600/10 text-indigo-700 font-extrabold" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 shrink-0" />
              {activeTab === "blog" && <span className="text-[9px] uppercase tracking-wider font-black">Блог</span>}
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
            </button>

            {/* Tab 5: Профиль */}
            <button
              onClick={() => {
                setActiveTab("profile");
                setSelectedClinic(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-indigo-600/10 text-indigo-700 font-extrabold" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <UserIcon className="w-4.5 h-4.5 shrink-0" />
              {activeTab === "profile" && <span className="text-[9px] uppercase tracking-wider font-black">Профиль</span>}
            </button>

          </div>
        </div>

      </div>
  );
}
