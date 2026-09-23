import React, { useState } from 'react';
import { Target, Check, LockKeyhole, Clock3, ChevronDown, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

// Patient-facing, read-only view of a criteria-led rehabilitation pathway.
// Shows every phase in the active plan, its status, and exit-criteria progress,
// so the patient can see where they are and what comes next.
export default function PatientPathwayCard({ activePlan, currentPhase, phases = [] }) {
  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  const [expandedId, setExpandedId] = useState(currentPhase?.id || null);

  if (!activePlan || sortedPhases.length === 0) return null;

  // Only render for genuinely criteria-led pathways (at least one phase has exit criteria).
  const hasCriteria = sortedPhases.some((p) => (p.exit_criteria || []).length > 0);
  if (!hasCriteria) return null;

  const toggle = (phase) => {
    if (phase.status === 'completed' || phase.id === currentPhase?.id || phase.status === 'active') {
      setExpandedId((id) => (id === phase.id ? null : phase.id));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 md:p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">Your Recovery Pathway</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your plan is criteria-led. Each phase has goals to meet before your practitioner advances you to the next stage.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-1">
        {sortedPhases.map((phase, index) => {
          const criteria = phase.exit_criteria || [];
          const metCount = criteria.filter((c) => c.is_met).length;
          const isComplete = phase.status === 'completed';
          const isActive = phase.id === currentPhase?.id || phase.status === 'active';
          const isLocked = !isComplete && !isActive;
          const isReviewReady = isActive && criteria.length > 0 && metCount === criteria.length;
          const outstanding = Math.max(criteria.length - metCount, 0);
          const expanded = expandedId === phase.id;
          const canExpand = !isLocked && criteria.length > 0;
          const percentage = criteria.length > 0 ? Math.round((metCount / criteria.length) * 100) : 0;

          return (
            <li key={phase.id || phase.phase_number} className="relative">
              {/* connector */}
              {index < sortedPhases.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[18px] top-10 bottom-0 w-px',
                    isComplete ? 'bg-emerald-300' : 'bg-slate-200'
                  )}
                />
              )}

              <div
                className={cn(
                  'relative pl-12 pb-5',
                  isLocked && 'opacity-60'
                )}
              >
                {/* status circle */}
                <div
                  className={cn(
                    'absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2',
                    isComplete && 'border-emerald-500 bg-emerald-500 text-white',
                    isActive && 'border-purple-500 bg-purple-500 text-white',
                    isLocked && 'border-slate-300 bg-white text-slate-400'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : isLocked ? (
                    <LockKeyhole className="h-3.5 w-3.5" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggle(phase)}
                  disabled={!canExpand}
                  className={cn(
                    'w-full text-left',
                    canExpand && 'cursor-pointer'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Phase {phase.phase_number}
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{phase.name}</h4>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        isComplete && 'bg-emerald-100 text-emerald-700',
                        isReviewReady && 'bg-lime-100 text-lime-800',
                        isActive && !isReviewReady && 'bg-purple-100 text-purple-700',
                        isLocked && 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {isComplete
                        ? 'Completed'
                        : isReviewReady
                          ? 'Ready for review'
                          : isActive
                            ? 'Current phase'
                            : 'Upcoming'}
                    </span>
                  </div>

                  {phase.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{phase.description}</p>
                  )}

                  {/* criteria progress */}
                  {criteria.length > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" />
                          {metCount} of {criteria.length} goals met
                        </span>
                        {canExpand && (
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 text-slate-400 transition-transform',
                              expanded && 'rotate-180'
                            )}
                          />
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            percentage === 100 ? 'bg-emerald-500' : 'bg-purple-500'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    !isLocked && (
                      <p className="text-xs text-slate-400 italic mt-2">
                        Goals will be set by your practitioner.
                      </p>
                    )
                  )}

                  {phase.duration_weeks && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock3 className="h-3 w-3" />
                      Review window: {phase.duration_weeks} week{phase.duration_weeks === 1 ? '' : 's'}
                    </div>
                  )}
                </button>

                {/* expanded criteria list */}
                {expanded && criteria.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {criteria.map((criterion, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border p-2',
                          criterion.is_met
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                            criterion.is_met ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'
                          )}
                        >
                          {criterion.is_met && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              criterion.is_met ? 'text-emerald-900' : 'text-slate-700'
                            )}
                          >
                            {criterion.criterion}
                          </p>
                          {criterion.target_value && (
                            <p className="text-xs text-slate-500 mt-0.5">Target: {criterion.target_value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isActive && (
                      <p className="text-[11px] text-slate-400 pt-1">
                        Only your practitioner can sign off progression to the next phase.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}