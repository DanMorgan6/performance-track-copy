import React from 'react';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import ProgressSummaryCard from './ProgressSummaryCard';

export default function InsightsAtAGlance({
  painLogs = [],
  exerciseLogs = [],
  patientOutcomeMeasures = [],
  outcomeMeasures = [],
  assessments = [],
  dailyNotes = []
}) {
  // Latest pain
  const latestPain = painLogs?.length > 0 ? painLogs[0].pain_level : null;
  const previousPain = painLogs?.length > 1 ? painLogs[1].pain_level : null;
  const painTrend = latestPain !== null && previousPain !== null ? latestPain - previousPain : null;

  // Latest function score (from completed outcome measures)
  const completedOutcomes = patientOutcomeMeasures?.filter(o => o.status === 'completed') || [];
  const latestOutcome = completedOutcomes.length > 0 ? completedOutcomes[0] : null;
  const latestOutcomeMeasure = latestOutcome ? outcomeMeasures?.find(m => m.id === latestOutcome.outcome_measure_id) : null;
  const functionImprovement = latestOutcome && latestOutcome.baseline_score ? 
    latestOutcome.total_score - latestOutcome.baseline_score : null;

  // Exercise adherence (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const logsInLast30 = exerciseLogs?.filter(log => new Date(log.date) >= thirtyDaysAgo) || [];
  const daysLogged = new Set(logsInLast30.map(log => log.date)).size;

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <ProgressSummaryCard
        painLogs={painLogs}
        patientOutcomeMeasures={patientOutcomeMeasures}
        assessments={assessments}
        dailyNotes={dailyNotes}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pain Level */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-600">Current Pain Level</h3>
          {painTrend !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
              painTrend < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}>
              {painTrend < 0 ? '↓' : '↑'} {Math.abs(painTrend)}
            </div>
          )}
        </div>
        {latestPain !== null ? (
          <>
            <p className="text-4xl font-bold text-slate-900 mb-1">{latestPain}</p>
            <p className="text-xs text-slate-500">/10 • {format(new Date(painLogs[0].date), 'MMM d, yyyy')}</p>
          </>
        ) : (
          <p className="text-slate-400">No pain logs yet</p>
        )}
      </div>

      {/* Function Score */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-600">Latest Outcome Measure</h3>
          {functionImprovement !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
              functionImprovement > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            )}>
              {functionImprovement > 0 ? '+' : ''}{functionImprovement}
            </div>
          )}
        </div>
        {latestOutcome ? (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-2">{latestOutcomeMeasure?.name}</p>
            <p className="text-3xl font-bold text-slate-900">{latestOutcome.total_score}</p>
            <p className="text-xs text-slate-500 mt-1">
              {latestOutcome.baseline_score ? `from baseline ${latestOutcome.baseline_score}` : 'No baseline'}
            </p>
          </>
        ) : (
          <p className="text-slate-400">No questionnaires completed yet</p>
        )}
      </div>

      {/* Exercise Adherence */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Exercise Activity (30d)</h3>
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-3xl font-bold text-slate-900">{daysLogged}</p>
            <p className="text-xs text-slate-500">days with activity</p>
          </div>
        </div>
      </div>
      </div>
      </div>
      );
      }