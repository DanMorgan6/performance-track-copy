import { createClientFromRequest } from 'npm:@base44/sdk';

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.patient_id) {
      return Response.json({ patient_id: user.patient_id, linked: false, already_linked: true });
    }

    const email = normaliseEmail(user.email);
    if (!email) return Response.json({ error: 'No email on account' }, { status: 400 });

    const patients = await base44.asServiceRole.entities.Patient.filter({
      email: { $regex: email, $options: 'i' },
    });
    const matches = patients.filter((patient) => normaliseEmail(patient.email) === email && !patient.user_id);

    // Never guess across clinics or duplicate records. The user must accept the
    // signed invite that identifies the exact clinic and patient record.
    if (matches.length !== 1) {
      return Response.json({
        patient_id: null,
        linked: false,
        requires_invite: true,
      });
    }

    const match = matches[0];
    const activeInvites = await base44.asServiceRole.entities.InviteToken.filter({
      patient_id: match.id,
      clinic_id: match.clinic_id,
      invite_type: 'patient',
      status: 'active',
    });
    const ownedInvite = activeInvites.find(
      (invite) => normaliseEmail(invite.email) === email,
    );

    if (!ownedInvite) {
      return Response.json({
        patient_id: null,
        linked: false,
        requires_invite: true,
      });
    }

    return Response.json({
      patient_id: match.id,
      linked: false,
      requires_invite: true,
    });
  } catch (error) {
    console.error('linkPatientAccount failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to check patient account' },
      { status: 500 },
    );
  }
});
