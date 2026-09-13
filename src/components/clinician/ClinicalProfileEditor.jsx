import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ClinicalProfileEditor({ userEmail, clinicId, onSave }) {
  const queryClient = useQueryClient();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [formData, setFormData] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['clinical-profile', userEmail],
    queryFn: async () => {
      const profiles = await base44.entities.ClinicalProfile.filter({ user_email: userEmail });
      return profiles[0] || null;
    },
    enabled: !!userEmail
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) {
        return base44.entities.ClinicalProfile.update(profile.id, data);
      } else {
        return base44.entities.ClinicalProfile.create({ ...data, clinic_id: clinicId, user_email: userEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profile'] });
      onSave?.();
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (fileUrl) => {
      setFormData(prev => ({ ...prev, photo_url: fileUrl }));
      setShowPhotoUpload(false);
    }
  });

  React.useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({
        full_name: '',
        title: '',
        qualifications: [],
        registrations: [],
        special_interests: [],
        bio: '',
        photo_url: '',
        visibility: {
          show_qualifications: true,
          show_special_interests: true,
          show_bio: true,
          show_photo: true
        },
        is_public: true
      });
    }
  }, [profile]);

  if (isLoading || !formData) return <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />;

  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="space-y-3">
        <Label>Profile Photo</Label>
        <div className="flex items-center gap-4">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
              {formData.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <Button
            onClick={() => setShowPhotoUpload(true)}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Professional Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Physical Therapist"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label>Professional Bio</Label>
        <Textarea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          placeholder="Tell patients about your experience and approach..."
          className="rounded-lg min-h-[100px]"
        />
      </div>

      {/* Qualifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Qualifications & Certifications</Label>
          <Button
            onClick={() => setFormData({
              ...formData,
              qualifications: [...(formData.qualifications || []), { qualification: '', visible_to_patient: true }]
            })}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {(formData.qualifications || []).map((qual, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  value={qual.qualification}
                  onChange={(e) => {
                    const newQuals = [...formData.qualifications];
                    newQuals[idx].qualification = e.target.value;
                    setFormData({...formData, qualifications: newQuals});
                  }}
                  placeholder="e.g., DPT, CSCS"
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={qual.visible_to_patient}
                  onCheckedChange={(checked) => {
                    const newQuals = [...formData.qualifications];
                    newQuals[idx].visible_to_patient = checked;
                    setFormData({...formData, qualifications: newQuals});
                  }}
                />
                <span className="text-xs text-slate-500">Show to patients</span>
              </div>
              <Button
                onClick={() => {
                  setFormData({
                    ...formData,
                    qualifications: formData.qualifications.filter((_, i) => i !== idx)
                  });
                }}
                variant="ghost"
                size="icon"
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Special Interests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Areas of Specialization</Label>
          <Button
            onClick={() => setFormData({
              ...formData,
              special_interests: [...(formData.special_interests || []), '']
            })}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {(formData.special_interests || []).map((interest, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <Input
                value={interest}
                onChange={(e) => {
                  const newInterests = [...formData.special_interests];
                  newInterests[idx] = e.target.value;
                  setFormData({...formData, special_interests: newInterests});
                }}
                placeholder="e.g., ACL Rehabilitation"
                className="rounded-lg flex-1 text-sm"
              />
              <Button
                onClick={() => {
                  setFormData({
                    ...formData,
                    special_interests: formData.special_interests.filter((_, i) => i !== idx)
                  });
                }}
                variant="ghost"
                size="icon"
                className="text-rose-500 hover:text-rose-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Controls */}
      <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <Label className="font-semibold">Patient-Visible Fields</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.visibility?.show_photo}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                visibility: {...formData.visibility, show_photo: checked}
              })}
            />
            <span className="text-sm text-slate-700">Show profile photo</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.visibility?.show_qualifications}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                visibility: {...formData.visibility, show_qualifications: checked}
              })}
            />
            <span className="text-sm text-slate-700">Show qualifications</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.visibility?.show_special_interests}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                visibility: {...formData.visibility, show_special_interests: checked}
              })}
            />
            <span className="text-sm text-slate-700">Show areas of specialization</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.visibility?.show_bio}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                visibility: {...formData.visibility, show_bio: checked}
              })}
            />
            <span className="text-sm text-slate-700">Show professional bio</span>
          </div>
        </div>
      </div>

      {/* Public Profile Toggle */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Checkbox
          checked={formData.is_public}
          onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
        />
        <div>
          <p className="text-sm font-medium text-blue-900">Make profile visible to patients</p>
          <p className="text-xs text-blue-700">Patients can view your profile from their care team card</p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          onClick={() => updateMutation.mutate(formData)}
          disabled={updateMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhotoMutation.mutate(file);
              }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}