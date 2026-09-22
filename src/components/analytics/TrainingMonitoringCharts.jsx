import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Dumbbell, Gauge, HeartPulse } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildExerciseTrendGroups,
  buildInternalLoadSeries,
  buildReadinessSummary,
  buildResponseSeries,
} from '@/lib/trainingTrendData';

const TOOLTIP_STYLE = {
  backgroundColor: '#171719',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '14px',
  color: '#fff',
  fontSize: '12px',
};

function ChartCard({ icon: Icon, title, subtitle, children, action }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#242427]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
            <Icon className="h-4 w-4 text-[#d8ff5f]" />
          </div>
          <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[230px] flex-col items-center justify-center text-center">
      <Activity className="h-7 w-7 text-zinc-700" />
      <p className="mt-3 max-w-sm text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function ReadinessPanel({ summary }) {
  const appearance = {
    responding: {
      icon: CheckCircle2,
      border: 'border-emerald-300/20',
      background: 'bg-emerald-300/[0.06]',
      colour: 'text-emerald-300',
    },
    review: {
      icon: AlertTriangle,
      border: 'border-amber-300/20',
      background: 'bg-amber-300/[0.06]',
      colour: 'text-amber-300',
    },
    insufficient: {
      icon: Clock3,
      border: 'border-white/[0.08]',
      background: 'bg-white/[0.03]',
      colour: 'text-zinc-400',
    },
  }[summary.status];
  const Icon = appearance.icon;

  return (
    <div className={`rounded-[24px] border p-5 ${appearance.border} ${appearance.background}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${appearance.colour}`} />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Current response status</p>
          <h4 className={`mt-1 text-lg font-black ${appearance.colour}`}>{summary.label}</h4>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{summary.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.contributors.map((contributor) => (
              <span key={contributor} className="rounded-full border border-white/[0.08] bg-[#171719]/60 px-3 py-1 text-xs text-zinc-300">
                {contributor}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs text-zinc-500">
        This is a transparent review prompt, not a readiness score. Phase progression still requires exit criteria and clinician approval.
      </p>
    </div>
  );
}

export default function TrainingMonitoringCharts({ exerciseLogs = [], sessionLogs = [], morningCheckIns = [] }) {
  const [loadView, setLoadView] = useState('daily');
  const exerciseGroups = useMemo(() => buildExerciseTrendGroups(exerciseLogs), [exerciseLogs]);
  const [selectedKey, setSelectedKey] = useState('');

  const selectedExercise = exerciseGroups.find((group) => group.key === selectedKey) || exerciseGroups[0];
  const internalLoad = useMemo(() => buildInternalLoadSeries(sessionLogs, loadView), [sessionLogs, loadView]);
  const responseData = useMemo(() => buildResponseSeries(sessionLogs, morningCheckIns), [sessionLogs, morningCheckIns]);
  const readiness = useMemo(() => buildReadinessSummary(sessionLogs, morningCheckIns), [sessionLogs, morningCheckIns]);

  const hasInternalLoad = internalLoad.some((row) => row.value > 0);
  const hasResponseData = responseData.some((row) => (
    row.immediatePain != null || row.nextMorning != null || row.fatigue != null || row.recovery != null || row.sleepQuality != null
  ));

  const viewCopy = {
    daily: 'Individual daily Internal Session Load across the latest 14 days',
    weekly: 'Seven-day totals, grouped Monday to Sunday, across the latest 10 weeks',
    long: 'Rolling 28-day Internal Session Load, sampled weekly',
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <ChartCard
          icon={Activity}
          title="Internal Session Load"
          subtitle={`${viewCopy[loadView]}. Session RPE × duration; not mechanical workload.`}
          action={(
            <div className="flex rounded-xl border border-white/[0.08] bg-[#171719] p-1">
              {[
                ['daily', 'Daily'],
                ['weekly', '7-day'],
                ['long', '28-day'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLoadView(value)}
                  aria-pressed={loadView === value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${loadView === value ? 'bg-[#d8ff5f] text-[#171719]' : 'text-zinc-500 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        >
          {hasInternalLoad ? (
            <ResponsiveContainer width="100%" height={270}>
              <ComposedChart data={internalLoad} margin={{ top: 12, right: 6, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} AU`, loadView === 'daily' ? 'Daily load' : loadView === 'weekly' ? '7-day load' : '28-day load']} />
                <Bar dataKey="value" fill="#d8ff5f" radius={[7, 7, 0, 0]} maxBarSize={34} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="Session duration and whole-session RPE will populate this graph." />}
        </ChartCard>

        <ReadinessPanel summary={readiness} />
      </div>

      <ChartCard
        icon={HeartPulse}
        title="Clinical response & recovery"
        subtitle="Session pain and the following daily morning symptoms, fatigue, recovery and sleep remain separate 0–10 measures."
      >
        {hasResponseData ? (
          <ResponsiveContainer width="100%" height={285}>
            <ComposedChart data={responseData} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
              <Line type="monotone" dataKey="immediatePain" name="Pain after" stroke="#fb7185" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="nextMorning" name="Next morning" stroke="#fbbf24" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#a78bfa" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="recovery" name="Recovery" stroke="#5eead4" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sleepQuality" name="Sleep" stroke="#60a5fa" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <EmptyChart message="Session pain and daily morning check-ins will populate this graph." />}
      </ChartCard>

      <div className="rounded-[24px] border border-white/[0.08] bg-[#242427]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
              <Dumbbell className="h-4 w-4 text-[#d8ff5f]" />
            </div>
            <div>
              <h4 className="font-bold text-white">Exercise-specific progression</h4>
              <p className="mt-1 text-xs text-zinc-500">Volume load and Estimated Strength are compared only within the same exercise, setup, equipment and side.</p>
            </div>
          </div>

          {exerciseGroups.length > 0 && (
            <select
              value={selectedExercise?.key || ''}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="max-w-full rounded-xl border border-white/[0.08] bg-[#171719] px-3 py-2 text-sm text-white"
              aria-label="Select exercise trend"
            >
              {exerciseGroups.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.name}{group.side !== 'not_applicable' ? ` · ${group.side}` : ''}{group.equipment ? ` · ${group.equipment}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedExercise ? (
          <div className="grid gap-5 p-3 sm:p-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-[#171719]/60 p-3">
              <div className="px-2 pt-2">
                <p className="text-sm font-bold text-white">Weekly Gym Workload</p>
                <p className="mt-1 text-xs text-zinc-500">Volume load ({selectedExercise.unit}) with hard-set exposure</p>
              </div>
              {selectedExercise.weekly.some((row) => row.volumeLoad > 0 || row.hardSets > 0) ? (
                <ResponsiveContainer width="100%" height={255}>
                  <ComposedChart data={selectedExercise.weekly} margin={{ top: 18, right: 4, left: -20, bottom: 2 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="load" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="sets" orientation="right" allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                    <Bar yAxisId="load" dataKey="volumeLoad" name="Volume load" fill="#d8ff5f" radius={[7, 7, 0, 0]} />
                    <Line yAxisId="sets" type="monotone" dataKey="hardSets" name="Hard sets" stroke="#5eead4" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="Working-set data will populate exercise-specific workload." />}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#171719]/60 p-3">
              <div className="flex items-start gap-2 px-2 pt-2">
                <Gauge className="mt-0.5 h-4 w-4 text-violet-300" />
                <div>
                  <p className="text-sm font-bold text-white">Estimated Strength</p>
                  <p className="mt-1 text-xs text-zinc-500">Valid set estimate and three-exposure rolling trend ({selectedExercise.unit})</p>
                </div>
              </div>
              {selectedExercise.exposures.length ? (
                <ResponsiveContainer width="100%" height={255}>
                  <ComposedChart data={selectedExercise.exposures} margin={{ top: 18, right: 8, left: -18, bottom: 2 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value).toFixed(1)} ${selectedExercise.unit}`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                    <Line type="monotone" dataKey="estimatedStrength" name="Set estimate" stroke="#71717a" strokeWidth={1.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="rollingStrength" name="3-exposure trend" stroke="#a78bfa" strokeWidth={3} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="Estimated Strength appears only when valid 3–10 repetition sets with measurable resistance are recorded." />}
            </div>
          </div>
        ) : (
          <EmptyChart message="Exercise graphs will appear after performance sets are logged." />
        )}
      </div>
    </div>
  );
}
