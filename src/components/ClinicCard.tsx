import React from "react";
import { CheckCircle2, Phone, Star, MapPin, RefreshCw } from "lucide-react";
import { Clinic } from "../types";
import { renderBrandLogo } from "./MapPlaceholder";

const getBrandConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("олимп") || lower.includes("olymp")) {
    return {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-white font-black",
      char: "О",
    };
  }
  if (lower.includes("инвиво") || lower.includes("invivo")) {
    return {
      bg: "bg-gradient-to-br from-cyan-400 to-indigo-500",
      text: "text-white font-black",
      char: "И",
    };
  }
  if (lower.includes("сункар") || lower.includes("sunkar")) {
    return {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500",
      text: "text-white font-black",
      char: "С",
    };
  }
  if (lower.includes("orhun") || lower.includes("орхун")) {
    return {
      bg: "bg-gradient-to-br from-rose-500 to-red-600",
      text: "text-white font-black",
      char: "О",
    };
  }
  if (lower.includes("хак") || lower.includes("hak")) {
    return {
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-white font-black",
      char: "Х",
    };
  }
  if (lower.includes("керуен") || lower.includes("keruen")) {
    return {
      bg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
      text: "text-white font-black",
      char: "К",
    };
  }
  return {
    bg: "bg-gradient-to-br from-slate-400 to-slate-600",
    text: "text-white font-semibold",
    char: name.charAt(0).toUpperCase() || "М",
  };
};

interface ClinicCardProps {
  clinic: Clinic;
  isSelectedForComparison: boolean;
  onToggleCompare: (id: string) => void;
  isActiveOnMap: boolean;
  onCardClick: (id: string) => void;
  serviceQuery: string;
}

export default function ClinicCard({
  clinic,
  isSelectedForComparison,
  onToggleCompare,
  isActiveOnMap,
  onCardClick,
  serviceQuery,
}: ClinicCardProps) {
  const brand = getBrandConfig(clinic.name);

  return (
    <div
      id={`clinic-card-${clinic.id}`}
      onClick={() => onCardClick(clinic.id)}
      className={`group relative p-5 bg-white border rounded-[2rem] transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        isActiveOnMap
          ? "border-indigo-500 bg-indigo-50/5 shadow-md ring-1 ring-indigo-500/30"
          : "border-slate-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Beautiful brand logo */}
            {clinic.logoUrl ? (
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img 
                  src={clinic.logoUrl} 
                  alt={clinic.name} 
                  className="w-full h-full object-contain p-0.5" 
                />
              </div>
            ) : null}
            
            <div className="min-w-0">
              {/* Bold Service Naming */}
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest block leading-none mb-1">
                {serviceQuery || "Медицинская услуга"}
              </span>
              {/* Clinic Brand Label */}
              <h4 className="font-sans font-black text-slate-800 text-sm group-hover:text-indigo-900 transition-colors leading-tight">
                {clinic.name}
              </h4>
            </div>
          </div>
          
          {/* Emerald Green Tag "Доступно по ОСМС" */}
          {clinic.osms ? (
            <span className="shrink-0 flex items-center gap-1.5 text-[8.5px] bg-emerald-500 text-white shadow-sm px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Доступно по ОСМС
            </span>
          ) : (
            <span className="shrink-0 text-[8.5px] bg-slate-100 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
              Платный тариф
            </span>
          )}
        </div>

        {/* Pricing Zone */}
        <div className="flex items-baseline gap-1 mt-2.5 mb-3.5">
          {clinic.osms ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">0 ₸</span>
              <span className="text-[9.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 font-extrabold">
                бесплатно по квоте
              </span>
              <span className="text-[10.5px] text-slate-400 line-through font-semibold font-mono">
                {clinic.price.toLocaleString()} ₸
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {clinic.price.toLocaleString()}
              </span>
              <span className="text-sm font-black text-slate-800">₸</span>
            </div>
          )}
        </div>

        {clinic.anomalous_inflation && (
          <div className="mb-3 px-3 py-1.5 bg-red-50 border border-red-150 rounded-xl flex items-center gap-1.5 text-red-700 animate-pulse">
            <span className="flex h-1.5 w-1.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">
              Внимание: Выявлено завышение тарифа (+50% к медиане)
            </span>
          </div>
        )}

        {/* Info list */}
        <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-[11px] font-medium" title={clinic.address}>
              {clinic.address} • <span className="font-extrabold text-slate-700">{clinic.district}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100/30 px-2 py-0.5 rounded-lg font-mono">
              Дистанция: {clinic.distance}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span className="font-black text-amber-800 text-[10px]">{clinic.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100/80">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
          <RefreshCw className="w-3 h-3 text-slate-300 animate-spin-slow shrink-0" />
          <span>Обновлено сегодня</span>
        </div>

        {/* PREMIUM SMOOTH TOGGLE SWITCH "Добавить к сравнению" */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(clinic.id);
          }}
          className="flex items-center gap-2.5 cursor-pointer p-1 select-none"
        >
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Добавить к сравнению
          </span>
          {/* iOS-style toggle switch switch */}
          <div 
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
              isSelectedForComparison ? "bg-indigo-600" : "bg-slate-200"
            }`}
          >
            <div 
              className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                isSelectedForComparison ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
