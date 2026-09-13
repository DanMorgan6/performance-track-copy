import { format, addWeeks, differenceInDays, startOfDay } from 'date-fns';

/**
 * Phase Progression Engine
 * Single source of truth for phase-based rehab progression logic
 */

/**
 * Check if all exit criteria for a phase are met
 */
export function areExitCriteriaMet(phase) {
  if (!phase?.exit_criteria || phase.exit_criteria.length === 0) {
    // No criteria defined = automatically met
    return true;
  }

  // All criteria must be met (AND logic)
  return phase.exit_criteria.every(criterion => criterion.is_met === true);
}

/**
 * Calculate phase status based on timeline and exit criteria
 */
export function getPhaseStatus(phase, plan, currentDate = new Date()) {
  if (!phase || !plan) return 'locked';

  const planStartDate = plan.start_date ? new Date(plan.start_date) : null;
  if (!planStartDate) return 'locked';

  const today = startOfDay(currentDate);
  const planStart = startOfDay(planStartDate);

  // Calculate when this phase should start based on previous phases
  let phaseStartDate = planStart;
  const allPhases = Array.isArray(plan.phases) ? plan.phases : [];
  
  for (let i = 1; i < phase.phase_number; i++) {
    const prevPhase = allPhases.find(p => p.phase_number === i);
    if (prevPhase) {
      phaseStartDate = addWeeks(phaseStartDate, prevPhase.duration_weeks || 0);
    }
  }

  // Calculate phase end date
  const phaseEndDate = addWeeks(phaseStartDate, phase.duration_weeks || 0);

  // Determine status
  if (today < phaseStartDate) {
    // Phase hasn't started yet
    return 'locked';
  }

  const criteriaMet = areExitCriteriaMet(phase);

  if (today >= phaseEndDate) {
    // Phase duration has elapsed
    if (criteriaMet) {
      return 'completed';
    } else {
      return 'repeating'; // Auto-repeat until criteria met
    }
  }

  // We're within the phase timeframe
  if (phase.phase_number === plan.current_phase) {
    return 'active';
  }

  return 'locked';
}

/**
 * Get the actual active phase considering auto-repeat logic
 */
export function getActivePhase(plan, phases, currentDate = new Date()) {
  if (!plan || !phases || phases.length === 0) return null;

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  
  for (const phase of sortedPhases) {
    const status = getPhaseStatus(phase, { ...plan, phases: sortedPhases }, currentDate);
    
    if (status === 'active' || status === 'repeating') {
      return {
        ...phase,
        status,
        criteriaMet: areExitCriteriaMet(phase),
        criteriaProgress: getExitCriteriaProgress(phase)
      };
    }
  }

  // No active phase - return the first phase
  return sortedPhases[0] ? {
    ...sortedPhases[0],
    status: 'active',
    criteriaMet: areExitCriteriaMet(sortedPhases[0]),
    criteriaProgress: getExitCriteriaProgress(sortedPhases[0])
  } : null;
}

/**
 * Get exit criteria progress
 */
export function getExitCriteriaProgress(phase) {
  if (!phase?.exit_criteria || phase.exit_criteria.length === 0) {
    return { completed: 0, total: 0, percentage: 100 };
  }

  const completed = phase.exit_criteria.filter(c => c.is_met === true).length;
  const total = phase.exit_criteria.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Get the appropriate week schedule for a given date within a phase
 * Handles auto-repeat by cycling through phase weeks
 */
export function getWeekScheduleForDate(phase, plan, targetDate) {
  if (!phase?.weeks || phase.weeks.length === 0) return null;

  const planStartDate = plan.start_date ? new Date(plan.start_date) : null;
  if (!planStartDate) return null;

  // Calculate phase start
  let phaseStartDate = new Date(planStartDate);
  const allPhases = Array.isArray(plan.phases) ? plan.phases : [];
  
  for (let i = 1; i < phase.phase_number; i++) {
    const prevPhase = allPhases.find(p => p.phase_number === i);
    if (prevPhase) {
      phaseStartDate = addWeeks(phaseStartDate, prevPhase.duration_weeks || 0);
    }
  }

  // Calculate weeks since phase start
  const daysSincePhaseStart = differenceInDays(new Date(targetDate), phaseStartDate);
  const weeksSincePhaseStart = Math.floor(daysSincePhaseStart / 7);

  // If we're in auto-repeat mode (beyond original duration), cycle through weeks
  const weekIndex = weeksSincePhaseStart % phase.weeks.length;
  
  return phase.weeks[weekIndex >= 0 ? weekIndex : 0];
}

/**
 * Check if a phase can be unlocked (all previous phases completed)
 */
export function canUnlockPhase(phaseNumber, phases, plan) {
  if (phaseNumber === 1) return true;

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);
  
  for (const phase of sortedPhases) {
    if (phase.phase_number >= phaseNumber) break;
    
    const status = getPhaseStatus(phase, { ...plan, phases: sortedPhases });
    if (status !== 'completed') {
      return false;
    }
  }

  return true;
}

/**
 * Get display message for phase status
 */
export function getPhaseStatusMessage(phase, status) {
  if (!phase) return '';

  switch (status) {
    case 'active':
      return 'Current Phase';
    case 'repeating':
      return `Continue ${phase.name} until criteria met`;
    case 'completed':
      return 'Phase Completed';
    case 'locked':
      return 'Locked - Complete previous phase first';
    default:
      return '';
  }
}