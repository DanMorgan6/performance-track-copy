import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PhaseTriggersManager({ planId, phases }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [newTrigger, setNewTrigger] = useState({
    phase_number: 1,
    outcome_measure_id: '',
    trigger_type: 'phase_complete'
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ['phase-triggers', planId],
    queryFn: () => base44.entities.PhaseOutcomeTrigger.filter({ plan_id: planId }),
    enabled: !!planId
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures'],
    queryFn: () => base44.entities.OutcomeMeasure.list()
  });

  const createTriggerMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseOutcomeTrigger.create({
      ...data,
      plan_id: planId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-triggers'] });
      setShowDialog(false);
      setNewTrigger({
        phase_number: 1,
        outcome_measure_id: '',
        trigger_type: 'phase_complete'
      });
    }
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: (id) => base44.entities.PhaseOutcomeTrigger.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-triggers'] });
    }
  });

  if (!planId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800">Automated Outcome Triggers</h4>
          <p className="text-sm text-slate-500">Send outcome measures when phases start or complete</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Trigger
        </Button>
      </div>

      {triggers.length > 0 ? (
        <div className="space-y-2">
          {triggers.map((trigger) => {
            const phase = phases?.find(p => p.phase_number === trigger.phase_number);
            const measure = outcomeMeasures.find(m => m.id === trigger.outcome_measure_id);
            
            return (
              <div key={trigger.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-purple-500" />
                  <div className="text-sm">
                    <span className="font-medium">Phase {trigger.phase_number}</span>
                    {phase && <span className="text-slate-500"> ({phase.name})</span>}
                    <span className="text-slate-400"> • </span>
                    <span className="text-slate-600">
                      {trigger.trigger_type === 'phase_start' ? 'At start' : 'On completion'}
                    </span>
                    <span className="text-slate-400"> → </span>
                    <span className="text-purple-600">{measure?.name}</span>
                  </div>
                  {trigger.triggered && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      Sent
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-sm">
          No automated triggers configured
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Automated Trigger</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phase</Label>
              <select
                value={newTrigger.phase_number}
                onChange={(e) => setNewTrigger({...newTrigger, phase_number: parseInt(e.target.value)})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                {phases?.map((phase) => (
                  <option key={phase.phase_number} value={phase.phase_number}>
                    Phase {phase.phase_number}: {phase.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Trigger When</Label>
              <select
                value={newTrigger.trigger_type}
                onChange={(e) => setNewTrigger({...newTrigger, trigger_type: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="phase_start">Phase Starts</option>
                <option value="phase_complete">Phase Completes</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Outcome Measure</Label>
              <select
                value={newTrigger.outcome_measure_id}
                onChange={(e) => setNewTrigger({...newTrigger, outcome_measure_id: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="">Select a measure...</option>
                {outcomeMeasures.map((measure) => (
                  <option key={measure.id} value={measure.id}>
                    {measure.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createTriggerMutation.mutate(newTrigger)}
                disabled={!newTrigger.outcome_measure_id || createTriggerMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Add Trigger
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}