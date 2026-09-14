import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');
  
  const [step, setStep] = useState('validating'); // 'validating', 'signin', 'details', 'success', 'error'
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [patientData, setPatientData] = useState({
    full_name: '',
    date_of_birth: '',
    phone: '',
    gender: ''
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid invite link. No token provided.');
        setStep('error');
        return;
      }

      try {
        // Validate token by fetching the corresponding InviteToken
        const tokens = await base44.entities.InviteToken.filter({
          token: token,
          status: 'active'
        });

        if (tokens.length === 0) {
          setError('Invalid or expired invite link. Please request a new one from your clinician.');
          setStep('error');
          return;
        }

        const inviteToken = tokens[0];

        // Check expiry
        if (new Date(inviteToken.expires_at) < new Date()) {
          setError('This invite has expired. Please request a new one from your clinician.');
          setStep('error');
          return;
        }

        setInvite(inviteToken);

        // Check if user is already logged in
        try {
          const user = await base44.auth.me();
          setCurrentUser(user);
          setStep('details');
        } catch {
          // Not logged in, redirect to login
          setStep('signin');
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Failed to validate invite. Please try again.');
        setStep('error');
      }
    };

    validateToken();
  }, [token]);

  const handleSignIn = async () => {
    try {
      // Redirect to login, and come back to this page after
      await base44.auth.redirectToLogin(window.location.href);
    } catch (err) {
      setError('Failed to redirect to login. Please try again.');
    }
  };

  const handleCompleteInvite = async (e) => {
    e.preventDefault();

    if (!patientData.full_name) {
      setError('Please enter your full name');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to complete this');
      return;
    }

    try {
      // Get the existing patient record (created when clinician set up the invite)
      const existingPatient = await base44.entities.Patient.filter({
        id: invite.patient_id
      });

      if (existingPatient.length === 0) {
        setError('Patient record not found. Please contact your clinician.');
        return;
      }

      const patient = existingPatient[0];

      // Update patient record with user_id and fill in any missing details
      await base44.entities.Patient.update(patient.id, {
        user_id: currentUser.id,
        full_name: patientData.full_name || patient.full_name,
        date_of_birth: patientData.date_of_birth || patient.date_of_birth,
        phone: patientData.phone || patient.phone,
        gender: patientData.gender || patient.gender,
        status: 'active'
      });

      // Mark invite token as used
      await base44.entities.InviteToken.update(invite.id, {
        status: 'used',
        used_at: new Date().toISOString()
      });

      // Link the authenticated patient to this tenant and patient record.
      await base44.auth.updateMe({
        clinic_id: invite.clinic_id,
        patient_id: patient.id,
        role: 'patient',
        onboarding_completed: true
      });

      setStep('success');

      // Redirect after delay
      setTimeout(() => {
        navigate(createPageUrl('PatientPortal'));
      }, 2000);
    } catch (err) {
      console.error('Error completing invite:', err);
      setError('Failed to complete registration. Please try again.');
    }
  };

  // Loading state
  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-600">Validating your invite...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 mx-auto">
              <AlertCircle className="w-7 h-7 text-rose-600" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Invite Invalid</h1>
              <p className="text-slate-600">{error}</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sign in required state
  if (step === 'signin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Sign In Required</h1>
              <p className="text-slate-600">You need to sign in to accept this invite</p>
            </div>
            <Button
              onClick={handleSignIn}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              Sign In or Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Details form state
  if (step === 'details' && invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Complete Your Profile</h1>
              <p className="text-slate-600">Fill in your details to complete registration</p>
            </div>

            <form onSubmit={handleCompleteInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={patientData.full_name}
                  onChange={(e) => setPatientData({...patientData, full_name: e.target.value})}
                  placeholder="Your full name"
                  className="rounded-xl"
                  required
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
                <Label>Gender</Label>
                <select
                  value={patientData.gender}
                  onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
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
                Complete Registration
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Success state
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

  return null;
}