import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

type PatientProfileInput = {
  full_name: string;
  date_of_birth?: string;
  phone?: string;
  gender?: string;
};

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      invite_id?: string;
      token?: string;
      patient_data?: PatientProfileInput;
    };
    const patientData = body.patient_data;

    if ((!body.invite_id && !body.token) || !patientData?.full_name?.trim()) {
      return Response.json({ error: 'Invite and patient name are required' }, { status: 400 });
    }

    let clinicId: string;
    let patientId: string | undefined;
    let injuryType: string | undefined;
    let invitedEmail: string;
    let markInviteAccepted: () => Promise<unknown>;

    if (body.token) {
      const tokens = await base44.asServiceRole.entities.InviteToken.filter({
        token: body.token,
        status: 'active',
        invite_type: 'patient',
      });
      const invite = tokens[0];

      if (!invite) {
        return Response.json({ error: 'Invite is invalid or has already been used' }, { status: 400 });
      }
      if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
        await base44.asServiceRole.entities.InviteToken.update(invite.id, { status: 'expired' });
        return Response.json({ error: 'Invite has expired' }, { status: 400 });
      }

      clinicId = invite.clinic_id;
      patientId = invite.patient_id;
      invitedEmail = invite.email;
      markInviteAccepted = () => base44.asServiceRole.entities.InviteToken.update(invite.id, {
        status: 'used',
        used_at: new Date().toISOString(),
      });

      if (!patientId) {
        return Response.json({ error: 'Invite is not linked to a patient record' }, { status: 400 });
      }
    } else {
      const invites = await base44.asServiceRole.entities.PatientInvite.filter({ id: body.invite_id });
      const invite = invites[0];

      if (!invite || invite.status !== 'active') {
        return Response.json({ error: 'Invite is invalid or has already been used' }, { status: 400 });
      }
      if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
        await base44.asServiceRole.entities.PatientInvite.update(invite.id, { status: 'expired' });
        return Response.json({ error: 'Invite has expired' }, { status: 400 });
      }

      clinicId = invite.clinic_id;
      invitedEmail = invite.patient_email;
      injuryType = invite.injury_type;
      markInviteAccepted = () => base44.asServiceRole.entities.PatientInvite.update(invite.id, {
        status: 'accepted',
        accepted_date: new Date().toISOString().split('T')[0],
      });
    }

    if (normaliseEmail(invitedEmail) !== normaliseEmail(user.email)) {
      return Response.json({ error: 'This invite belongs to a different email address' }, { status: 403 });
    }

    const existing = patientId
      ? await base44.asServiceRole.entities.Patient.filter({ id: patientId, clinic_id: clinicId })
      : await base44.asServiceRole.entities.Patient.filter({ clinic_id: clinicId, email: user.email });

    const patientPayload = {
      full_name: patientData.full_name.trim(),
      date_of_birth: patientData.date_of_birth || null,
      phone: patientData.phone || null,
      gender: patientData.gender || null,
      email: user.email,
      clinic_id: clinicId,
      ...(injuryType ? { injury_type: injuryType } : {}),
      user_id: user.id,
      status: 'active',
    };

    const patient = existing[0]
      ? await base44.asServiceRole.entities.Patient.update(existing[0].id, patientPayload)
      : await base44.asServiceRole.entities.Patient.create(patientPayload);

    await base44.auth.updateMe({
      clinic_id: clinicId,
      patient_id: patient.id,
      role: 'patient',
      onboarding_completed: true,
    });
    await markInviteAccepted();

    return Response.json({ patient_id: patient.id });
  } catch (error) {
    console.error('Patient invite acceptance failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invite' },
      { status: 500 },
    );
  }
});
