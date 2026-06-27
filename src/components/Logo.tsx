import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const crossSize = {
    sm: { bar1: "w-2.5 h-7 rounded-sm", bar2: "w-7 h-2.5 rounded-sm" },
    md: { bar1: "w-3.5 h-9 rounded-md", bar2: "w-9 h-3.5 rounded-md" },
    lg: { bar1: "w-5 h-14 rounded-lg", bar2: "w-14 h-5 rounded-lg" },
  };

  const currentCross = crossSize[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Deep Blue Vertical Bar */}
        <div className={`absolute bg-blue-800 ${currentCross.bar1} shadow-sm`} />
        {/* Overlapping Translucent Light Blue Horizontal Bar with multiply blend */}
        <div className={`absolute bg-sky-400/80 mix-blend-multiply ${currentCross.bar2} shadow-xs`} />
      </div>
      <div>
        <span className="font-display font-bold text-slate-900 tracking-tight text-lg leading-none block">
          Med<span className="text-blue-600">Tariff</span>
          <span className="text-sky-500 font-semibold text-sm">.kz</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono tracking-wider block uppercase">
          Б2Ц Пациент Клиникасы
        </span>
      </div>
    </div>
  );
}
