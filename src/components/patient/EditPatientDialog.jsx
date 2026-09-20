import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EditPatientDialog({ open, onOpenChange, formData, setFormData, onSave, saving }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Medical Details</h3>
            <p className="text-xs text-slate-500 mb-3">Update these any time the clinical picture changes.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Injury / Condition</Label>
                <Input
                  value={formData.injury_type || ''}
                  onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
                  placeholder="e.g., ACL reconstruction, rotator cuff tear"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Injury</Label>
                <Input
                  type="date"
                  value={formData.injury_date || ''}
                  onChange={(e) => setFormData({ ...formData, injury_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Medications</Label>
                <Textarea
                  value={formData.medications || ''}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="e.g., Ibuprofen 400mg as needed, Paracetamol 1g QDS"
                  className="rounded-xl min-h-[70px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Medical Conditions / Comorbidities</Label>
                <Textarea
                  value={formData.medical_conditions || ''}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="e.g., Asthma, hypertension, diabetes"
                  className="rounded-xl min-h-[70px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}