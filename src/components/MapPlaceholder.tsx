import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Navigation, Car, Loader2 } from "lucide-react";
import { MapMarker } from "../types";

interface MapPlaceholderProps {
  markers: MapMarker[];
  activeMarkerId?: string;
  onMarkerSelect: (id: string) => void;
  city: string;
  isRoutingActive?: boolean;
  onCloseRouting?: () => void;
  onStartRouting?: () => void;
  onBookClinic?: (clinicId: string) => void;
}

const getBrandLogoText = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("олимп") || lower.includes("olymp")) return "О";
  if (lower.includes("инвиво") || lower.includes("invivo")) return "И";
  if (lower.includes("сункар") || lower.includes("sunkar")) return "С";
  if (lower.includes("orhun") || lower.includes("орхун")) return "ОХ";
  if (lower.includes("хак") || lower.includes("hak")) return "Х";
  if (lower.includes("керуен") || lower.includes("keruen")) return "К";
  if (lower.includes("инвитро")) return "ИТ";
  if (lower.includes("helix")) return "Х";
  return name.charAt(0).toUpperCase() || "М";
};

const adjustBrightness = (hex: string, percent: number) => {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = Math.max(0, Math.min(255, R + percent));
  G = Math.max(0, Math.min(255, G + percent));
  B = Math.max(0, Math.min(255, B + percent));

  const rHex = R.toString(16).padStart(2, "0");
  const gHex = G.toString(16).padStart(2, "0");
  const bHex = B.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
};

