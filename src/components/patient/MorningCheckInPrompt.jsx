import React, { useState } from 'react';
import { CheckCircle2, CloudSun, Moon, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

function Measure({ label, hint, value, onChange, lowLabel, highLabel }) {
  return (
    <label className="block rounded-2xl border border-white/[0.08] bg-[#171719] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-[11px] text-zinc-500">{hint}</p>
        </div>
        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#d8ff5f] px-2 text-sm font-black text-[#171719]">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[#d8ff5f]"
        aria-label={label}
      />
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </label>
  );
}

export default function MorningCheckInPrompt({ patient }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    morning_symptoms: 0,
    fatigue: 3,
    recovery: 7,
    sleep_quality: 7,
  });

  const filters = {
    clinic_id: patient?.clinic_id,
    patient_id: patient?.id,
    date: today,
  };

  const { data: existing, isLoading } = useQuery({
    queryKey: ['morning-check-in', patient?.clinic_id, patient?.id, today],
    queryFn: async () => {
      const rows = await base44.entities.MorningCheckIn.filter(filters, '-created_date', 1);
      return rows[0] || null;
    },
    enabled: Boolean(patient?.clinic_id && patient?.id),
  });

  const mutation = useMutation({
    mutationFn: () => base44.entities.MorningCheckIn.create({
      ...filters,
      ...form,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morning-check-in'] });
      queryClient.invalidateQueries({ queryKey: ['morning-check-ins'] });
    },
  });

  if (isLoading || existing) return null;

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#d8ff5f]/25 bg-[#242427] text-white shadow-xl shadow-black/10">
      <div className="border-b border-white/[0.08] bg-[#d8ff5f]/[0.07] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d8ff5f] text-[#171719]">
            <CloudSun className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d8ff5f]">Daily prompt</p>
            <h2 className="mt-0.5 text-xl font-black">Good morning — how are you today?</h2>
            <p className="mt-1 text-sm text-zinc-400">Four quick sliders. Record this before today's activity.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Measure
          label="Morning symptoms"
          hint="Pain, stiffness or irritation"
          value={form.morning_symptoms}
          onChange={(value) => setForm((current) => ({ ...current, morning_symptoms: value }))}
          lowLabel="None"
          highLabel="Severe"
        />
        <Measure
          label="Fatigue"
          hint="How tired do you feel?"
          value={form.fatigue}
          onChange={(value) => setForm((current) => ({ ...current, fatigue: value }))}
          lowLabel="Fresh"
          highLabel="Exhausted"
        />
        <Measure
          label="Recovery"
          hint="How ready does your body feel?"
          value={form.recovery}
          onChange={(value) => setForm((current) => ({ ...current, recovery: value }))}
          lowLabel="Poor"
          highLabel="Excellent"
        />
        <Measure
          label="Sleep quality"
          hint="Your overall sleep last night"
          value={form.sleep_quality}
          onChange={(value) => setForm((current) => ({ ...current, sleep_quality: value }))}
          lowLabel="Poor"
          highLabel="Excellent"
        />
      </div>

      <div className="px-4 pb-4">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-[#d8ff5f] py-6 font-bold text-[#171719] hover:bg-[#c8ef50]"
        >
          {mutation.isPending ? <Moon className="mr-2 h-5 w-5 animate-pulse" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
          {mutation.isPending ? 'Saving…' : 'Save morning check-in'}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Visible only to you and your clinic team.
        </p>
      </div>
    </section>
  );
}
