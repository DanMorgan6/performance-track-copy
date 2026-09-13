import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSettingsPanel from "@/components/billing/BillingSettingsPanel";
import { Building2, Palette, CreditCard, ArrowLeft, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

export default function ClinicSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl('CoachDashboard');
      }
    };
    loadUser();
  }, []);

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['clinic', user?.clinic_id],
    queryFn: async () => {
      if (!user?.clinic_id) return null;
      const clinics = await base44.entities.Clinic.filter({ id: user.clinic_id });
      return clinics[0];
    },
    enabled: !!user?.clinic_id
  });

  const updateClinicMutation = useMutation({
    mutationFn: (data) => base44.entities.Clinic.update(clinic.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic'] });
    }
  });

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    address: '',
    booking_url: '',
    brand_color_primary: '#9333ea',
    brand_color_secondary: '#06b6d4'
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        contact_email: clinic.contact_email || '',
        phone: clinic.phone || '',
        address: clinic.address || '',
        booking_url: clinic.booking_url || '',
        brand_color_primary: clinic.brand_color_primary || '#9333ea',
        brand_color_secondary: clinic.brand_color_secondary || '#06b6d4'
      });
    }
  }, [clinic]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <Link 
          to={createPageUrl('CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Clinic Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 mb-6">
            <TabsTrigger value="general" className="rounded-lg">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Clinic Information</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateClinicMutation.mutate(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Clinic Booking Link
                  </Label>
                  <Input
                    type="url"
                    value={formData.booking_url}
                    onChange={(e) => setFormData({...formData, booking_url: e.target.value})}
                    placeholder="https://your-booking-page.com"
                    className="rounded-xl"
                  />
                  <p className="text-xs text-slate-400">Patients will see a "Book Appointment" button in their portal</p>
                </div>

                <Button
                  type="submit"
                  disabled={updateClinicMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {updateClinicMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="branding">
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Brand Colors</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateClinicMutation.mutate({
                  brand_color_primary: formData.brand_color_primary,
                  brand_color_secondary: formData.brand_color_secondary
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={formData.brand_color_primary}
                      onChange={(e) => setFormData({...formData, brand_color_primary: e.target.value})}
                      className="w-16 h-16 rounded-xl border-2 border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={formData.brand_color_primary}
                      onChange={(e) => setFormData({...formData, brand_color_primary: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={formData.brand_color_secondary}
                      onChange={(e) => setFormData({...formData, brand_color_secondary: e.target.value})}
                      className="w-16 h-16 rounded-xl border-2 border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={formData.brand_color_secondary}
                      onChange={(e) => setFormData({...formData, brand_color_secondary: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateClinicMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {updateClinicMutation.isPending ? 'Saving...' : 'Save Colors'}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            {clinic && <BillingSettingsPanel clinic={clinic} />}
          </TabsContent>
        </Tabs>

        {/* Account Deletion */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">Delete Account & Data</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Permanently delete your clinic account and all associated patient data. This action cannot be undone and is irreversible.
              </p>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <button className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-medium select-none">
                    Request Account Deletion
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Delete Clinic Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>This will permanently delete:</p>
                      <ul className="list-disc ml-4 space-y-1 text-sm">
                        <li>Your clinic profile and settings</li>
                        <li>All patient records and health data</li>
                        <li>All rehabilitation plans and phase data</li>
                        <li>All reports, assessments, and outcome measures</li>
                      </ul>
                      <p className="font-medium text-slate-700 mt-3">Type <span className="font-bold text-red-600">DELETE</span> to confirm:</p>
                      <input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mt-1"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
                      onClick={() => {
                        // Send deletion request email
                        base44.integrations.Core.SendEmail({
                          to: 'privacy@beachesperformance.com',
                          subject: `Account Deletion Request - ${clinic?.name}`,
                          body: `Clinic admin ${user?.email} has requested deletion of clinic "${clinic?.name}" (ID: ${clinic?.id}). Please process this request in accordance with GDPR Article 17.`
                        });
                        setDeleteDialogOpen(false);
                        setDeleteConfirmText('');
                        alert('Your deletion request has been submitted. Our team will process it within 30 days in accordance with GDPR.');
                      }}
                    >
                      Confirm Deletion
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-slate-400 mt-3">
                Under GDPR Article 17, we will process your deletion request within 30 days. Some data may be retained for legal compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}