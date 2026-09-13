import React from 'react';
import { format } from 'date-fns';
import { getWeekScheduleForDate } from '@/components/plan/PhaseProgressionEngine';
import { Dumbbell, Zap, Moon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_TYPE_CONFIG = {
  training: {
    label: 'Strength Day',
    sublabel: 'Build your strength',
    gradient: 'from-purple-900 via-purple-800 to-pink-900',
    accent: 'from-purple-500 to-pink-500',
    icon: Dumbbell,
    iconColor: 'text-purple-300',
    bgGlow: 'bg-purple-500/10',
    textAccent: 'text-purple-300',
  },
  conditioning: {
    label: 'Conditioning Day',
    sublabel: 'Push your endurance',
    gradient: 'from-blue-900 via-blue-800 to-cyan-900',
    accent: 'from-blue-500 to-cyan-500',
    icon: Zap,
    iconColor: 'text-blue-300',
    bgGlow: 'bg-blue-500/10',
    textAccent: 'text-blue-300',
  },
  rest: {
    label: 'Rest Day',
    sublabel: 'Recovery is progress too',
    gradient: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'from-slate-500 to-slate-600',
    icon: Moon,
    iconColor: 'text-slate-300',
    bgGlow: 'bg-slate-500/10',
    textAccent: 'text-slate-300',
  },
};

export default function DayTypeBannerCard({ activePlan, currentPhase, onViewToday }) {
  // Only show for phased programs
  if (!activePlan || activePlan.program_type !== 'phased' || !currentPhase?.weeks) {
    return null;
  }

  const today = new Date();
  const todayName = format(today, 'EEEE');

  const weekSchedule = getWeekScheduleForDate(currentPhase, activePlan, today);
  const todayDay = weekSchedule?.daily_schedule?.find(d => d.day === todayName);
  const dayType = todayDay?.type || 'rest';
  const exerciseCount = todayDay?.exercises?.length || 0;

  const config = DAY_TYPE_CONFIG[dayType] || DAY_TYPE_CONFIG.rest;
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden bg-gradient-to-br shadow-xl",
      config.gradient
    )}>
      {/* Decorative glow circle */}
      <div className={cn(
        "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20",
        config.bgGlow.replace('bg-', 'bg-')
      )} />
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)' }}
      />

      <div className="relative p-6">
        {/* Tag */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4",
          "bg-white/10 backdrop-blur-sm border border-white/20"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full bg-current animate-pulse", config.textAccent)} />
          <span className="text-white/80">{format(today, 'EEEE, MMMM d')}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-1">{config.label}</h3>
            <p className={cn("text-sm font-medium mb-4", config.textAccent)}>
              {config.sublabel}
            </p>
            {dayType !== 'rest' && exerciseCount > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/70">
                  {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} planned
                </span>
              </div>
            )}
            {onViewToday && dayType !== 'rest' && (
              <button
                onClick={onViewToday}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold",
                  "bg-gradient-to-r text-white shadow-lg transition-all hover:scale-105",
                  config.accent
                )}
              >
                View Today's Session
              </button>
            )}
          </div>

          {/* Big icon */}
          <div className={cn(
            "w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20"
          )}>
            <Icon className={cn("w-10 h-10", config.iconColor)} />
          </div>
        </div>
      </div>
    </div>
  );
}