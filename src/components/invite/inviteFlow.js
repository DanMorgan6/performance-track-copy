import { createPageUrl } from '@/utils';

export function normaliseInviteEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function getUnifiedInviteUrl(token, origin = window.location.origin) {
  if (!token) throw new Error('Invite token is required.');
  return `${origin}${createPageUrl('AcceptInvite')}?t=${encodeURIComponent(token)}`;
}

export function getInviteError(error, fallback = 'Unable to process this invitation.') {
  return error?.response?.data?.error
    || error?.data?.error
    || error?.message
    || fallback;
}
