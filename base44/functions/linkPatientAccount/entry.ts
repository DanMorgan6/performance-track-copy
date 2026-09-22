import { createClientFromRequest } from 'npm:@base44/sdk';

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

    const finishLinkedPatient = async (linkedPatient: Record<string, any>) => {
      await base44.asServiceRole.entities.User.update(user.id, {
        role: 'patient',
        clinic_id: linkedPatient.clinic_id,
        patient_id: linkedPatient.id,
        onboarding_completed: true,
      });

      const activeInvites = await base44.asServiceRole.entities.InviteToken.filter({
        patient_id: linkedPatient.id,
        clinic_id: linkedPatient.clinic_id,
        invite_type: 'patient',
        status: 'active',
      });
      for (const invite of activeInvites) {
        if (normaliseEmail(invite.email) === email) {
          await base44.asServiceRole.entities.InviteToken.update(invite.id, {
            status: 'used',
            used_at: new Date().toISOString(),
          });
        }
      }

      return Response.json({
        patient_id: linkedPatient.id,
        patient: linkedPatient,
        linked: false,
        already_linked: true,
        repaired: true,
      });
    };

    // The authenticated user-to-patient relationship is authoritative. Checking it
    // first repairs sessions whose JWT still contains an older or missing patient_id.
    const patientsLinkedToUser = await base44.asServiceRole.entities.Patient.filter({
      user_id: user.id,
    });
    const ownedPatientLinks = patientsLinkedToUser.filter(
      (patient) => normaliseEmail(patient.email) === email,
    );

    if (ownedPatientLinks.length === 1) {
      return await finishLinkedPatient(ownedPatientLinks[0]);
    }
    if (ownedPatientLinks.length > 1) {
      return Response.json(
        { error: 'Multiple patient records are linked to this account. Please contact the clinic.' },
        { status: 409 },
      );
    }

    if (user.patient_id) {
      const linkedPatients = await base44.asServiceRole.entities.Patient.filter({ id: user.patient_id });
      const linkedPatient = linkedPatients[0];

      if (
        linkedPatient
        && linkedPatient.user_id === user.id
        && normaliseEmail(linkedPatient.email) === email
      ) {
        return await finishLinkedPatient(linkedPatient);
      }

      return Response.json({ error: 'The linked patient account could not be verified.' }, { status: 409 });
    }

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
