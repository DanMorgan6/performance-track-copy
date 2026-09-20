import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isClinicAdmin, isPractitioner } from '@/lib/roles';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const featureCards = [
  {
    icon: ClipboardCheck,
    eyebrow: 'Criteria-led',
    title: 'Progress when the patient is ready',
    copy: 'Build phased weekly programmes with measurable exit criteria. Time prompts a review; it never advances a patient automatically.'
  },
  {
    icon: Sparkles,
    eyebrow: 'AI-assisted',
    title: 'Programme faster, keep clinical control',
    copy: 'Generate a structured starting point from the patient profile, then review and edit every phase, exercise and criterion.'
  },
  {
    icon: Dumbbell,
    eyebrow: 'Quick Plans',
    title: 'Simple when simple is right',
    copy: 'Send a focused exercise bundle in minutes for patients who do not need a full phased return-to-performance plan.'
  }
];

const plans = [
  { name: 'Clinic', practitioners: 'Up to 5 practitioners', price: '£30' },
  { name: 'Clinic Plus', practitioners: '6–10 practitioners', price: '£45' }
];

const progressStats = [
  { value: '4/5', label: 'Exit criteria' },
  { value: '82%', label: 'Adherence' },
  { value: '2/10', label: 'Pain today' }
];

const criteriaChecks = [
  { label: 'Single-leg calf raise', detail: '25 controlled reps', done: true },
  { label: 'Hop test symmetry', detail: '≥ 90% LSI', done: true },
  { label: '24-hour symptom response', detail: 'No increase above 2/10', done: true },
  { label: 'Running exposure', detail: '3 × 20 min symptom-stable', done: true },
  { label: 'Practitioner review', detail: 'Sign-off required', done: false }
];

