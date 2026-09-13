import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, FileText, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PhaseTimeline from "@/components/ui/PhaseTimeline";
import ExitCriteriaCard from "@/components/ui/ExitCriteriaCard";
import PhaseTriggersManager from "@/components/outcome/PhaseTriggersManager";
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

export default function PatientPlanTab({
  patientId,
  patient,
  plans,
  activePlan,
  activePlanPhases,
  currentPhase,
  phaseTriggers,
  outcomeMeasures,
  updatePlanMutation,
  queryClient,
  onSaveTemplate,
}) {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [viewWeekIndex, setViewWeekIndex] = useState(0);

  const displayPhase = selectedPhase || currentPhase;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* All Plans List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">Rehabilitation Plans</h3>
          <Link to={createPageUrl(`CreatePlan?patient_id=${patientId}`)}>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl" size="sm">
              <Plus className="w-4 h-4 mr-2" />New Plan
            </Button>
          </Link>
        </div>

        {plans.length > 0 ? (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800">{plan.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      plan.status === 'active' && "bg-emerald-100 text-emerald-700",
                      plan.status === 'completed' && "bg-blue-100 text-blue-700",
                      plan.status === 'paused' && "bg-amber-100 text-amber-700",
                      plan.status === 'draft' && "bg-slate-200 text-slate-700"
                    )}>{plan.status}</span>
                  </div>
                  {plan.description && <p className="text-sm text-slate-500">{plan.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {plan.start_date && <span>{format(new Date(plan.start_date), 'MMM d, yyyy')}</span>}
                    {plan.total_phases && <span>• {plan.total_phases} phases</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {plan.status !== 'active' && (
                    <Button onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'active' }})} variant="outline" size="sm" className="rounded-xl text-emerald-600 hover:text-emerald-700">Activate</Button>
                  )}
                  <Link to={createPageUrl(`EditPlan?id=${plan.id}`)}>
                    <Button variant="outline" size="sm" className="rounded-xl"><Edit className="w-4 h-4" /></Button>
                  </Link>
                  <Button onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'paused' }})} variant="outline" size="sm" className="rounded-xl">Pause</Button>
                  <Button onClick={async () => { if (window.confirm('Delete this plan?')) { await base44.entities.RehabPlan.delete(plan.id); queryClient.invalidateQueries({ queryKey: ['patient-plans'] }); }}} variant="outline" size="sm" className="rounded-xl text-rose-600 hover:text-rose-700"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No plans yet</p>
          </div>
        )}
      </div>

      {/* Active Plan Details */}
      {activePlan && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">{activePlan.title}</h2>
              {activePlan.description && <p className="text-slate-500 text-sm mt-1">{activePlan.description}</p>}
            </div>
            <Button onClick={onSaveTemplate} variant="outline" size="sm" className="rounded-xl">
              <FileText className="w-4 h-4 mr-2" />Save as Template
            </Button>
          </div>

          <PhaseTimeline phases={activePlanPhases} currentPhase={activePlan.current_phase} onPhaseClick={(phase) => setSelectedPhase(phase)} />

          <div className="mt-5">
            <PhaseTriggersManager planId={activePlan.id} phases={activePlanPhases} />
          </div>

          {/* Weekly Schedule */}
          {displayPhase && (() => {
            if (!displayPhase?.weeks || displayPhase.weeks.length === 0) {
              return (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Exercise List</h3>
                  {displayPhase?.exercises?.length > 0 ? (
                    displayPhase.exercises.map((exercise, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-2">
                        <div className="font-medium text-slate-700">{exercise.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{exercise.sets} sets × {exercise.reps} reps</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-6">No exercises defined</p>
                  )}
                </div>
              );
            }

            const currentWeek = displayPhase.weeks[viewWeekIndex] || displayPhase.weeks[0];
            return (
              <div className="mt-5 space-y-4">
                {displayPhase.weeks.length > 1 && (
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewWeekIndex(Math.max(0, viewWeekIndex - 1))} disabled={viewWeekIndex === 0} className="rounded-lg">
                      <ChevronLeft className="w-4 h-4 mr-1" />Prev
                    </Button>
                    <span className="text-sm font-semibold text-slate-700">Week {currentWeek.week_number} / {displayPhase.weeks.length}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewWeekIndex(Math.min(displayPhase.weeks.length - 1, viewWeekIndex + 1))} disabled={viewWeekIndex === displayPhase.weeks.length - 1} className="rounded-lg">
                      Next<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="grid grid-cols-7 gap-1 min-w-[560px]">
                    {currentWeek.daily_schedule?.map((day, dayIndex) => (
                      <div key={dayIndex} className={cn("rounded-xl border-2 overflow-hidden", day.type === 'training' && "border-purple-200", day.type === 'rest' && "border-slate-200 bg-slate-50", day.type === 'conditioning' && "border-blue-200")}>
                        <div className={cn("p-2 border-b-2 text-center", day.type === 'training' && "bg-purple-50 border-purple-200", day.type === 'rest' && "bg-slate-100 border-slate-200", day.type === 'conditioning' && "bg-blue-50 border-blue-200")}>
                          <div className="text-[10px] font-bold text-slate-600">{day.day.substring(0, 3).toUpperCase()}</div>
                        </div>
                        <div className="p-2 space-y-1.5 min-h-[200px] text-[11px]">
                          {day.type !== 'rest' ? (
                            day.exercises?.length > 0 ? day.exercises.map((exercise, ei) => (
                              <div key={ei} className={cn("p-1.5 rounded-lg", exercise.superset_group ? "bg-amber-50 border border-amber-200" : "bg-slate-50")}>
                                <div className="font-medium text-slate-700 leading-tight">{exercise.name || 'Unnamed'}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">{exercise.sets}×{exercise.reps}</div>
                              </div>
                            )) : <div className="text-center py-4 text-slate-400 text-[10px]">No exercises</div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-[10px]">Rest</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {displayPhase && (
            <div className="mt-5 p-5 bg-slate-50 rounded-2xl">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{displayPhase?.name}</h3>
              {displayPhase?.description && <p className="text-sm text-slate-500 mb-4">{displayPhase.description}</p>}
              <ExitCriteriaCard
                criteria={displayPhase?.exit_criteria}
                editable={true}
                onToggle={async (index) => {
                  const updatedCriteria = [...displayPhase.exit_criteria];
                  updatedCriteria[index].is_met = !updatedCriteria[index].is_met;
                  await base44.entities.RehabPhase.update(displayPhase.id, { exit_criteria: updatedCriteria });
                  queryClient.invalidateQueries({ queryKey: ['patient-phases'] });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}