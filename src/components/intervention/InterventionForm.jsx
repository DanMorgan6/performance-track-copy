import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/MobileSelect";

// Config: which fields to show per intervention type
const INTERVENTION_CONFIG = {
  injection: {
    showMedication: true,
    medicationLabel: 'Medication',
    medicationPlaceholder: 'e.g., Cortisone 40mg',
    showLocation: true,
  },
  manipulation: {
    showMedication: false,
    showLocation: true,
    showTechnique: true,
    techniqueLabel: 'Technique',
    techniquePlaceholder: 'e.g., HVLA thrust, Mulligan',
  },
  dry_needling: {
    showMedication: false,
    showLocation: true,
    showTechnique: true,
    techniqueLabel: 'Muscles Targeted',
    techniquePlaceholder: 'e.g., Upper trapezius, piriformis',
  },
  taping: {
    showMedication: false,
    showLocation: true,
    showTechnique: true,
    techniqueLabel: 'Tape Type / Method',
    techniquePlaceholder: 'e.g., Kinesio tape, McConnell',
  },
  mobilization: {
    showMedication: false,
    showLocation: true,
    showTechnique: true,
    techniqueLabel: 'Technique / Grade',
    techniquePlaceholder: 'e.g., Maitland Grade III',
  },
  soft_tissue_therapy: {
    showMedication: false,
    showLocation: true,
    showTechnique: true,
    techniqueLabel: 'Technique',
    techniquePlaceholder: 'e.g., Myofascial release, deep tissue',
  },
  shockwave_therapy: {
    showMedication: false,
    showLocation: true,
    showShockwave: true,
  },
  other: {
    showMedication: true,
    medicationLabel: 'Details',
    medicationPlaceholder: 'Describe the intervention',
    showLocation: true,
  },
};

export default function InterventionForm({ intervention, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(intervention || {
    intervention_type: 'injection',
    intervention_date: new Date().toISOString().split('T')[0],
    location: '',
    medication_or_details: '',
    technique_details: '',
    performed_by: '',
    notes: '',
    follow_up_date: '',
    shockwave_type: 'focused',
    shockwave_frequency: '',
    shockwave_energy: '',
    shockwave_impulses: '',
  });

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const config = INTERVENTION_CONFIG[formData.intervention_type] || INTERVENTION_CONFIG.other;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <Label>Intervention Type *</Label>
          <MobileSelect
            label="Intervention Type"
            value={formData.intervention_type}
            onChange={(e) => set('intervention_type', e.target.value)}
            required
            options={[
              { value: 'injection', label: 'Injection' },
              { value: 'manipulation', label: 'Manipulation' },
              { value: 'dry_needling', label: 'Dry Needling' },
              { value: 'taping', label: 'Taping' },
              { value: 'mobilization', label: 'Mobilization' },
              { value: 'soft_tissue_therapy', label: 'Soft Tissue Therapy' },
              { value: 'shockwave_therapy', label: 'Shock Wave Therapy' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input
            type="date"
            value={formData.intervention_date}
            onChange={(e) => set('intervention_date', e.target.value)}
            className="rounded-xl"
            required
          />
        </div>

        {/* Location */}
        {config.showLocation && (
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g., Right knee"
              className="rounded-xl"
            />
          </div>
        )}

        {/* Medication / Details (injection, other) */}
        {config.showMedication && (
          <div className="space-y-2">
            <Label>{config.medicationLabel}</Label>
            <Input
              value={formData.medication_or_details}
              onChange={(e) => set('medication_or_details', e.target.value)}
              placeholder={config.medicationPlaceholder}
              className="rounded-xl"
            />
          </div>
        )}

        {/* Technique field (manipulation, dry needling, taping, mobilization, soft tissue) */}
        {config.showTechnique && (
          <div className="space-y-2">
            <Label>{config.techniqueLabel}</Label>
            <Input
              value={formData.technique_details || ''}
              onChange={(e) => set('technique_details', e.target.value)}
              placeholder={config.techniquePlaceholder}
              className="rounded-xl"
            />
          </div>
        )}

        {/* Performed By */}
        <div className="space-y-2">
          <Label>Performed By</Label>
          <Input
            value={formData.performed_by}
            onChange={(e) => set('performed_by', e.target.value)}
            placeholder="Clinician name"
            className="rounded-xl"
          />
        </div>

        {/* Follow-up Date */}
        <div className="space-y-2">
          <Label>Follow-up Date</Label>
          <Input
            type="date"
            value={formData.follow_up_date}
            onChange={(e) => set('follow_up_date', e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Shockwave-specific fields */}
      {config.showShockwave && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="col-span-2 space-y-2">
            <Label>Shockwave Type</Label>
            <div className="flex gap-6">
              {['focused', 'radial'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shockwave_type"
                    value={type}
                    checked={formData.shockwave_type === type}
                    onChange={(e) => set('shockwave_type', e.target.value)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Frequency (Hz)</Label>
            <Input
              type="number"
              value={formData.shockwave_frequency}
              onChange={(e) => set('shockwave_frequency', e.target.value)}
              placeholder="e.g., 8"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Energy (mJ/mm²)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.shockwave_energy}
              onChange={(e) => set('shockwave_energy', e.target.value)}
              placeholder="e.g., 0.25"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Impulses</Label>
            <Input
              type="number"
              value={formData.shockwave_impulses}
              onChange={(e) => set('shockwave_impulses', e.target.value)}
              placeholder="e.g., 2000"
              className="rounded-xl"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Additional notes..."
          className="rounded-xl"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
          {intervention ? 'Update' : 'Add'} Intervention
        </Button>
      </div>
    </form>
  );
}