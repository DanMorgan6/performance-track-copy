import React from 'react';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PhaseTimeline({ phases, currentPhase, onPhaseClick }) {
  if (!phases || phases.length === 0) return null;

  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
      
      <div className="space-y-4">
        {phases.sort((a, b) => a.phase_number - b.phase_number).map((phase, index) => {
          const isActive = phase.status === 'active';
          const isCompleted = phase.status === 'completed';
          const isPending = phase.status === 'pending';
          
          return (
            <div
              key={phase.id}
              onClick={() => onPhaseClick?.(phase)}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-2xl transition-all",
                isActive && "bg-purple-50 border border-purple-100 shadow-sm cursor-pointer",
                isCompleted && "bg-emerald-50/50 cursor-pointer",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Status indicator */}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8 rounded-full",
                isCompleted && "bg-emerald-500",
                isActive && "bg-purple-600",
                isPending && "bg-slate-200"
              )}>
                {isCompleted && <CheckCircle2 className="w-5 h-5 text-white" />}
                {isActive && <Play className="w-4 h-4 text-white ml-0.5" />}
                {isPending && <Circle className="w-4 h-4 text-slate-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Phase {phase.phase_number}</span>
                  {isActive && (
                    <span className="px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">Current</span>
                  )}
                </div>
                <h4 className={cn(
                  "font-semibold mt-0.5",
                  isCompleted && "text-emerald-700",
                  isActive && "text-purple-700",
                  isPending && "text-slate-400"
                )}>
                  {phase.name}
                  {isPending && <span className="ml-2 text-xs">(Locked)</span>}
                </h4>
                {phase.duration_weeks && (
                  <p className="text-xs text-slate-400 mt-1">
                    {phase.duration_weeks} week{phase.duration_weeks !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Progress indicator for active phase */}
              {isActive && phase.exit_criteria && (
                <div className="text-right">
                  <span className="text-xs text-purple-600 font-medium">
                    {phase.exit_criteria.filter(c => c.is_met).length}/{phase.exit_criteria.length}
                  </span>
                  <p className="text-xs text-slate-400">criteria met</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}