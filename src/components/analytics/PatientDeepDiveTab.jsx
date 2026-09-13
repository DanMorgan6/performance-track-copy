import React, { useState } from 'react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import AdherenceHeatmap from './AdherenceHeatmap';
import { TrendingDown, TrendingUp, Minus, Activity, AlertCircle, BarChart3 } from 'lucide-react';

// ─── Longitudinal Progress Chart ─────────────────────────────────────────────
function LongitudinalChart({ painLogs, patientOutcomeMeasures, outcomeMeasures, assessments }) {
  const [overlay, setOverlay] = useState('pain'); // 'pain' | 'outcomes' | 'assessments'

  // Build unified pain timeline
  const painData = [...painLogs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(l => ({
      date: format(new Date(l.date), 'MMM d'),
      rawDate: l.date,
      pain: l.pain_level,
    }));

  // Outcome measures — normalise to % of max score
  const completedOutcomes = patientOutcomeMeasures
    .filter(o => o.status === 'completed' && o.completed_date)
    .sort((a, b) => new Date(a.completed_date) - new Date(b.completed_date));

  const outcomeGroups = {};
  completedOutcomes.forEach(o => {
    const measure = outcomeMeasures.find(m => m.id === o.outcome_measure_id);
    if (!measure) return;
    const key = measure.name;
    if (!outcomeGroups[key]) outcomeGroups[key] = { max: measure.total_score_max, data: [] };
    outcomeGroups[key].data.push({
      date: format(new Date(o.completed_date), 'MMM d'),
      rawDate: o.completed_date,
      score: o.total_score,
      pct: measure.total_score_max ? Math.round((o.total_score / measure.total_score_max) * 100) : 0,
      name: key,
    });
  });

  const COLORS = ['#9333ea', '#06b6d4', '#f59e0b', '#10b981'];
  const outcomeNames = Object.keys(outcomeGroups);

  // Assessment timeline
  const assessmentData = [...assessments]
    .sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date))
    .reduce((acc, a) => {
      const key = `${a.test_name}${a.side !== 'n/a' ? ` (${a.side})` : ''}`;
      if (!acc[key]) acc[key] = [];
      const numericVal = parseFloat(a.value);
      if (!isNaN(numericVal)) {
        acc[key].push({
          date: format(new Date(a.assessment_date), 'MMM d'),
          value: numericVal,
          unit: a.unit,
        });
      }
      return acc;
    }, {});
  const assessmentKeys = Object.keys(assessmentData);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pain', label: 'Pain Levels' },
          { id: 'outcomes', label: 'Outcome Scores' },
          { id: 'assessments', label: 'Objective Tests' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setOverlay(t.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              overlay === t.id
                ? 'bg-purple-600 text-white border-transparent'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pain chart */}
      {overlay === 'pain' && (
        painData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={painData}>
              <defs>
                <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: 'Pain /10', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`${v}/10`, 'Pain']} />
              <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'High Pain', fontSize: 10, fill: '#ef4444' }} />
              <Area type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} fill="url(#painGrad)" dot={{ r: 3, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">No pain logs recorded</div>
        )
      )}

      {/* Outcomes chart */}
      {overlay === 'outcomes' && (
        outcomeNames.length > 0 ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {outcomeNames.map((name, i) => (
                <span key={name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {name}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Score']} />
                {outcomeNames.map((name, i) => (
                  <Line
                    key={name}
                    data={outcomeGroups[name].data}
                    type="monotone"
                    dataKey="pct"
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 5, fill: COLORS[i % COLORS.length] }}
                    name={name}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">No completed outcome measures</div>
        )
      )}

      {/* Assessments chart */}
      {overlay === 'assessments' && (
        assessmentKeys.length > 0 ? (
          <div className="space-y-6">
            {assessmentKeys.slice(0, 4).map((key, i) => (
              <div key={key}>
                <p className="text-xs font-medium text-slate-600 mb-2">{key}</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={assessmentData[key]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v, n, p) => [`${v} ${p.payload.unit || ''}`, key]} />
                    <Line type="monotone" dataKey="value" stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">No objective assessments recorded</div>
        )
      )}
    </div>
  );
}

// ─── Correlation Scatter Plot ─────────────────────────────────────────────────
function CorrelationChart({ exerciseLogs, painLogs, patientOutcomeMeasures, outcomeMeasures }) {
  const [xAxis, setXAxis] = useState('adherence'); // 'adherence'
  const [yAxis, setYAxis] = useState('pain');       // 'pain' | 'outcome'

  // Build weekly data points
  const weeks = 16;
  const data = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = subDays(new Date(), i * 7);
    const weekStart = subDays(weekEnd, 6);

    const weekLogs = exerciseLogs.filter(l => {
      const d = new Date(l.date);
      return d >= weekStart && d <= weekEnd;
    });
    const adherence = weekLogs.length > 0
      ? Math.round((weekLogs.filter(l => l.completed).length / weekLogs.length) * 100)
      : null;

    const weekPain = painLogs.filter(l => {
      const d = new Date(l.date);
      return d >= weekStart && d <= weekEnd;
    });
    const avgPain = weekPain.length > 0
      ? parseFloat((weekPain.reduce((s, l) => s + l.pain_level, 0) / weekPain.length).toFixed(1))
      : null;

    if (adherence !== null && avgPain !== null) {
      data.push({ week: format(weekStart, 'MMM d'), adherence, pain: avgPain });
    }
  }

  // Pearson correlation coefficient
  const calcCorrelation = (pts, xKey, yKey) => {
    if (pts.length < 3) return null;
    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p[xKey], 0);
    const sumY = pts.reduce((s, p) => s + p[yKey], 0);
    const sumXY = pts.reduce((s, p) => s + p[xKey] * p[yKey], 0);
    const sumX2 = pts.reduce((s, p) => s + p[xKey] ** 2, 0);
    const sumY2 = pts.reduce((s, p) => s + p[yKey] ** 2, 0);
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    return den === 0 ? 0 : parseFloat((num / den).toFixed(2));
  };

  const correlation = data.length >= 3 ? calcCorrelation(data, 'adherence', 'pain') : null;

  const corrLabel = correlation === null
    ? 'Insufficient data'
    : correlation < -0.5
      ? `Strong negative correlation (${correlation}) — higher adherence → lower pain`
      : correlation > 0.5
        ? `Strong positive correlation (${correlation})`
        : `Weak / no correlation (${correlation})`;

  const corrColor = correlation !== null && correlation < -0.3
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : correlation !== null && correlation > 0.3
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="space-y-4">
      {correlation !== null && (
        <div className={cn('text-xs font-medium px-3 py-2 rounded-lg border', corrColor)}>
          📊 {corrLabel}
        </div>
      )}

      {data.length >= 3 ? (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="adherence"
              name="Adherence"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              label={{ value: 'Adherence %', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="pain"
              name="Pain"
              domain={[0, 10]}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              label={{ value: 'Avg Pain', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(val, name) => [name === 'Adherence' ? `${val}%` : `${val}/10`, name]}
            />
            <Scatter data={data} fill="#9333ea" opacity={0.8} />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-10 text-slate-400 text-sm">
          Not enough data yet for correlation analysis (need at least 3 weeks of pain + exercise logs)
        </div>
      )}
      <p className="text-xs text-slate-400">Each point = one week of data. X = exercise adherence, Y = average pain level.</p>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PatientDeepDiveTab({
  patient,
  exerciseLogs,
  painLogs,
  patientOutcomeMeasures,
  outcomeMeasures,
  assessments,
  activePlan,
}) {
  // Summary stats
  const totalLogs = exerciseLogs.length;
  const completedLogs = exerciseLogs.filter(l => l.completed).length;
  const overallAdherence = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  const avgPain = painLogs.length > 0
    ? (painLogs.reduce((s, l) => s + l.pain_level, 0) / painLogs.length).toFixed(1)
    : null;

  // Pain trend direction
  const recent = painLogs.slice(0, 5);
  const older = painLogs.slice(5, 10);
  const recentAvg = recent.length > 0 ? recent.reduce((s, l) => s + l.pain_level, 0) / recent.length : null;
  const olderAvg = older.length > 0 ? older.reduce((s, l) => s + l.pain_level, 0) / older.length : null;
  const painTrend = recentAvg !== null && olderAvg !== null
    ? recentAvg < olderAvg - 0.5 ? 'improving' : recentAvg > olderAvg + 0.5 ? 'worsening' : 'stable'
    : 'insufficient';

  // Latest outcome score
  const latestOutcome = [...patientOutcomeMeasures]
    .filter(o => o.status === 'completed' && o.completed_date)
    .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0];
  const latestMeasure = latestOutcome ? outcomeMeasures.find(m => m.id === latestOutcome.outcome_measure_id) : null;
  const latestPct = latestOutcome && latestMeasure?.total_score_max
    ? Math.round((latestOutcome.total_score / latestMeasure.total_score_max) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{overallAdherence}%</p>
          <p className="text-xs text-slate-500 mt-1">Overall Adherence</p>
        </div>
        <div className={cn('rounded-xl p-4 text-center border', painTrend === 'improving' ? 'bg-emerald-50 border-emerald-100' : painTrend === 'worsening' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100')}>
          <div className="flex items-center justify-center gap-1 mb-1">
            {painTrend === 'improving' && <TrendingDown className="w-4 h-4 text-emerald-600" />}
            {painTrend === 'worsening' && <TrendingUp className="w-4 h-4 text-rose-600" />}
            {(painTrend === 'stable' || painTrend === 'insufficient') && <Minus className="w-4 h-4 text-slate-500" />}
            <p className="text-2xl font-bold text-slate-700">{avgPain ?? '—'}</p>
          </div>
          <p className="text-xs text-slate-500">Avg Pain ({painTrend})</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalLogs}</p>
          <p className="text-xs text-slate-500 mt-1">Total Exercise Logs</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{latestPct !== null ? `${latestPct}%` : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Latest PROM Score</p>
        </div>
      </div>

      {/* Adherence Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-800">Exercise Adherence Heatmap</h3>
          <span className="text-xs text-slate-400 ml-auto">Last 12 weeks</span>
        </div>
        <AdherenceHeatmap exerciseLogs={exerciseLogs} days={84} />
      </div>

      {/* Longitudinal Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-800">Longitudinal Progress</h3>
        </div>
        <LongitudinalChart
          painLogs={painLogs}
          patientOutcomeMeasures={patientOutcomeMeasures}
          outcomeMeasures={outcomeMeasures}
          assessments={assessments}
        />
      </div>

      {/* Correlation Analysis */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-800">Adherence vs Pain Correlation</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Scatter plot of weekly adherence % against average pain level</p>
        <CorrelationChart
          exerciseLogs={exerciseLogs}
          painLogs={painLogs}
          patientOutcomeMeasures={patientOutcomeMeasures}
          outcomeMeasures={outcomeMeasures}
        />
      </div>
    </div>
  );
}