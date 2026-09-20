import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isPractitioner } from '@/lib/roles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, User, Mail, Phone, Calendar, FileText, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import InjuryCaptureForm from '@/components/injury/InjuryCaptureForm';
import { titleCaseName } from '@/lib/nameFormat';
import { createPatientInviteToken } from '@/components/invite/InviteTokenUtils';

export default function CreatePatient() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const submissionInProgressRef = React.useRef(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    injury_type: '',
    injury_date: '',
    notes: '',
    status: 'active'
  });
  const [injuries, setInjuries] = useState([]);

  // Security: Prevent patients from accessing this page
  React.useEffect(() => {
    const checkAccess = async () => {
      const user = await base44.auth.me();
      if (!isPractitioner(user)) {
        window.location.href = createPageUrl('PatientPortal');
        return;
      }
      setCurrentUser(user);
    };
    checkAccess();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (submissionInProgressRef.current) return;
    submissionInProgressRef.current = true;
    setSaving(true);
    
    try {
      // Auto-assign current clinician and clinic to patient, set status to 'invited'
      const patient = await base44.entities.Patient.create({
        ...formData,
        full_name: titleCaseName(formData.full_name),
        assigned_coach: currentUser?.email,
        clinic_id: currentUser?.clinic_id,
        status: 'invited'
      });

      // Create injury records if any
      for (const injury of injuries) {
        await base44.entities.Injury.create({
          ...injury,
          patient_id: patient.id,
          clinic_id: currentUser?.clinic_id
        });
      }

      // Create InviteToken using utility function
      const inviteToken = await createPatientInviteToken(
        currentUser?.clinic_id,
        patient.id,
        patient.email,
        currentUser?.email
      );

      // Generate invite link
      const inviteLink = `${window.location.origin}${createPageUrl('AcceptInvite')}?t=${inviteToken.token}`;

      // Send invite email with link
      try {
        await base44.integrations.Core.SendEmail({
          to: patient.email,
          subject: `You're invited to your rehabilitation portal`,
          body: `Hi ${patient.full_name},\n\nYour clinician has invited you to join your personalized rehabilitation portal.\n\nClick here to accept your invite:\n${inviteLink}\n\nThis link will expire in 30 days.\n\nBest regards,\nYour Clinic Team`
        });
      } catch (emailError) {
        // Patient not registered yet—email will be sent when they accept invite
        console.log('Email not sent (patient not registered yet)');
      }

      // Track that access was sent
      await base44.entities.Patient.update(patient.id, {
        portal_access_sent: true,
        portal_access_sent_date: new Date().toISOString().split('T')[0]
      });

      navigate(createPageUrl(`PatientDetail?id=${patient.id}`));
    } catch (error) {
      console.error('Failed to create patient:', error);
      alert('Failed to create patient. Please try again.');
      submissionInProgressRef.current = false;
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link 
          to={createPageUrl('CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800">Add New Patient</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Enter patient details to create their profile</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="John Smith"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gender
                </Label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Injury/Condition
                </Label>
                <Input
                  value={formData.injury_type}
                  onChange={(e) => handleChange('injury_type', e.target.value)}
                  placeholder="e.g., ACL Tear, Lower Back Pain"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Injury Date
                </Label>
                <Input
                  type="date"
                  value={formData.injury_date}
                  onChange={(e) => handleChange('injury_date', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any relevant medical history, previous injuries, or special considerations..."
                className="rounded-xl min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Injuries & Conditions</Label>
              <InjuryCaptureForm
                injuries={injuries}
                onAddInjury={(injury) => setInjuries([...injuries, injury])}
                onRemoveInjury={(idx) => setInjuries(injuries.filter((_, i) => i !== idx))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl('CoachDashboard')}>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Patient
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}