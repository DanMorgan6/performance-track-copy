import React from 'react';
import { Activity, CheckCircle2, Layers, Zap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PLAN_MODE_LABELS, getPlanMode } from '@/lib/planModes';

const COPY = {
  basic: {
    icon: Zap,
    title: 'Minimal patient input',
    detail: 'Completion is one tap. Patients only open details when load changed or something caused difficulty.',
  },
  phased: {
    icon: Layers,
    title: 'Relevant rehabilitation response',
    detail: 'Completion, actual dosage, pain and modifications are captured without mandatory RIR or session-load entry.',
  },
  performance: {
    icon: Activity,
    title: 'Advanced monitoring',
    detail: 'Set-level load, RIR, Estimated Strength, session load and recovery monitoring are enabled.',
  },
};

export default function MonitoringSettingsCard({ planData, setPlanData }) {
  const mode = getPlanMode(planData);
  const config = COPY[mode];
  const Icon = config.icon;
  const canUseMorning = mode !== 'basic';

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#242427] p-5 text-white">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d8ff5f]/10">
          <Icon className="h-5 w-5 text-[#d8ff5f]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8ff5f]">{PLAN_MODE_LABELS[mode]}</p>
          <h3 className="mt-1 font-bold text-white">{config.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{config.detail}</p>
        </div>
      </div>

      {canUseMorning && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-[#171719] p-3">
          <Checkbox
            checked={planData.morning_check_in_enabled === true}
            onCheckedChange={(checked) => setPlanData((current) => ({
              ...current,
              morning_check_in_enabled: checked === true,
            }))}
          />
          <span>
            <span className="block text-sm font-bold text-white">Daily morning check-in</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
              Ask for morning symptoms, fatigue, recovery and sleep. Performance Plans enable this by default.
            </span>
          </span>
        </label>
      )}

      <div className="mt-3 flex items-start gap-2 text-xs text-zinc-500">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
        Individual exercises can override this level—for example, detailed calf-raise monitoring with simple mobility completion.
      </div>
    </section>
  );
}
