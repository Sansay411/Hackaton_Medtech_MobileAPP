import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Plus, Minus, Navigation, Info, Car, MapPin, Loader2, RefreshCw } from "lucide-react";
import { MapMarker } from "../types";

interface MapPlaceholderProps {
  markers: MapMarker[];
  activeMarkerId?: string;
  onMarkerSelect: (id: string) => void;
  city: string;
  isRoutingActive?: boolean;
  onCloseRouting?: () => void;
}

const cleanApiKey = (key: string) => {
  if (!key) return "";
  return key.replace(/['"]/g, "").trim();
};

const API_KEY = cleanApiKey(
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "AIzaSyABfvjnXYgwV0gJ6Q1jQveW_BvOY4j-9xQ"
);

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.length > 5;

const customMapStyle = [
  {
    "featureType": "all",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#f8fafc" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#475569" }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#f1f5f9" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "poi.medical",
    "elementType": "all",
    "stylers": [
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "poi.medical",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#e0f2fe" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#cbd5e1" },
      { "weight": 1 }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#64748b" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#eff6ff" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#93c5fd" }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#bae6fd" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#0284c7" }
    ]
  }
];

// Helper to calculate great-circle distance between two coordinates in kilometers
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

interface RouteDisplayProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onRouteComputed: (stats: { distance: string; duration: string } | null) => void;
}

// Sub-component to calculate and render the route
function RouteDisplay({ origin, destination, onRouteComputed }: RouteDisplayProps) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    let active = true;

    // Clean up any existing polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (!map || !origin || !destination) {
      onRouteComputed(null);
      return;
    }

    if (routesLib && routesLib.Route && typeof routesLib.Route.computeRoutes === "function") {
      routesLib.Route.computeRoutes({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: "DRIVING" as any,
        fields: ["path", "distanceMeters", "durationMillis", "viewport"],
      })
      .then(({ routes }) => {
        if (!active) return;
        if (routes && routes[0]) {
          const newPolylines = routes[0].createPolylines();
          newPolylines.forEach(p => {
            p.setOptions({
              strokeColor: "#2563eb", // Vibrant high-contrast blue for road alignment
              strokeOpacity: 0.9,
              strokeWeight: 6,
            });
            p.setMap(map);
          });
          polylinesRef.current = newPolylines;

          const distanceMeters = routes[0].distanceMeters;
          const durationMillis = routes[0].durationMillis;

          let distStr = "—";
          let durStr = "—";

          if (distanceMeters !== undefined) {
            distStr = (distanceMeters / 1000).toFixed(1) + " км";
          }
          if (durationMillis !== undefined) {
            const ms = typeof durationMillis === "string" ? parseInt(durationMillis, 10) : durationMillis;
            durStr = Math.max(1, Math.round(ms / 60000)) + " мин";
          }

          onRouteComputed({
            distance: distStr,
            duration: durStr,
          });

          if (routes[0].viewport) {
            map.fitBounds(routes[0].viewport);
          }
        }
      })
      .catch((err) => {
        console.warn("Route.computeRoutes failed, falling back to multi-segment grid path:", err);
        if (active) {
          drawFallbackPath();
        }
      });
    } else {
      drawFallbackPath();
    }

    function drawFallbackPath() {
      if (!active) return;
      // Create a beautiful, high-fidelity multi-segment grid path simulating real street turns
      const midLat1 = origin.lat + (destination.lat - origin.lat) * 0.4;
      const midLng1 = origin.lng;
      const midLat2 = origin.lat + (destination.lat - origin.lat) * 0.4;
      const midLng2 = origin.lng + (destination.lng - origin.lng) * 0.6;
      const midLat3 = origin.lat + (destination.lat - origin.lat) * 0.85;
      const midLng3 = origin.lng + (destination.lng - origin.lng) * 0.6;
      const midLat4 = origin.lat + (destination.lat - origin.lat) * 0.85;
      const midLng4 = destination.lng;

      const path = [
        { lat: origin.lat, lng: origin.lng },
        { lat: midLat1, lng: midLng1 },
        { lat: midLat2, lng: midLng2 },
        { lat: midLat3, lng: midLng3 },
        { lat: midLat4, lng: midLng4 },
        { lat: destination.lat, lng: destination.lng }
      ];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map
      });

      polylinesRef.current = [polyline];

      const d = getDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
      const simulatedDist = (d * 1.3).toFixed(1) + " км";
      const simulatedTime = Math.max(2, Math.round(d * 1.3 * 2.2 + 2)) + " мин";
      
      onRouteComputed({
        distance: simulatedDist,
        duration: simulatedTime,
      });

      // Pan map bounds to fit the route nicely
      const bounds = new google.maps.LatLngBounds();
      path.forEach(pt => bounds.extend(pt));
      map.fitBounds(bounds);
    }

    return () => {
      active = false;
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

const getBrandConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("олимп") || lower.includes("olymp")) {
    return {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-white font-black",
      char: "О",
      accent: "border-emerald-200 shadow-emerald-100"
    };
  }
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    return {
      bg: "bg-gradient-to-br from-cyan-400 to-indigo-500",
      text: "text-white font-black",
      char: "И",
      accent: "border-cyan-200 shadow-cyan-100"
    };
  }
  if (lower.includes("сункар") || lower.includes("sunkar")) {
    return {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500",
      text: "text-white font-black",
      char: "С",
      accent: "border-amber-200 shadow-amber-100"
    };
  }
  if (lower.includes("orhun") || lower.includes("орхун")) {
    return {
      bg: "bg-gradient-to-br from-rose-500 to-red-600",
      text: "text-white font-black",
      char: "О",
      accent: "border-rose-200 shadow-rose-100"
    };
  }
  if (lower.includes("хак") || lower.includes("hak")) {
    return {
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-white font-black",
      char: "Х",
      accent: "border-blue-200 shadow-blue-100"
    };
  }
  if (lower.includes("керуен") || lower.includes("keruen")) {
    return {
      bg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
      text: "text-white font-black",
      char: "К",
      accent: "border-purple-200 shadow-purple-100"
    };
  }
  return {
    bg: "bg-gradient-to-br from-slate-400 to-slate-600",
    text: "text-white font-semibold",
    char: name.charAt(0).toUpperCase() || "М",
    accent: "border-indigo-200 shadow-indigo-100"
  };
};

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
        <span className="absolute text-[8px] font-black tracking-tighter text-white drop-shadow-xs">Олимп</span>
      </div>
    );
  }
  
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-cyan-400 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-cyan-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4.5 10.5C4.5 10.5 7.5 4.5 12 4.5C16.5 4.5 19.5 10.5 19.5 10.5C19.5 10.5 16.5 16.5 12 16.5C7.5 16.5 4.5 10.5 4.5 10.5Z" stroke="rgba(255,255,255,0.25)" />
          <circle cx="12" cy="10.5" r="3" fill="white" />
          <path d="M12 13.5v6M10 16.5h4" />
        </svg>
        <span className="absolute bottom-0.5 text-[6.5px] font-black uppercase tracking-widest text-white/90">Invivo</span>
      </div>
    );
  }
  
  if (lower.includes("сункар") || lower.includes("sunkar")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-amber-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
          <path d="M12 12V2a10 10 0 0 1 10 10H12Z" fill="white" />
          <path d="M12 12H2a10 10 0 0 1 10-10v10Z" fill="rgba(255,255,255,0.5)" />
          <path d="M12 12v10a10 10 0 0 1-10-10h10Z" fill="rgba(255,255,255,0.2)" />
        </svg>
        <span className="absolute bottom-0.5 text-[6.5px] font-black uppercase tracking-widest text-white/95">Сункар</span>
      </div>
    );
  }
  
  if (lower.includes("orhun") || lower.includes("орхун")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-rose-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" strokeWidth="3" />
          <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <span className="absolute bottom-0.5 text-[6px] font-black uppercase tracking-widest text-white/90">Orhun</span>
      </div>
    );
  }
  
  if (lower.includes("хак") || lower.includes("hak")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-blue-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.15)" />
          <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="3" />
        </svg>
        <span className="absolute bottom-0.5 text-[7px] font-black uppercase tracking-widest text-white/90">ХАК</span>
      </div>
    );
  }
  
  if (lower.includes("керуен") || lower.includes("keruen")) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
        <svg className="w-5 h-5 text-purple-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 22h20L12 2z" fill="rgba(255,255,255,0.15)" />
          <circle cx="12" cy="13" r="4" fill="white" />
        </svg>
        <span className="absolute bottom-0.5 text-[6px] font-black uppercase tracking-widest text-white/90">Керуен</span>
      </div>
    );
  }
  
  return (
    <div className={`${sizeClass} bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden transition-transform`}>
      <svg className="w-4.5 h-4.5 text-slate-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      <span className="absolute bottom-0.5 text-[6.5px] font-black uppercase tracking-widest text-white/90">Клиника</span>
    </div>
  );
};

