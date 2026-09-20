import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, RefreshCw, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPatientInviteToken, regeneratePatientInviteToken, getPatientInviteUrl } from './InviteTokenUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function PatientInviteManager({ patient, clinic, currentUser }) {
  const [invite, setInvite] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Load existing active invite
  useEffect(() => {
    const loadInvite = async () => {
      if (!patient?.id || !clinic?.id) return;
      const existing = await base44.entities.InviteToken.filter({
        clinic_id: clinic.id,
        patient_id: patient.id,
        invite_type: 'patient',
        status: 'active'
      });
      if (existing.length > 0) {
        setInvite(existing[0]);
      }
    };
    loadInvite();
  }, [patient?.id, clinic?.id]);

  const createInviteMutation = useMutation({
    mutationFn: () => createPatientInviteToken(
      clinic.id,
      patient.id,
      patient.email,
      currentUser.email
    ),
    onSuccess: async (newInvite) => {
      setInvite(newInvite);
      setShowDialog(true);
      // Automatically send email on first invite creation
      const url = getPatientInviteUrl(newInvite.token);
      try {
        await base44.integrations.Core.SendEmail({
          to: patient.email,
          subject: `Your Patient Portal Invite – ${clinic?.name || 'Your Clinic'}`,
          body: `Hi ${patient.full_name},\n\n${clinic?.name || 'Your clinic'} has set up a patient portal for your rehabilitation programme.\n\nClick the link below to create your account and get started:\n\n${url}\n\nThis link expires in 30 days. If you have any questions, please contact your clinician.\n\nBest wishes,\n${clinic?.name || 'Your Clinic'} Team`
        });
        setEmailError('');
        await base44.entities.Patient.update(patient.id, {
          portal_access_sent: true,
          portal_access_sent_date: new Date().toISOString().split('T')[0]
        });
      } catch (e) {
        setEmailError('The email could not be delivered. Copy the secure link and share it directly.');
        await base44.entities.Patient.update(patient.id, {
          portal_access_sent: false,
          portal_access_sent_date: null
        });
        console.error('Failed to auto-send invite email', e);
      }
    }
  });

  const regenerateInviteMutation = useMutation({
    mutationFn: () => regeneratePatientInviteToken(
      clinic.id,
      patient.id,
      patient.email,
      currentUser.email
    ),
    onSuccess: (newInvite) => {
      setInvite(newInvite);
      setCopied(false);
    }
  });

  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const inviteUrl = invite ? getPatientInviteUrl(invite.token) : null;

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    if (!inviteUrl || !patient.email) return;
    setSendingEmail(true);
    try {
      setEmailError('');
      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject: `Your Patient Portal Invite – ${clinic?.name || 'Your Clinic'}`,
        body: `Hi ${patient.full_name},\n\n${clinic?.name || 'Your clinic'} has set up a patient portal for your rehabilitation programme.\n\nClick the link below to create your account and get started:\n\n${inviteUrl}\n\nThis link expires in 30 days. If you have any questions, please contact your clinician.\n\nBest wishes,\n${clinic?.name || 'Your Clinic'} Team`
      });
      await base44.entities.Patient.update(patient.id, {
        portal_access_sent: true,
        portal_access_sent_date: new Date().toISOString().split('T')[0]
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (e) {
      setEmailError('The email could not be delivered. Copy the secure link and share it directly.');
      await base44.entities.Patient.update(patient.id, {
        portal_access_sent: false,
        portal_access_sent_date: null
      });
    }
    setSendingEmail(false);
  };

  if (!invite) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">Patient Portal Access</h3>
        <p className="text-sm text-blue-700 mb-4">
          Generate a link to let {patient.full_name} access their patient portal
        </p>
        <Button
          onClick={() => createInviteMutation.mutate()}
          disabled={createInviteMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          size="sm"
        >
          {createInviteMutation.isPending ? 'Creating...' : 'Generate Invite Link'}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-emerald-900">Portal Access Active</h3>
            <p className="text-xs text-emerald-600 mt-1">Link expires in 30 days</p>
          </div>
          <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-medium rounded-full">
            Active
          </span>
        </div>

        {emailError && (
          <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
            {emailError}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowDialog(true)}
            variant="outline"
            className="rounded-xl text-emerald-700 border-emerald-300"
            size="sm"
          >
            View Link & QR
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            variant="outline"
            className="rounded-xl text-emerald-700 border-emerald-300"
            size="sm"
          >
            <Mail className="w-3 h-3 mr-1" />
            {sendingEmail ? 'Sending...' : emailSent ? '✓ Sent!' : 'Email Invite'}
          </Button>
          <Button
            onClick={() => regenerateInviteMutation.mutate()}
            disabled={regenerateInviteMutation.isPending}
            variant="outline"
            className="rounded-xl text-emerald-700 border-emerald-300"
            size="sm"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Portal Access</DialogTitle>
            <DialogDescription>
              Share this link or QR code with {patient.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Link Section */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl || ''}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-600"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  className="rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied && <p className="text-xs text-emerald-600 mt-1">✓ Copied</p>}
            </div>

            {/* QR Code Section */}
            <div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-2 hover:text-slate-800"
              >
                {showQR ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showQR ? 'Hide' : 'Show'} QR Code
              </button>
              {showQR && (
                <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
                  <QRCode
                    value={inviteUrl || ''}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}
            </div>

            {/* Send Email */}
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingEmail ? 'Sending...' : emailSent ? '✓ Email Sent!' : `Email Invite to ${patient.email}`}
            </Button>

            {/* Expires */}
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Expires:</strong> {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}