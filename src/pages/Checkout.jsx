import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Lock, Loader2, Users } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seatCount, setSeatCount] = useState(1);
  const [clinicLoaded, setClinicLoaded] = useState(false);

  useEffect(() => {
    const loadClinic = async () => {
      try {
        const user = await base44.auth.me();
        const clinics = await base44.entities.Clinic.filter({ owner_email: user.email });
        if (clinics.length) {
          const users = await base44.entities.User.list();
          const count = users.filter(u => u.role === 'admin' && u.clinic_id === clinics[0].id).length;
          setSeatCount(Math.max(1, count));
        }
      } catch (e) {}
      setClinicLoaded(true);
    };
    loadClinic();
  }, []);

  const monthlyPrice = 25 + Math.max(0, seatCount - 1) * 15;

  const handleStartTrial = async () => {
    // Block in iframe (preview mode)
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open the app in a new tab.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await base44.auth.me();
      const clinics = await base44.entities.Clinic.filter({ owner_email: user.email });
      if (!clinics.length) {
        alert('Please complete clinic onboarding first');
        navigate(createPageUrl('ClinicOnboarding'));
        return;
      }

      const clinic = clinics[0];

      const response = await base44.functions.invoke('stripeCreateSubscription', {
        clinic_id: clinic.id
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError(response.data?.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-6">
      <div className="max-w-2xl mx-auto pt-10">
        <Button
          onClick={() => navigate(createPageUrl('Pricing'))}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Start Your Free Trial</h1>
            <p className="text-slate-600">Pay as you grow · per-seat pricing</p>
          </div>

          {/* Plan Summary */}
          <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Subscription Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Active Clinicians
                </span>
                <span className="font-medium text-slate-900">{clinicLoaded ? seatCount : '...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pricing</span>
                <span className="font-medium text-slate-900">£25 + £15/additional seat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Trial Period</span>
                <span className="font-medium text-emerald-600">14 Days Free</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-purple-200">
                <span className="text-slate-600">After Trial</span>
                <span className="font-bold text-slate-900">£{clinicLoaded ? monthlyPrice : '...'}/month</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Lock className="w-4 h-4" />
            <span>Secure payment processing by Stripe. No charge until trial ends.</span>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <Button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-lg"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirecting to Stripe...</>
            ) : (
              'Start Free Trial'
            )}
          </Button>

          <p className="text-center text-xs text-slate-500 mt-4">
            You won't be charged until your 14-day trial ends. Cancel anytime.
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /><span>14-day free trial</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /><span>Cancel anytime</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /><span>Secure payments</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}