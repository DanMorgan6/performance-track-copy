import React from 'react';
import { Calendar, Dumbbell, Clock, TrendingUp } from 'lucide-react';

function countSessions(days) {
  return days.filter(d => d.emphasis && d.emphasis !== 'rest').length;
}

function countExercises(days) {
  return days.reduce((sum, d) => sum + (d.blocks || []).reduce((s, b) => s + (b.exercises?.length || 0), 0), 0);
}

function estimateMinutes(days) {
  return days.reduce((sum, d) => {
    if (!d.duration) return sum;
    const match = d.duration.match(/(\d+)/);
    return match ? sum + parseInt(match[1]) : sum;
  }, 0);
}

export default function WeeklyStats({ days = [] }) {
  const sessions = countSessions(days);
  const exercises = countExercises(days);
  const minutes = estimateMinutes(days);

  const stats = [
    { label: 'Planned Sessions', value: sessions, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Exercises', value: exercises, icon: Dumbbell, color: 'text-blue-600 bg-blue-50' },
    { label: 'Est. Weekly Load', value: minutes > 0 ? `${minutes} min` : '—', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Rest Days', value: 7 - sessions, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
            <s.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}