import React from 'react';
import { Dumbbell, Moon, Clock, BarChart2, Copy, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EMPHASIS_OPTIONS = [
  { value: 'rehab', label: 'Rehab', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
  { value: 'strength', label: 'Strength', color: 'bg-purple-100 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
  { value: 'conditioning', label: 'Conditioning', color: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
  { value: 'recovery', label: 'Recovery', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'rest', label: 'Rest', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
];

const emphasisStyle = {
  rehab: 'border-blue-200 bg-blue-50/30',
  strength: 'border-purple-200 bg-purple-50/30',
  conditioning: 'border-amber-200 bg-amber-50/30',
  recovery: 'border-emerald-200 bg-emerald-50/30',
  rest: 'border-slate-200 bg-slate-50',
};

const emphasisHeader = {
  rehab: 'bg-blue-500',
  strength: 'bg-purple-600',
  conditioning: 'bg-amber-500',
  recovery: 'bg-emerald-500',
  rest: 'bg-slate-300',
};

function getBlockSummary(blocks = []) {
  const badges = [];
  const supersets = blocks.filter(b => b.type === 'superset');
  const circuits = blocks.filter(b => b.type === 'circuit');
  if (supersets.length > 0) badges.push({ label: `${supersets.length} Superset${supersets.length > 1 ? 's' : ''}`, style: 'bg-violet-100 text-violet-700' });
  if (circuits.length > 0) badges.push({ label: `${circuits.length} Circuit${circuits.length > 1 ? 's' : ''}`, style: 'bg-amber-100 text-amber-700' });
  return badges;
}

function countExercises(blocks = []) {
  return blocks.reduce((sum, b) => sum + (b.exercises?.length || 0), 0);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DayCard({ day, dayIndex, isSelected, onSelect, onEmphasisChange, onCopy, onPaste, hasCopied }) {
  const emphasis = day.emphasis || 'rest';
  const isRest = emphasis === 'rest';
  const blockBadges = getBlockSummary(day.blocks || []);
  const exerciseCount = countExercises(day.blocks || []);

  return (
    <div
      onClick={() => onSelect(dayIndex)}
      className={cn(
        "group flex flex-col rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md select-none",
        emphasisStyle[emphasis],
        isSelected && "ring-2 ring-purple-500 ring-offset-2 shadow-lg",
        !isSelected && "hover:border-slate-300"
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1 w-full", emphasisHeader[emphasis])} />

      {/* Day label */}
      <div className="px-2 pt-2 pb-1 flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-widest", isRest ? "text-slate-400" : "text-slate-600")}>
          {DAY_LABELS[dayIndex]}
        </span>
        <div className="flex items-center gap-0.5">
          {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500 mr-0.5" />}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCopy?.(); }}
            title="Copy day"
            className="p-0.5 rounded hover:bg-white/70 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
          {hasCopied && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPaste?.(); }}
              title="Paste day"
              className="p-0.5 rounded hover:bg-white/70 text-purple-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <ClipboardPaste className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Session title */}
      <div className="px-3 pb-2">
        <p className={cn("text-xs font-semibold line-clamp-1", isRest ? "text-slate-400 italic" : "text-slate-800")}>
          {day.session_title || (isRest ? 'Rest Day' : 'Untitled Session')}
        </p>
      </div>

      {/* Emphasis pills */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {EMPHASIS_OPTIONS.map(opt => (
          <button
            type="button"
            key={opt.value}
            onClick={(e) => { e.stopPropagation(); onEmphasisChange(dayIndex, opt.value); }}
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full border font-semibold transition-all",
              emphasis === opt.value
                ? opt.color + " shadow-sm scale-105"
                : "bg-white/60 text-slate-400 border-slate-200 hover:border-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!isRest && (
        <div className="px-3 pb-3 space-y-1.5 flex-1">
          {day.duration && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{day.duration}</span>
            </div>
          )}
          {exerciseCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Dumbbell className="w-3 h-3" />
              <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {day.load_target && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <BarChart2 className="w-3 h-3" />
              <span>{day.load_target}</span>
            </div>
          )}
          {blockBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {blockBadges.map((b, i) => (
                <span key={i} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", b.style)}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
          {day.session_note && (
            <p className="text-[9px] text-slate-400 line-clamp-1 italic mt-1">{day.session_note}</p>
          )}
        </div>
      )}

      {isRest && (
        <div className="px-3 pb-4 flex-1 flex items-center justify-center">
          <Moon className="w-6 h-6 text-slate-300" />
        </div>
      )}
    </div>
  );
}