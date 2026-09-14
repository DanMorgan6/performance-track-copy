import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isSubscriptionActive, calculateMonthlyPrice, formatPrice, SELF_SERVICE_MAX_PRACTITIONERS } from '@/components/utils/subscriptionUtils';
import { isPractitioner } from '@/lib/roles';
import { Mail, Send, Loader2, AlertCircle, CheckCircle2, CreditCard, Copy, QrCode, X } from 'lucide-react';

// Generate cryptographically secure random token
function generateSecureToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function ClinicianInviteManager({ clinicId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success' | 'manage'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('clinician');
  const [error, setError] = useState(null);
  const [showSeatConfirm, setShowSeatConfirm] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [newInvite, setNewInvite] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);

  // Fetch clinic
  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const clinics = await base44.entities.Clinic.filter({ id: clinicId });
      return clinics[0];
    },
    enabled: !!clinicId
  });

  // Fetch active clinicians
  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinic-clinicians', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const users = await base44.entities.User.list();
      return users.filter(u => u.clinic_id === clinicId && isPractitioner(u));
    },
    enabled: !!clinicId
  });

  // Fetch pending invites
  const { data: pendingInvites = [], refetch: refetchInvites } = useQuery({
    queryKey: ['pending-invites', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      return base44.entities.InviteToken.filter({
        clinic_id: clinicId,
        invite_type: 'clinician',
        status: 'active'
      }, '-created_date');
    },
    enabled: !!clinicId
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const user = await base44.auth.me();
      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const invite = await base44.entities.InviteToken.create({
        clinic_id: clinicId,
        token,
        invite_type: 'clinician',
        email,
        role_target: role,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        created_by: user.email
      });

      const link = `${window.location.origin}${new URL(window.location.href).pathname}#/AcceptClinicianInvite?t=${token}`;
      setInviteLink(link);
      setNewInvite(invite);
      return { invite, link };
    },
    onSuccess: () => {
      refetchInvites();
      setStep('success');
    },
    onError: (err) => {
      setError(err.message || 'Failed to create invite');
    }
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      await base44.entities.InviteToken.update(inviteId, {
        status: 'revoked',
        revoked_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      refetchInvites();
      setSelectedInvite(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Check subscription
    if (!isSubscriptionActive(clinic)) {
      window.location.href = createPageUrl('Checkout');
      return;
    }

    // Check seat change
    const currentClinicianCount = clinicians.length;
    const newClinicianCount = currentClinicianCount + 1;
    const currentPrice = calculateMonthlyPrice(currentClinicianCount);
    if (newClinicianCount > SELF_SERVICE_MAX_PRACTITIONERS) {
      setError('Self-service plans support up to 10 practitioners. Contact the Performance Track+ team for a tailored plan.');
      return;
    }
    const newPrice = calculateMonthlyPrice(newClinicianCount);

    if (newPrice > currentPrice) {
      setShowSeatConfirm(true);
    } else {
      createInviteMutation.mutate();
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(link);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleGenerateQR = (link) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
    window.open(qrUrl, '_blank');
  };

  // Reset state on close
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setStep('form');
      setEmail('');
      setName('');
      setRole('clinician');
      setError(null);
      setShowSeatConfirm(false);
      setNewInvite(null);
      setInviteLink('');
    }
    onOpenChange(newOpen);
  };

  // Form step
  if (step === 'form' && !showSeatConfirm) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Clinician</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="clinician@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                disabled={createInviteMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Full Name (Optional)</Label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                disabled={createInviteMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={createInviteMutation.isPending}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="clinician">Clinician</option>
                <option value="clinic_admin">Clinic Admin</option>
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-rose-700">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1 rounded-xl"
                disabled={createInviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                disabled={createInviteMutation.isPending}
              >
                {createInviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Invite
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Seat confirmation
  if (showSeatConfirm && step === 'form') {
    const currentClinicianCount = clinicians.length;
    const newClinicianCount = currentClinicianCount + 1;
    const newPrice = calculateMonthlyPrice(newClinicianCount);
    const formattedNewPrice = formatPrice(newPrice);

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Seat Addition</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                Adding this clinician will increase your clinic to <strong>{newClinicianCount} clinician{newClinicianCount > 1 ? 's' : ''}</strong>.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Your new monthly cost will be <strong>{formattedNewPrice}</strong>.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSeatConfirm(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSeatConfirm(false);
                  createInviteMutation.mutate();
                }}
                disabled={createInviteMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {createInviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success step - show link and QR
  if (step === 'success' && newInvite) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Created!</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">
                Share this with <strong>{email}</strong>:
              </p>
            </div>

            {/* Copy Link Section */}
            <div className="space-y-2">
              <div className="bg-slate-50 rounded-xl p-3 break-all text-xs text-slate-600 border border-slate-200 max-h-20 overflow-y-auto">
                {inviteLink}
              </div>
              <Button
                onClick={() => handleCopyLink(inviteLink)}
                variant="outline"
                className="w-full rounded-xl"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedToken === inviteLink ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>

            {/* QR Code Section */}
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Or scan with phone:</p>
              <Button
                onClick={() => handleGenerateQR(inviteLink)}
                variant="outline"
                className="w-full rounded-xl"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
            </div>

            {/* Expires info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                ℹ️ Invite expires in 7 days. The clinician can join by visiting the link or scanning the QR code.
              </p>
            </div>

            <Button
              onClick={() => {
                setStep('form');
                setEmail('');
                setName('');
                setRole('clinician');
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Invite Another Clinician
            </Button>

            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              className="w-full rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
