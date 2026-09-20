import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Already linked — nothing to do
    if (user.patient_id) {
      return Response.json({ patient_id: user.patient_id, linked: false, already_linked: true });
    }

    const email = normaliseEmail(user.email);
    if (!email) return Response.json({ error: 'No email on account' }, { status: 400 });

    // Find an unlinked patient whose email matches (case-insensitive)
    const patients = await base44.asServiceRole.entities.Patient.filter({
      email: { $regex: email, $options: 'i' },
    });

    const match = patients.find((p) => normaliseEmail(p.email) === email && !p.user_id);

    if (!match) {
      return Response.json({ patient_id: null, linked: false });
    }

    // Link the patient record to this user account
    await base44.asServiceRole.entities.Patient.update(match.id, {
      user_id: user.id,
      status: 'active',
    });

    await base44.auth.updateMe({
      patient_id: match.id,
      clinic_id: match.clinic_id,
      role: 'patient',
      onboarding_completed: true,
    });

    return Response.json({ patient: match, linked: true });
  } catch (error) {
    console.error('linkPatientAccount failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to link patient account' },
      { status: 500 },
    );
  }
});