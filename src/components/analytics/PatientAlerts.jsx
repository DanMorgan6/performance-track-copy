import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  Clock,
  MoonStar,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { addWeeks, format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

function latestRecord(records) {
  return [...records].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

function getReviewDate(plan, currentPhase, phases) {
  if (!plan?.start_date || !currentPhase) return null;
  let reviewDate = new Date(plan.start_date);

  [...phases]
    .filter((phase) => phase.plan_id === plan.id && phase.phase_number <= currentPhase.phase_number)
    .sort((a, b) => a.phase_number - b.phase_number)
    .forEach((phase) => {
      reviewDate = addWeeks(reviewDate, phase.duration_weeks || 0);
    });

  return reviewDate;
}

export default function PatientAlerts({
  patients,
  exerciseLogs,
  painLogs,
  patientOutcomeMeasures,
  plans = [],
  phases = []
}) {
  const alerts = [];

  patients.forEach((patient) => {
    const patientLogs = exerciseLogs.filter((log) => log.patient_id === patient.id);
    const last7Days = patientLogs.filter((log) => new Date(log.date) >= subDays(new Date(), 7));
    const adherence = last7Days.length > 0
      ? (last7Days.filter((log) => log.completed).length / last7Days.length) * 100
      : null;

    if (adherence !== null && adherence < 50 && last7Days.length >= 2) {
      alerts.push({
        type: 'Adherence',
        severity: adherence < 25 ? 'high' : 'medium',
        patient,
        message: `${Math.round(adherence)}% completion across the last 7 days`,
        icon: TrendingDown
      });
    }

    const recentPain = painLogs
      .filter((log) => log.patient_id === patient.id)
      .filter((log) => new Date(log.date) >= subDays(new Date(), 7))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestPain = recentPain[0];

    if (latestPain?.pain_level >= 8) {
      alerts.push({
        type: 'Pain',
        severity: 'high',
        patient,
        message: `Pain ${latestPain.pain_level}/10 reported ${format(new Date(latestPain.date), 'd MMM')}`,
        icon: AlertTriangle
      });
    } else if (recentPain.length >= 3) {
      const newest = Number(recentPain[0].pain_level);
      const oldest = Number(recentPain[recentPain.length - 1].pain_level);
      if (Number.isFinite(newest) && Number.isFinite(oldest) && newest - oldest >= 2) {
        alerts.push({
          type: 'Pain trend',
          severity: 'medium',
          patient,
          message: `Pain has increased by ${newest - oldest} points this week`,
          icon: TrendingUp
        });
      }
    }

    const overdueProms = patientOutcomeMeasures.filter(
      (measure) => measure.patient_id === patient.id && measure.status === 'pending'
    );
    if (overdueProms.length > 0) {
      alerts.push({
        type: 'PROMs',
        severity: 'low',
        patient,
        message: `${overdueProms.length} patient questionnaire${overdueProms.length === 1 ? '' : 's'} awaiting completion`,
        icon: Clock
      });
    }

    const activePlan = plans.find(
      (plan) => plan.patient_id === patient.id && plan.status === 'active'
    );
    const planPhases = phases.filter((phase) => phase.plan_id === activePlan?.id);
    const currentPhase = planPhases.find(
      (phase) => phase.phase_number === activePlan?.current_phase || phase.status === 'active'
    );

    if (currentPhase) {
      const criteria = currentPhase.exit_criteria || [];
      const criteriaMet = criteria.length > 0 && criteria.every((criterion) => criterion.is_met);
      const reviewDate = getReviewDate(activePlan, currentPhase, planPhases);

      if (criteriaMet) {
        alerts.push({
          type: 'Phase review',
          severity: 'medium',
          patient,
          message: `${currentPhase.name}: exit criteria recorded as met — practitioner sign-off required`,
          icon: ClipboardCheck
        });
      } else if (reviewDate && reviewDate <= new Date()) {
        const outstanding = criteria.filter((criterion) => !criterion.is_met).length;
        alerts.push({
          type: 'Criteria review',
          severity: 'high',
          patient,
          message: `${currentPhase.name}: planned review point reached with ${outstanding || 'no'} criteria outstanding`,
          icon: ClipboardCheck
        });
      }
    }

    const latestExercise = latestRecord(patientLogs);
    if (
      patient.status === 'active' &&
      (!latestExercise || new Date(latestExercise.date) < subDays(new Date(), 14))
    ) {
      alerts.push({
        type: 'Inactivity',
        severity: 'low',
        patient,
        message: latestExercise
          ? `No exercise activity since ${format(new Date(latestExercise.date), 'd MMM')}`
          : 'No exercise activity has been recorded',
        icon: MoonStar
      });
    }
  });

  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10">
          <ClipboardCheck className="h-5 w-5 text-emerald-300" />
        </div>
        No current clinical priorities.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 12).map((alert, index) => {
        const Icon = alert.icon;
        return (
          <Link
            key={`${alert.patient.id}-${alert.type}-${index}`}
            to={createPageUrl(`PatientDetail?id=${alert.patient.id}`)}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              alert.severity === 'high' && 'bg-rose-400/10',
              alert.severity === 'medium' && 'bg-amber-400/10',
              alert.severity === 'low' && 'bg-sky-400/10'
            )}>
              <Icon className={cn(
                'h-4 w-4',
                alert.severity === 'high' && 'text-rose-300',
                alert.severity === 'medium' && 'text-amber-300',
                alert.severity === 'low' && 'text-sky-300'
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{alert.patient.full_name}</p>
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                  {alert.type}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{alert.message}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition-colors group-hover:text-[#d8ff5f]" />
          </Link>
        );
      })}
    </div>
  );
}