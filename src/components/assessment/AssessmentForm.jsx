import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import MobileSelect from "@/components/ui/MobileSelect";

export default function AssessmentForm({ assessment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(assessment || {
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: 'strength',
    test_name: '',
    body_part: '',
    side: 'n/a',
    value: '',
    unit: '',
    baseline: '',
    notes: '',
    clinician_name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          {assessment ? 'Edit Assessment' : 'New Objective Assessment'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              required
              value={formData.assessment_date}
              onChange={(e) => setFormData({...formData, assessment_date: e.target.value})}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Assessment Type</Label>
            <MobileSelect
              label="Assessment Type"
              value={formData.assessment_type}
              onChange={(e) => setFormData({...formData, assessment_type: e.target.value})}
              options={[
                { value: 'strength', label: 'Strength' },
                { value: 'range_of_motion', label: 'Range of Motion' },
                { value: 'functional_test', label: 'Functional Test' },
                { value: 'balance', label: 'Balance' },
                { value: 'endurance', label: 'Endurance' },
                { value: 'flexibility', label: 'Flexibility' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Test Name *</Label>
          <Input
            required
            value={formData.test_name}
            onChange={(e) => setFormData({...formData, test_name: e.target.value})}
            placeholder="e.g., Knee Extension Strength, Single Leg Hop"
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Body Part</Label>
            <Input
              value={formData.body_part}
              onChange={(e) => setFormData({...formData, body_part: e.target.value})}
              placeholder="e.g., Right Knee"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Side</Label>
            <MobileSelect
              label="Side"
              value={formData.side}
              onChange={(e) => setFormData({...formData, side: e.target.value})}
              options={[
                { value: 'n/a', label: 'N/A' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'bilateral', label: 'Bilateral' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2 col-span-1">
            <Label>Value</Label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              placeholder="25"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 col-span-1">
            <Label>Unit</Label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              placeholder="kg, °, sec"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2 col-span-1">
            <Label>Baseline</Label>
            <Input
              value={formData.baseline}
              onChange={(e) => setFormData({...formData, baseline: e.target.value})}
              placeholder="30"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Clinician Name</Label>
          <Input
            value={formData.clinician_name}
            onChange={(e) => setFormData({...formData, clinician_name: e.target.value})}
            placeholder="Your name"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional observations..."
            className="rounded-xl"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
            {assessment ? 'Update' : 'Add'} Assessment
          </Button>
        </div>
      </form>
    </div>
  );
}