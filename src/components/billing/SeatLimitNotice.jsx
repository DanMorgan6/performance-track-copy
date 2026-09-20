import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp } from 'lucide-react';

const plans = {
  clinic: { name: 'Clinic', maxClinicians: 5, nextPlan: 'group' },
  group: { name: 'Group', maxClinicians: 999, nextPlan: null }
};

export default function SeatLimitNotice({ clinic, currentCount }) {
  const currentPlan = plans[clinic.subscription_plan] || plans.clinic;
  const isAtLimit = currentCount >= currentPlan.maxClinicians;
  const isNearLimit = currentCount >= currentPlan.maxClinicians - 1;

  if (!isNearLimit || currentPlan.maxClinicians === 999) {
    return null;
  }

  if (isAtLimit) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900 mb-1">
              Clinician Limit Reached
            </h4>
            <p className="text-sm text-rose-700 mb-3">
              You've reached your limit of {currentPlan.maxClinicians} clinician{currentPlan.maxClinicians > 1 ? 's' : ''} 
              on the {currentPlan.name} plan. Upgrade to add more team members.
            </p>
            {currentPlan.nextPlan && (
              <Link to={createPageUrl(`ClinicSettings?tab=billing`)}>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">
            Approaching Seat Limit
          </h4>
          <p className="text-sm text-amber-700">
            You're using {currentCount} of {currentPlan.maxClinicians} seats. 
            Consider upgrading if you need to add more clinicians.
          </p>
        </div>
      </div>
    </div>
  );
}