import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, HeartPulse } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { calculateInternalSessionLoad } from '@/lib/trainingMetrics';

const initialState = {
  duration_minutes: '',
  session_rpe: '',
  immediate_pain: '',
  modified: false,
  modification_reason: '',
  completion_status: 'completed',
};

export default function PatientSessionSummary({ patient, planId, phaseId, date }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);

  const filters = useMemo(() => ({
    clinic_id: patient?.clinic_id,
    patient_id: patient?.id,
    plan_id: planId,
    date,
  }), [patient?.clinic_id, patient?.id, planId, date]);

  const { data: existing } = useQuery({
    queryKey: ['training-session-log', filters],
    queryFn: async () => {
      const results = await base44.entities.TrainingSessionLog.filter(filters, '-created_date', 1);
      return results[0] || null;
    },
    enabled: Boolean(filters.clinic_id && filters.patient_id && filters.plan_id && date),
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      duration_minutes: existing.duration_minutes ?? '',
      session_rpe: existing.session_rpe ?? '',
      immediate_pain: existing.immediate_pain ?? '',
      modified: existing.modified === true,
      modification_reason: existing.modification_reason || '',
      completion_status: existing.completion_status || 'completed',
    });
  }, [existing]);

  const internalLoad = calculateInternalSessionLoad(form.duration_minutes, form.session_rpe);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...filters,
        phase_id: phaseId,
        duration_minutes: Number(form.duration_minutes) || 0,
        session_rpe: Number(form.session_rpe) || 0,
        internal_session_load: internalLoad,
        immediate_pain: form.immediate_pain === '' ? undefined : Number(form.immediate_pain),
        modified: form.modified,
        modification_reason: form.modified ? form.modification_reason : '',
        completion_status: form.completion_status,
        completed: form.completion_status === 'completed',
      };
      return existing
        ? base44.entities.TrainingSessionLog.update(existing.id, payload)
        : base44.entities.TrainingSessionLog.create(payload);
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['training-session-log'] });
      queryClient.invalidateQueries({ queryKey: ['training-session-logs'] });
    },
  });

  const update = (field, value) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const isComplete = saved || Boolean(existing);
  const displayDuration = existing?.duration_minutes ?? form.duration_minutes ?? 0;
  const displayRpe = existing?.session_rpe ?? form.session_rpe ?? 0;
  const displayLoad = existing?.internal_session_load ?? internalLoad;
  const displayStatus = existing?.completion_status ?? form.completion_status ?? 'completed';
  const statusLabel = {
    completed: 'Completed',
    part_completed: 'Partly completed',
    stopped: 'Stopped',
  }[displayStatus] || 'Completed';

  if (isComplete) {
    return (
      <section className="rounded-[24px] border border-emerald-400/25 bg-[#242427] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Session complete</h3>
            <p className="text-xs text-zinc-400">Your session response has been recorded.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Duration</p>
            <p className="mt-0.5 text-sm font-bold text-white">{displayDuration}m</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">RPE</p>
            <p className="mt-0.5 text-sm font-bold text-white">{displayRpe}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Load</p>
            <p className="mt-0.5 text-sm font-bold text-[#d8ff5f]">{displayLoad} AU</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Status</p>
            <p className="mt-0.5 text-sm font-bold text-white">{statusLabel}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-5 text-white">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d8ff5f]/10">
          <Activity className="h-5 w-5 text-[#d8ff5f]" />
        </div>
        <div>
          <h3 className="font-bold text-white">Finish session</h3>
          <p className="mt-1 text-sm text-zinc-400">Three quick details. Tomorrow's response is recorded separately in your morning check-in.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-zinc-400">
          Duration (minutes)
          <Input type="number" min="0" inputMode="numeric" value={form.duration_minutes} onChange={(event) => update('duration_minutes', event.target.value)} />
        </label>
        <label className="space-y-1 text-xs text-zinc-400">
          Session effort (0–10)
          <Input type="number" min="0" max="10" inputMode="numeric" value={form.session_rpe} onChange={(event) => update('session_rpe', event.target.value)} />
        </label>
        <label className="col-span-2 space-y-1 text-xs text-zinc-400">
          Pain immediately after (0–10)
          <Input type="number" min="0" max="10" inputMode="numeric" value={form.immediate_pain} onChange={(event) => update('immediate_pain', event.target.value)} />
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-[#d8ff5f]/20 bg-[#d8ff5f]/[0.06] p-3">
        <p className="text-xs text-zinc-400">Internal Session Load</p>
        <p className="mt-1 text-2xl font-black text-[#d8ff5f]">{internalLoad} <span className="text-sm font-semibold">AU</span></p>
        <p className="mt-1 text-xs text-zinc-500">Session effort × duration. This is perceived demand, not mechanical workload.</p>
      </div>

      <select value={form.completion_status} onChange={(event) => update('completion_status', event.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-[#171719] px-3 py-3 text-white">
        <option value="completed">Session completed</option>
        <option value="part_completed">Partly completed</option>
        <option value="stopped">Session stopped</option>
      </select>

      <label className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#171719] p-3 text-sm text-zinc-200">
        <Checkbox checked={form.modified} onCheckedChange={(checked) => update('modified', checked === true)} />
        I changed or stopped part of the session
      </label>
      {form.modified && (
        <Textarea className="mt-3" value={form.modification_reason} onChange={(event) => update('modification_reason', event.target.value)} placeholder="Briefly tell your clinician what changed" />
      )}

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.duration_minutes || form.session_rpe === ''}
        className="mt-4 w-full rounded-xl bg-[#d8ff5f] py-6 font-bold text-[#171719] hover:bg-[#c8ef50]"
      >
        {saved ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <HeartPulse className="mr-2 h-5 w-5" />}
        {mutation.isPending ? 'Saving…' : saved ? 'Session saved' : existing ? 'Update session' : 'Finish session'}
      </Button>
    </section>
  );
}
