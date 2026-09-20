import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = normaliseEmail(user.email);
    if (!email) return Response.json({ error: 'No email on account' }, { status: 400 });

    // 1. If the user already has a patient_id, trust it and fetch the record directly.
    let patient = null;
    if (user.patient_id) {
      const existing = await base44.asServiceRole.entities.Patient.filter({ id: user.patient_id });
      patient = existing[0];
    }

    // 2. Otherwise (or if that record vanished), resolve by email. Match a patient
    //    that is either unlinked or already linked to THIS user — never one linked
    //    to a different account.
    if (!patient) {
      const byEmail = await base44.asServiceRole.entities.Patient.filter({
        email: { $regex: email, $options: 'i' },
      });
      patient = byEmail.find(
        (p) => normaliseEmail(p.email) === email && (p.user_id === user.id || !p.user_id),
      );
    }

    if (!patient) {
      return Response.json({ patient_id: null, linked: false });
    }

    // 3. Ensure the bidirectional link is complete (patient.user_id + user.patient_id).
    //    This also refreshes the user's token data so subsequent RLS checks pass.
    if (!patient.user_id) {
      await base44.asServiceRole.entities.Patient.update(patient.id, {
        user_id: user.id,
        status: 'active',
      });
    }

    await base44.auth.updateMe({
      patient_id: patient.id,
      clinic_id: patient.clinic_id,
      role: 'patient',
      onboarding_completed: true,
    });

    return Response.json({ patient, linked: true });
  } catch (error) {
    console.error('linkPatientAccount failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to link patient account' },
      { status: 500 },
    );
  }
});