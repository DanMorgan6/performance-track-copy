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
