import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PatientAlerts({ patients, exerciseLogs, painLogs, patientOutcomeMeasures }) {
  const alerts = [];

  patients.forEach(patient => {
    const patientLogs = exerciseLogs.filter(l => l.patient_id === patient.id);
    const last7Days = patientLogs.filter(l => {
      const d = new Date(l.date);
      return d >= subDays(new Date(), 7);
    });

    const adherence = last7Days.length > 0
      ? (last7Days.filter(l => l.completed).length / last7Days.length) * 100
      : null;

    // Low adherence alert
    if (adherence !== null && adherence < 50 && last7Days.length >= 2) {
      alerts.push({
        type: 'adherence',
        severity: adherence < 25 ? 'high' : 'medium',
        patient,
        message: `${Math.round(adherence)}% adherence in the last 7 days`,
        icon: TrendingDown,
      });
    }

    // High pain alert
    const recentPain = painLogs
      .filter(l => l.patient_id === patient.id)
      .filter(l => new Date(l.date) >= subDays(new Date(), 7));
    const latestPain = recentPain.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (latestPain && latestPain.pain_level >= 8) {
      alerts.push({
        type: 'pain',
        severity: 'high',
        patient,
        message: `Pain level ${latestPain.pain_level}/10 reported on ${format(new Date(latestPain.date), 'MMM d')}`,
        icon: AlertTriangle,
      });
    }

    // Overdue outcome measures
    const overdue = patientOutcomeMeasures.filter(
      om => om.patient_id === patient.id && om.status === 'pending'
    );
    if (overdue.length > 0) {
      alerts.push({
        type: 'outcome',
        severity: 'low',
        patient,
        message: `${overdue.length} pending questionnaire${overdue.length > 1 ? 's' : ''} not completed`,
        icon: Clock,
      });
    }
  });

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5 text-emerald-500" />
        </div>
        No alerts — all patients are on track!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 10).map((alert, i) => {
        const Icon = alert.icon;
        return (
          <Link
            key={i}
            to={createPageUrl(`PatientDetail?id=${alert.patient.id}`)}
            className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-slate-50 group"
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              alert.severity === 'high' && 'bg-rose-100',
              alert.severity === 'medium' && 'bg-amber-100',
              alert.severity === 'low' && 'bg-blue-100',
            )}>
              <Icon className={cn(
                'w-4 h-4',
                alert.severity === 'high' && 'text-rose-600',
                alert.severity === 'medium' && 'text-amber-600',
                alert.severity === 'low' && 'text-blue-600',
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{alert.patient.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{alert.message}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}