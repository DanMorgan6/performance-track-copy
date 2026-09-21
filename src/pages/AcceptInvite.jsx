import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { getInviteError } from '@/components/invite/inviteFlow';

function responseData(response) {
  return response?.data || response || {};
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || searchParams.get('token');
  const [step, setStep] = useState('validating');
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [patientData, setPatientData] = useState({
    full_name: '',
    date_of_birth: '',
    phone: '',
    gender: '',
  });

  const redirectForInvite = (inviteType) => {
    const destination = inviteType === 'clinician' ? 'CoachDashboard' : 'PatientPortal';
    window.location.assign(createPageUrl(destination));
  };

  useEffect(() => {
    let active = true;

    const inspect = async () => {
      if (!token) {
        setError('This invitation link is incomplete. Please request a new one.');
        setStep('error');
        return;
      }

      try {
        await base44.auth.me();
      } catch {
        if (active) setStep('signin');
        return;
      }

      try {
        const response = await base44.functions.invoke('inspectInvite', { token });
        const details = responseData(response);
        if (details.error) throw new Error(details.error);
        if (!active) return;

        setInvite(details);
        setPatientData((current) => ({
          ...current,
          full_name: details.patient_name || current.full_name,
          date_of_birth: details.patient_date_of_birth || current.date_of_birth,
        }));

        if (details.already_accepted) {
          setStep('success');
          window.setTimeout(() => redirectForInvite(details.invite_type), 600);
        } else {
          setStep(details.invite_type === 'clinician' ? 'confirm' : 'details');
        }
      } catch (err) {
        if (!active) return;
        setError(getInviteError(err, 'Unable to validate this invitation.'));
        setStep('error');
      }
    };

    inspect();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const acceptClinicianInvite = async () => {
    setAccepting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('acceptClinicianInvite', { token });
      const result = responseData(response);
      if (result.error) throw new Error(result.error);

      // Recalculate the clinic's Stripe tier from server-side practitioner data.
      // Invitation acceptance remains successful if billing reconciliation needs
      // administrator attention.
      try {
        await base44.functions.invoke('syncClinicSubscriptionTier', {});
      } catch (billingError) {
        console.error('Clinic billing reconciliation failed:', billingError);
      }

      setStep('success');
      window.setTimeout(() => redirectForInvite('clinician'), 600);
    } catch (err) {
      setError(getInviteError(err, 'Unable to accept this invitation.'));
      setAccepting(false);
    }
  };

  const acceptPatientInvite = async (event) => {
    event.preventDefault();
    if (!patientData.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setAccepting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('acceptPatientInvite', {
        token,
        patient_data: patientData,
      });
      const result = responseData(response);
      if (result.error) throw new Error(result.error);
      setStep('success');
      window.setTimeout(() => redirectForInvite('patient'), 600);
    } catch (err) {
      setError(getInviteError(err, 'Unable to complete your registration.'));
      setAccepting(false);
    }
  };

  const shell = (children) => (
    <div className="performance-shell min-h-screen bg-[#171719] p-5 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#242427] p-7 shadow-2xl">
        {children}
      </div>
    </div>
  );

  if (step === 'validating') {
    return shell(
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#d8ff5f]" />
        <p className="text-sm text-zinc-400">Checking your secure invitation…</p>
      </div>
    );
  }

  if (step === 'signin') {
    return shell(
      <div className="space-y-6 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-[#d8ff5f]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Sign in to continue</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in or create an account using the exact email address that received this invitation.
          </p>
        </div>
        <Button onClick={handleSignIn} className="w-full rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c9f050]">
          Sign in or create account
        </Button>
      </div>
    );
  }

  if (step === 'error') {
    return shell(
      <div className="space-y-5 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Invitation problem</h1>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
        </div>
        <Button onClick={() => window.location.assign(createPageUrl('Home'))} variant="outline" className="w-full rounded-xl border-white/10 bg-white/5 text-white">
          Return home
        </Button>
      </div>
    );
  }

  if (step === 'confirm' && invite) {
    return shell(
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#d8ff5f]" />
          <h1 className="mt-4 text-2xl font-bold text-white">Join {invite.clinic_name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You have been invited as {invite.role_target === 'clinic_admin' ? 'a clinic administrator' : 'a clinician'}.
          </p>
        </div>
        {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        <Button onClick={acceptClinicianInvite} disabled={accepting} className="w-full rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c9f050]">
          {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Accept invitation
        </Button>
      </div>
    );
  }

  if (step === 'details' && invite) {
    return shell(
      <form onSubmit={acceptPatientInvite} className="space-y-5">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#d8ff5f]" />
          <h1 className="mt-4 text-2xl font-bold text-white">Join {invite.clinic_name}</h1>
          <p className="mt-2 text-sm text-zinc-400">Confirm your details to activate your rehabilitation portal.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Full name *</Label>
          <Input required value={patientData.full_name} onChange={(event) => setPatientData({ ...patientData, full_name: event.target.value })} className="rounded-xl border-white/10 bg-[#171719] text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Date of birth</Label>
          <Input type="date" value={patientData.date_of_birth} onChange={(event) => setPatientData({ ...patientData, date_of_birth: event.target.value })} className="rounded-xl border-white/10 bg-[#171719] text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Phone</Label>
          <Input type="tel" value={patientData.phone} onChange={(event) => setPatientData({ ...patientData, phone: event.target.value })} className="rounded-xl border-white/10 bg-[#171719] text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Gender</Label>
          <select value={patientData.gender} onChange={(event) => setPatientData({ ...patientData, gender: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#171719] px-3 py-2 text-white">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        <Button type="submit" disabled={accepting} className="w-full rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c9f050]">
          {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Activate portal
        </Button>
      </form>
    );
  }

  if (step === 'success') {
    return shell(
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#d8ff5f]" />
        <h1 className="text-2xl font-bold text-white">Invitation accepted</h1>
        <p className="text-sm text-zinc-400">Your account is ready. Redirecting you now…</p>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#d8ff5f]" />
      </div>
    );
  }

  return null;
}
