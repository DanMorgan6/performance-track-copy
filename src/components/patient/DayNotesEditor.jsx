import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Save } from 'lucide-react';

export default function DayNotesEditor({ dayNote, date, patientId, planId, clinicId, onSave, onCancel }) {
  const queryClient = useQueryClient();
  const [clinicianNote, setClinicianNote] = useState(dayNote?.clinician_note || '');
  const [patientNote, setPatientNote] = useState(dayNote?.patient_note || '');
  const [saving, setSaving] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DayNote.create({
      ...data,
      clinic_id: clinicId,
      patient_id: patientId,
      plan_id: planId,
      date
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-notes'] });
      onSave?.();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DayNote.update(dayNote.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-notes'] });
      onSave?.();
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dayNote?.id) {
        await updateMutation.mutateAsync({
          clinician_note: clinicianNote,
          patient_note: patientNote
        });
      } else {
        await createMutation.mutateAsync({
          clinician_note: clinicianNote,
          patient_note: patientNote
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <h4 className="font-semibold text-blue-900 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Day Notes
      </h4>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-slate-700">Clinician Note</Label>
          <Textarea
            value={clinicianNote}
            onChange={(e) => setClinicianNote(e.target.value)}
            placeholder="Add coaching cues, observations, or guidance for this day..."
            className="mt-2 rounded-xl"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Patient Note</Label>
          <Textarea
            value={patientNote}
            onChange={(e) => setPatientNote(e.target.value)}
            placeholder="Patient feedback or comments about this day..."
            className="mt-2 rounded-xl"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || (!clinicianNote && !patientNote)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Notes
        </Button>
      </div>
    </div>
  );
}