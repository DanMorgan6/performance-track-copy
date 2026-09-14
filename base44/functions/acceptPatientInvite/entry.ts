import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { invite_id: inviteId, patient_data: patientData } = await req.json();
    if (!inviteId || !patientData?.full_name) {
      return Response.json({ error: 'Invite and patient name are required' }, { status: 400 });
    }

    const invites = await base44.asServiceRole.entities.PatientInvite.filter({ id: inviteId });
    const invite = invites[0];
    if (!invite || invite.status !== 'active') {
      return Response.json({ error: 'Invite is invalid or has already been used' }, { status: 400 });
    }
    if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
      await base44.asServiceRole.entities.PatientInvite.update(invite.id, { status: 'expired' });
      return Response.json({ error: 'Invite has expired' }, { status: 400 });
    }
    if (normaliseEmail(invite.patient_email) !== normaliseEmail(user.email)) {
      return Response.json({ error: 'This invite belongs to a different email address' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.Patient.filter({
      clinic_id: invite.clinic_id,
      email: user.email,
    });

    const patientPayload = {
      full_name: patientData.full_name,
      date_of_birth: patientData.date_of_birth || null,
      phone: patientData.phone || null,
      email: user.email,
      clinic_id: invite.clinic_id,
      injury_type: invite.injury_type || null,
      user_id: user.id,
      status: 'active',
    };

    const patient = existing[0]
      ? await base44.asServiceRole.entities.Patient.update(existing[0].id, patientPayload)
      : await base44.asServiceRole.entities.Patient.create(patientPayload);

    await base44.auth.updateMe({
      clinic_id: invite.clinic_id,
      patient_id: patient.id,
      role: 'patient',
      onboarding_completed: true,
    });

    await base44.asServiceRole.entities.PatientInvite.update(invite.id, {
      status: 'accepted',
      accepted_date: new Date().toISOString().split('T')[0],
    });

    return Response.json({ patient_id: patient.id });
  } catch (error) {
    console.error('Patient invite acceptance failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invite' },
      { status: 500 },
    );
  }
});