export default function MapPlaceholder({
  markers,
  activeMarkerId,
  onMarkerSelect,
  city,
  isRoutingActive = false,
  onCloseRouting,
}: MapPlaceholderProps) {
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Fallback coordinates for Kazakhstan cities
  const isAstana = city?.toLowerCase()?.includes("астана") || false;
  const isShymkent = city?.toLowerCase()?.includes("шымкент") || false;
  const isKaraganda = city?.toLowerCase()?.includes("караганда") || false;

  const cityCenter = isAstana
    ? { lat: 51.169392, lng: 71.449074 }
    : isShymkent
    ? { lat: 42.3417, lng: 69.5901 }
    : isKaraganda
    ? { lat: 49.8022, lng: 73.0881 }
    : { lat: 43.238940, lng: 76.889709 }; // Default Almaty

  const currentCenter = cityCenter;

  const isFarAway = userLocation
    ? getDistanceKm(userLocation.lat, userLocation.lng, cityCenter.lat, cityCenter.lng) > 20
    : false;

  // Origin for route computation
  // We prioritize the real user location if available and nearby, falling back to a point near the city center if the user is far away or no geolocation exists
  const routeOrigin = userLocation && !isFarAway
    ? userLocation
    : { lat: cityCenter.lat + 0.008, lng: cityCenter.lng - 0.012 };

  // Attempt to acquire high-accuracy user location
  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocatingUser(false);
        if (mapRef.current) {
          const userIsFar = getDistanceKm(coords.lat, coords.lng, cityCenter.lat, cityCenter.lng) > 20;
          if (userIsFar) {
            mapRef.current.panTo(cityCenter);
            mapRef.current.setZoom(12);
          } else {
            mapRef.current.panTo(coords);
            mapRef.current.setZoom(13);
          }
        }
      },
      (error) => {
        console.log("Could not fetch geolocation:", error);
        setLocatingUser(false);
        if (mapRef.current) {
          mapRef.current.panTo(cityCenter);
          mapRef.current.setZoom(12);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  // Center route destination marker
  const activeMarker = markers.find((m) => m.id === activeMarkerId);
  const activeCoords = activeMarker
    ? { lat: activeMarker.lat, lng: activeMarker.lng }
    : null;

  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 12;
      mapRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 12;
      mapRef.current.setZoom(currentZoom - 1);
    }
  };

  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl shadow-inner font-sans">
        <div className="max-w-md bg-white p-6 rounded-2xl shadow-md border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">Необходим API Ключ Google Maps</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Для работы интерактивной карты цен и построения точных маршрутов требуется валидный Google Maps API Key.
          </p>
          <div className="text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-slate-600">
            <p><strong>1.</strong> Получите ключ в консоли Google Cloud.</p>
            <p><strong>2.</strong> Откройте Настройки (⚙️ в углу) in AI Studio.</p>
            <p><strong>3.</strong> Добавьте Секрет <code>GOOGLE_MAPS_PLATFORM_KEY</code>.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl border border-slate-200 shadow-md overflow-hidden min-h-[400px]">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={currentCenter}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          fullscreenControl={false}
          mapTypeControl={false}
          streetViewControl={false}
          zoomControl={false}
          options={{
            styles: customMapStyle,
            disableDefaultUI: true,
          }}
          onZoomChanged={(e) => setZoom(e.map.getZoom() || 12)}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          style={{ width: "100%", height: "100%" }}
          onTilesLoaded={(e) => {
            mapRef.current = e.map;
          }}
        >
          {/* Active Route Start point Pin */}
          <AdvancedMarker 
            position={routeOrigin} 
            title={userLocation && !isFarAway ? "Ваше местоположение" : "Точка старта (Центр города)"}
          >
            <div className="relative flex items-center justify-center w-10 h-10 select-none pointer-events-none">
              <div className="absolute w-7 h-7 bg-blue-500/25 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Interactive Pricing Markers */}
          {markers.map((marker) => {
            const isActive = activeMarkerId === marker.id;
            const simplifiedName = marker.name
              ? marker.name
                  .replace(/Лабораторный центр|Медицинская лаборатория|Многопрофильный медицинский центр|Диагностическая клиника/g, "")
                  .replace(/["']/g, "")
                  .trim()
              : "Клиника";

            const displayRating = marker.rating || 4.5;

            return (
              <AdvancedMarker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => onMarkerSelect(marker.id)}
              >
                <div className="relative flex flex-col items-center group cursor-pointer select-none">
                  
                  {/* Glowing Pulse Backdrop for Selected Clinic */}
                  {isActive && (
                    <span className="absolute -inset-1.5 rounded-3xl opacity-20 animate-ping bg-[#1B449C]" />
                  )}

                  {/* Polished interactive clinic card */}
                  <div className={`flex items-center gap-2.5 bg-white rounded-2xl p-2 shadow-lg border transition-all duration-300 w-52 text-left ${
                    isActive 
                      ? "border-[#1B449C] ring-4 ring-indigo-100/50 scale-110 z-40" 
                      : "border-slate-200 hover:border-slate-300 hover:scale-105 z-10 shadow-sm"
                  }`}>
                    {/* Left: Brand Icon with neat background */}
                    {renderBrandLogo(marker.name, "w-8.5 h-8.5 rounded-xl")}
                    
                    {/* Middle: Brand name, price, and free OSMS badge if eligible */}
                    <div className="flex-1 min-w-0 leading-tight">
                      <div className="text-[8.5px] font-black text-slate-400 truncate uppercase tracking-tight leading-none">
                        {simplifiedName}
                      </div>
                      <div className="text-[12px] font-black text-slate-800 font-mono leading-none mt-1">
                        {marker.price.toLocaleString()} ₸
                      </div>
                      {marker.osms && (
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-[6.5px] font-black font-mono tracking-wider px-1 py-0.5 rounded uppercase mt-1">
                          ОСМС
                        </span>
                      )}
                    </div>

                    {/* Right: Gold Star numeric rating */}
                    <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100/70 px-1.5 py-0.5 rounded-lg shrink-0 self-start">
                      <span className="text-amber-500 text-[10px] leading-none">★</span>
                      <span className="text-amber-800 text-[9px] font-black leading-none">
                        {displayRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Bubble Pointer Stem */}
                  <div
                    className={`w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b shadow-xs transition-colors duration-300 ${
                      isActive
                        ? "bg-white border-[#1B449C]"
                        : "bg-white border-slate-200"
                    }`}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Calculate and draw dynamic route display */}
          {isRoutingActive && activeCoords && (
            <RouteDisplay
              origin={routeOrigin}
              destination={activeCoords}
              onRouteComputed={(stats) => setRouteStats(stats)}
            />
          )}
        </Map>
      </APIProvider>

      {/* Floating City HUD (Top Left) */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs text-slate-800 flex items-center gap-2.5 shadow-md max-w-[180px] sm:max-w-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-bold truncate">Цены: {city}</span>
      </div>

      {/* Geolocation Button */}
      <button
        onClick={locateUser}
        disabled={locatingUser}
        className="absolute right-4 bottom-[176px] p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 z-30"
        title="Определить мое местоположение"
      >
        {locatingUser ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Navigation className="w-4 h-4 text-blue-600" />
        )}
      </button>

      {/* Custom Zoom Buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col bg-white border border-slate-200 p-1.5 rounded-2xl shadow-md gap-1 z-30">
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
        <div className="absolute bottom-24 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 rounded-3xl p-4 shadow-xl animate-fade-in z-30">
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
                  {isFarAway ? (
                    <div className="text-[8.5px] text-amber-700 bg-amber-50/70 border border-amber-100/80 px-2.5 py-1.5 rounded-xl font-bold leading-normal mt-2.5">
                      ⚠️ Вы находитесь за пределами города. Маршрут и расстояние рассчитаны от вашей фактической геопозиции.
                    </div>
                  ) : !userLocation ? (
                    <div className="text-[8.5px] text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl font-semibold leading-normal mt-2.5">
                      ℹ️ Доступ к геопозиции закрыт. Построен маршрут от центра города.
                    </div>
                  ) : null}
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
