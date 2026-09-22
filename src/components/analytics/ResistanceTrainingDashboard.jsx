import React, { useMemo } from 'react';
import { Activity, AlertTriangle, BarChart3, Dumbbell, Gauge, HeartPulse, TrendingDown, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  average,
  exerciseComparisonKey,
  percentChange,
  summariseWorkingSets,
} from '@/lib/trainingMetrics';

const startOfWeek = (dateValue) => {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
};

const formatValue = (value, decimals = 0) => (
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: decimals }) : '—'
);

function MetricCard({ icon: Icon, label, value, detail, tone = 'lime' }) {
  const tones = {
    lime: 'border-[#d8ff5f]/20 bg-[#d8ff5f]/[0.06] text-[#d8ff5f]',
    teal: 'border-teal-300/20 bg-teal-300/[0.06] text-teal-300',
    purple: 'border-violet-300/20 bg-violet-300/[0.06] text-violet-300',
    amber: 'border-amber-300/20 bg-amber-300/[0.06] text-amber-300',
    rose: 'border-rose-300/20 bg-rose-300/[0.06] text-rose-300',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</p>
    </div>
  );
}

const getLogSummary = (log) => {
  if (log.working_sets?.length) return summariseWorkingSets(log.working_sets, log.movement_type);
  const reps = Number.parseFloat(log.reps_completed) || 0;
  return {
    volume_load: Number(log.volume_load) || ((Number(log.sets_completed) || 0) * reps * (Number(log.weight) || 0)),
    hard_sets: Number(log.hard_sets) || 0,
    estimated_strength: Number(log.estimated_strength) || undefined,
    estimated_strength_confidence: log.estimated_strength_confidence || 'not_eligible',
  };
};

const responseFlagged = (log) => Number(log.pain_during) > 3
  || Number(log.pain_after) > 3
  || log.pain_limited === true
  || log.modified === true
  || log.difficulty === 'too_hard';

const sessionFlagged = (session) => Number(session.next_morning_symptoms) > 3
  || Number(session.immediate_pain) > 3
  || Number(session.fatigue) >= 8
  || session.modified === true
  || session.completion_status === 'stopped';

