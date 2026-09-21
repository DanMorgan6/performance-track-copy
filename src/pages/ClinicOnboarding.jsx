import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, Phone, MapPin, Sparkles, Calendar } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { titleCaseName } from '@/lib/nameFormat';

export default function ClinicOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [clinicData, setClinicData] = useState({
    name: '',
    contact_email: '',
    phone: '',
    address: '',
    booking_url: '',
    logo_url: '',
    brand_color_primary: '#9333ea',
    brand_color_secondary: '#06b6d4'
  });
  const [userData, setUserData] = useState({
    job_title: '',
    specialties: [],
    booking_enabled: false,
    booking_url: ''
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setClinicData(prev => ({ ...prev, contact_email: user.email }));
      
      // Check if already onboarded
      if (user.onboarding_completed && user.clinic_id) {
        navigate(createPageUrl('CoachDashboard'), { replace: true });
      }
    };
    loadUser();
  }, [navigate]);

  const handleClinicSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBrandingSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setClinicData({...clinicData, logo_url: result.file_url});
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('provisionClinic', {
        clinic: {
          ...clinicData,
          name: titleCaseName(clinicData.name),
        },
        profile: userData,
      });
      const result = response?.data || response || {};
      if (result.error) throw new Error(result.error);

      // Billing is deliberately the next step. Clinic creation and privileged
      // role assignment have already completed securely on the server.
      window.location.assign(createPageUrl('Checkout'));
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err?.response?.data?.error || err?.message || 'Unable to create your clinic. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="performance-shell min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50/30 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to Performance Track +</h1>
          <p className="text-slate-500">Let's get your clinic set up</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-12 h-1 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
          <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
          <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-purple-600' : 'bg-slate-200'}`} />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {step === 1 ? (
            <form onSubmit={handleClinicSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Clinic Information</h2>
                <p className="text-sm text-slate-500 mb-6">Tell us about your clinic</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Clinic Name *
                </Label>
                <Input
                  required
                  value={clinicData.name}
                  onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                  placeholder="Your Clinic Name"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Email *
                </Label>
                <Input
                  type="email"
                  required
                  value={clinicData.contact_email}
                  onChange={(e) => setClinicData({...clinicData, contact_email: e.target.value})}
                  placeholder="contact@clinic.com"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  value={clinicData.phone}
                  onChange={(e) => setClinicData({...clinicData, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Textarea
                  value={clinicData.address}
                  onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                  placeholder="123 Main St, City, Country"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Clinic Booking Link (optional)
                </Label>
                <Input
                  type="url"
                  value={clinicData.booking_url}
                  onChange={(e) => setClinicData({...clinicData, booking_url: e.target.value})}
                  placeholder="https://your-booking-page.com"
                  className="rounded-xl"
                />
                <p className="text-xs text-slate-400">Patients will see a "Book Appointment" button in their portal</p>
              </div>

              <Button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-lg"
              >
                Continue
              </Button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleBrandingSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Branding</h2>
                <p className="text-sm text-slate-500 mb-6">Customize your clinic's look and feel</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Clinic Logo</Label>
                <div className="flex items-center gap-4">
                  {clinicData.logo_url && (
                    <img 
                      src={clinicData.logo_url} 
                      alt="Clinic logo" 
                      className="w-20 h-20 object-contain rounded-xl border border-slate-200 p-2 bg-white"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        className="rounded-xl cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('logo-upload').click();
                        }}
                      >
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    </label>
                    <p className="text-xs text-slate-400 mt-2">Recommended: Square image, min 200x200px</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={clinicData.brand_color_primary}
                    onChange={(e) => setClinicData({...clinicData, brand_color_primary: e.target.value})}
                    className="w-16 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={clinicData.brand_color_primary}
                    onChange={(e) => setClinicData({...clinicData, brand_color_primary: e.target.value})}
                    placeholder="#9333ea"
                    className="rounded-xl flex-1"
                  />
                </div>
                <p className="text-xs text-slate-400">Used for buttons, highlights, and accents</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Secondary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={clinicData.brand_color_secondary}
                    onChange={(e) => setClinicData({...clinicData, brand_color_secondary: e.target.value})}
                    className="w-16 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={clinicData.brand_color_secondary}
                    onChange={(e) => setClinicData({...clinicData, brand_color_secondary: e.target.value})}
                    placeholder="#06b6d4"
                    className="rounded-xl flex-1"
                  />
                </div>
                <p className="text-xs text-slate-400">Used for secondary elements and backgrounds</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Preview</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    style={{ backgroundColor: clinicData.brand_color_primary }}
                    className="px-4 py-2 rounded-lg text-white font-medium w-full"
                  >
                    Primary Button
                  </button>
                  <div
                    style={{ backgroundColor: `${clinicData.brand_color_secondary}20` }}
                    className="px-4 py-2 rounded-lg font-medium w-full text-center"
                  >
                    Secondary Element
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Profile</h2>
                <p className="text-sm text-slate-500 mb-6">Tell us about yourself</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Job Title *</Label>
                <Input
                  required
                  value={userData.job_title}
                  onChange={(e) => setUserData({...userData, job_title: e.target.value})}
                  placeholder="e.g., Physical Therapist, Sports Therapist"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Specialties (comma separated)</Label>
                <Input
                  value={userData.specialties.join(', ')}
                  onChange={(e) => setUserData({...userData, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  placeholder="e.g., Sports Injuries, Post-Surgical Rehab"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <Label className="text-slate-600">Enable Online Booking</Label>
                  </div>
                  <Switch
                    checked={userData.booking_enabled}
                    onCheckedChange={(checked) => setUserData({...userData, booking_enabled: checked})}
                  />
                </div>
                {userData.booking_enabled && (
                  <div className="space-y-2">
                    <Label className="text-slate-600 text-sm">Booking Page URL *</Label>
                    <Input
                      required={userData.booking_enabled}
                      value={userData.booking_url}
                      onChange={(e) => setUserData({...userData, booking_url: e.target.value})}
                      placeholder="https://your-booking-page.com"
                      className="rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-2">🎉 14-Day Free Trial</h3>
                <p className="text-sm text-purple-700">
                  Your clinic starts with a 14-day free trial, includes unlimited patient programmes, and is £30/month for up to 5 practitioners after the trial.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}