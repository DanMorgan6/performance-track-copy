import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('patient mobile experience', () => {
  it('loads Insights through the protected patient ownership link', () => {
    const insights = readFileSync('src/pages/PatientInsights.jsx', 'utf8');

    expect(insights).toContain("functions.invoke('linkPatientAccount'");
    expect(insights).not.toContain("Patient.filter({ email:");
    expect(insights).toContain('clinic_id: patient.clinic_id');
    expect(insights).toContain('loadError');
    expect(insights).toContain('Insights could not load');
  });

  it('uses the branded splash for patient startup states', () => {
    const portal = readFileSync('src/pages/PatientPortal.jsx', 'utf8');
    const insights = readFileSync('src/pages/PatientInsights.jsx', 'utf8');
    const splash = readFileSync('src/components/patient/PatientPortalSplash.jsx', 'utf8');

    expect(portal).toContain('<PatientPortalSplash');
    expect(insights).toContain('<PatientPortalSplash');
    expect(portal).not.toContain('Loading your portal...');
    expect(insights).not.toContain('Loading your insights...');
    expect(splash).toContain('Performance Track');
    expect(splash).toContain('Plan rehab · Prove progress · Move forward');
    expect(splash).toContain('role="status"');
  });

  it('keeps exercise demonstrations inside the patient plan', () => {
    const dayDetail = readFileSync('src/components/patient/DayDetail.jsx', 'utf8');
    const videoPreview = readFileSync('src/components/exercise/ExerciseVideoPreview.jsx', 'utf8');

    expect(dayDetail).toContain('<ExerciseVideoPreview');
    expect(dayDetail).toContain('variant="button"');
    expect(dayDetail).not.toContain('target="_blank"');
    expect(videoPreview).toContain('<Dialog open={showModal}');
    expect(videoPreview).toContain('Close this window to return to your plan.');
    expect(videoPreview).toContain("aria-label={`Watch ${exerciseName || 'exercise'} demonstration`}");
  });

  it('keeps the weekly selector visible while patients move between days', () => {
    const portal = readFileSync('src/pages/PatientPortal.jsx', 'utf8');
    const weeklyOverview = readFileSync('src/components/patient/WeeklyOverview.jsx', 'utf8');
    const dayDetail = readFileSync('src/components/patient/DayDetail.jsx', 'utf8');

    expect(portal).toContain('selectedWeekDays');
    expect(portal).toContain('onPrevious={() => moveSelectedPlanDay(-1)}');
    expect(portal).toContain('onNext={() => moveSelectedPlanDay(1)}');
    expect(portal).toContain('selectedDayIndex={selectedDayIndex}');
    expect(weeklyOverview).toContain('aria-pressed={isSelected}');
    expect(weeklyOverview).toContain('shadow-[inset_0_0_0_1px_#d8ff5f]');
    expect(weeklyOverview).not.toContain('ring-offset-2');
    expect(dayDetail).toContain('aria-label="Previous day"');
    expect(dayDetail).toContain('aria-label="Next day"');
  });

  it('uses dark status surfaces so phase text remains readable', () => {
    const phaseStatus = readFileSync('src/components/patient/PhaseStatusCard.jsx', 'utf8');

    expect(phaseStatus).toContain("bg: 'bg-emerald-500/10'");
    expect(phaseStatus).toContain("bg: 'bg-amber-500/10'");
    expect(phaseStatus).not.toContain("bg: 'bg-emerald-50'");
  });

  it('extends the graphite theme through iPhone safe areas and browser chrome', () => {
    const html = readFileSync('index.html', 'utf8');
    const css = readFileSync('src/index.css', 'utf8');
    const manifest = readFileSync('public/manifest.json', 'utf8');

    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('<meta name="theme-color" content="#171719"');
    expect(html).toContain('apple-mobile-web-app-status-bar-style');
    expect(css).toContain('background-color: #171719');
    expect(css).toContain('overscroll-behavior-y: none');
    expect(css).toContain('min-height: 100dvh');
    expect(manifest).toContain('"theme_color": "#171719"');
    expect(manifest).toContain('"background_color": "#171719"');
  });

  it('keeps the patient profile drawer independently scrollable on mobile', () => {
    const profile = readFileSync('src/components/patient/PatientProfilePanel.jsx', 'utf8');
    const portal = readFileSync('src/pages/PatientPortal.jsx', 'utf8');

    expect(profile).toContain('overflow-y-auto');
    expect(profile).toContain("WebkitOverflowScrolling: 'touch'");
    expect(profile).toContain("touchAction: 'pan-y'");
    expect(profile).toContain('env(safe-area-inset-bottom)');
    expect(profile).toContain('Close profile menu');
    expect(portal).toContain('h-[100dvh]');
    expect(portal).toContain("document.body.style.overflow = 'hidden'");
  });
});
