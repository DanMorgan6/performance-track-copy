import { createClientFromRequest } from 'npm:@base44/sdk';

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to continue.' }, { status: 401 });

    const { token } = await req.json() as { token?: string };
    if (!token) return Response.json({ error: 'Invite token is required.' }, { status: 400 });

    const invites = await base44.asServiceRole.entities.InviteToken.filter({ token });
    const invite = invites[0];

    if (!invite || invite.status === 'revoked') {
      return Response.json({ error: 'This invitation is invalid or has been revoked.' }, { status: 404 });
    }

    if (normaliseEmail(invite.email) !== normaliseEmail(user.email)) {
      return Response.json(
        { error: 'This invitation belongs to a different email address.' },
        { status: 403 },
      );
    }

    if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
      if (invite.status === 'active') {
        await base44.asServiceRole.entities.InviteToken.update(invite.id, { status: 'expired' });
      }
      return Response.json(
        { error: 'This invitation has expired. Please request a new one.' },
        { status: 410 },
      );
    }

    if (!['patient', 'clinician'].includes(invite.invite_type)) {
      return Response.json({ error: 'Unsupported invitation type.' }, { status: 400 });
    }

    const clinics = await base44.asServiceRole.entities.Clinic.filter({ id: invite.clinic_id });
    const clinic = clinics[0];

    let patient = null;
    if (invite.invite_type === 'patient' && invite.patient_id) {
      const patients = await base44.asServiceRole.entities.Patient.filter({
        id: invite.patient_id,
        clinic_id: invite.clinic_id,
      });
      patient = patients[0] || null;
      if (!patient) {
        return Response.json(
          { error: 'The patient record linked to this invitation no longer exists.' },
          { status: 409 },
        );
      }
    }

    return Response.json({
      invite_type: invite.invite_type,
      role_target: invite.role_target || (invite.invite_type === 'patient' ? 'patient' : 'clinician'),
      clinic_name: clinic?.name || 'your clinic',
      patient_name: patient?.full_name || '',
      patient_date_of_birth: patient?.date_of_birth || '',
      status: invite.status,
      already_accepted: invite.status === 'used',
    });
  } catch (error) {
    console.error('Invite inspection failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to validate invitation.' },
      { status: 500 },
    );
  }
});