const securityCards = [
  { icon: LockKeyhole, title: 'Tenant isolation', copy: 'One clinic cannot browse another clinic’s records.' },
  { icon: ShieldCheck, title: 'Role-based access', copy: 'Patients and practitioners see only what they need.' },
  { icon: BrainCircuit, title: 'AI with oversight', copy: 'Generated programmes remain drafts until reviewed.' },
  { icon: Activity, title: 'Clinical audit trail', copy: 'Progression decisions retain criteria and rationale.' }
];

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();

        if (!currentUser.role) {
          window.location.href = createPageUrl('UserTypeSelection');
          return;
        }

        if (isPractitioner(currentUser)) {
          window.location.href = createPageUrl(
            isClinicAdmin(currentUser) && !currentUser.onboarding_completed
              ? 'ClinicOnboarding'
              : 'CoachDashboard'
          );
          return;
        }

        window.location.href = createPageUrl('PatientPortal');
        return;
      } catch {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171719] flex items-center justify-center">
        <div className="animate-spin w-9 h-9 border-2 border-[#c7f03d] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="performance-shell min-h-screen bg-[#171719] text-zinc-50 overflow-hidden">
      <header className="relative z-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#c7f03d] text-zinc-950 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Performance Track<span className="text-[#c7f03d]">+</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="bg-[#c7f03d] hover:bg-[#d7ff55] text-zinc-950 rounded-xl px-5 font-semibold"
          >
            Sign in
          </Button>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="absolute -top-40 right-[-12rem] w-[38rem] h-[38rem] rounded-full bg-[#c7f03d]/10 blur-3xl" />
          <div className="absolute top-32 left-[-16rem] w-[32rem] h-[32rem] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1.12fr_.88fr] gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c7f03d]/30 bg-[#c7f03d]/10 px-4 py-2 text-sm text-[#d9ff62] mb-7">
                <ShieldCheck className="w-4 h-4" />
                Clinical decisions stay with the practitioner
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.05em] leading-[0.98]">
                Plan rehab.
                <br />
                Prove progress.
                <br />
                <span className="text-[#c7f03d]">Move forward.</span>
              </h1>
              <p className="mt-7 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
                A criteria-led rehabilitation platform for clinics. Create detailed weekly plans, monitor patient response and make return-to-performance decisions using evidence—not the calendar alone.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="h-13 bg-[#c7f03d] hover:bg-[#d7ff55] text-zinc-950 rounded-xl px-7 text-base font-semibold"
                >
                  Start with Performance Track+
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Link to={createPageUrl('Pricing')}>
                  <Button variant="outline" className="h-13 w-full border-white/15 bg-white/[0.03] hover:bg-white/[0.07] text-white rounded-xl px-7 text-base">
                    View pricing
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-500">Clinic subscriptions from £30 per month.</p>
            </div>

            <div className="relative rounded-[2rem] border border-white/10 bg-[#202023] p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Return to run</p>
                  <h2 className="text-xl font-semibold mt-1">Phase 3 · Capacity</h2>
                </div>
                <span className="rounded-full bg-amber-400/10 text-amber-300 px-3 py-1 text-xs font-medium">Review due</span>
              </div>
              <div className="grid grid-cols-3 gap-3 my-5">
                {progressStats.map(({ value, label }) => (
                  <div key={label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <p className="text-2xl font-semibold text-[#c7f03d]">{value}</p>
                    <p className="text-xs text-zinc-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {criteriaChecks.map(({ label, detail, done }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
                    <CheckCircle2 className={done ? 'w-5 h-5 text-[#c7f03d]' : 'w-5 h-5 text-zinc-600'} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-zinc-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-[#c7f03d] text-zinc-950 px-4 py-3 text-sm font-semibold text-center">
                Criteria first. Practitioner sign-off always.
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="border-y border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="max-w-2xl mb-12">
              <p className="text-sm uppercase tracking-[0.18em] text-[#c7f03d]">Built for the way you work</p>
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mt-3">The right level of structure for every patient.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {featureCards.map(({ icon: Icon, eyebrow, title, copy }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-[#202023] p-7">
                  <Icon className="w-7 h-7 text-[#c7f03d]" />
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mt-8">{eyebrow}</p>
                  <h3 className="text-xl font-semibold mt-2">{title}</h3>
                  <p className="text-zinc-400 leading-relaxed mt-3">{copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid lg:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-white/10 bg-[#202023] p-8 flex gap-5">
                <Users className="w-7 h-7 text-[#c7f03d] flex-none" />
                <div>
                  <h3 className="text-xl font-semibold">Practitioner and patient experiences</h3>
                  <p className="text-zinc-400 mt-2 leading-relaxed">Clinicians programme, review criteria and monitor progress. Patients see today’s work, record symptoms and complete outcome measures without clinical clutter.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#202023] p-8 flex gap-5">
                <Gauge className="w-7 h-7 text-[#c7f03d] flex-none" />
                <div>
                  <h3 className="text-xl font-semibold">Load and recovery context</h3>
                  <p className="text-zinc-400 mt-2 leading-relaxed">Bring readiness, activity and recovery signals alongside the rehab plan. Wearable connections are designed as decision support, never automatic progression.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#c7f03d]">Clinic data stays clinic data</p>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mt-3">Privacy designed into the platform.</h2>
            <p className="text-zinc-400 text-lg leading-relaxed mt-5">
              Each clinic operates in its own tenant boundary. Patient and practitioner access is linked to both identity and clinic, with role-based permissions protecting clinical records.
            </p>
            <Link to={createPageUrl('PrivacyPolicy')} className="inline-flex items-center gap-2 text-[#c7f03d] mt-6 font-medium hover:text-[#d7ff55]">
              Read privacy and GDPR information
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {securityCards.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-[#202023] p-5">
                <Icon className="w-6 h-6 text-[#c7f03d]" />
                <h3 className="font-semibold mt-4">{title}</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-white/10 bg-[#1d1d20]">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c7f03d]">Straightforward clinic pricing</p>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mt-3">Start small. Keep the full platform.</h2>
            <div className="grid md:grid-cols-2 gap-5 mt-12 text-left">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-3xl border border-white/10 bg-[#242427] p-7">
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="text-zinc-500 mt-1">{plan.practitioners}</p>
                  <div className="flex items-end gap-2 mt-7">
                    <span className="text-5xl font-semibold">{plan.price}</span>
                    <span className="text-zinc-500 pb-1">/ month</span>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm text-zinc-300">
                    {['Quick, phased and AI-assisted plans', 'Practitioner and patient portals', 'Upload your own exercises', 'Clinic-isolated data'].map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#c7f03d] mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="mt-8 bg-[#c7f03d] hover:bg-[#d7ff55] text-zinc-950 rounded-xl px-8 py-6 text-base font-semibold"
            >
              Create your clinic account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Performance Track+</p>
          <div className="flex items-center gap-5">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white">Privacy & GDPR</Link>
            <Link to={createPageUrl('Pricing')} className="hover:text-white">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
