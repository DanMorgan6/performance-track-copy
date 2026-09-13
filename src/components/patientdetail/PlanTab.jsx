import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PhaseTimeline from "@/components/ui/PhaseTimeline";
import ExitCriteriaCard from "@/components/ui/ExitCriteriaCard";
import PhaseTriggersManager from "@/components/outcome/PhaseTriggersManager";
import { cn } from "@/lib/utils";

export default function PlanTab({
  patientId, plans, activePlan, activePlanPhases, currentPhase, selectedPhase,
  viewWeekIndex, setViewWeekIndex, setSelectedPhase,
  updatePlanMutation, queryClient, phaseTriggers, outcomeMeasures,
  patient, patientOutcomeMeasures, base44,
  setShowSaveTemplateDialog, setTemplateData,
}) {
  return (
    <div className="space-y-4">
      {/* All Plans */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-sm font-semibold text-slate-800">Rehabilitation Plans</h3>
          <Link to={createPageUrl(`CreatePlan?patient_id=${patientId}`)}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs">
              <Plus className="w-4 h-4 mr-1" /> New Plan
            </Button>
          </Link>
        </div>
        {plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-800 text-sm">{plan.title}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      plan.status === 'active' && "bg-emerald-100 text-emerald-700",
                      plan.status === 'completed' && "bg-blue-100 text-blue-700",
                      plan.status === 'paused' && "bg-amber-100 text-amber-700",
                      plan.status === 'draft' && "bg-slate-200 text-slate-700"
                    )}>{plan.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {plan.start_date && <span>{format(new Date(plan.start_date), 'MMM d, yyyy')}</span>}
                    {plan.total_phases && <span>• {plan.total_phases} phases</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {plan.status !== 'active' && (
                    <Button onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'active' }})} variant="outline" size="sm" className="rounded-xl text-emerald-600 text-xs">Reactivate</Button>
                  )}
                  <Link to={createPageUrl(`EditPlan?id=${plan.id}`)}>
                    <Button variant="outline" size="sm" className="rounded-xl"><Edit className="w-4 h-4" /></Button>
                  </Link>
                  <Button onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'paused' }})} variant="outline" size="sm" className="rounded-xl text-xs">Pause</Button>
                  <Button onClick={async () => {
                    if (window.confirm('Delete this plan and all its data? This cannot be undone.')) {
                      await base44.entities.RehabPlan.delete(plan.id);
                      queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
                    }
                  }} variant="outline" size="sm" className="rounded-xl text-rose-600 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-400 text-sm">No plans yet</p>
        )}
      </div>

      {/* Active Plan Details */}
      {activePlan ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">{activePlan.title}</h2>
              {activePlan.description && <p className="text-slate-500 text-sm mt-1">{activePlan.description}</p>}
            </div>
            <Button onClick={() => {
              setTemplateData({ name: activePlan.title, description: activePlan.description || '', condition_type: patient?.injury_type || '' });
              setShowSaveTemplateDialog(true);
            }} variant="outline" size="sm" className="rounded-xl text-xs">
              <FileText className="w-4 h-4 mr-1" /> Save as Template
            </Button>
          </div>

          <PhaseTimeline phases={activePlanPhases} currentPhase={activePlan.current_phase} onPhaseClick={(phase) => setSelectedPhase(phase)} />

          <div className="mt-5">
            <PhaseTriggersManager planId={activePlan.id} phases={activePlanPhases} />
          </div>

          {/* Weekly Schedule */}
          {(selectedPhase || currentPhase) && (() => {
            const phase = selectedPhase || currentPhase;
            if (!phase?.weeks || phase.weeks.length === 0) {
              return (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Weekly Schedule</h3>
                  <p className="text-sm text-slate-500 mb-3">This phase uses a general exercise list.</p>
                  <div className="space-y-2">
                    {phase?.exercises?.map((exercise, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                        <div className="font-medium text-slate-700">{exercise.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{exercise.sets} sets × {exercise.reps} reps</div>
                      </div>
                    )) || <p className="text-center text-slate-400 py-8 text-sm">No exercises defined</p>}
                  </div>
                </div>
              );
            }
            const currentWeek = phase.weeks[viewWeekIndex] || phase.weeks[0];
            return (
              <div className="mt-5 space-y-3">
                {phase.weeks.length > 1 && (
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewWeekIndex(Math.max(0, viewWeekIndex - 1))} disabled={viewWeekIndex === 0} className="rounded-lg text-xs">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <span className="text-sm font-semibold text-slate-700">Week {currentWeek.week_number} of {phase.weeks.length}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewWeekIndex(Math.min(phase.weeks.length - 1, viewWeekIndex + 1))} disabled={viewWeekIndex === phase.weeks.length - 1} className="rounded-lg text-xs">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-1 min-w-[480px]">
                    {currentWeek.daily_schedule?.map((day, dayIndex) => (
                      <div key={dayIndex} className={cn("bg-white rounded-xl border-2 overflow-hidden",
                        day.type === 'training' && "border-purple-200",
                        day.type === 'rest' && "border-slate-200 bg-slate-50",
                        day.type === 'conditioning' && "border-blue-200"
                      )}>
                        <div className={cn("p-2 border-b-2 text-center",
                          day.type === 'training' && "bg-purple-50 border-purple-200",
                          day.type === 'rest' && "bg-slate-100 border-slate-200",
                          day.type === 'conditioning' && "bg-blue-50 border-blue-200"
                        )}>
                          <div className="text-[10px] font-bold text-slate-600">{day.day.substring(0,3).toUpperCase()}</div>
                        </div>
                        <div className="p-2 space-y-2 min-h-[200px] text-[11px]">
                          {day.type !== 'rest' ? (
                            day.exercises?.length > 0 ? day.exercises.map((ex, i) => (
                              <div key={i} className={cn("p-1.5 rounded-lg", ex.superset_group ? "bg-amber-50 border border-amber-200" : "bg-slate-50")}>
                                <div className="font-medium text-slate-700 leading-tight">{ex.name || 'Unnamed'}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{ex.sets}×{ex.reps}</div>
                              </div>
                            )) : <div className="text-center py-4 text-slate-300 text-[10px]">Empty</div>
                          ) : <div className="text-center py-4 text-slate-300 text-[10px]">Rest</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {(selectedPhase || currentPhase) && (
            <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{(selectedPhase || currentPhase)?.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{(selectedPhase || currentPhase)?.description}</p>
              <ExitCriteriaCard
                criteria={(selectedPhase || currentPhase)?.exit_criteria}
                editable={true}
                onToggle={async (index) => {
                  const phaseToUpdate = selectedPhase || currentPhase;
                  const updatedCriteria = [...phaseToUpdate.exit_criteria];
                  updatedCriteria[index].is_met = !updatedCriteria[index].is_met;
                  await base44.entities.RehabPhase.update(phaseToUpdate.id, { exit_criteria: updatedCriteria });
                  queryClient.invalidateQueries({ queryKey: ['patient-phases'] });
                  if (phaseToUpdate.status === 'active') {
                    const allMet = updatedCriteria.every(c => c.is_met);
                    if (allMet && activePlan) {
                      const nextPhaseNumber = phaseToUpdate.phase_number + 1;
                      if (nextPhaseNumber <= activePlan.total_phases) {
                        await base44.entities.RehabPhase.update(phaseToUpdate.id, { status: 'completed' });
                        const completionTriggers = phaseTriggers.filter(t => t.phase_number === phaseToUpdate.phase_number && t.trigger_type === 'phase_complete' && !t.triggered);
                        for (const trigger of completionTriggers) {
                          const measure = outcomeMeasures.find(m => m.id === trigger.outcome_measure_id);
                          if (measure) {
                            const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
                            await base44.entities.PatientOutcomeMeasure.create({ patient_id: patientId, outcome_measure_id: trigger.outcome_measure_id, sent_date: new Date().toISOString().split('T')[0], status: 'pending', frequency: 'one-time', notes: `Automatically sent upon completing ${phaseToUpdate.name}` });
                            await base44.integrations.Core.SendEmail({ to: patient.email, subject: `Phase Complete! New Questionnaire Available`, body: `Hi ${patient.full_name},\n\nCongratulations on completing ${phaseToUpdate.name}!\n\nPlease complete: ${measure.name}\n\nPortal: ${portalUrl}` });
                            await base44.entities.PhaseOutcomeTrigger.update(trigger.id, { triggered: true, triggered_date: new Date().toISOString().split('T')[0] });
                          }
                        }
                        const nextPhase = activePlanPhases.find(p => p.phase_number === nextPhaseNumber);
                        if (nextPhase) {
                          await base44.entities.RehabPhase.update(nextPhase.id, { status: 'active' });
                          const startTriggers = phaseTriggers.filter(t => t.phase_number === nextPhaseNumber && t.trigger_type === 'phase_start' && !t.triggered);
                          for (const trigger of startTriggers) {
                            const measure = outcomeMeasures.find(m => m.id === trigger.outcome_measure_id);
                            if (measure) {
                              const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
                              await base44.entities.PatientOutcomeMeasure.create({ patient_id: patientId, outcome_measure_id: trigger.outcome_measure_id, sent_date: new Date().toISOString().split('T')[0], status: 'pending', frequency: 'one-time', notes: `Automatically sent at start of ${nextPhase.name}` });
                              await base44.integrations.Core.SendEmail({ to: patient.email, subject: `New Phase Started! Questionnaire Available`, body: `Hi ${patient.full_name},\n\nStarting ${nextPhase.name}!\n\nPlease complete: ${measure.name}\n\nPortal: ${portalUrl}` });
                              await base44.entities.PhaseOutcomeTrigger.update(trigger.id, { triggered: true, triggered_date: new Date().toISOString().split('T')[0] });
                            }
                          }
                        }
                        await base44.entities.RehabPlan.update(activePlan.id, { current_phase: nextPhaseNumber });
                        queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
                        queryClient.invalidateQueries({ queryKey: ['patient-outcomes'] });
                        queryClient.invalidateQueries({ queryKey: ['phase-triggers'] });
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-500 text-sm">Create a plan above to get started</p>
        </div>
      )}
    </div>
  );
}