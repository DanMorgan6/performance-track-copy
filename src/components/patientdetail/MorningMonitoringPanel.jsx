import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { CloudSun, Activity, Moon, BatteryCharging, BedDouble } from 'lucide-react';
import { getMonitoringLevel, isMorningCheckInEnabled } from '@/lib/planModes';

const MONITORING_LEVEL_LABEL = {
  basic: 'Basic',
  standard: 'Standard',
  performance: 'Performance',
};

function MetricPill({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2">
      <Icon className={`h-4 w-4 ${accent}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="text-sm font-bold text-white">{value ?? '—'}<span className="ml-0.5 text-xs font-medium text-zinc-500">/10</span></p>
      </div>
    </div>
  );
}

export default function MorningMonitoringPanel({ patient, activePlan }) {
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['morning-check-ins', patient?.clinic_id, patient?.id],
    queryFn: () => base44.entities.MorningCheckIn.filter(
      { clinic_id: patient.clinic_id, patient_id: patient.id },
      '-date',
      30
    ),
    enabled: Boolean(patient?.clinic_id && patient?.id),
  });

  const monitoringLevel = getMonitoringLevel(activePlan);
  const morningEnabled = isMorningCheckInEnabled(activePlan);
  const recent = checkIns.slice(0, 14);

  const avg = (field) => {
    const values = recent.map((c) => Number(c[field])).filter((v) => Number.isFinite(v));
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d8ff5f] text-[#171719]">
              <CloudSun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d8ff5f]">Daily monitoring</p>
              <h3 className="mt-0.5 text-lg font-black text-white">Morning check-ins</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Patient-reported symptoms, fatigue, recovery and sleep before each day's activity.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-bold text-zinc-300">
              {MONITORING_LEVEL_LABEL[monitoringLevel]} monitoring
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${morningEnabled ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.05] text-zinc-500'}`}>
              {morningEnabled ? 'Morning prompt on' : 'Morning prompt off'}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#242427] p-8 text-center text-sm text-zinc-500">
          Loading monitoring data…
        </div>
      ) : recent.length === 0 ? (
        <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-7 text-center">
          <BedDouble className="mx-auto h-9 w-9 text-zinc-600" />
          <h3 className="mt-3 font-bold text-white">No morning check-ins recorded</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            {morningEnabled
              ? 'The patient has not submitted a morning check-in yet. The daily prompt appears at the top of their portal each morning.'
              : 'Morning monitoring is not enabled for this plan. Turn it on in the plan settings to start collecting daily readiness data.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricPill icon={Activity} label="Avg symptoms" value={avg('morning_symptoms')} accent="text-rose-300" />
            <MetricPill icon={BatteryCharging} label="Avg fatigue" value={avg('fatigue')} accent="text-amber-300" />
            <MetricPill icon={Moon} label="Avg recovery" value={avg('recovery')} accent="text-[#d8ff5f]" />
            <MetricPill icon={BedDouble} label="Avg sleep" value={avg('sleep_quality')} accent="text-sky-300" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#242427]">
            <div className="grid grid-cols-5 gap-2 border-b border-white/[0.08] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              <span>Date</span>
              <span className="text-center">Symptoms</span>
              <span className="text-center">Fatigue</span>
              <span className="text-center">Recovery</span>
              <span className="text-center">Sleep</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recent.map((entry) => (
                <div key={entry.id} className="grid grid-cols-5 gap-2 border-b border-white/[0.04] px-4 py-2.5 text-sm last:border-b-0">
                  <span className="font-semibold text-white">{format(new Date(entry.date), 'dd MMM')}</span>
                  <span className="text-center text-rose-200">{entry.morning_symptoms ?? '—'}</span>
                  <span className="text-center text-amber-200">{entry.fatigue ?? '—'}</span>
                  <span className="text-center text-[#d8ff5f]">{entry.recovery ?? '—'}</span>
                  <span className="text-center text-sky-200">{entry.sleep_quality ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {recent[0]?.note && (
            <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4 text-sm text-zinc-300">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Latest note · {format(new Date(recent[0].date), 'dd MMM')}</p>
              <p className="mt-1">{recent[0].note}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}