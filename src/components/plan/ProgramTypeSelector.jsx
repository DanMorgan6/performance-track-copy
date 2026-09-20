import React from 'react';
import { Bot, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  {
    id: 'basic',
    title: 'Quick Plan',
    subtitle: 'A few exercises, sent fast',
    description: 'Create a focused exercise bundle with dosage, videos and patient instructions.',
    features: ['Recurring weekly schedule', 'Clear dosage and coaching cues', 'Ideal for simple presentations'],
    icon: Zap,
    accent: 'hover:border-sky-300/40 hover:bg-sky-300/[0.05]'
  },
  {
    id: 'phased',
    title: 'Phased Rehab Plan',
    subtitle: 'Criteria-led return pathway',
    description: 'Build a detailed weekly programme across clinical phases with measurable exit criteria.',
    features: ['Weekly session planning', 'Exit-criteria sign-off', 'Time guides review, never progression'],
    icon: Layers,
    accent: 'hover:border-[#d8ff5f]/40 hover:bg-[#d8ff5f]/[0.05]',
    recommended: true
  },
  {
    id: 'ai_assisted',
    title: 'AI-Assisted Plan',
    subtitle: 'Draft faster, review clinically',
    description: 'Generate a structured starting point from the patient profile, then review and edit every detail.',
    features: ['Clinician-approved output', 'Structured phases and criteria', 'Editable before publication'],
    icon: Bot,
    accent: 'hover:border-violet-300/40 hover:bg-violet-300/[0.05]'
  }
];

export default function ProgramTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8ff5f]">Choose a workflow</p>
        <h2 className="mt-2 text-xl font-bold text-white">How would you like to programme?</h2>
        <p className="mt-1 text-sm text-zinc-500">All routes remain editable and under practitioner control.</p>
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
                option.accent
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