import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ScheduledReportManager({ patientId, patientName }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    report_name: `${patientName} - Progress Report`,
    frequency: 'weekly',
    send_to_email: '',
    include_sections: ['progress', 'assessments', 'outcomes', 'pain']
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: scheduledReports = [] } = useQuery({
    queryKey: ['scheduled-reports', patientId],
    queryFn: () => base44.entities.ScheduledReport.filter({ patient_id: patientId }, '-created_date'),
    enabled: !!patientId
  });

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const nextDate = new Date();
      if (data.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (data.frequency === 'bi-weekly') nextDate.setDate(nextDate.getDate() + 14);
      else if (data.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

      return base44.entities.ScheduledReport.create({
        ...data,
        clinic_id: user.clinic_id,
        patient_id: patientId,
        clinician_email: user.email,
        next_generation_date: nextDate.toISOString().split('T')[0],
        active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setShowDialog(false);
      setNewReport({
        report_name: `${patientName} - Progress Report`,
        frequency: 'weekly',
        send_to_email: '',
        include_sections: ['progress', 'assessments', 'outcomes', 'pain']
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    }
  });

  const toggleReportMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.ScheduledReport.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    }
  });

  const toggleSection = (section) => {
    const sections = newReport.include_sections.includes(section)
      ? newReport.include_sections.filter(s => s !== section)
      : [...newReport.include_sections, section];
    setNewReport({ ...newReport, include_sections: sections });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800">Scheduled Reports</h4>
          <p className="text-sm text-slate-500">Automated report generation</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          size="sm"
          variant="outline"
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {scheduledReports.length > 0 ? (
        <div className="space-y-2">
          {scheduledReports.map((report) => (
            <div key={report.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-slate-800">{report.report_name}</h5>
                    <Badge variant={report.active ? "default" : "outline"}>
                      {report.active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Frequency: {report.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>Next: {format(new Date(report.next_generation_date), 'MMM d, yyyy')}</span>
                    </div>
                    {report.last_generated_date && (
                      <div>Last generated: {format(new Date(report.last_generated_date), 'MMM d, yyyy')}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReportMutation.mutate({ id: report.id, active: !report.active })}
                  >
                    {report.active ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteReportMutation.mutate(report.id)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-sm">
          No scheduled reports
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Automated Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                value={newReport.report_name}
                onChange={(e) => setNewReport({ ...newReport, report_name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <select
                value={newReport.frequency}
                onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Send to Email (optional)</Label>
              <Input
                type="email"
                value={newReport.send_to_email}
                onChange={(e) => setNewReport({ ...newReport, send_to_email: e.target.value })}
                placeholder={currentUser?.email}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Include Sections</Label>
              <div className="space-y-2">
                {['progress', 'assessments', 'outcomes', 'pain', 'exercises', 'interventions'].map(section => (
                  <div key={section} className="flex items-center space-x-2">
                    <Checkbox
                      id={`schedule-${section}`}
                      checked={newReport.include_sections.includes(section)}
                      onCheckedChange={() => toggleSection(section)}
                    />
                    <Label htmlFor={`schedule-${section}`} className="capitalize cursor-pointer">
                      {section}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createReportMutation.mutate(newReport)}
                disabled={!newReport.report_name || createReportMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Schedule Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}