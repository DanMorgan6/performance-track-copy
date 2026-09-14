import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Crown,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { isPractitioner } from '@/lib/roles';

const plans = {
  solo: { name: 'Solo', price: 39, maxClinicians: 1, seats: '1 clinician' },
  clinic: { name: 'Clinic', price: 129, maxClinicians: 5, seats: '2-5 clinicians' },
  group: { name: 'Group', price: 199, maxClinicians: 999, seats: '6+ clinicians' }
};

export default function SubscriptionManager({ clinic }) {
  const queryClient = useQueryClient();
  const [changingPlan, setChangingPlan] = useState(false);

  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinic-clinicians', clinic.id],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => isPractitioner(u) && u.clinic_id === clinic.id);
    }
  });

  const currentPlan = plans[clinic.subscription_plan] || plans.solo;
  const isOnTrial = clinic.subscription_status === 'trial';
  const daysUntilTrialEnd = clinic.trial_end_date 
    ? Math.ceil((new Date(clinic.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const updatePlanMutation = useMutation({
    mutationFn: async (newPlan) => {
      // This would call a backend function to update Stripe subscription
      // await base44.functions.updateSubscription({ clinic_id: clinic.id, plan: newPlan });
      
      // For now, just update the clinic record
      await base44.entities.Clinic.update(clinic.id, {
        subscription_plan: newPlan,
        max_clinicians: plans[newPlan].maxClinicians
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
      setChangingPlan(false);
    }
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      // This would call a backend function to cancel Stripe subscription
      // await base44.functions.cancelSubscription({ clinic_id: clinic.id });
      
      await base44.entities.Clinic.update(clinic.id, {
        subscription_status: 'cancelled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Trial Notice */}
      {isOnTrial && daysUntilTrialEnd > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Crown className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">Free Trial Active</h3>
              <p className="text-sm text-purple-700 mb-3">
                Your trial ends on {format(new Date(clinic.trial_end_date), 'MMMM d, yyyy')} 
                ({daysUntilTrialEnd} days remaining)
              </p>
              <p className="text-xs text-purple-600">
                You'll be charged £{currentPlan.price}/month after your trial ends. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Current Plan</h3>
            <p className="text-3xl font-bold text-purple-600">
              {currentPlan.name}
            </p>
            <p className="text-slate-600 text-sm mt-1">£{currentPlan.price}/month</p>
          </div>
          <Button
            onClick={() => setChangingPlan(!changingPlan)}
            variant="outline"
            className="rounded-xl"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Change Plan
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">Clinicians</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {clinicians.length}/{currentPlan.maxClinicians === 999 ? '∞' : currentPlan.maxClinicians}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">Status</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 capitalize">
              {clinic.subscription_status}
            </p>
          </div>
        </div>
      </div>

      {/* Seat Limit Warning */}
      {clinicians.length >= currentPlan.maxClinicians && currentPlan.maxClinicians < 999 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Seat Limit Reached</h4>
              <p className="text-sm text-amber-700">
                You've reached your maximum of {currentPlan.maxClinicians} clinician{currentPlan.maxClinicians > 1 ? 's' : ''}. 
                Upgrade your plan to add more team members.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Options */}
      {changingPlan && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4">Select New Plan</h4>
          <div className="space-y-3">
            {Object.entries(plans).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => updatePlanMutation.mutate(key)}
                disabled={key === clinic.subscription_plan || updatePlanMutation.isPending}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  key === clinic.subscription_plan
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900">{plan.name}</h5>
                    <p className="text-sm text-slate-600">{plan.seats}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">£{plan.price}</p>
                    <p className="text-xs text-slate-500">/month</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Billing Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Billing Management</h4>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl"
            onClick={() => {
              // Open Stripe customer portal
              // window.location.href = await base44.functions.createBillingPortalSession({ clinic_id: clinic.id });
              alert('Stripe customer portal integration needed');
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment Method
          </Button>

          {clinic.subscription_status !== 'cancelled' && (
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl text-rose-600 hover:text-rose-700"
              onClick={() => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  cancelSubscriptionMutation.mutate();
                }
              }}
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}