import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getUnifiedInviteUrl,
  normaliseInviteEmail,
} from '../src/components/invite/inviteFlow';

describe('unified invitation flow', () => {
  it('normalises email ownership checks', () => {
    expect(normaliseInviteEmail('  Patient.Name@Example.COM ')).toBe('patient.name@example.com');
  });

  it('always builds the browser-router acceptance URL', () => {
    expect(getUnifiedInviteUrl('token with spaces', 'https://rehab.example'))
      .toBe('https://rehab.example/AcceptInvite?t=token%20with%20spaces');
  });

  it('keeps every active invite generator on InviteToken and the unified route', () => {
    const activeInviteSources = [
      'src/pages/CreatePatient.jsx',
      'src/components/invite/PatientInviteManager.jsx',
      'src/components/clinician/ClinicianInviteManager.jsx',
      'src/components/clinician/PendingInvitesList.jsx',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');

    expect(activeInviteSources).not.toContain('#/Accept');
    expect(activeInviteSources).not.toContain('ClinicInvite.create');
    expect(activeInviteSources).not.toContain('PatientInvite.create');
    expect(activeInviteSources).toContain('getUnifiedInviteUrl');
  });

  it('assigns patient and clinician roles only through protected service-role functions', () => {
    const patientAcceptance = readFileSync('base44/functions/acceptPatientInvite/entry.ts', 'utf8');
    const clinicianAcceptance = readFileSync('base44/functions/acceptClinicianInvite/entry.ts', 'utf8');
    const combined = `${patientAcceptance}\n${clinicianAcceptance}`;

    expect(combined).not.toContain('auth.updateMe');
    expect(patientAcceptance).toContain('asServiceRole.entities.User.update');
    expect(clinicianAcceptance).toContain('asServiceRole.entities.User.update');
    expect(combined).toContain("status: 'used'");
  });

  it('requires server-side invite inspection before acceptance', () => {
    const acceptancePage = readFileSync('src/pages/AcceptInvite.jsx', 'utf8');

    expect(acceptancePage).toContain("functions.invoke('inspectInvite'");
    expect(acceptancePage).toContain("functions.invoke('acceptPatientInvite'");
    expect(acceptancePage).toContain("functions.invoke('acceptClinicianInvite'");
    expect(acceptancePage).not.toContain('entities.InviteToken.filter');
  });
});
