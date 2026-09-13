import React from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Download, FileText } from 'lucide-react';

export default function PatientReportView({ reports }) {
  const visibleReports = reports.filter(r => r.visible_to_patient);

  if (visibleReports.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No reports available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleReports.map((report) => (
        <div key={report.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
          <FileText className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 capitalize">
              {report.type.replace('_', ' ')}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {format(new Date(report.date), 'MMMM d, yyyy')}
            </p>
            {report.notes && (
              <p className="text-sm text-slate-600 mt-2">{report.notes}</p>
            )}
          </div>
          <Button
            onClick={() => window.open(report.file_url, '_blank')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex-shrink-0"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}