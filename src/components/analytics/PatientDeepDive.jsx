import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdherenceHeatmap from './AdherenceHeatmap';
import { TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatientDeepDive({ patient, onClose }) {
  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['deep-exercise', patient.id],
    queryFn: () => base44.entities.ExerciseLog.filter({ patient_id: patient.id }, '-date'),
  });

  const { data: painLogs = [] } = useQuery({
    queryKey: ['deep-pain', patient.id],
    queryFn: () => base44.entities.PainLog.filter({ patient_id: patient.id }, '-date'),
  });

  const { data: patientOutcomes = [] } = useQuery({
    queryKey: ['deep-outcomes', patient.id],
    queryFn: () => base44.entities.PatientOutcomeMeasure.filter({ patient_id: patient.id }, '-sent_date'),
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures-list'],
    queryFn: () => base44.entities.OutcomeMeasure.list(),
  });

  // Weekly adherence data (last 12 weeks)
  const weeklyAdherence = Array.from({ length: 12 }, (_, i) => {
    const weekEnd = subDays(new Date(), i * 7);
    const weekStart = subDays(weekEnd, 6);
    const weekLogs = exerciseLogs.filter(l => {
      const d = new Date(l.date);
      return d >= weekStart && d <= weekEnd;
    });
    const rate = weekLogs.length > 0 ? Math.round((weekLogs.filter(l => l.completed).length / weekLogs.length) * 100) : 0;
    return { week: format(weekStart, 'MMM d'), adherence: rate };
  }).reverse();

  // Pain trend (last 30 logs)
  const painTrend = painLogs.slice(0, 30).reverse().map(l => ({
    date: format(new Date(l.date), 'MMM d'),
    pain: l.pain_level,
  }));

  // Outcome measure scores
  const completedOutcomes = patientOutcomes
    .filter(o => o.status === 'completed')
    .map(o => {
      const measure = outcomeMeasures.find(m => m.id === o.outcome_measure_id);
      return {
        date: format(new Date(o.completed_date), 'MMM d'),
        name: measure?.name || 'Unknown',
        score: o.total_score,
        maxScore: measure?.total_score_max || 100,
        pct: measure?.total_score_max ? Math.round((o.total_score / measure.total_score_max) * 100) : 0,
      };
    });

  // Overall stats
  const totalLogs = exerciseLogs.length;
  const completedLogs = exerciseLogs.filter(l => l.completed).length;
  const overallAdherence = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
  const avgPain = painLogs.length > 0
    ? (painLogs.reduce((s, l) => s + l.pain_level, 0) / painLogs.length).toFixed(1)
    : 'N/A';

  // Pain trend direction
  const recentPainAvg = painLogs.slice(0, 5).reduce((s, l) => s + l.pain_level, 0) / Math.max(painLogs.slice(0, 5).length, 1);
  const olderPainAvg = painLogs.slice(5, 10).reduce((s, l) => s + l.pain_level, 0) / Math.max(painLogs.slice(5, 10).length, 1);
  const painDirection = recentPainAvg < olderPainAvg - 0.5 ? 'improving' : recentPainAvg > olderPainAvg + 0.5 ? 'worsening' : 'stable';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-4xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{patient.full_name}</h2>
            <p className="text-sm text-slate-500">{patient.injury_type || 'No injury specified'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{overallAdherence}%</p>
              <p className="text-xs text-slate-500 mt-1">Overall Adherence</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{avgPain}</p>
              <p className="text-xs text-slate-500 mt-1">Avg Pain Score</p>
            </div>
            <div className={cn('rounded-xl p-4 text-center', painDirection === 'improving' ? 'bg-emerald-50' : painDirection === 'worsening' ? 'bg-rose-50' : 'bg-slate-50')}>
              <div className="flex items-center justify-center gap-1">
                {painDirection === 'improving' ? <TrendingDown className="w-5 h-5 text-emerald-600" /> : painDirection === 'worsening' ? <TrendingUp className="w-5 h-5 text-rose-600" /> : <Minus className="w-5 h-5 text-slate-500" />}
                <p className={cn('text-sm font-semibold capitalize', painDirection === 'improving' ? 'text-emerald-700' : painDirection === 'worsening' ? 'text-rose-700' : 'text-slate-600')}>
                  {painDirection}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Pain Trend</p>
            </div>
          </div>

          {/* Adherence Heatmap */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Exercise Adherence (Last 12 Weeks)</h3>
            <AdherenceHeatmap exerciseLogs={exerciseLogs} days={84} />
          </div>

          {/* Adherence trend */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Weekly Adherence Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyAdherence}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="adherence" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pain trend */}
          {painTrend.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Pain Level Over Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={painTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Outcome scores */}
          {completedOutcomes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Outcome Measure Scores</h3>
              <div className="space-y-2">
                {completedOutcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{o.name}</p>
                      <p className="text-xs text-slate-400">{o.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-700">{o.score}<span className="text-xs text-slate-400 font-normal">/{o.maxScore}</span></p>
                      <p className="text-xs text-slate-500">{o.pct}%</p>
                    </div>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${o.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}