import { createClientFromRequest } from 'npm:@base44/sdk';

type PatientProfileInput = {
  full_name?: string;
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
    if (!user) return Response.json({ error: 'Please sign in to continue.' }, { status: 401 });

    const body = await req.json() as {
      token?: string;
      patient_data?: PatientProfileInput;
    };
    if (!body.token) {
      return Response.json({ error: 'Invite token is required.' }, { status: 400 });
    }

    const tokens = await base44.asServiceRole.entities.InviteToken.filter({
      token: body.token,
      invite_type: 'patient',
    });
    const invite = tokens[0];

    if (!invite || invite.status === 'revoked') {
      return Response.json({ error: 'This invitation is invalid or has been revoked.' }, { status: 404 });
    }
    if (normaliseEmail(invite.email) !== normaliseEmail(user.email)) {
      return Response.json({ error: 'This invitation belongs to a different email address.' }, { status: 403 });
    }
    if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
      if (invite.status === 'active') {
        await base44.asServiceRole.entities.InviteToken.update(invite.id, { status: 'expired' });
      }
      return Response.json({ error: 'This invitation has expired. Please request a new one.' }, { status: 410 });
    }
    if (!invite.patient_id) {
      return Response.json({ error: 'This invitation is not linked to a patient record.' }, { status: 409 });
    }

    const patients = await base44.asServiceRole.entities.Patient.filter({
      id: invite.patient_id,
      clinic_id: invite.clinic_id,
    });
    const patient = patients[0];

    if (!patient) {
      return Response.json({ error: 'The linked patient record no longer exists.' }, { status: 409 });
    }

    if (invite.status === 'used') {
      if (patient.user_id === user.id && user.patient_id === patient.id) {
        return Response.json({ patient_id: patient.id, already_accepted: true });
      }
      return Response.json({ error: 'This invitation has already been used.' }, { status: 409 });
    }
    if (invite.status !== 'active') {
      return Response.json({ error: 'This invitation is no longer active.' }, { status: 409 });
    }

    const patientData = body.patient_data || {};
    const fullName = String(patientData.full_name || patient.full_name || '').trim();
    if (!fullName) {
      return Response.json({ error: 'Patient name is required.' }, { status: 400 });
    }

    const patientPayload = {
      full_name: fullName,
      email: normaliseEmail(user.email),
      clinic_id: invite.clinic_id,
      user_id: user.id,
      status: 'active',
      ...((patientData.date_of_birth || patient.date_of_birth)
        ? { date_of_birth: patientData.date_of_birth || patient.date_of_birth }
        : {}),
      ...((patientData.phone || patient.phone)
        ? { phone: patientData.phone || patient.phone }
        : {}),
      ...((patientData.gender || patient.gender)
        ? { gender: patientData.gender || patient.gender }
        : {}),
    };

    await base44.asServiceRole.entities.Patient.update(patient.id, patientPayload);

    // App roles and tenant links are privileged fields. Always assign them
    // through the service role after the signed-in email owns the invite.
    await base44.asServiceRole.entities.User.update(user.id, {
      clinic_id: invite.clinic_id,
      patient_id: patient.id,
      role: 'patient',
      onboarding_completed: true,
    });

    await base44.asServiceRole.entities.InviteToken.update(invite.id, {
      status: 'used',
      used_at: new Date().toISOString(),
    });

    const duplicateTokens = await base44.asServiceRole.entities.InviteToken.filter({
      clinic_id: invite.clinic_id,
      patient_id: patient.id,
      invite_type: 'patient',
      status: 'active',
    });
    for (const duplicate of duplicateTokens) {
      if (duplicate.id !== invite.id) {
        await base44.asServiceRole.entities.InviteToken.update(duplicate.id, {
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ patient_id: patient.id, success: true });
  } catch (error) {
    console.error('Patient invite acceptance failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invitation.' },
      { status: 500 },
    );
  }
});
