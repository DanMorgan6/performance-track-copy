/**
 * Subscription utilities for clinic billing.
 * Prices are inclusive monthly subscription amounts in pence.
 */

export const SMALL_CLINIC_MAX_PRACTITIONERS = 5;
export const SELF_SERVICE_MAX_PRACTITIONERS = 10;

export function calculateMonthlyPrice(practitionerCount = 0) {
  const count = Math.max(0, Number(practitionerCount) || 0);
  if (count > SELF_SERVICE_MAX_PRACTITIONERS) return null;
  return count <= SMALL_CLINIC_MAX_PRACTITIONERS ? 3000 : 4500;
}

export function isTrialStatus(status) {
  return status === 'trial' || status === 'trialing';
}

export function isTrialValid(clinic) {
  if (!clinic || !isTrialStatus(clinic.subscription_status) || !clinic.trial_end_date) return false;
  return new Date(clinic.trial_end_date).getTime() > Date.now();
}

export function isSubscriptionActive(clinic) {
  if (!clinic) return false;
  if (clinic.subscription_status === 'active') return true;
  return isTrialValid(clinic);
}

export function getTrialDaysRemaining(clinic) {
  if (!clinic?.trial_end_date) return 0;
  const trialEnd = new Date(clinic.trial_end_date).getTime();
  if (!Number.isFinite(trialEnd)) return 0;
  return Math.ceil((trialEnd - Date.now()) / 86400000);
}

export function getTrialStatus(clinic) {
  if (!clinic) return 'Unknown';
  if (!isTrialStatus(clinic.subscription_status)) return 'Not on trial';
  const daysRemaining = getTrialDaysRemaining(clinic);
  return daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired';
}

export function formatPrice(pricePence) {
  if (pricePence === null || pricePence === undefined) return 'Contact us';
  const pounds = pricePence / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: pounds % 1 === 0 ? 0 : 2,
  }).format(pounds);
}

export function getSubscriptionBlockReason(clinic) {
  if (!clinic) return 'Unable to verify subscription.';

  if (isTrialStatus(clinic.subscription_status)) {
    const daysRemaining = getTrialDaysRemaining(clinic);
    if (daysRemaining <= 0) return 'Your trial has ended. Please subscribe to continue.';
    return `Your trial ends in ${daysRemaining} days. Set up billing now.`;
  }

  const reasonMap = {
    past_due: 'Your payment is overdue. Please update your payment method.',
    unpaid: 'Your subscription payment failed. Please update your payment method.',
    canceled: 'Your subscription has been cancelled. Reactivate to continue.',
    incomplete: 'Your subscription setup is incomplete. Please complete checkout.',
  };

  return reasonMap[clinic.subscription_status] || 'Please contact support.';
}
