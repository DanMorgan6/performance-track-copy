import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AcceptClinicianInvite() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('t'); // Changed from 'code' to 't' for token
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        // Check if user is logged in
        try {
          const user = await base44.auth.me();
          setCurrentUser(user);
        } catch {
          // Not logged in, will be handled by handleAccept
          setCurrentUser(null);
        }

        if (!inviteToken) {
          setError('Invalid invite link');
          setLoading(false);
          return;
        }

        // Find invite by token
        const invites = await base44.entities.InviteToken.filter({ 
          token: inviteToken,
          invite_type: 'clinician',
          status: 'active'
        });
        
        if (invites.length === 0) {
          setError('This invite is invalid or has already been used');
          setLoading(false);
          return;
        }

        const inviteRecord = invites[0];
        
        // Check if invite is expired
        if (new Date(inviteRecord.expires_at) < new Date()) {
          setError('This invite has expired. Please ask your clinic admin to send a new one.');
          setLoading(false);
          return;
        }

        setInvite(inviteRecord);

        // Load clinic info
        const clinics = await base44.entities.Clinic.filter({ id: inviteRecord.clinic_id });
        if (clinics.length > 0) {
          setClinic(clinics[0]);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load invite');
        console.error(err);
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteToken]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      let user = currentUser;

      // If not logged in, redirect to login
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Verify email matches invite
      if (invite.email !== user.email) {
        setError(`This invite was sent to ${invite.email}, but you're signed in as ${user.email}. Please sign in with the correct account.`);
        setAccepting(false);
        return;
      }

      // Update user with clinic_id and role
      await base44.auth.updateMe({
        clinic_id: invite.clinic_id,
        role: invite.role_target || 'clinician',
        onboarding_completed: true
      });

      // Mark invite as used
      await base44.entities.InviteToken.update(invite.id, {
        status: 'used',
        used_at: new Date().toISOString()
      });

      // Redirect to clinic dashboard
      setTimeout(() => {
        navigate(createPageUrl('CoachDashboard'));
      }, 500);
    } catch (err) {
      setError('Failed to accept invite. Please try again.');
      console.error(err);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Invalid Invite</h2>
          <p className="text-slate-600 text-center mb-6">{error}</p>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-full bg-slate-600 hover:bg-slate-700 rounded-xl"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 space-y-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Join {clinic?.name || 'Clinic'}</h2>
            <p className="text-slate-600">You've been invited to join as a <strong>{invite?.role === 'clinic_admin' ? 'Clinic Admin' : 'Clinician'}</strong></p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
            {currentUser && (
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Email</Label>
                <p className="text-slate-900 font-medium mt-1">{currentUser.email}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Clinic</Label>
              <p className="text-slate-900 font-medium mt-1">{clinic?.name || 'Loading...'}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Role</Label>
              <p className="text-slate-900 font-medium mt-1 capitalize">{invite?.role_target === 'clinic_admin' ? 'Clinic Admin' : 'Clinician'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleAccept}
              disabled={accepting || !currentUser}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : currentUser ? (
                'Accept Invitation'
              ) : (
                'Sign in to Accept'
              )}
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl('Home'))}
              variant="outline"
              className="w-full rounded-xl"
              disabled={accepting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}