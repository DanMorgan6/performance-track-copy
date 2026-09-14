import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "purple" }) {
  const colorClasses = {
    purple: "border-[#d8ff5f]/30 bg-[#d8ff5f] text-zinc-950 shadow-[0_18px_45px_rgba(216,255,95,0.12)]",
    emerald: "border-emerald-300/[0.15] bg-gradient-to-br from-emerald-400/[0.15] to-[#242427] text-white",
    blue: "border-sky-300/[0.15] bg-gradient-to-br from-sky-400/[0.15] to-[#242427] text-white",
    amber: "border-amber-300/[0.15] bg-gradient-to-br from-amber-400/[0.15] to-[#242427] text-white",
    rose: "border-rose-300/[0.15] bg-gradient-to-br from-rose-400/[0.15] to-[#242427] text-white",
    teal: "border-teal-300/[0.15] bg-gradient-to-br from-teal-400/[0.15] to-[#242427] text-white",
  };

  const iconClasses = {
    purple: "bg-black/10 text-zinc-950",
    emerald: "bg-emerald-300/10 text-emerald-300",
    blue: "bg-sky-300/10 text-sky-300",
    amber: "bg-amber-300/10 text-amber-300",
    rose: "bg-rose-300/10 text-rose-300",
    teal: "bg-teal-300/10 text-teal-300",
  };

  const isHighlighted = color === 'purple';

  return (
    <div className={cn(
      "group relative min-h-[148px] overflow-hidden rounded-[24px] border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6",
      colorClasses[color]
    )}>
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity",
        isHighlighted ? "bg-white/[0.35] opacity-70" : "bg-white/10 opacity-30 group-hover:opacity-60"
      )} />
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "truncate text-[11px] font-bold uppercase tracking-[0.14em] md:text-xs",
            isHighlighted ? "text-zinc-950/60" : "text-zinc-500"
          )}>{title}</p>
          <p className={cn(
            "mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl",
            isHighlighted ? "text-zinc-950" : "text-white"
          )}>{value}</p>
          {subtitle && (
            <p className={cn(
              "mt-1 text-xs md:text-sm",
              isHighlighted ? "text-zinc-950/60" : "text-zinc-500"
            )}>{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium",
              trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex-shrink-0 rounded-2xl p-2.5 md:p-3", iconClasses[color])}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
