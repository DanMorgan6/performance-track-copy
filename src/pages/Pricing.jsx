import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Clinic',
    price: '£30',
    seats: '0–5 practitioners',
    description: 'Everything a focused clinic needs to prescribe and track rehabilitation.',
    featured: true,
  },
  {
    name: 'Clinic Plus',
    price: '£45',
    seats: '6–10 practitioners',
    description: 'The same complete platform for a growing multidisciplinary team.',
    featured: false,
  },
];

const features = [
  'Detailed weekly rehabilitation plans',
  'Phased returns with clear exit criteria',
  'AI-assisted programming',
  'Quick programmes with a few exercises',
  'Upload your own exercises and videos',
  'Practitioner and patient experiences',
  'Clinic-isolated patient data',
  'Progress, adherence and outcome tracking',
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#171719] px-4 py-16 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8ff5f]/25 bg-[#d8ff5f]/10 px-4 py-2 text-sm font-bold text-[#d8ff5f]">
            <Sparkles className="h-4 w-4" />
            14-day free trial
          </div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            Straightforward pricing for better rehab.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            One complete clinical platform. Your monthly price changes only when your practitioner team grows beyond five.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`relative overflow-hidden rounded-[32px] border p-7 sm:p-9 ${
                plan.featured
                  ? 'border-[#d8ff5f]/35 bg-[#242427] shadow-[0_24px_80px_rgba(0,0,0,0.35)]'
                  : 'border-white/10 bg-[#1d1d20]'
              }`}
            >
              {plan.featured && (
                <span className="absolute right-6 top-6 rounded-full bg-[#d8ff5f] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-950">
                  Most popular
                </span>
              )}
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">{plan.name}</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-black tracking-[-0.06em] text-white">{plan.price}</span>
                <span className="pb-2 text-zinc-500">/ month</span>
              </div>
              <p className="mt-2 font-bold text-[#d8ff5f]">{plan.seats}</p>
              <p className="mt-4 max-w-md leading-7 text-zinc-400">{plan.description}</p>
              <Button
                onClick={() => navigate(createPageUrl('ClinicOnboarding'))}
                className="mt-8 min-h-12 w-full rounded-2xl bg-[#d8ff5f] font-black text-zinc-950 hover:bg-[#e3ff86]"
              >
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-black/20 p-7 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#d8ff5f]" />
                <h2 className="text-2xl font-black text-white">Included in every clinic</h2>
              </div>
              <p className="mt-3 leading-7 text-zinc-400">
                No feature gating between tiers. Each clinic has its own protected workspace and cannot access another clinic’s records.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d8ff5f]/15">
                    <Check className="h-3.5 w-3.5 text-[#d8ff5f]" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-zinc-500">
          More than 10 practitioners? Contact the Performance Track+ team for a tailored clinic plan.
        </p>
      </div>
    </div>
  );
}
