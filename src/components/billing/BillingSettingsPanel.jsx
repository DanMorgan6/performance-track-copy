import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { CreditCard, Users, Calendar, TrendingUp, AlertCircle, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { calculateMonthlyPrice, formatPrice, getTrialDaysRemaining, isTrialStatus } from '@/components/utils/subscriptionUtils';
import { isPractitioner } from '@/lib/roles';

export default function BillingSettingsPanel({ clinic }) {
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Get all clinicians in clinic
  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinic-clinicians', clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const users = await base44.entities.User.filter({ clinic_id: clinic.id });
      return users.filter(u => isPractitioner(u) && u.clinic_id === clinic.id);
    },
    enabled: !!clinic?.id
  });

  const isTrialing = isTrialStatus(clinic?.subscription_status);
  const trialDaysRemaining = getTrialDaysRemaining(clinic);
  const monthlyPrice = calculateMonthlyPrice(clinicians.length);
  const formattedPrice = formatPrice(monthlyPrice);

  const [portalLoading, setPortalLoading] = useState(false);

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await base44.functions.invoke('stripeCustomerPortal', { clinic_id: clinic.id });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert(response.data?.error || 'Failed to open billing portal');
      }
    } catch (err) {
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await openCustomerPortal();
    },
    onSuccess: () => {
      setShowCancelConfirm(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* Trial Notice */}
      {isTrialing && trialDaysRemaining > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Crown className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">Free Trial Active</h3>
              <p className="text-sm text-purple-700 mb-2">
                Your trial ends on {format(new Date(clinic.trial_end_date), 'MMMM d, yyyy')} ({trialDaysRemaining} day{trialDaysRemaining > 1 ? 's' : ''} remaining)
              </p>
              <p className="text-xs text-purple-600">
                You'll be charged <strong>{formattedPrice}/month</strong> after trial ends. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Subscription Status</h3>
            <p className="text-slate-600">
              <span className={`font-medium capitalize ${
                clinic?.subscription_status === 'active' ? 'text-emerald-600' :
                isTrialStatus(clinic?.subscription_status) ? 'text-blue-600' :
                'text-rose-600'
              }`}>
                {isTrialStatus(clinic?.subscription_status) ? 'Free Trial' : clinic?.subscription_status?.replace('_', ' ')}
              </span>
            </p>
          </div>
          {clinic?.current_period_end && !isTrialStatus(clinic?.subscription_status) && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Next billing date</p>
              <p className="text-sm font-medium text-slate-900">
                {format(new Date(clinic.current_period_end), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Clinicians/Seats */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-600 uppercase">Clinicians</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{clinicians.length}</p>
            <p className="text-xs text-slate-500 mt-1">active seats</p>
          </div>

          {/* Monthly Cost */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-600 uppercase">Monthly Cost</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{formattedPrice}</p>
            <p className="text-xs text-slate-500 mt-1">per month</p>
          </div>
        </div>

        {/* Pricing Formula */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            <strong>Pricing:</strong> £30/month for 0–5 practitioners · £45/month for 6–10
          </p>
        </div>
      </div>

      {/* Billing Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Billing Management</h4>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl"
            onClick={openCustomerPortal}
            disabled={portalLoading}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {portalLoading ? 'Opening portal...' : 'Manage Billing & Payment Method'}
          </Button>

          {clinic?.subscription_status !== 'canceled' && (
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl text-rose-600 hover:text-rose-700"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Subscription
            </Button>
          )}

          {clinic?.subscription_status === 'canceled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-700">Subscription canceled. Access will end at period end.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <h3 className="text-lg font-semibold text-slate-900">Cancel Subscription?</h3>
            </div>
            <p className="text-slate-600">
              Your clinic will lose access to all features at the end of your billing period. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {portalLoading ? 'Opening...' : 'Manage in Stripe'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}