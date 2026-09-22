import React from 'react';

export default function PatientPortalSplash({
  status = 'Preparing your rehabilitation plan',
}) {
  return (
    <div className="performance-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#171719] px-6 text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 72%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center text-center" role="status" aria-live="polite">
        <div className="pt-splash-mark relative mb-8 flex h-28 w-28 items-center justify-center">
          <div className="pt-splash-ring absolute inset-0 rounded-[34px] border border-[#d8ff5f]/25" aria-hidden="true" />
          <div className="absolute inset-3 rounded-[28px] bg-[#d8ff5f]/10 blur-xl" aria-hidden="true" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#d8ff5f] shadow-[0_18px_60px_rgba(216,255,95,0.24)]">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-zinc-950" fill="none" aria-hidden="true">
              <path
                d="M2.5 13h4.1l2.35-6.2 4.15 11.1 2.8-7.1h5.6"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#d8ff5f]">
          Performance Track <span aria-hidden="true">+</span>
        </p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl">
          Know today. See what&apos;s next.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{status}</p>

        <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
          <div className="pt-splash-progress h-full w-2/5 rounded-full bg-[#d8ff5f]" />
        </div>

        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Plan rehab · Prove progress · Move forward
        </p>
      </div>
    </div>
  );
}
