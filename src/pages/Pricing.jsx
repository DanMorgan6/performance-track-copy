import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from 'lucide-react';

const tiers = [
  {
    name: 'Pay as you grow',
    monthlyPrice: 'From £25',
    description: 'Scale your clinic at your own pace',
    basePrice: 25,
    perSeatPrice: 15,
    baseSeats: 1,
    features: [
      'Unlimited patients per clinician',
      'Full exercise library',
      'Real-time progress tracking',
      'Outcome measures',
      'Email support',
      'Custom branding',
      'Team collaboration',
      'Advanced analytics'
    ],
    popular: true
  }
];

export default function Pricing() {
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-center pt-20 pb-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          14-Day Free Trial
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Pay only for what you use. £25/month for your first clinician, then £15/month for each additional clinician.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="relative bg-white rounded-3xl shadow-lg border-2 border-purple-500 scale-100 p-8">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Our Plan
            </span>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{tiers[0].name}</h3>
            <p className="text-slate-600 text-base mb-6">{tiers[0].description}</p>
            
            {/* Pricing Example */}
            <div className="bg-purple-50 rounded-2xl p-6 mb-6">
              <p className="text-sm text-slate-600 mb-4">Example monthly pricing:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">1 clinician:</span>
                  <span className="text-2xl font-bold text-purple-600">£25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">2 clinicians:</span>
                  <span className="text-2xl font-bold text-purple-600">£40</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">3 clinicians:</span>
                  <span className="text-2xl font-bold text-purple-600">£55</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Formula: £25 + (clinicians - 1) × £15
              </p>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            {tiers[0].features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleSelectPlan}
            className="w-full rounded-xl py-6 text-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
          >
            Start 14-Day Free Trial
          </Button>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">How does the free trial work?</h4>
              <p className="text-slate-600">
                All new clinics get a 14-day free trial. We'll ask for payment details upfront, but you won't be charged until your trial ends. Cancel anytime during the trial to avoid charges.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Can I change plans later?</h4>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time from your clinic settings. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">What happens if I exceed my clinician limit?</h4>
              <p className="text-slate-600">
                You'll be prompted to upgrade to the next tier when you try to add more clinicians than your current plan allows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}