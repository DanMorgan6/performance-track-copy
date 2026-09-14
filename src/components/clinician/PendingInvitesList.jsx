import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Trash2, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function PendingInvitesList({ clinicId }) {
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState(null);

  // Fetch pending invites
  const { data: pendingInvites = [], refetch } = useQuery({
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

  // Revoke mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      await base44.entities.InviteToken.update(inviteId, {
        status: 'revoked',
        revoked_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleCopyLink = (token) => {
    const link = `${window.location.origin}${new URL(window.location.href).pathname}#/AcceptClinicianInvite?t=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleShowQR = (token) => {
    const link = `${window.location.origin}${new URL(window.location.href).pathname}#/AcceptClinicianInvite?t=${token}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
    window.open(qrUrl, '_blank');
  };

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Invites</h3>
      
      <div className="space-y-3">
        {pendingInvites.map((invite) => {
          const expiresAt = new Date(invite.expires_at);
          const isExpiringSoon = expiresAt < new Date(Date.now() + 24 * 60 * 60 * 1000);

          return (
            <div key={invite.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="font-medium text-slate-900 truncate">{invite.email}</p>
                  {isExpiringSoon && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex-shrink-0">
                      Expires soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Sent {formatDistanceToNow(new Date(invite.created_date), { addSuffix: true })} • Expires {format(expiresAt, 'MMM d')}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopyLink(invite.token)}
                  title="Copy invite link"
                  className="rounded-lg"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleShowQR(invite.token)}
                  title="Show QR code"
                  className="rounded-lg"
                >
                  <QrCode className="w-4 h-4 text-slate-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => revokeInviteMutation.mutate(invite.id)}
                  disabled={revokeInviteMutation.isPending}
                  title="Revoke invite"
                  className="rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}