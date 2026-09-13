import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { getSubscriptionBlockReason, getTrialDaysRemaining } from '@/components/utils/subscriptionUtils';

/**
 * Billing paywall shown when subscription is invalid
 * Used on CoachDashboard, PatientPortal, etc.
 */
export default function BillingPaywall({ clinic, userRole }) {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin' || userRole === 'clinic_admin';

  const daysRemaining = getTrialDaysRemaining(clinic);
  const reason = getSubscriptionBlockReason(clinic);

  const handleBillingClick = () => {
    navigate(createPageUrl('ClinicSettings?tab=billing'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {clinic?.subscription_status === 'trialing' ? 'Trial Ending' : 'Subscription Required'}
            </h1>
            <p className="text-slate-600">{reason}</p>
          </div>

          {/* Trial Info (if trialing) */}
          {clinic?.subscription_status === 'trialing' && daysRemaining > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Free Trial Ends Soon</p>
                  <p className="text-sm text-blue-700">{daysRemaining} day{daysRemaining > 1 ? 's' : ''} remaining</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          {isAdmin ? (
            <Button
              onClick={handleBillingClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-lg flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Manage Billing
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm text-amber-700">
                <strong>Admin Action Required:</strong> Your clinic administrator needs to set up billing to continue.
              </p>
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-slate-500 text-center">
            Questions? <a href="mailto:support@example.com" className="text-purple-600 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}