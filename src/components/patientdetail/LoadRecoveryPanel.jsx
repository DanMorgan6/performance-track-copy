import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity,
  Footprints,
  HeartPulse,
  Link2,
  Moon,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const PROVIDERS = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    note: 'Requires the planned iOS companion app.'
  },
  {
    id: 'health_connect',
    name: 'Health Connect',
    note: 'Requires the planned Android companion app.'
  },
  {
    id: 'garmin',
    name: 'Garmin',
    note: 'Available after Garmin developer approval.'
  },
  {
    id: 'fitbit',
    name: 'Fitbit / Google Health',
    note: 'Available after provider approval and migration review.'
  }
];

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <Icon className="h-4 w-4 text-[#d8ff5f]" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-600">{detail}</p>
    </div>
  );
}

export default function LoadRecoveryPanel({ patient }) {
  const { data: connections = [] } = useQuery({
    queryKey: ['wearable-connections', patient?.id],
    queryFn: () => base44.entities.WearableConnection.filter(
      { patient_id: patient.id, clinic_id: patient.clinic_id },
      '-created_date'
    ),
    enabled: !!patient?.id && !!patient?.clinic_id
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ['wearable-summaries', patient?.id],
    queryFn: () => base44.entities.WearableDailySummary.filter(
      { patient_id: patient.id, clinic_id: patient.clinic_id },
      '-summary_date',
      14
    ),
    enabled: !!patient?.id && !!patient?.clinic_id
  });

  const recent = summaries.slice(0, 7);
  const average = (field) => {
    const values = recent
      .map((item) => Number(item[field]))
      .filter((value) => Number.isFinite(value));
    if (values.length === 0) return null;
    return values.reduce((total, value) => total + value, 0) / values.length;
  };
  const total = (field) => recent.reduce((sum, item) => {
    const value = Number(item[field]);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const latest = recent[0];
  const avgSleepMinutes = average('sleep_minutes');
  const avgRestingHeartRate = average('resting_heart_rate');
  const avgHrv = average('hrv_ms');
  const connectedProviders = new Set(
    connections.filter((connection) => connection.status === 'connected').map((connection) => connection.provider)
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[#d8ff5f]/20 bg-[#d8ff5f]/[0.06] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#d8ff5f]" />
          <div>
            <h3 className="font-bold text-white">Decision support, never automatic progression</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Load and recovery data can add context to a clinical review. Performance Track+ never advances a rehabilitation phase because of wearable data or elapsed time alone.
            </p>
          </div>
        </div>
      </div>

      {recent.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={Footprints}
              label="Steps"
              value={Math.round(total('steps')).toLocaleString()}
              detail="Total across latest 7 records"
            />
            <MetricCard
              icon={Activity}
              label="Active minutes"
              value={Math.round(total('active_minutes')).toLocaleString()}
              detail="Latest 7 records"
            />
            <MetricCard
              icon={Moon}
              label="Average sleep"
              value={avgSleepMinutes == null ? '—' : `${Math.floor(avgSleepMinutes / 60)}h ${Math.round(avgSleepMinutes % 60)}m`}
              detail="Use alongside symptoms and clinical findings"
            />
            <MetricCard
              icon={HeartPulse}
              label="Recovery markers"
              value={avgRestingHeartRate == null ? '—' : `${Math.round(avgRestingHeartRate)} bpm`}
              detail={avgHrv == null ? 'Average resting heart rate' : `RHR · HRV ${Math.round(avgHrv)} ms`}
            />
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#242427] p-4 text-sm text-zinc-400">
            Latest sync: {latest?.summary_date || 'Not available'} · Source: {latest?.provider?.replaceAll('_', ' ') || 'Not recorded'}
          </div>
        </>
      ) : (
        <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-7 text-center">
          <Smartphone className="mx-auto h-9 w-9 text-zinc-600" />
          <h3 className="mt-3 font-bold text-white">No wearable data yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            The data model is ready for consented provider connections. Live sync remains off until the clinic completes the relevant provider approvals and mobile-bridge work.
          </p>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-white">Connection readiness</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const connected = connectedProviders.has(provider.id);
            return (
              <div key={provider.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#242427] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Link2 className="h-4 w-4 text-[#d8ff5f]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{provider.name}</p>
                    <span className={connected
                      ? 'rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300'
                      : 'rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-zinc-500'
                    }>
                      {connected ? 'Connected' : 'Integration ready'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{provider.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