const getClinicLogoUrl = (name: string) => {
  const lower = name.toLowerCase();
  
  if (lower.includes("олимп") || lower.includes("olymp")) {
    return "https://kdlolymp.kz/favicons/android-chrome-512x512.png";
  }
  if (lower.includes("инвитро") || lower.includes("invitro")) {
    return "https://invitro.kz/local/templates/invitro_main/src/image/icons/footer/logo.svg";
  }
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    return "https://www.google.com/s2/favicons?domain=invivo.kz&sz=128";
  }

  // Custom styled premium SVG logos for other clinics to prevent DNS/CORS errors
  let color = "#64748b";
  let symbol = "";
  
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    color = "#0ea5e9"; // Teal-Blue
    symbol = `<circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="8"/><path d="M50 30 L50 70 M30 50 L70 50" stroke="white" stroke-width="8"/>`;
  } else if (lower.includes("сункар") || lower.includes("sunkar")) {
    color = "#0284c7"; // Sky Blue
    symbol = `<path d="M30 35 C40 20, 60 20, 70 35 C70 50, 30 50, 30 65 C30 80, 60 80, 70 65" fill="none" stroke="white" stroke-width="10" stroke-linecap="round"/>`;
  } else if (lower.includes("орхун") || lower.includes("orhun")) {
    color = "#8b5cf6"; // Purple
    symbol = `<circle cx="50" cy="50" r="28" fill="none" stroke="white" stroke-width="10"/><circle cx="50" cy="50" r="12" fill="white"/>`;
  } else if (lower.includes("хак") || lower.includes("hak")) {
    color = "#10b981"; // Emerald
    symbol = `<path d="M30 25 L30 75 M70 25 L70 75 M30 50 L70 50" fill="none" stroke="white" stroke-width="10" stroke-linecap="round"/>`;
  } else if (lower.includes("керуен") || lower.includes("keruen")) {
    color = "#f59e0b"; // Gold/Amber
    symbol = `<path d="M30 25 L30 75 M70 25 L35 50 L70 75" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (lower.includes("dau") || lower.includes("дау")) {
    color = "#ef4444"; // Red
    symbol = `<path d="M30 25 L50 25 C65 25, 70 35, 70 50 C70 65, 65 75, 50 75 L30 75 Z" fill="none" stroke="white" stroke-width="10" stroke-linejoin="round"/>`;
  } else if (lower.includes("поликлиника")) {
    color = "#6366f1"; // Indigo
    symbol = `<path d="M30 75 L30 25 L70 25 L70 75" fill="none" stroke="white" stroke-width="10" stroke-linecap="round"/>`;
  } else {
    // Fallback beautiful text-based SVG logo
    const firstLetter = name.trim().charAt(0).toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="25" fill="${encodeURIComponent(color)}"/><text x="50" y="68" font-family="system-ui, sans-serif" font-size="55" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text></svg>`;
  }

  // Premium vector SVG with grid background and centralized clean symbol
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad-${lower.replace(/[^a-z]/g, "")}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" />
        <stop offset="100%" stop-color="${adjustBrightness(color, -20)}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="25" fill="url(%23grad-${lower.replace(/[^a-z]/g, "")})"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="1"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
    <g transform="scale(0.8) translate(12.5, 12.5)">
      ${symbol}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}`;
};

const getCityCoords = (cityName: string) => {
  const lower = cityName.toLowerCase();
  if (lower.includes("астана")) return { lat: 51.169392, lng: 71.449074 };
  if (lower.includes("шымкент")) return { lat: 42.3417, lng: 69.5901 };
  if (lower.includes("караганда")) return { lat: 49.8022, lng: 73.0881 };
  if (lower.includes("усть-каменогорск")) return { lat: 49.9482, lng: 82.6277 };
  if (lower.includes("актобе")) return { lat: 50.2839, lng: 57.1669 };
  if (lower.includes("павлодар")) return { lat: 52.2873, lng: 76.9674 };
  return { lat: 43.238940, lng: 76.889709 }; // Almaty default
};

export default function MapPlaceholder({
  markers,
  activeMarkerId,
  onMarkerSelect,
  city,
  isRoutingActive,
  onCloseRouting,
  onStartRouting,
  onBookClinic
}: MapPlaceholderProps) {
  // Bind global marker click handler
  useEffect(() => {
    (window as any).onMapMarkerClick = (id: string) => {
      onMarkerSelect(id);
    };
    return () => {
      delete (window as any).onMapMarkerClick;
    };
  }, [onMarkerSelect]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapglLoaded, setMapglLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);

  const markersRef = useRef<{ [key: string]: any }>({});
  const activeRouteRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const currentCenter = getCityCoords(city);

  // Load 2GIS MapGL and Directions plugin scripts dynamically
  useEffect(() => {
    if ((window as any).mapgl && (window as any).mapgl.Directions) {
      setMapglLoaded(true);
      return;
    }
    const mapglScript = document.createElement("script");
    mapglScript.src = "https://mapgl.2gis.com/api/js/v1";
    mapglScript.async = true;
    mapglScript.onload = () => {
      const directionsScript = document.createElement("script");
      directionsScript.src = "https://unpkg.com/@2gis/mapgl-directions@^2/dist/directions.js";
      directionsScript.async = true;
      directionsScript.onload = () => {
        setMapglLoaded(true);
      };
      document.body.appendChild(directionsScript);
    };
    document.body.appendChild(mapglScript);
  }, []);

  // Initialize 2GIS Map
  useEffect(() => {
    if (!mapglLoaded || !mapContainerRef.current || !(window as any).mapgl) return;

    const mapgl = (window as any).mapgl;
    
    // Clear container just in case
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = "";
    }

    const map = new mapgl.Map(mapContainerRef.current, {
      center: [currentCenter.lng, currentCenter.lat], // [longitude, latitude]
      zoom: zoom,
      key: "26c65059-f062-4a91-a973-b8a38fedf562",
      zoomControl: false
    });

    setMapInstance(map);

    return () => {
      map.destroy();
      setMapInstance(null);
    };
  }, [mapglLoaded, city]);

  // Handle marker updates
  useEffect(() => {
    if (!mapInstance || !mapglLoaded || !(window as any).mapgl) return;

    const mapgl = (window as any).mapgl;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => {
      m.destroy();
    });
    markersRef.current = {};

    // Add new markers
    markers.forEach((marker) => {
      const isActive = activeMarkerId === marker.id;
      const simplifiedName = marker.name
        ? marker.name
            .replace(/Лабораторный центр|Медицинская лаборатория|Многопрофильный медицинский центр|Диагностическая клиника|Медицинский центр|Медицинская организация|Медицинские лаборатории|Клинико-диагностическая лаборатория/g, "")
            .replace(/["']/g, "")
            .trim()
        : "Клиника";

      // Use real coordinates, or fall back to city center with slight spread
      const markerLat = marker.lat || currentCenter.lat + (Math.random() - 0.5) * 0.03;
      const markerLng = marker.lng || currentCenter.lng + (Math.random() - 0.5) * 0.03;

      const htmlContent = `
        <div onclick="window.onMapMarkerClick('${marker.id}')" style="width: 186px; height: 56px; pointer-events: auto;" class="relative flex flex-col items-center select-none cursor-pointer">
          <div class="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border ${isActive ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"} hover:border-blue-600 transition-all duration-300 w-full h-full text-left">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${marker.logoUrl || getClinicLogoUrl(marker.name)}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
              <div style="display:none;width:100%;height:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);align-items:center;justify-content:center;border-radius:12px" class="text-white font-black text-xs">${getBrandLogoText(marker.name)}</div>
            </div>
            <div class="flex-1 min-w-0 leading-tight">
              <div class="text-[8px] font-black text-slate-400 truncate uppercase tracking-tight">${simplifiedName}</div>
              <div class="text-[12px] font-black text-slate-800 font-mono mt-0.5">${marker.price.toLocaleString()} ₸</div>
            </div>
            <div class="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg shrink-0 self-start">
              <span class="text-amber-500 text-[9px]">★</span>
              <span class="text-amber-800 text-[8px] font-black">${(marker.rating || 4.5).toFixed(1)}</span>
            </div>
          </div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2.5 h-2.5 bg-white rotate-45 border-r border-b ${isActive ? "border-blue-600" : "border-slate-200"}"></div>
        </div>
      `;

      const m = new mapgl.HtmlMarker(mapInstance, {
        coordinates: [markerLng, markerLat],
        html: htmlContent,
        anchor: [93, 56],
        interactive: true,
      });

      markersRef.current[marker.id] = m;
    });

  }, [mapInstance, markers, activeMarkerId, mapglLoaded]);

  // Handle active marker changes: center map
  useEffect(() => {
    if (!mapInstance || !activeMarkerId) return;
    const activeMarker = markers.find((m) => m.id === activeMarkerId);
    if (activeMarker) {
      mapInstance.setCenter([activeMarker.lng, activeMarker.lat]);
    }
  }, [mapInstance, activeMarkerId]);

  // Handle dynamic routing
  useEffect(() => {
    if (!mapInstance || !mapglLoaded || !(window as any).mapgl) return;

    const mapgl = (window as any).mapgl;

    // Clear old route
    if (activeRouteRef.current) {
      activeRouteRef.current.clear();
      activeRouteRef.current = null;
    }

    if (isRoutingActive && activeMarkerId) {
      const activeMarker = markers.find((m) => m.id === activeMarkerId);
      if (activeMarker) {
        const start = userLocation 
          ? [userLocation.lng, userLocation.lat] 
          : [currentCenter.lng, currentCenter.lat]; // [longitude, latitude]
        const end = [activeMarker.lng, activeMarker.lat]; // [longitude, latitude]

        const directions = new mapgl.Directions(mapInstance, {
          directionsApiKey: "26c65059-f062-4a91-a973-b8a38fedf562"
        });

        directions.on("routingSuccess", (data: any) => {
          const route = data.routes[0];
          if (route) {
            const lengthMeters = route.distance || route.length || 0;
            const durationSeconds = route.duration || 0;
            const distanceKm = (lengthMeters / 1000).toFixed(1);
            const durationMin = Math.round(durationSeconds / 60);
            setRouteStats({
              distance: `${distanceKm} км`,
              duration: `${durationMin} мин`
            });
          }
        });

        directions.on("routingError", (err: any) => {
          console.error("2GIS Route build error:", err);
          setRouteStats(null);
        });

        directions.carRoute({
          points: [start, end]
        });

        activeRouteRef.current = directions;
      }
    } else {
      setRouteStats(null);
    }
  }, [mapInstance, isRoutingActive, activeMarkerId, userLocation, mapglLoaded]);

  // Locate User action
  const locateUser = () => {
    if (!mapInstance || !mapglLoaded || !(window as any).mapgl) return;
    setLocatingUser(true);

    const mapgl = (window as any).mapgl;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          setLocatingUser(false);

          // Center map
          mapInstance.setCenter([coords.lng, coords.lat]);

          // Draw user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.destroy();
          }

          userMarkerRef.current = new mapgl.Marker(mapInstance, {
            type: "html",
            coordinates: [coords.lng, coords.lat],
            html: `<div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse"></div>`
          });
        },
        (error) => {
          console.warn("2GIS Geolocation failed:", error);
          setLocatingUser(false);
        },
        { timeout: 8000 }
      );
    } else {
      setLocatingUser(false);
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      const newZoom = mapInstance.getZoom() + 1;
      mapInstance.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const newZoom = mapInstance.getZoom() - 1;
      mapInstance.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const activeMarker = markers.find((m) => m.id === activeMarkerId);

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl border border-slate-200 shadow-md overflow-hidden min-h-[400px]">
      
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating City HUD (Top Left) */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs text-slate-800 flex items-center gap-2.5 shadow-md max-w-[180px] sm:max-w-none z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-bold truncate">Цены: {city}</span>
      </div>

      {/* Geolocation Button */}
      <button
        onClick={locateUser}
        disabled={locatingUser}
        className="absolute right-4 bottom-44 p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 z-10"
        title="Определить мое местоположение"
      >
        {locatingUser ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Navigation className="w-4 h-4 text-blue-600" />
        )}
      </button>

      {/* Custom Zoom Buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col bg-white border border-slate-200 p-1.5 rounded-2xl shadow-md gap-1 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          title="Приблизить"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-100 my-0.5 mx-1" />
        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          title="Отдалить"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Premium Glassmorphic Clinic Details Panel (Bottom Panel) */}
      {!isRoutingActive && activeMarker && (
        <div className="absolute bottom-20 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 rounded-3xl p-4 shadow-xl animate-fade-in z-10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img
                src={activeMarker.logoUrl || getClinicLogoUrl(activeMarker.name)}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              {(!activeMarker.logoUrl && !getClinicLogoUrl(activeMarker.name).startsWith("http")) ? null : null}
            </div>
            <div className="flex-1 min-w-0 relative">
              <button
                onClick={() => onMarkerSelect(undefined as any)}
                className="absolute -top-1 -right-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-full transition cursor-pointer font-extrabold text-xs p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
                title="Закрыть информацию"
              >
                ✕
              </button>
              <h4 className="text-sm font-black text-slate-950 leading-tight pr-6 tracking-tight">
                {activeMarker.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{activeMarker.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg shrink-0">
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="text-amber-800 text-[10px] font-black">{activeMarker.rating?.toFixed(1) || "4.5"}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">•</span>
                <span className="text-xs font-black text-emerald-600 font-mono">от {activeMarker.price.toLocaleString()} ₸</span>
                {activeMarker.osms && (
                  <>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg">ОСМС</span>
                  </>
                )}
              </div>

              {/* Action Buttons: Route & Book */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={onStartRouting}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  Маршрут
                </button>
                <button
                  onClick={() => onBookClinic && onBookClinic(activeMarker.id)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                >
                  Запись
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Routing Stats Overlay (Bottom Panel) */}
      {isRoutingActive && activeMarker && (
        <div className="absolute bottom-20 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 rounded-3xl p-4 shadow-xl animate-fade-in z-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100/60 rounded-2xl shrink-0 mt-0.5">
              <Car className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 relative">
              {onCloseRouting && (
                <button
                  onClick={onCloseRouting}
                  className="absolute -top-1 right-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-full transition cursor-pointer font-extrabold text-xs p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
                  title="Закрыть маршрут"
                >
                  ✕
                </button>
              )}
              <h4 className="text-xs font-black text-slate-950 leading-tight truncate pr-6 tracking-tight">
                Маршрут до {activeMarker.name.replace(/Лабораторный центр|Медицинская лаборатория|Многопрофильный медицинский центр|Диагностическая клиника/g, "").trim()}
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">{activeMarker.address}</p>

              {routeStats ? (
                <div className="flex flex-col gap-1 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-blue-50/50 border border-blue-100/30 px-2 py-0.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Дистанция:</span>
                      <span className="text-xs font-black text-blue-600 font-mono">{routeStats.distance}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1 bg-emerald-50/50 border border-emerald-100/30 px-2 py-0.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Время:</span>
                      <span className="text-xs font-black text-emerald-600 font-mono">{routeStats.duration}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span className="font-medium">Построение оптимального маршрута...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const renderBrandLogo = (name: string, sizeClass = "w-8.5 h-8.5 rounded-xl") => {
  const logoUrl = getClinicLogoUrl(name);
  if (logoUrl) {
    return (
      <div className={`${sizeClass} bg-white border border-slate-100 flex items-center justify-center shadow-xs shrink-0 overflow-hidden`}>
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-full h-full object-contain p-0.5" 
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = "flex";
          }}
        />
        <div className="hidden w-full h-full items-center justify-center bg-blue-600 text-white font-black text-xs">
          {getBrandLogoText(name)}
        </div>
      </div>
    );
  }

  const lower = name.toLowerCase();
  
  if (lower.includes("олимп") || lower.includes("olymp")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-emerald-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="rgba(255,255,255,0.15)" />
          <path d="M2 12h20" stroke="rgba(255,255,255,0.2)" />
        </svg>
      </div>
    );
  }
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-cyan-400 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-cyan-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    );
  }
  if (lower.includes("сункар") || lower.includes("sunkar")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-amber-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
    );
  }
  if (lower.includes("orhun") || lower.includes("орхун")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <span className="font-black text-sm tracking-tighter">ОН</span>
      </div>
    );
  }
  if (lower.includes("хак") || lower.includes("hak")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <span className="font-black text-sm tracking-tighter">ХК</span>
      </div>
    );
  }
  if (lower.includes("керуен") || lower.includes("keruen")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <span className="font-black text-sm tracking-tighter">КМ</span>
      </div>
    );
  }
  return (
    <div className={`${sizeClass} bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
      <span className="font-semibold text-xs">{name.charAt(0).toUpperCase() || "М"}</span>
    </div>
  );
};
