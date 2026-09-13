import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

// Generate a URL-safe random token
export function generateRandomToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create clinician invite token
export async function createClinicianInviteToken(clinicId, email, roleTarget = 'clinician', createdBy) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const token = generateRandomToken();
  
  return base44.entities.InviteToken.create({
    clinic_id: clinicId,
    token,
    invite_type: 'clinician',
    email,
    role_target: roleTarget,
    expires_at: expiresAt.toISOString(),
    status: 'active',
    created_by: createdBy
  });
}

// Create patient invite token
export async function createPatientInviteToken(clinicId, patientId, email, createdBy) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const token = generateRandomToken();
  
  return base44.entities.InviteToken.create({
    clinic_id: clinicId,
    token,
    invite_type: 'patient',
    email,
    patient_id: patientId,
    role_target: 'patient',
    expires_at: expiresAt.toISOString(),
    status: 'active',
    created_by: createdBy
  });
}

// Revoke all previous tokens and create a new one
export async function regeneratePatientInviteToken(clinicId, patientId, email, createdBy) {
  // Mark all previous tokens as revoked
  const existing = await base44.entities.InviteToken.filter({
    clinic_id: clinicId,
    patient_id: patientId,
    invite_type: 'patient',
    status: 'active'
  });
  
  for (const token of existing) {
    await base44.entities.InviteToken.update(token.id, {
      status: 'revoked',
      revoked_at: new Date().toISOString()
    });
  }
  
  // Create new token
  return createPatientInviteToken(clinicId, patientId, email, createdBy);
}

// Get patient invite URL
export function getPatientInviteUrl(token) {
  return `${window.location.origin}${createPageUrl(`PatientInviteAccept?token=${token}`)}`;
}

// Validate and redeem token
export async function validateAndRedeemToken(token, clinicId) {
  const tokens = await base44.entities.InviteToken.filter({
    token,
    clinic_id: clinicId,
    status: 'active'
  });
  
  if (tokens.length === 0) {
    throw new Error('Invalid or expired invite token');
  }
  
  const inviteToken = tokens[0];
  
  // Check expiration
  if (new Date(inviteToken.expires_at) < new Date()) {
    await base44.entities.InviteToken.update(inviteToken.id, { status: 'expired' });
    throw new Error('Invite token has expired');
  }
  
  return inviteToken;
}