import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCircle, Plus, Mail, Shield, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SeatLimitNotice from "@/components/billing/SeatLimitNotice";
import ClinicianInviteManager from "@/components/clinician/ClinicianInviteManager";
import PendingInvitesList from "@/components/clinician/PendingInvitesList";
import { isClinicAdmin, isPractitioner } from '@/lib/roles';
import { createPageUrl } from '@/utils';

export default function ManageCoaches() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: ''
  });

  const [currentUser, setCurrentUser] = React.useState(null);
  const [clinic, setClinic] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (!isClinicAdmin(user)) {
          window.location.href = createPageUrl('CoachDashboard');
          return;
        }
        setCurrentUser(user);
        
        // Load clinic data for seat limits
        if (user.clinic_id) {
          const clinics = await base44.entities.Clinic.filter({ id: user.clinic_id });
          if (clinics.length > 0) {
            setClinic(clinics[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['clinic-users', currentUser?.clinic_id],
    queryFn: async () => {
      try {
        if (!currentUser?.clinic_id) return [];
        // Filter users by clinic_id
        return await base44.entities.User.filter({ clinic_id: currentUser.clinic_id });
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!currentUser?.clinic_id
  });

  const coaches = users.filter(u => u.clinic_id === currentUser?.clinic_id && isPractitioner(u));
  
  const filteredCoaches = coaches.filter(coach => 
    coach.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Manage Clinicians</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Invite and manage clinician access</p>
          </div>
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Clinician
          </Button>
        </div>

        {/* Seat Limit Notice & Pending Invites */}
        <div className="space-y-6 mb-6">
          {clinic && <SeatLimitNotice clinic={clinic} currentCount={coaches.length} />}
          {currentUser?.clinic_id && <PendingInvitesList clinicId={currentUser.clinic_id} />}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search clinicians..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Coaches List */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredCoaches.length === 0 ? (
            <div className="p-10 text-center">
              <UserCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No clinicians found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredCoaches.map((coach) => (
                <div key={coach.id} className="flex items-center gap-3 p-4 md:p-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                    {coach.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm md:text-base truncate">{coach.full_name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">{coach.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-500 hidden sm:block" />
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium capitalize">
                      {coach.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Manager Dialog */}
        <ClinicianInviteManager 
          clinicId={currentUser?.clinic_id}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      </div>
    </div>
  );
}
