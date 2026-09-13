import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  achieved: { label: 'Achieved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  blocked: { label: 'Blocked', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertCircle },
};

export default function PhasePanel({ phase, phases, currentPhaseIndex, onCriteriaToggle }) {
  const [expanded, setExpanded] = useState(true);

  if (!phase) return null;

  const criteria = phase.exit_criteria || [];
  const achievedCount = criteria.filter(c => c.is_met).length;
  const completionPct = criteria.length > 0 ? Math.round((achievedCount / criteria.length) * 100) : 0;
  const allMet = criteria.length > 0 && achievedCount === criteria.length;
  const nextPhase = phases?.[currentPhaseIndex + 1];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors"
        onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Active Phase</span>
              <span className="text-xs text-slate-400">Phase {(phase.phase_number || 1)}</span>
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">{phase.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", allMet ? "bg-emerald-500" : "bg-purple-500")}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">{achievedCount}/{criteria.length} criteria</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* Phase meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
            {phase.duration_weeks && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{phase.duration_weeks} weeks</p>
              </div>
            )}
            {phase.description && (
              <div className="bg-slate-50 rounded-xl p-3 col-span-2 sm:col-span-3">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Objective</p>
                <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{phase.description}</p>
              </div>
            )}
          </div>

          {/* Exit Criteria */}
          {criteria.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Exit Criteria</p>
              {criteria.map((c, i) => {
                const status = c.is_met ? 'achieved' : 'in_progress';
                const cfg = statusConfig[status];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl border", cfg.color)}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onCriteriaToggle?.(i); }}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{c.criterion}</p>
                      {c.target_value && <p className="text-[10px] opacity-70">Target: {c.target_value}</p>}
                    </div>
                    <span className="text-[10px] font-semibold whitespace-nowrap">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Next Phase Lock */}
          {nextPhase && (
            <div className={cn(
              "mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
              allMet ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
            )}>
              {allMet ? <ArrowRight className="w-4 h-4 flex-shrink-0 text-emerald-600" /> : <Lock className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium">
                {allMet ? `Ready to progress to: ${nextPhase.name}` : `Next phase locked: ${nextPhase.name} — complete all criteria above`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}