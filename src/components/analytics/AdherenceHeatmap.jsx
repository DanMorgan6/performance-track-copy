import React from 'react';
import { format, eachDayOfInterval, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdherenceHeatmap({ exerciseLogs, days = 84 }) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);

  const allDays = eachDayOfInterval({ start: startDate, end: today });

  // Build a map of date -> { completed, total }
  const logMap = {};
  exerciseLogs.forEach(log => {
    if (!logMap[log.date]) logMap[log.date] = { completed: 0, total: 0 };
    logMap[log.date].total++;
    if (log.completed) logMap[log.date].completed++;
  });

  const getColor = (dateStr) => {
    const data = logMap[dateStr];
    if (!data || data.total === 0) return 'bg-slate-100';
    const rate = data.completed / data.total;
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
              const data = logMap[dateStr];
              return (
                <div
                  key={dateStr}
                  title={`${format(day, 'MMM d')}: ${data ? `${data.completed}/${data.total} completed` : 'No data'}`}
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