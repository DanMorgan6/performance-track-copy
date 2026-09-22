import React from 'react';
import { Activity, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  {
    id: 'basic',
    title: 'Basic Plan',
    subtitle: 'Straightforward exercise prescription',
    description: 'Send a focused group of exercises with minimal patient data entry.',
    features: ['One-tap completion', 'Previous load recalled', 'Report changes or problems only'],
    icon: Zap,
    accent: 'hover:border-sky-300/40 hover:bg-sky-300/[0.05]',
  },
  {
    id: 'phased',
    title: 'Phased Plan',
    subtitle: 'Criteria-led rehabilitation',
    description: 'Build weekly rehabilitation phases with measurable exit criteria and clinician-controlled progression.',
    features: ['Weekly session planning', 'Relevant load and symptom response', 'Exit criteria—not time—control progression'],
    icon: Layers,
    accent: 'hover:border-[#d8ff5f]/40 hover:bg-[#d8ff5f]/[0.05]',
    recommended: true,
  },
  {
    id: 'performance',
    title: 'Performance Plan',
    subtitle: 'Phased rehabilitation + advanced monitoring',
    description: 'Use the same criteria-led structure with detailed strength, workload and recovery monitoring.',
    features: ['Set-level load and RIR', 'Estimated Strength and session load', 'Morning recovery and advanced graphs'],
    icon: Activity,
    accent: 'hover:border-violet-300/40 hover:bg-violet-300/[0.05]',
  },
];

export default function ProgramTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8ff5f]">Choose a plan</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">What level of programming does this patient need?</h2>
        <p className="mt-1 text-sm text-zinc-500">AI assistance remains available inside every plan and all output stays under practitioner control.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'relative rounded-[22px] border border-white/[0.08] bg-[#242427] p-5 text-left transition-all hover:-translate-y-0.5',
                option.accent,
              )}
            >
              {option.recommended && (
                <span className="absolute right-4 top-4 rounded-full bg-[#d8ff5f] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-950">
                  Core pathway
                </span>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Icon className="h-5 w-5 text-[#d8ff5f]" />
              </div>
              <h3 className="mt-4 font-bold text-white">{option.title}</h3>
              <p className="mt-1 text-xs font-semibold text-zinc-400">{option.subtitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{option.description}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-zinc-500">
                {option.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-[#d8ff5f]">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
