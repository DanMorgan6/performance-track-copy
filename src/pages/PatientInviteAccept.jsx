import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PatientInviteAccept() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('code'); // 'code', 'details', 'success'
  const [invite, setInvite] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [patientData, setPatientData] = useState({
    full_name: '',
    date_of_birth: '',
    phone: ''
  });

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const handleFindInvite = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const invites = await base44.entities.PatientInvite.filter({
        invite_code: inviteCode.toUpperCase()
      });

      if (invites.length === 0 || invites[0].status !== 'active') {
        setError('Invalid or expired invite code. Please check and try again.');
        return;
      }

      const patientInvite = invites[0];
      setInvite(patientInvite);

      // Pre-fill patient data if available
      if (patientInvite.full_name) {
        setPatientData(prev => ({
          ...prev,
          full_name: patientInvite.full_name
        }));
      }
      if (patientInvite.date_of_birth) {
        setPatientData(prev => ({
          ...prev,
          date_of_birth: patientInvite.date_of_birth
        }));
      }

      setStep('details');
    } catch (err) {
      setError('Failed to validate invite. Please try again.');
      console.error(err);
    }
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();

    if (!patientData.full_name) {
      setError('Please enter your name');
      return;
    }

    try {
      // Create or update patient record
      const patient = await base44.entities.Patient.create({
        full_name: patientData.full_name,
        date_of_birth: patientData.date_of_birth || null,
        phone: patientData.phone || null,
        email: currentUser.email,
        clinic_id: invite.clinic_id,
        injury_type: invite.injury_type || null,
        status: 'active'
      });

      // Update user profile
      await base44.auth.updateMe({
        clinic_id: invite.clinic_id,
        patient_id: patient.id,
        role: 'patient',
        onboarding_completed: true
      });

      // Mark invite as accepted
      await base44.entities.PatientInvite.update(invite.id, {
        status: 'accepted',
        accepted_date: new Date().toISOString().split('T')[0]
      });

      setStep('success');

      // Redirect after delay
      setTimeout(() => {
        navigate(createPageUrl('PatientPortal'));
      }, 2000);
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
      console.error(err);
    }
  };

  // Step 1: Enter Invite Code
  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Join Your Clinic</h1>
              <p className="text-slate-600">Enter the invite code sent to you by your clinician</p>
            </div>

            <form onSubmit={handleFindInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="e.g., ABC123"
                  className="rounded-xl text-center text-xl tracking-widest"
                  maxLength="10"
                />
              </div>

              {error && (
                <div className="flex gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={inviteCode.length < 3}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
              >
                Continue
              </Button>
            </form>

            <p className="text-xs text-slate-400 text-center">
              Don't have an invite code? Contact your clinician for one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Enter Details
  if (step === 'details' && invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Create Your Account</h1>
              <p className="text-slate-600">Complete your profile to get started</p>
            </div>

            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={patientData.full_name}
                  onChange={(e) => setPatientData({...patientData, full_name: e.target.value})}
                  placeholder="Your full name"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={patientData.date_of_birth}
                  onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  type="tel"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                  placeholder="Your phone number"
                  className="rounded-xl"
                />
              </div>

              {error && (
                <div className="flex gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
              >
                Create Account
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setStep('code');
                  setError('');
                }}
                variant="outline"
                className="w-full rounded-xl"
              >
                Back
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Welcome!</h1>
              <p className="text-slate-600">Your account has been created successfully</p>
            </div>

            <p className="text-sm text-slate-500">Redirecting to your portal...</p>

            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }
}