import React from 'react';
import SessionLoadChart from '@/components/analytics/SessionLoadChart';
import LoadPerformanceInsights from '@/components/analytics/LoadPerformanceInsights';
import CohortComparison from '@/components/analytics/CohortComparison';
import AutoTaskSuggestions from '@/components/clinician/AutoTaskSuggestions';
import TaskManager from '@/components/clinician/TaskManager';
import ProgressDashboard from '@/components/analytics/ProgressDashboard';
import AdherenceChart from '@/components/analytics/AdherenceChart';
import { format } from 'date-fns';

export default function PatientAnalyticsTab({
  patient,
  patientId,
  exerciseLogs,
  painLogs,
  assessments,
  patientOutcomeMeasures,
  currentPhase,
  adherenceRate,
  avgPainLevel,
  dailyNotes,
}) {
  return (
    <div className="space-y-4 lg:space-y-6 mx-3 lg:mx-0">
      {/* Session Load Analytics */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Session Load Analysis</h3>
        <SessionLoadChart exerciseLogs={exerciseLogs} />
      </div>

      {/* AI Load Insights */}
      <LoadPerformanceInsights patient={patient} exerciseLogs={exerciseLogs} />

      {/* Cohort Comparison */}
      <CohortComparison
        patient={patient}
        adherenceRate={adherenceRate}
        avgPainLevel={avgPainLevel}
      />

      {/* Auto Task Suggestions */}
      <AutoTaskSuggestions
        patient={patient}
        adherenceRate={adherenceRate}
        avgPainLevel={avgPainLevel}
        outcomeMeasures={patientOutcomeMeasures}
      />

      {/* Tasks Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tasks & Follow-ups</h3>
        <TaskManager patientId={patientId} showPatientInfo={false} />
      </div>

      <ProgressDashboard
        painLogs={painLogs}
        assessments={assessments}
        exerciseLogs={exerciseLogs}
        outcomeMeasures={patientOutcomeMeasures}
      />

      {/* Adherence Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Exercise Adherence</h3>
        <AdherenceChart exerciseLogs={exerciseLogs} currentPhase={currentPhase} days={30} />
      </div>

      {/* Daily Check-Ins */}
      {dailyNotes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Check-Ins</h3>
          <div className="space-y-3">
            {dailyNotes.slice(0, 10).map((note) => (
              <div key={note.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-slate-700">
                    {format(new Date(note.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex gap-2 text-xs flex-wrap justify-end">
                    <span className="px-2 py-1 bg-white rounded-full">{note.mood}</span>
                    <span className="px-2 py-1 bg-white rounded-full">Energy: {note.energy_level}/10</span>
                    <span className="px-2 py-1 bg-white rounded-full">Sleep: {note.sleep_quality}</span>
                    <span className="px-2 py-1 bg-white rounded-full">Adherence: {note.adherence_self_rating}/10</span>
                  </div>
                </div>
                {note.notes && <p className="text-sm text-slate-600">{note.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}