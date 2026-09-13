import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AcceptClinicInvite() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (!inviteCode) {
          setError('Invalid invite link');
          return;
        }

        // Find invite by code
        const invites = await base44.entities.ClinicInvite.filter({ invite_code: inviteCode });
        
        if (invites.length === 0 || invites[0].status !== 'pending') {
          setError('This invite is invalid or has already been used');
          return;
        }

        const clinicInvite = invites[0];
        
        // Verify email matches
        if (clinicInvite.email !== user.email) {
          setError(`This invite was sent to ${clinicInvite.email}, but you're signed in as ${user.email}`);
          return;
        }

        setInvite(clinicInvite);
      } catch (err) {
        setError('Failed to load invite');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteCode]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      // Update user with clinic_id and role
      await base44.auth.updateMe({
        clinic_id: invite.clinic_id,
        role: invite.role,
        role_type: 'clinic'
      });

      // Mark invite as accepted
      await base44.entities.ClinicInvite.update(invite.id, {
        status: 'accepted',
        accepted_date: new Date().toISOString().split('T')[0]
      });

      // Redirect to clinic dashboard
      navigate(createPageUrl('CoachDashboard'));
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
            <h2 className="text-2xl font-bold text-slate-900">Join Clinic</h2>
            <p className="text-slate-600">You've been invited to join as a {invite?.role}</p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Email</Label>
              <p className="text-slate-900 font-medium mt-1">{currentUser?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Role</Label>
              <p className="text-slate-900 font-medium mt-1 capitalize">{invite?.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl('Home'))}
              variant="outline"
              className="w-full rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}