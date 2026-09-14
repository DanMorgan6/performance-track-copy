import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSubscriptionActive, calculateMonthlyPrice, formatPrice, SELF_SERVICE_MAX_PRACTITIONERS } from '@/components/utils/subscriptionUtils';
import { isPractitioner } from '@/lib/roles';
import { Mail, Send, Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export default function ClinicianInviteDialog({ clinicId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('clinician');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [showSeatConfirm, setShowSeatConfirm] = useState(false);
  const [newClinicianName, setNewClinicianName] = useState('');

  // Fetch clinic and clinicians
  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const clinics = await base44.entities.Clinic.filter({ id: clinicId });
      return clinics[0];
    },
    enabled: !!clinicId
  });

  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinic-clinicians', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const users = await base44.entities.User.list();
      return users.filter(u => isPractitioner(u) && u.clinic_id === clinicId);
    },
    enabled: !!clinicId
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Generate unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create ClinicInvite record
      const invite = await base44.entities.ClinicInvite.create({
        clinic_id: clinicId,
        email,
        role,
        invite_code: inviteCode,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Send invite email
      const inviteUrl = `${window.location.origin}${new URL(window.location.href).pathname}#/AcceptClinicianInvite?code=${inviteCode}`;
      
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'You\'ve been invited to join the clinic',
        body: `You've been invited to join as a ${role}.\n\nAccept here: ${inviteUrl}`
      });

      return invite;
    },
    onSuccess: () => {
      setSubmitted(true);
      setEmail('');
      setRole('clinician');
      setShowSeatConfirm(false);
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
      }, 2000);
      queryClient.invalidateQueries({ queryKey: ['clinic-invites', 'clinic-clinicians'] });
    },
    onError: (err) => {
      setError(err.message || 'Failed to send invite');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setNewClinicianName(email.split('@')[0]);

    // Check subscription status
    if (!isSubscriptionActive(clinic)) {
      // Redirect to checkout if no active subscription
      window.location.href = createPageUrl('Checkout');
      return;
    }

    // If subscription is active, show seat confirmation
    const currentClinicianCount = clinicians.length;
    const newClinicianCount = currentClinicianCount + 1;
    const currentPrice = calculateMonthlyPrice(currentClinicianCount);
    if (newClinicianCount > SELF_SERVICE_MAX_PRACTITIONERS) {
      setError('Self-service plans support up to 10 practitioners. Contact the Performance Track+ team for a tailored plan.');
      return;
    }
    const newPrice = calculateMonthlyPrice(newClinicianCount);

    if (newPrice > currentPrice) {
      // Show seat confirmation
      setShowSeatConfirm(true);
    } else {
      // No price change, proceed directly
      createInviteMutation.mutate();
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Invite Sent!</h3>
            <p className="text-sm text-slate-600">Clinician will receive an invite email at {email}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Seat confirmation dialog
  if (showSeatConfirm) {
    const currentClinicianCount = clinicians.length;
    const newClinicianCount = currentClinicianCount + 1;
    const newPrice = calculateMonthlyPrice(newClinicianCount);
    const formattedNewPrice = formatPrice(newPrice);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Seat Addition</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                Adding <strong>{newClinicianName}</strong> will increase your clinic to <strong>{newClinicianCount} clinician{newClinicianCount > 1 ? 's' : ''}</strong>.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Your new monthly cost will be <strong>{formattedNewPrice}</strong>.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSeatConfirm(false);
                  setEmail('');
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createInviteMutation.mutate()}
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
                    Confirm & Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole} disabled={createInviteMutation.isPending}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinician">Clinician</SelectItem>
                <SelectItem value="clinic_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-rose-700">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}