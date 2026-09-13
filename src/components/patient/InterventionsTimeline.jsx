import React from 'react';
import { format } from 'date-fns';
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function InterventionsTimeline({ interventions }) {
  if (interventions.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <p className="text-slate-500">No interventions recorded yet</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'planned':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200';
      case 'planned':
        return 'bg-amber-50 border-amber-200';
      case 'cancelled':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-white border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">Interventions</h2>
        <p className="text-sm text-slate-500 mt-1">Treatments and procedures during your care</p>
      </div>

      <div className="space-y-3">
        {interventions.map((intervention, idx) => (
          <div
            key={intervention.id}
            className={cn(
              'border-2 rounded-2xl p-5 transition-colors',
              getStatusColor(intervention.status)
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="mt-1">
                {getStatusIcon(intervention.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 capitalize">
                      {intervention.intervention_type.replace('_', ' ')}
                    </h4>
                    {intervention.title && (
                      <p className="text-sm text-slate-600 mt-1">{intervention.title}</p>
                    )}
                  </div>
                  <span className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
                    intervention.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                    intervention.status === 'planned' && 'bg-amber-100 text-amber-700',
                    intervention.status === 'cancelled' && 'bg-slate-200 text-slate-700'
                  )}>
                    {intervention.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-slate-600">
                  {intervention.location && (
                    <p><strong>Location:</strong> {intervention.location}</p>
                  )}
                  {intervention.medication_or_details && (
                    <p><strong>Details:</strong> {intervention.medication_or_details}</p>
                  )}
                  <p>
                    <strong>Date:</strong> {format(new Date(intervention.intervention_date), 'MMMM d, yyyy')}
                    {intervention.intervention_time && ` at ${intervention.intervention_time}`}
                  </p>
                </div>

                {/* Notes */}
                {intervention.notes && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700">{intervention.notes}</p>
                  </div>
                )}

                {/* Follow-up */}
                {intervention.follow_up_date && (
                  <p className="text-xs text-slate-500 mt-3">
                    Follow-up scheduled: {format(new Date(intervention.follow_up_date), 'MMM d, yyyy')}
                  </p>
                )}

                {/* Attachments */}
                {intervention.attachments && intervention.attachments.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-slate-600">Attachments:</p>
                    {intervention.attachments.map((att, attIdx) => (
                      <a
                        key={attIdx}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-xs text-purple-600 hover:text-purple-700 underline"
                      >
                        📎 {att.file_name || 'Download'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}