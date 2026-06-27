import React from "react";
import { X, Navigation, ShieldCheck, Heart, Sparkles, Building, Landmark, Star, MapPin, Phone, HelpCircle } from "lucide-react";
import { Clinic } from "../types";

interface ComparisonMatrixProps {
  selectedClinics: Clinic[];
  onRemoveFromComparison: (id: string) => void;
  onClose: () => void;
  serviceQuery: string;
  onBuildRoute?: (clinic: Clinic) => void;
}

export default function ComparisonMatrix({
  selectedClinics,
  onRemoveFromComparison,
  onClose,
  serviceQuery,
  onBuildRoute,
}: ComparisonMatrixProps) {
  
  // Helper to parse distance text like "2.4 км" or "800 м" into kilometers
  const parseDistanceNum = (distStr: string): number => {
    if (!distStr) return 999;
    const normalized = distStr.toLowerCase().trim();
    const match = normalized.match(/[\d.]+/);
    if (!match) return 999;
    const val = parseFloat(match[0]);
    if (normalized.includes("м") && !normalized.includes("к")) {
      return val / 1000; // convert meters to km
    }
    return val;
  };

  // Extract values for highlights
  const prices = selectedClinics.map(c => c.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const parsedDistances = selectedClinics.map(c => parseDistanceNum(c.distance));
  const minDistance = parsedDistances.length > 0 ? Math.min(...parsedDistances) : 999;

  const ratings = selectedClinics.map(c => c.rating);
  const maxRating = ratings.length > 0 ? Math.max(...ratings) : 0;

  return (
    <div id="comparison-matrix-sheet" className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end justify-center animate-fade-in p-2 sm:p-4">
      {/* Frosted White Glass Sheet */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/60 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up">
        
        {/* Header Drag Bar Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Matrix Title Block */}
        <div className="px-5 pb-3.5 pt-1 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="text-left">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
              Сравнительный анализ • MedTariff.kz
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
              Сравнение по: <span className="text-indigo-900 font-black">"{serviceQuery || "Услуга"}"</span>
            </h2>
          </div>
          <button
            id="close-matrix-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison body area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {selectedClinics.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-3xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Нет выбранных предложений</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                Пожалуйста, выберите до 4 клиник в результатах поиска, нажав кнопку «Сравнить».
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              
              {/* Dynamic scroll indicator / differences highlights info */}
              <div className="bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-2xl text-[10px] text-indigo-950 font-bold flex items-start gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="leading-tight">
                    Интерактивная таблица различий. Выгодные цены, близкие маршруты и лучшие рейтинги выделены цветом автоматически!
                  </p>
                  {selectedClinics.length > 1 && (
                    <p className="text-[9px] text-indigo-600 font-black uppercase tracking-wider mt-1">
                      Разница в цене составляет до {(maxPrice - minPrice).toLocaleString()} ₸!
                    </p>
                  )}
                </div>
              </div>

              {/* Swipe/Scroll notification if columns overflow */}
              {selectedClinics.length > 2 && (
                <div className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-widest text-center animate-pulse">
                  ← Смахните влево-вправо для сравнения клиник →
                </div>
              )}

              {/* The Side-By-Side Comparison Table Matrix */}
              <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-xs flex">
                
                {/* Fixed Left Column - Labels */}
                <div className="w-[105px] shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col font-bold text-[9px] text-slate-500 uppercase tracking-wider">
                  <div className="h-[75px] px-2.5 flex items-center bg-slate-100/70 border-b border-slate-200 text-slate-600">Клиника</div>
                  <div className="h-[55px] px-2.5 flex items-center border-b border-slate-100">Тариф резидента</div>
                  <div className="h-[46px] px-2.5 flex items-center border-b border-slate-100">ОСМС Квота</div>
                  <div className="h-[50px] px-2.5 flex items-center border-b border-slate-100">Дистанция</div>
                  <div className="h-[44px] px-2.5 flex items-center border-b border-slate-100">Рейтинг</div>
                  <div className="h-[60px] px-2.5 flex items-center border-b border-slate-100 text-[8.5px]">Контакты / Район</div>
                  <div className="h-[48px] px-2.5 flex items-center bg-slate-100/30">Действие</div>
                </div>

                {/* Horizontally Scrollable Columns for each selected clinic */}
                <div className="flex-1 flex overflow-x-auto no-scrollbar snap-x snap-mandatory divide-x divide-slate-100">
                  {selectedClinics.map((clinic) => {
                    const isCheapest = clinic.price === minPrice && selectedClinics.length > 1;
                    const isClosest = parseDistanceNum(clinic.distance) === minDistance && selectedClinics.length > 1;
                    const isHighestRated = clinic.rating === maxRating && selectedClinics.length > 1;

                    return (
                      <div 
                        key={clinic.id} 
                        className="w-[145px] sm:w-[160px] shrink-0 snap-start flex flex-col text-left relative"
                      >
                        {/* Remove button at top right */}
                        <button
                          onClick={() => onRemoveFromComparison(clinic.id)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer z-10"
                          title="Убрать из сравнения"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Row 1: Clinic Name Header */}
                        <div className="h-[75px] p-2.5 bg-slate-50/40 border-b border-slate-200 flex flex-col justify-between pr-7">
                          <span className="text-[7.5px] font-mono font-black text-slate-400 uppercase tracking-widest block leading-none">
                            {clinic.district}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-[11px] leading-tight tracking-tight line-clamp-3 mt-0.5">
                            {clinic.name}
                          </h4>
                        </div>

                        {/* Row 2: Price for Residents */}
                        <div className={`h-[55px] p-2.5 border-b border-slate-100 flex flex-col justify-center transition-colors ${
                          isCheapest ? "bg-emerald-50/50" : ""
                        }`}>
                          <div className="flex items-baseline gap-0.5">
                            <span className={`text-sm font-black tracking-tight ${isCheapest ? "text-emerald-700" : "text-slate-800"}`}>
                              {clinic.price.toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-bold ${isCheapest ? "text-emerald-600" : "text-slate-500"}`}>₸</span>
                          </div>
                          {isCheapest ? (
                            <span className="text-[7px] font-extrabold bg-emerald-500 text-white px-1 py-0.5 rounded-md uppercase tracking-wider mt-0.5 block w-max leading-none">
                              ✓ Лучшая цена
                            </span>
                          ) : (
                            <span className="text-[7px] text-slate-400 block mt-0.5 font-bold">
                              Стандартный тариф
                            </span>
                          )}
                        </div>

                        {/* Row 3: OSMS Status */}
                        <div className="h-[46px] px-2.5 border-b border-slate-100 flex items-center">
                          {clinic.osms ? (
                            <span className="text-[7.5px] font-extrabold bg-teal-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 leading-none shadow-3xs">
                              <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                              ОСМС Квота
                            </span>
                          ) : (
                            <span className="text-[7.5px] font-extrabold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                              Только платно
                            </span>
                          )}
                        </div>

                        {/* Row 4: Distance Matrix */}
                        <div className={`h-[50px] p-2.5 border-b border-slate-100 flex flex-col justify-center transition-colors ${
                          isClosest ? "bg-indigo-50/40" : ""
                        }`}>
                          <div className="flex items-center gap-1">
                            <MapPin className={`w-3.5 h-3.5 ${isClosest ? "text-indigo-600 animate-bounce" : "text-slate-400"}`} />
                            <span className={`text-xs font-black ${isClosest ? "text-indigo-900" : "text-slate-700"}`}>
                              {clinic.distance}
                            </span>
                          </div>
                          {isClosest && (
                            <span className="text-[6.5px] text-indigo-600 font-extrabold uppercase mt-0.5 block leading-none">
                              Ближайшая к вам
                            </span>
                          )}
                        </div>

                        {/* Row 5: Rating */}
                        <div className={`h-[44px] px-2.5 border-b border-slate-100 flex items-center gap-1 transition-colors ${
                          isHighestRated ? "bg-amber-50/40" : ""
                        }`}>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-black text-slate-800">{clinic.rating}</span>
                          </div>
                          {isHighestRated && (
                            <span className="text-[6.5px] bg-amber-500 text-white px-1 py-0.5 rounded uppercase font-black tracking-wide shrink-0 scale-90 origin-left">
                              ТОП
                            </span>
                          )}
                        </div>

                        {/* Row 6: Address and Phone info */}
                        <div className="h-[60px] p-2.5 border-b border-slate-100 flex flex-col justify-center gap-0.5 overflow-hidden text-slate-500">
                          <span className="text-[8px] font-extrabold text-slate-700 block truncate leading-none">
                            {clinic.phone}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-400 leading-tight line-clamp-2">
                            {clinic.address}
                          </span>
                        </div>

                        {/* Row 7: Action Build Route Button */}
                        <div className="h-[48px] p-2 bg-slate-50/20 flex items-center justify-center">
                          <button
                            onClick={() => {
                              if (onBuildRoute) {
                                onBuildRoute(clinic);
                              } else {
                                alert(`Прокладываем маршрут до ${clinic.name}`);
                              }
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          >
                            <Navigation className="w-2.5 h-2.5 fill-current shrink-0" />
                            <span>Маршрут</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}

                  {/* Add Slot box to prompt choosing more */}
                  {selectedClinics.length < 4 && (
                    <div className="w-[110px] shrink-0 snap-start flex flex-col items-center justify-center text-center p-3 bg-slate-50/30 text-slate-400 h-full min-h-[300px]">
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-dashed border-slate-200 shadow-3xs mb-2">
                        <Building className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <span className="text-[8px] font-black uppercase text-slate-500">Еще слот</span>
                      <p className="text-[7.5px] text-slate-400 mt-1 leading-normal max-w-[80px]">
                        Добавьте другие клиники для сравнения
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Comparative summary analytics block */}
              {selectedClinics.length >= 2 && (
                <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-slate-100/80 rounded-2xl p-3 text-left">
                  <h5 className="text-[9.5px] font-black text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Результаты анализа MedTariff AI:
                  </h5>
                  <div className="text-[9.5px] text-slate-600 space-y-1 font-bold">
                    {(() => {
                      const cheapestClinic = [...selectedClinics].sort((a, b) => a.price - b.price)[0];
                      const closestClinic = [...selectedClinics].sort((a, b) => parseDistanceNum(a.distance) - parseDistanceNum(b.distance))[0];
                      const osmsCount = selectedClinics.filter(c => c.osms).length;

                      return (
                        <ul className="list-disc pl-3.5 space-y-1">
                          <li>
                            Самый выгодный тариф у клиники <strong className="text-emerald-700">"{cheapestClinic.name}"</strong>: <strong className="text-slate-800">{cheapestClinic.price.toLocaleString()} ₸</strong>.
                          </li>
                          <li>
                            Ближе всего к вам находится <strong className="text-indigo-800">"{closestClinic.name}"</strong> ({closestClinic.distance}).
                          </li>
                          {osmsCount > 0 ? (
                            <li>
                              Из выбранных, <strong className="text-teal-700">{osmsCount} клиник(и)</strong> поддерживают бесплатные квоты по ОСМС.
                            </li>
                          ) : (
                            <li className="text-amber-700/80">
                              Ни одна из выбранных клиник не поддерживает ОСМС бесплатные квоты для данной услуги.
                            </li>
                          )}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer info branding */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <span className="text-[9px] text-slate-400 font-bold tracking-wide uppercase block">
            MedTariff.kz • Информационная система медицинских тарифов РК
          </span>
        </div>

      </div>
    </div>
  );
}
