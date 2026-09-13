import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "teal" }) {
  const colorClasses = {
    purple: "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-100",
    emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100",
    blue: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100",
    amber: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100",
    rose: "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-100",
  };

  const iconClasses = {
    purple: "text-purple-600 bg-purple-100",
    emerald: "text-emerald-500 bg-emerald-100",
    blue: "text-blue-500 bg-blue-100",
    amber: "text-amber-500 bg-amber-100",
    rose: "text-rose-500 bg-rose-100",
  };

  return (
    <div className={cn(
      "p-4 md:p-6 rounded-2xl border transition-all hover:shadow-lg",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-slate-500 font-medium truncate">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-400 mt-1">{subtitle}</p>
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
          <div className={cn("p-2 md:p-3 rounded-xl flex-shrink-0", iconClasses[color])}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        )}
      </div>
    </div>
  );
}