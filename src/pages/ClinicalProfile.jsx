import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClinicalProfileEditor from '@/components/clinician/ClinicalProfileEditor';

export default function ClinicalProfile() {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        // Only clinicians can edit their own profile
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Home');
      }
    };
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href={createPageUrl('CoachDashboard')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 mt-2">Manage your professional profile visible to patients</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-6 text-sm">
            ✓ Profile saved successfully
          </div>
        )}

        {/* Editor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <ClinicalProfileEditor
            userEmail={user.email}
            clinicId={user.clinic_id}
            onSave={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }}
          />
        </div>
      </div>
    </div>
  );
}
