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

    const invites = await base44.asServiceRole.entities.InviteToken.filter({
      token,
      invite_type: 'clinician',
    });
    const invite = invites[0];

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

    const roleTarget = invite.role_target === 'clinic_admin' ? 'clinic_admin' : 'clinician';

    if (invite.status === 'used') {
      if (user.clinic_id === invite.clinic_id && (user.role === roleTarget || user._app_role === roleTarget)) {
        return Response.json({
          success: true,
          clinic_id: invite.clinic_id,
          role: roleTarget,
          already_accepted: true,
        });
      }
      return Response.json({ error: 'This invitation has already been used.' }, { status: 409 });
    }
    if (invite.status !== 'active') {
      return Response.json({ error: 'This invitation is no longer active.' }, { status: 409 });
    }
    if (user.clinic_id && user.clinic_id !== invite.clinic_id) {
      return Response.json(
        { error: 'This account already belongs to another clinic. Use a separate account for this invitation.' },
        { status: 409 },
      );
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      role: roleTarget,
      clinic_id: invite.clinic_id,
      patient_id: null,
      onboarding_completed: true,
    });

    await base44.asServiceRole.entities.InviteToken.update(invite.id, {
      status: 'used',
      used_at: new Date().toISOString(),
    });

    const duplicateInvites = await base44.asServiceRole.entities.InviteToken.filter({
      clinic_id: invite.clinic_id,
      invite_type: 'clinician',
      status: 'active',
    });
    for (const duplicate of duplicateInvites) {
      if (
        duplicate.id !== invite.id
        && normaliseEmail(duplicate.email) === normaliseEmail(invite.email)
      ) {
        await base44.asServiceRole.entities.InviteToken.update(duplicate.id, {
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      clinic_id: invite.clinic_id,
      role: roleTarget,
    });
  } catch (error) {
    console.error('Clinician invite acceptance failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to accept invitation.' },
      { status: 500 },
    );
  }
});
