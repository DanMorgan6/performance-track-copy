import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isClinicAdmin, isPractitioner } from '@/lib/roles';
import { Stethoscope, Users } from 'lucide-react';

export default function UserTypeSelection() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        // User already has role - redirect to appropriate page
        if (isClinicAdmin(user)) {
          navigate(createPageUrl('ClinicOnboarding'));
        } else if (isPractitioner(user)) {
          navigate(createPageUrl('CoachDashboard'));
        } else if (user.role === 'patient') {
          navigate(createPageUrl('PatientPortal'));
        }
      } catch {
        // Not logged in, show selection
      }
    };
    checkUser();
  }, [navigate]);

  const handleSelect = async (roleType) => {
    setSelecting(true);
    try {
      // Check for invite codes in URL
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('t') || params.get('token');

      if (roleType === 'clinic') {
        // Clinic creation has its own protected onboarding checks. Never allow
        // this screen to grant itself a privileged role.
        navigate(createPageUrl('ClinicOnboarding'));
      } else if (roleType === 'patient') {
        if (!inviteToken) {
          alert('Patient access requires the secure link sent by your clinician.');
          setSelecting(false);
          return;
        }
        navigate(`${createPageUrl('AcceptInvite')}?t=${encodeURIComponent(inviteToken)}`);
      }
    } catch (error) {
      alert('Failed to set user type. Please try again.');
      setSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to Performance Track+</h1>
          <p className="text-xl text-slate-500">Tell us how you'll be using the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clinic Option */}
          <button
            onClick={() => handleSelect('clinic')}
            disabled={selecting}
            className="group relative p-8 bg-white rounded-3xl border-2 border-slate-100 hover:border-purple-300 hover:shadow-xl transition-all"
          >
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Stethoscope className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Clinic / Clinician</h3>
            <p className="text-slate-600 mb-6">Manage patients, create rehabilitation programmes, and track progress</p>
            <ul className="text-sm text-slate-500 space-y-2 mb-6 text-left">
              <li>✓ Create rehabilitation plans</li>
              <li>✓ Manage patient programmes</li>
              <li>✓ Track adherence & outcomes</li>
              <li>✓ Multi-clinician support</li>
            </ul>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-purple-600 font-medium">Click to set up your clinic</p>
            </div>
          </button>

          {/* Patient Option */}
          <button
            onClick={() => handleSelect('patient')}
            disabled={selecting}
            className="group relative p-8 bg-white rounded-3xl border-2 border-slate-100 hover:border-teal-300 hover:shadow-xl transition-all"
          >
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Patient</h3>
            <p className="text-slate-600 mb-6">Complete your rehabilitation programme with support from your clinician</p>
            <ul className="text-sm text-slate-500 space-y-2 mb-6 text-left">
              <li>✓ View your programmes</li>
              <li>✓ Log exercises & pain</li>
              <li>✓ Complete assessments</li>
              <li>✓ Track your recovery</li>
            </ul>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-teal-600 font-medium">You'll need an invite code</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}