import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate the accepting user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const token = body?.token;
    if (!token) {
      return Response.json({ error: 'Missing invite token' }, { status: 400 });
    }

    // Look up the invite
    const invites = await base44.entities.InviteToken.filter({
      token,
      invite_type: 'clinician',
      status: 'active'
    });

    if (invites.length === 0) {
      return Response.json({ error: 'This invite is invalid or has already been used' }, { status: 404 });
    }

    const invite = invites[0];

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: 'This invite has expired. Please ask your clinic admin to send a new one.' }, { status: 410 });
    }

    // Email must match the signed-in user
    if (invite.email !== user.email) {
      return Response.json({
        error: `This invite was sent to ${invite.email}, but you're signed in as ${user.email}. Please sign in with the correct account.`
      }, { status: 403 });
    }

    const roleTarget = invite.role_target || 'clinician';
    const clinicId = invite.clinic_id;

    // role is a built-in and cannot be set via auth.updateMe — apply it as service role.
    await base44.asServiceRole.entities.User.update(user.id, {
      role: roleTarget,
      clinic_id: clinicId,
      onboarding_completed: true
    });

    // Mark the invite as used
    await base44.entities.InviteToken.update(invite.id, {
      status: 'used',
      used_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      clinic_id: clinicId,
      role: roleTarget
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}