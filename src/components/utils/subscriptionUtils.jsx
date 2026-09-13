/**
 * Subscription utilities for managing clinic billing
 */

// Calculate monthly price in pence based on seat count
// Formula: £25 + (max(0, seats - 1) * £15)
export function calculateMonthlyPrice(seatCount) {
  const basePriceGBP = 25;
  const additionalSeatPriceGBP = 15;
  
  const totalPriceGBP = basePriceGBP + Math.max(0, seatCount - 1) * additionalSeatPriceGBP;
  return Math.round(totalPriceGBP * 100); // Convert to pence
}

// Check if clinic subscription is active/valid
export function isSubscriptionActive(clinic) {
  if (!clinic) return false;
  
  const validStatuses = ['trialing', 'active'];
  return validStatuses.includes(clinic.subscription_status);
}

// Check if trial is still valid
export function isTrialValid(clinic) {
  if (!clinic || clinic.subscription_status !== 'trialing') return false;
  if (!clinic.trial_end_date) return false;
  
  return new Date(clinic.trial_end_date) > new Date();
}

// Get days remaining in trial (returns negative if expired)
export function getTrialDaysRemaining(clinic) {
  if (!clinic?.trial_end_date) return 0;
  
  const now = new Date();
  const trialEnd = new Date(clinic.trial_end_date);
  const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  
  return daysRemaining;
}

// Get human-readable trial status
export function getTrialStatus(clinic) {
  if (!clinic) return 'unknown';
  if (clinic.subscription_status === 'trialing') {
    const daysRemaining = getTrialDaysRemaining(clinic);
    if (daysRemaining > 0) {
      return `${daysRemaining} days remaining`;
    }
    return 'Expired';
  }
  return 'Not on trial';
}

// Format price for display
export function formatPrice(pricePence) {
  const poundsAndPence = (pricePence / 100).toFixed(2);
  return `£${poundsAndPence}`;
}

// Get subscription reason for billing paywall
export function getSubscriptionBlockReason(clinic) {
  if (!clinic) return 'Unable to verify subscription';
  
  if (clinic.subscription_status === 'trialing') {
    const daysRemaining = getTrialDaysRemaining(clinic);
    if (daysRemaining <= 0) {
      return 'Your trial has ended. Please subscribe to continue.';
    }
    return `Your trial ends in ${daysRemaining} days. Set up billing now.`;
  }
  
  const reasonMap = {
    'past_due': 'Your payment is overdue. Please update your payment method.',
    'unpaid': 'Your subscription payment failed. Please update your payment method.',
    'canceled': 'Your subscription has been canceled. Reactivate to continue.',
    'incomplete': 'Your subscription setup is incomplete. Please complete checkout.'
  };
  
  return reasonMap[clinic.subscription_status] || 'Please contact support.';
}