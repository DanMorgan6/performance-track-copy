import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Download, Trash2, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ReportList({ reports, patientId, onExtractClick }) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ reportId, currentVisibility }) => {
      const currentUser = await base44.auth.me();
      const newVisibility = !currentVisibility;

      await base44.entities.Report.update(reportId, {
        visible_to_patient: newVisibility
      });

      // Log audit event
      await base44.entities.AuditLog.create({
        clinic_id: currentUser.clinic_id,
        patient_id: patientId,
        report_id: reportId,
        action: 'report_visibility_changed',
        details: {
          visible_to_patient: newVisibility
        },
        created_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.entities.Report.delete(reportId);
      
      const currentUser = await base44.auth.me();
      await base44.entities.AuditLog.create({
        clinic_id: currentUser.clinic_id,
        patient_id: patientId,
        report_id: reportId,
        action: 'report_uploaded',
        details: { deleted: true },
        created_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] });
    }
  });

  if (reports.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        No reports uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-slate-800 capitalize text-sm">
                {report.type.replace('_', ' ')}
              </h4>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                report.visible_to_patient ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
              )}>
                {report.visible_to_patient ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {format(new Date(report.date), 'MMM d, yyyy')}
              {report.notes && ` • ${report.notes.substring(0, 50)}${report.notes.length > 50 ? '...' : ''}`}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(report.file_url, '_blank')}
              className="rounded-lg flex-1 sm:flex-none text-xs sm:text-sm"
              title="Download report"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1 sm:hidden">View</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleVisibilityMutation.mutate({ 
                reportId: report.id, 
                currentVisibility: report.visible_to_patient 
              })}
              disabled={toggleVisibilityMutation.isPending}
              className="rounded-lg flex-1 sm:flex-none text-xs sm:text-sm"
              title={report.visible_to_patient ? 'Hide from patient' : 'Show to patient'}
            >
              {report.visible_to_patient ? (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="ml-1 sm:hidden">
                {report.visible_to_patient ? 'Hide' : 'Show'}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onExtractClick(report)}
              className="rounded-lg flex-1 sm:flex-none text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50 text-xs sm:text-sm"
              title="Extract diagnosis with AI"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1 sm:hidden">Extract</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Delete this report?')) {
                  deleteReportMutation.mutate(report.id);
                }
              }}
              disabled={deleteReportMutation.isPending}
              className="rounded-lg text-rose-600 hover:text-rose-700 flex-1 sm:flex-none text-xs sm:text-sm"
              title="Delete report"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1 sm:hidden">Delete</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}