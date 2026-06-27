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

const getCityCoords = (cityName: string) => {
  const lower = cityName.toLowerCase();
  if (lower.includes("астана")) return { lat: 51.169392, lng: 71.449074 };
  if (lower.includes("шымкент")) return { lat: 42.3417, lng: 69.5901 };
  if (lower.includes("караганда")) return { lat: 49.8022, lng: 73.0881 };
  if (lower.includes("усть-каменогорск")) return { lat: 49.9482, lng: 82.6277 };
  return { lat: 43.238940, lng: 76.889709 }; // Almaty default
};

export default function MapPlaceholder({
  markers,
  activeMarkerId,
  onMarkerSelect,
  city,
  isRoutingActive,
  onCloseRouting
}: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);

  const placemarksRef = useRef<{ [key: string]: any }>({});
  const activeRouteRef = useRef<any>(null);
  const userPlacemarkRef = useRef<any>(null);

  const currentCenter = getCityCoords(city);

  // Load Yandex Maps API script dynamically
  useEffect(() => {
    if ((window as any).ymaps) {
      setYmapsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=1d533692-1ee7-4fb7-9201-2165fbb5d14d&lang=ru_RU";
    script.async = true;
    script.onload = () => setYmapsLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Yandex Map
  useEffect(() => {
    if (!ymapsLoaded || !mapContainerRef.current || !(window as any).ymaps) return;

    const ymaps = (window as any).ymaps;
    ymaps.ready(() => {
      // Clear container just in case
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }

      const map = new ymaps.Map(mapContainerRef.current, {
        center: [currentCenter.lat, currentCenter.lng],
        zoom: zoom,
        controls: [] // We render our own premium Tailwind Zoom controls
      });

      setMapInstance(map);
    });

    return () => {
      setMapInstance(null);
    };
  }, [ymapsLoaded, city]);

  // Handle marker updates
  useEffect(() => {
    if (!mapInstance || !ymapsLoaded || !(window as any).ymaps) return;

    const ymaps = (window as any).ymaps;

    // Clear old placemarks
    Object.values(placemarksRef.current).forEach((pm) => {
      mapInstance.geoObjects.remove(pm);
    });
    placemarksRef.current = {};

    // Custom Placemark layout
    const customPlacemarkLayout = ymaps.templateLayoutFactory.createClass(
      `<div style="transform: translate(-50%, -100%);" class="relative flex flex-col items-center select-none cursor-pointer">
         <div class="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border $[properties.borderClass] hover:border-blue-600 transition-all duration-300 w-44 text-left">
           <div class="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 border border-slate-100">
             $[properties.logoText]
           </div>
           <div class="flex-1 min-w-0 leading-tight">
             <div class="text-[7.5px] font-black text-slate-400 truncate uppercase tracking-tight">$[properties.clinicName]</div>
             <div class="text-[11px] font-black text-slate-800 font-mono mt-0.5">$[properties.price] ₸</div>
           </div>
           <div class="flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded-lg shrink-0 self-start">
             <span class="text-amber-500 text-[9px]">★</span>
             <span class="text-amber-800 text-[8px] font-black">$[properties.rating]</span>
           </div>
         </div>
         <div class="w-2 h-2 bg-white rotate-45 -mt-1.2 border-r border-b $[properties.borderClass]"></div>
       </div>`
    );

    // Add new placemarks
    markers.forEach((marker) => {
      const isActive = activeMarkerId === marker.id;
      const simplifiedName = marker.name
        ? marker.name
            .replace(/Лабораторный центр|Медицинская лаборатория|Многопрофильный медицинский центр|Диагностическая клиника/g, "")
            .replace(/["']/g, "")
            .trim()
        : "Клиника";

      const pm = new ymaps.Placemark(
        [marker.lat, marker.lng],
        {
          clinicName: simplifiedName,
          price: marker.price.toLocaleString(),
          rating: (marker.rating || 4.5).toFixed(1),
          logoText: getBrandLogoText(marker.name),
          borderClass: isActive ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"
        },
        {
          iconLayout: customPlacemarkLayout,
          iconImageSize: [176, 50],
          iconImageOffset: [-88, -50]
        }
      );

      pm.events.add("click", () => {
        onMarkerSelect(marker.id);
      });

      mapInstance.geoObjects.add(pm);
      placemarksRef.current[marker.id] = pm;
    });

  }, [mapInstance, markers, activeMarkerId]);

  // Handle active marker changes: center map
  useEffect(() => {
    if (!mapInstance || !activeMarkerId) return;
    const activeMarker = markers.find((m) => m.id === activeMarkerId);
    if (activeMarker) {
      mapInstance.setCenter([activeMarker.lat, activeMarker.lng], zoom);
    }
  }, [mapInstance, activeMarkerId]);

  // Handle dynamic routing
  useEffect(() => {
    if (!mapInstance || !ymapsLoaded || !(window as any).ymaps) return;

    const ymaps = (window as any).ymaps;

    // Clear old route
    if (activeRouteRef.current) {
      mapInstance.geoObjects.remove(activeRouteRef.current);
      activeRouteRef.current = null;
    }

    if (isRoutingActive && activeMarkerId) {
      const activeMarker = markers.find((m) => m.id === activeMarkerId);
      if (activeMarker) {
        const start = userLocation ? [userLocation.lat, userLocation.lng] : [currentCenter.lat, currentCenter.lng];
        const end = [activeMarker.lat, activeMarker.lng];

        const multiRoute = new ymaps.multiRouter.MultiRoute(
          {
            referencePoints: [start, end],
            params: {
              routingMode: "auto"
            }
          },
          {
            routeStrokeColor: "#1e40af",
            routeStrokeWidth: 5,
            boundsAutoApply: true
          }
        );

        multiRoute.model.events.add("requestsuccess", () => {
          const activeRoute = multiRoute.getActiveRoute();
          if (activeRoute) {
            const distanceText = activeRoute.properties.get("distance").text;
            const durationText = activeRoute.properties.get("duration").text;
            setRouteStats({
              distance: distanceText,
              duration: durationText
            });
          }
        });

        mapInstance.geoObjects.add(multiRoute);
        activeRouteRef.current = multiRoute;
      }
    } else {
      setRouteStats(null);
    }
  }, [mapInstance, isRoutingActive, activeMarkerId, userLocation]);

  // Locate User action
  const locateUser = () => {
    if (!mapInstance || !ymapsLoaded || !(window as any).ymaps) return;
    setLocatingUser(true);

    const ymaps = (window as any).ymaps;

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
          mapInstance.setCenter([coords.lat, coords.lng], 14);

          // Draw user location marker
          if (userPlacemarkRef.current) {
            mapInstance.geoObjects.remove(userPlacemarkRef.current);
          }

          const userPm = new ymaps.Placemark(
            [coords.lat, coords.lng],
            {},
            {
              preset: "islands#circleDotIconWithCaption",
              iconColor: "#1e40af"
            }
          );
          mapInstance.geoObjects.add(userPm);
          userPlacemarkRef.current = userPm;
        },
        (error) => {
          console.warn("Geolocation failed:", error);
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
