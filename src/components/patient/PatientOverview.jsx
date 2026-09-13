import React from 'react';
import PatientOverviewCard from "@/components/clinician/PatientOverviewCard";
import PatientInjuryHighlighter from "@/components/injury/PatientInjuryHighlighter";
import WeekCalendarOverview from "@/components/clinician/WeekCalendarOverview";

export default function PatientOverview({
        patient,
        activePlan,
        currentPhase,
        activePlanPhases,
        adherenceRate,
        avgPainLevel,
        exerciseLogs,
        patientOutcomeMeasures,
        interventions,
        dayNotes,
        onSendProm,
        onAddNote,
        onViewExitCriteria
      }) {
        return (
          <div className="space-y-8">
            {/* Injury Map */}
                  <PatientInjuryHighlighter patient={patient} />

                  {/* Quick Stats - 3 Column Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <p className="text-sm font-medium text-slate-600 mb-3">Adherence (30d)</p>
                      <p className="text-4xl font-bold text-purple-600">{adherenceRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <p className="text-sm font-medium text-slate-600 mb-3">Avg Pain Level</p>
                      <p className="text-4xl font-bold text-rose-600">{avgPainLevel?.toFixed(1) || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <p className="text-sm font-medium text-slate-600 mb-3">Pending PROMs</p>
                      <p className="text-4xl font-bold text-amber-600">{patientOutcomeMeasures.filter(o => o.status === 'pending').length}</p>
                    </div>
                  </div>

                  {/* Plan Hero Card */}
                  <PatientOverviewCard
                    plan={activePlan}
                    currentPhase={currentPhase}
                    activePlanPhases={activePlanPhases}
                    onSendProm={onSendProm}
                    onAddNote={onAddNote}
                    onViewExitCriteria={onViewExitCriteria}
                  />

                  {/* Weekly Overview */}
                  <WeekCalendarOverview
                    currentPhase={currentPhase}
                    plan={activePlan}
                    exerciseLogs={exerciseLogs}
                    patientOutcomeMeasures={patientOutcomeMeasures}
                    interventions={interventions}
                    dayNotes={dayNotes}
                    onDayClick={() => {}}
                  />
          </div>
        );
      }