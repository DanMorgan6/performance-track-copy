import React from 'react';
import { Check, ChevronRight, Clock3, LockKeyhole, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CriteriaLedPhaseRibbon({ phases = [], currentPhase, onPhaseClick }) {
  if (phases.length === 0) return null;

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);

  return (
    <section className="mb-6 rounded-[24px] border border-white/[0.08] bg-[#242427] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d8ff5f]">
            <Target className="h-4 w-4" />
            Criteria-led pathway
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">Phase progression</h2>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-zinc-500">
          Duration guides review timing only. A practitioner advances the patient after exit criteria and clinical context have been reviewed.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {sortedPhases.map((phase, index) => {
          const criteria = phase.exit_criteria || [];
          const metCount = criteria.filter((criterion) => criterion.is_met).length;
          const isComplete = phase.status === 'completed';
          const isActive = phase.id === currentPhase?.id || phase.status === 'active';
          const isLocked = !isComplete && !isActive;
          const isReviewReady = isActive && criteria.length > 0 && metCount === criteria.length;
          const outstanding = Math.max(criteria.length - metCount, 0);

          return (
            <React.Fragment key={phase.id || phase.phase_number}>
              <button
                type="button"
                onClick={() => !isLocked && onPhaseClick?.(phase)}
                disabled={isLocked}
                className={cn(
                  'min-w-[235px] rounded-2xl border p-4 text-left transition-colors',
                  isComplete && 'border-emerald-300/20 bg-emerald-400/[0.07]',
                  isActive && 'border-[#d8ff5f]/35 bg-[#d8ff5f]/[0.07]',
                  isLocked && 'cursor-not-allowed border-white/[0.06] bg-black/10 opacity-55'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      Phase {phase.phase_number}
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-sm font-bold text-white">{phase.name}</h3>
                  </div>
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isComplete && 'bg-emerald-400 text-zinc-950',
                    isActive && 'bg-[#d8ff5f] text-zinc-950',
                    isLocked && 'bg-white/[0.06] text-zinc-500'
                  )}>
                    {isComplete ? <Check className="h-4 w-4" /> : isLocked ? <LockKeyhole className="h-3.5 w-3.5" /> : <Target className="h-4 w-4" />}
                  </div>
                </div>

                {phase.description && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-500">{phase.description}</p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3 text-xs">
                  <span className={cn(
                    'font-semibold',
                    isComplete && 'text-emerald-300',
                    isReviewReady && 'text-[#d8ff5f]',
                    isActive && !isReviewReady && 'text-amber-300',
                    isLocked && 'text-zinc-600'
                  )}>
                    {isComplete
                      ? 'Clinically completed'
                      : isReviewReady
                        ? 'Ready for review'
                        : criteria.length === 0
                          ? 'Criteria required'
                          : `${outstanding} outstanding`}
                  </span>
                  <span className="text-zinc-600">{metCount}/{criteria.length}</span>
                </div>

                {phase.duration_weeks && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <Clock3 className="h-3 w-3" />
                    Review window: {phase.duration_weeks} week{phase.duration_weeks === 1 ? '' : 's'}
                  </div>
                )}
              </button>
              {index < sortedPhases.length - 1 && (
                <ChevronRight className="mt-16 hidden h-5 w-5 shrink-0 text-zinc-700 sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
