import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  User
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MobileSelect from "@/components/ui/MobileSelect";

export default function TaskManager({ patientId, showPatientInfo = false }) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'follow_up_call',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['clinician-tasks', patientId],
    queryFn: async () => {
      if (patientId) {
        return base44.entities.ClinicianTask.filter({ patient_id: patientId }, '-created_date');
      } else {
        // Get all tasks assigned to current user
        const user = await base44.auth.me();
        return base44.entities.ClinicianTask.filter({ assigned_to: user.email }, '-created_date');
      }
    },
    enabled: !!currentUser
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-tasks'],
    queryFn: () => base44.entities.Patient.list(),
    enabled: showPatientInfo
  });

  const { data: clinicians = [] } = useQuery({
    queryKey: ['clinicians'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user.clinic_id) return [];
      const users = await base44.entities.User.filter({ clinic_id: user.clinic_id });
      return users.filter(isPractitioner);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ClinicianTask.create({
        ...data,
        patient_id: patientId,
        assigned_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-tasks'] });
      setShowCreateDialog(false);
      setNewTask({
        title: '',
        description: '',
        task_type: 'follow_up_call',
        priority: 'medium',
        assigned_to: '',
        due_date: ''
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClinicianTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ClinicianTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-tasks'] });
    }
  });

  const handleCompleteTask = (task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-rose-100 text-rose-700'
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-xl text-xs"
          >
            All ({tasks.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="rounded-xl text-xs"
          >
            Pending ({tasks.filter(t => t.status !== 'completed').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className="rounded-xl text-xs"
          >
            Done ({tasks.filter(t => t.status === 'completed').length})
          </Button>
        </div>
        {patientId && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const patient = patients.find(p => p.id === task.patient_id);
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
            
            return (
              <div key={task.id} className={cn(
                "p-4 rounded-xl border transition-all",
                task.status === 'completed' ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-purple-200"
              )}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleCompleteTask(task)}
                    disabled={task.status === 'completed'}
                    className={cn(
                      "mt-0.5 flex-shrink-0",
                      task.status === 'completed' ? "text-emerald-500" : "text-slate-300 hover:text-purple-600"
                    )}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium text-sm",
                          task.status === 'completed' ? "text-slate-500 line-through" : "text-slate-800"
                        )}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                        )}
                        {showPatientInfo && patient && (
                          <p className="text-xs text-slate-500 mt-1">
                            <User className="w-3 h-3 inline mr-1" />
                            {patient.full_name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge className={cn("text-xs hidden sm:inline-flex", priorityColors[task.priority])}>
                          {task.priority}
                        </Badge>
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            className="text-slate-400 hover:text-rose-500 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="capitalize">{task.task_type.replace('_', ' ')}</span>
                      {task.due_date && (
                        <>
                          <span>•</span>
                          <span className={cn(
                            "flex items-center gap-1",
                            isOverdue && "text-rose-600 font-medium"
                          )}>
                            <Clock className="w-3 h-3" />
                            Due {format(new Date(task.due_date), 'MMM d')}
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                          </span>
                        </>
                      )}
                      {task.auto_generated && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">Auto-generated</Badge>
                        </>
                      )}
                      {task.trigger_reason && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">{task.trigger_reason}</span>
                        </>
                      )}
                    </div>

                    {task.status === 'completed' && task.completed_date && (
                      <p className="text-xs text-slate-400 mt-1">
                        Completed {format(new Date(task.completed_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400 text-sm">
          No {filter !== 'all' && filter} tasks
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                required
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="e.g., Follow up on knee pain"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Task details..."
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Task Type</Label>
                <MobileSelect
                  label="Task Type"
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({...newTask, task_type: e.target.value})}
                  options={[
                    { value: 'follow_up_call', label: 'Follow-up Call' },
                    { value: 'review_progress', label: 'Review Progress' },
                    { value: 'adjust_plan', label: 'Adjust Plan' },
                    { value: 'assessment_needed', label: 'Assessment Needed' },
                    { value: 'consultation', label: 'Consultation' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <MobileSelect
                  label="Priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <MobileSelect
                  label="Clinician"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                  options={[
                    { value: '', label: 'Select clinician...' },
                    ...clinicians.map((clinician) => ({
                      value: clinician.email,
                      label: `${clinician.full_name} ${clinician.email === currentUser?.email ? '(Me)' : ''}`
                    }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={!newTask.title || !newTask.assigned_to || createTaskMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}