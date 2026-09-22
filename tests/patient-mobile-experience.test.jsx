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
