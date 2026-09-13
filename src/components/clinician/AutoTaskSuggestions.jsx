import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus } from 'lucide-react';

export default function AutoTaskSuggestions({ patient, adherenceRate, avgPainLevel, outcomeMeasures }) {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const user = await base44.auth.me();
      return base44.entities.ClinicianTask.create({
        ...taskData,
        patient_id: patient.id,
        assigned_to: user.email,
        assigned_by: user.email,
        auto_generated: true,
        priority: taskData.priority || 'medium',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-tasks'] });
    }
  });

  const suggestions = [];

  // Low adherence detection
  if (adherenceRate !== null && adherenceRate < 50) {
    suggestions.push({
      title: `Follow up: ${patient.full_name} - Low Exercise Adherence`,
      description: `Patient adherence is at ${Math.round(adherenceRate)}%. Consider calling to discuss barriers and adjust the plan if needed.`,
      task_type: 'follow_up_call',
      priority: adherenceRate < 30 ? 'urgent' : 'high',
      trigger_reason: `Low adherence: ${Math.round(adherenceRate)}%`
    });
  }

  // High pain detection
  if (avgPainLevel !== null && avgPainLevel > 6) {
    suggestions.push({
      title: `Review pain management for ${patient.full_name}`,
      description: `Average pain level is ${avgPainLevel.toFixed(1)}/10. May need to adjust treatment plan or refer for additional intervention.`,
      task_type: 'review_progress',
      priority: avgPainLevel > 8 ? 'urgent' : 'high',
      trigger_reason: `High pain: ${avgPainLevel.toFixed(1)}/10`
    });
  }

  // Incomplete outcome measures
  const pendingOutcomes = outcomeMeasures?.filter(o => o.status === 'pending') || [];
  if (pendingOutcomes.length > 2) {
    suggestions.push({
      title: `${patient.full_name} - Multiple pending questionnaires`,
      description: `Patient has ${pendingOutcomes.length} incomplete outcome measures. Follow up to ensure completion.`,
      task_type: 'follow_up_call',
      priority: 'medium',
      trigger_reason: `${pendingOutcomes.length} pending questionnaires`
    });
  }

  // Patient inactive (no recent logs)
  // This would require checking last activity date - simplified for now

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h4 className="font-semibold text-slate-800">Suggested Actions</h4>
        <Badge variant="outline" className="ml-auto">AI-Powered</Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium text-slate-800 text-sm mb-1">{suggestion.title}</h5>
                <p className="text-xs text-slate-600 mb-2">{suggestion.description}</p>
                <div className="flex items-center gap-2">
                  <Badge className={
                    suggestion.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    suggestion.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }>
                    {suggestion.priority}
                  </Badge>
                  <span className="text-xs text-slate-500">{suggestion.trigger_reason}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createTaskMutation.mutate(suggestion)}
                disabled={createTaskMutation.isPending}
                className="rounded-lg"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}