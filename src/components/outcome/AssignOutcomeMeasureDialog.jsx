import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, CheckCircle2, Send } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AssignOutcomeMeasureDialog({ open, onOpenChange, measure }) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [frequency, setFrequency] = useState('one-time');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ['assign-patients'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Patient.filter({ assigned_coach: user.email }, 'full_name');
    },
    enabled: open
  });

  const assignMutation = useMutation({
    mutationFn: async ({ patient }) => {
      // Create the PatientOutcomeMeasure record
      await base44.entities.PatientOutcomeMeasure.create({
        patient_id: patient.id,
        outcome_measure_id: measure.id,
        sent_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        frequency,
        notes,
      });

      // Send email notification to patient
      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject: `New questionnaire assigned: ${measure.name}`,
        body: `Hi ${patient.full_name},\n\nYour clinician has assigned you a new questionnaire: "${measure.name}".\n\n${notes ? `Note from your clinician: ${notes}\n\n` : ''}Please log in to your patient portal to complete it.\n\nThank you,\nYour Rehabilitation Team`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-patient-outcomes'] });
      setSuccess(true);
    }
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedPatient) return;
    assignMutation.mutate({ patient: selectedPatient });
  };

  const handleClose = (val) => {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setSelectedPatientId('');
        setPatientSearch('');
        setFrequency('one-time');
        setNotes('');
        setSuccess(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Patient</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-slate-800">Questionnaire Assigned!</p>
            <p className="text-sm text-slate-500">
              <strong>{measure?.name}</strong> has been sent to <strong>{selectedPatient?.full_name}</strong> and is waiting for their response.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Measure info */}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-0.5">Assigning</p>
              <p className="font-semibold text-slate-800 text-sm">{measure?.name}</p>
              {measure?.condition && <p className="text-xs text-slate-500">{measure.condition}</p>}
            </div>

            {/* Patient search & select */}
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 p-3 text-center">No patients found</p>
                ) : (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-sm transition-colors",
                        selectedPatientId === p.id
                          ? "bg-purple-50 text-purple-700 font-medium"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <p className="font-medium">{p.full_name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes for Patient (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any instructions or context for the patient..."
                className="rounded-xl"
                rows={2}
              />
            </div>

            <Button
              onClick={handleAssign}
              disabled={!selectedPatientId || assignMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {assignMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Assign & Notify Patient
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}