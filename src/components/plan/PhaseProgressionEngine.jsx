import { addWeeks, differenceInDays, startOfDay } from 'date-fns';

/**
 * Criteria-led rehabilitation progression.
 * Time is used only to indicate when a clinical review is due.
 * This module never advances or completes a phase automatically.
 */

export function areExitCriteriaMet(phase) {
  if (!phase?.exit_criteria || phase.exit_criteria.length === 0) {
    return false;
  }

  return phase.exit_criteria.every((criterion) => criterion.is_met === true);
}

function getPlannedPhaseStart(phase, plan) {
  const planStartDate = plan?.start_date ? new Date(plan.start_date) : null;
  if (!planStartDate || Number.isNaN(planStartDate.getTime())) return null;

  let phaseStartDate = startOfDay(planStartDate);
  const allPhases = Array.isArray(plan.phases) ? plan.phases : [];

  for (let phaseNumber = 1; phaseNumber < phase.phase_number; phaseNumber += 1) {
    const previousPhase = allPhases.find((item) => item.phase_number === phaseNumber);
    if (previousPhase) {
      phaseStartDate = addWeeks(phaseStartDate, previousPhase.duration_weeks || 0);
    }
  }

  return phaseStartDate;
}

export function getPhaseStatus(phase, plan, currentDate = new Date()) {
  if (!phase || !plan) return 'locked';

  if (phase.status === 'completed' || phase.phase_number < plan.current_phase) {
    return 'completed';
  }

  if (phase.phase_number > plan.current_phase) {
    return 'locked';
  }

  const criteriaMet = areExitCriteriaMet(phase);
  if (criteriaMet) {
    return 'review_ready';
  }

  const plannedStart = getPlannedPhaseStart(phase, plan);
  if (plannedStart && phase.duration_weeks) {
    const plannedReviewDate = addWeeks(plannedStart, phase.duration_weeks);
    if (startOfDay(currentDate) >= plannedReviewDate) {
      return 'review_due';
    }
  }

  return 'active';
}

export function getActivePhase(plan, phases, currentDate = new Date()) {
  if (!plan || !phases || phases.length === 0) return null;

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  const storedCurrentPhase = sortedPhases.find(
    (phase) => phase.phase_number === plan.current_phase || phase.status === 'active'
  );
  const phase = storedCurrentPhase || sortedPhases.find((item) => item.status !== 'completed') || sortedPhases[0];
  const status = getPhaseStatus(phase, { ...plan, phases: sortedPhases }, currentDate);

  return {
    ...phase,
    status,
    criteriaMet: areExitCriteriaMet(phase),
    criteriaProgress: getExitCriteriaProgress(phase)
  };
}

export function getExitCriteriaProgress(phase) {
  if (!phase?.exit_criteria || phase.exit_criteria.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = phase.exit_criteria.filter((criterion) => criterion.is_met === true).length;
  const total = phase.exit_criteria.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100)
  };
}

/**
 * Returns the planned week to display. Cycling the schedule does not change
 * phase status and cannot unlock the next phase.
 */
export function getWeekScheduleForDate(phase, plan, targetDate) {
  if (!phase?.weeks || phase.weeks.length === 0) return null;

  const phaseStartDate = getPlannedPhaseStart(phase, plan);
  if (!phaseStartDate) return null;

  const daysSincePhaseStart = differenceInDays(new Date(targetDate), phaseStartDate);
  const weeksSincePhaseStart = Math.floor(daysSincePhaseStart / 7);
  const weekIndex = weeksSincePhaseStart % phase.weeks.length;

  return phase.weeks[weekIndex >= 0 ? weekIndex : 0];
}

export function canUnlockPhase(phaseNumber, phases) {
  if (phaseNumber === 1) return true;

  return [...phases]
    .filter((phase) => phase.phase_number < phaseNumber)
    .every((phase) => phase.status === 'completed');
}

export function getPhaseStatusMessage(phase, status) {
  if (!phase) return '';

  switch (status) {
    case 'active':
      return 'Continue the current phase and reassess the exit criteria.';
    case 'review_due':
      return 'The planned review point has arrived; criteria remain outstanding.';
    case 'review_ready':
      return 'Exit criteria are recorded as met. Practitioner review is required before progression.';
    case 'completed':
      return 'Phase completed following practitioner review.';
    case 'locked':
      return 'Complete and clinically sign off the previous phase first.';
    default:
      return '';
  }
}
