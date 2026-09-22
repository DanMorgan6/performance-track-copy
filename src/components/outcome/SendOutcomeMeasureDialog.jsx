import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/MobileSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SendOutcomeMeasureDialog({ open, onOpenChange, outcomeMeasures, patientId, patientEmail, onSend }) {
  const [selectedMeasure, setSelectedMeasure] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState('one-time');

  const handleSend = () => {
    if (!selectedMeasure) return;
    
    onSend({
      patient_id: patientId,
      outcome_measure_id: selectedMeasure,
      sent_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      frequency,
      notes,
      patient_email: patientEmail
    });
    
    setSelectedMeasure('');
    setNotes('');
    setFrequency('one-time');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Outcome Measure</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Outcome Measure</Label>
            <MobileSelect
              value={selectedMeasure}
              onChange={(e) => setSelectedMeasure(e.target.value)}
              options={outcomeMeasures.map((measure) => ({
                value: measure.id,
                label: `${measure.name} - ${measure.condition}`,
              }))}
              placeholder="Choose a measure..."
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <MobileSelect
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              options={[
                { value: 'one-time', label: 'One-time' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'bi-weekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              label="Frequency"
              className="text-sm"
            />
            <p className="text-xs text-slate-500">
              {frequency === 'one-time' ? 'Patient will be notified once' : `Patient will receive this questionnaire ${frequency}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional instructions for the patient..."
              className="rounded-xl"
            />
          </div>

          <Button 
            onClick={handleSend}
            disabled={!selectedMeasure}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            Send & Notify Patient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}