export default function ResistanceTrainingDashboard({ patient, exerciseLogs = [] }) {
  const { data: sessionLogs = [] } = useQuery({
    queryKey: ['training-session-logs', patient?.clinic_id, patient?.id],
    queryFn: () => base44.entities.TrainingSessionLog.filter({
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
    }, '-date', 200),
    enabled: Boolean(patient?.clinic_id && patient?.id),
  });

  const metrics = useMemo(() => {
    const enriched = exerciseLogs.map((log) => ({ ...log, summary: getLogSummary(log) }));
    const exerciseGroups = new Map();

    enriched.forEach((log) => {
      const key = exerciseComparisonKey(log);
      const current = exerciseGroups.get(key) || {
        key,
        name: log.exercise_name,
        unit: log.load_unit || 'kg',
        side: log.side || 'not_applicable',
        logs: [],
      };
      current.logs.push(log);
      exerciseGroups.set(key, current);
    });

    const exerciseRows = [...exerciseGroups.values()].map((group) => {
      const sorted = [...group.logs].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const weekly = new Map();
      sorted.forEach((log) => {
        const week = startOfWeek(log.date);
        weekly.set(week, (weekly.get(week) || 0) + (Number(log.summary.volume_load) || 0));
      });
      const weekEntries = [...weekly.entries()].sort(([a], [b]) => a.localeCompare(b));
      const latestWeek = weekEntries.at(-1)?.[1] || 0;
      const previousWeek = weekEntries.at(-2)?.[1] || 0;
      const exposures = sorted
        .filter((log) => Number(log.summary.estimated_strength) > 0)
        .map((log) => ({ date: log.date, value: Number(log.summary.estimated_strength), confidence: log.summary.estimated_strength_confidence }));
      const latestThree = exposures.slice(-3);
      const previousThree = exposures.slice(-6, -3);
      const rollingStrength = average(latestThree.map((exposure) => exposure.value));
      const previousRollingStrength = average(previousThree.map((exposure) => exposure.value));
      const recent = sorted.at(-1);
      const previous = sorted.at(-2);
      const recentRir = average((recent?.working_sets || []).map((set) => set.rir));
      const previousRir = average((previous?.working_sets || []).map((set) => set.rir));
      const efficient = Boolean(recent && previous
        && Number(recent.summary.volume_load) >= Number(previous.summary.volume_load)
        && ((recentRir != null && previousRir != null && recentRir > previousRir)
          || Number(recent.pain_after) < Number(previous.pain_after)));

      return {
        ...group,
        latestWeek,
        workloadChange: percentChange(latestWeek, previousWeek),
        rollingStrength,
        strengthChange: previousRollingStrength == null ? null : percentChange(rollingStrength, previousRollingStrength),
        confidence: latestThree.at(-1)?.confidence || 'not eligible',
        averageRir: average(sorted.flatMap((log) => (log.working_sets || []).map((set) => set.rir))),
        hardSets: sorted.reduce((sum, log) => sum + (Number(log.summary.hard_sets) || 0), 0),
        plannedSets: Number(recent?.planned_sets) || 0,
        completedSets: Number(recent?.sets_completed) || 0,
        efficient,
      };
    }).sort((a, b) => b.latestWeek - a.latestWeek);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const recentSessions = sessionLogs.filter((session) => new Date(`${session.date}T12:00:00`) >= sevenDaysAgo);
    const sessionLoad = recentSessions.reduce((sum, session) => sum + (Number(session.internal_session_load) || 0), 0);
    const totalHardSets = enriched.reduce((sum, log) => sum + (Number(log.summary.hard_sets) || 0), 0);
    const flaggedResponses = enriched.filter(responseFlagged).length + sessionLogs.filter(sessionFlagged).length;
    const strengthExercises = exerciseRows.filter((row) => row.rollingStrength != null).length;

    return {
      exerciseRows,
      trackedExercises: exerciseRows.filter((row) => row.latestWeek > 0).length,
      totalHardSets,
      strengthExercises,
      sessionLoad,
      recentSessionCount: recentSessions.length,
      flaggedResponses,
    };
  }, [exerciseLogs, sessionLogs]);

  return (
    <section className="space-y-5">
      <div className="rounded-[24px] border border-[#d8ff5f]/20 bg-[#d8ff5f]/[0.06] p-5">
        <h3 className="font-bold text-white">Gym progression & load response</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          Workload, strength capacity and perceived demand are kept separate. Signals support review; exit criteria and clinician approval still control progression.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard icon={BarChart3} label="Gym Workload" value={metrics.trackedExercises} detail="Exercises with separate weekly volume-load totals" />
        <MetricCard icon={Dumbbell} label="Strength Exposure" value={metrics.totalHardSets} detail="Logged working sets at RPE ≥7 / RIR ≤3" tone="teal" />
        <MetricCard icon={Gauge} label="Estimated Strength" value={metrics.strengthExercises} detail="Exercises with a valid three-exposure trend" tone="purple" />
        <MetricCard icon={Activity} label="Session Load" value={`${formatValue(metrics.sessionLoad)} AU`} detail={`Internal load across ${metrics.recentSessionCount} recent sessions`} tone="amber" />
        <MetricCard icon={HeartPulse} label="Load Response" value={metrics.flaggedResponses} detail="Pain, fatigue, modification or symptom flags for review" tone="rose" />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#242427]">
        <div className="border-b border-white/[0.08] p-5">
          <h4 className="font-bold text-white">Exercise-specific trends</h4>
          <p className="mt-1 text-xs text-zinc-500">Loads are never added across different exercises, equipment, setups or sides.</p>
        </div>

        {metrics.exerciseRows.length ? (
          <div className="divide-y divide-white/[0.08]">
            {metrics.exerciseRows.map((row) => (
              <div key={row.key} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-white">{row.name}</h5>
                    <p className="mt-1 text-xs capitalize text-zinc-500">{row.side.replace('_', ' ')} · {row.unit}</p>
                  </div>
                  {row.efficient && (
                    <span className="rounded-full bg-teal-300/10 px-3 py-1 text-xs font-bold text-teal-300">Efficiency improved</span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div><p className="text-xs text-zinc-500">Weekly volume load</p><p className="mt-1 font-bold text-white">{formatValue(row.latestWeek, 1)} {row.unit}</p></div>
                  <div>
                    <p className="text-xs text-zinc-500">Weekly change</p>
                    <p className="mt-1 flex items-center gap-1 font-bold text-white">
                      {row.workloadChange == null ? '—' : row.workloadChange >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-300" /> : <TrendingDown className="h-4 w-4 text-amber-300" />}
                      {row.workloadChange == null ? '' : `${Math.abs(row.workloadChange).toFixed(1)}%`}
                    </p>
                  </div>
                  <div><p className="text-xs text-zinc-500">Estimated Strength</p><p className="mt-1 font-bold text-white">{row.rollingStrength == null ? '—' : `${formatValue(row.rollingStrength, 1)} ${row.unit}`}</p><p className="text-[10px] text-zinc-600">3-exposure rolling · {row.confidence}</p></div>
                  <div><p className="text-xs text-zinc-500">Average RIR</p><p className="mt-1 font-bold text-white">{row.averageRir == null ? '—' : row.averageRir.toFixed(1)}</p></div>
                  <div><p className="text-xs text-zinc-500">Latest planned / actual</p><p className="mt-1 font-bold text-white">{row.plannedSets || '—'} / {row.completedSets || '—'} sets</p></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-7 w-7 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No resistance-training performance data has been logged yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
