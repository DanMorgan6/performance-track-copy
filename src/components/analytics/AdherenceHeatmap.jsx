import React from 'react';
import { format, eachDayOfInterval, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

// dailyData: { [dateStr]: { expected, completed } } built by the shared adherence helpers,
// so this chart renders the same truth used everywhere else.
export default function AdherenceHeatmap({ dailyData = {}, days = 84 }) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  const getColor = (dateStr) => {
    const data = dailyData[dateStr];
    if (!data || data.expected === 0) {
      // Rest day or pre-plan: neutral, unless unexpected activity was logged.
      return (!data || data.completed === 0) ? 'bg-slate-100' : 'bg-amber-300';
    }
    const rate = data.completed / data.expected;
    if (rate >= 0.8) return 'bg-emerald-500';
    if (rate >= 0.5) return 'bg-emerald-300';
    if (rate > 0) return 'bg-amber-300';
    return 'bg-rose-300';
  };

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];
  allDays.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === allDays.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const data = dailyData[dateStr];
              return (
                <div
                  key={dateStr}
                  title={`${format(day, 'MMM d')}: ${data ? `${data.completed}/${data.expected} completed` : 'No data'}`}
                  className={cn('w-3.5 h-3.5 rounded-sm cursor-default transition-all hover:scale-125', getColor(dateStr))}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <div className="w-3 h-3 rounded-sm bg-amber-300" />
          <div className="w-3 h-3 rounded-sm bg-emerald-300" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}