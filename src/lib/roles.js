const PRACTITIONER_ROLES = new Set(['admin', 'clinic_admin', 'clinician']);
const CLINIC_ADMIN_ROLES = new Set(['admin', 'clinic_admin']);

export function getUserRole(userOrRole) {
  if (typeof userOrRole === 'string') return userOrRole;
  return userOrRole?._app_role || userOrRole?.role || '';
}

export function isPractitioner(userOrRole) {
  return PRACTITIONER_ROLES.has(getUserRole(userOrRole));
}

export function isClinicAdmin(userOrRole) {
  return CLINIC_ADMIN_ROLES.has(getUserRole(userOrRole));
}

export function isPatient(userOrRole) {
  return !isPractitioner(userOrRole);
}
