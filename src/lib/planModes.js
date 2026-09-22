export const PLAN_MODE_DEFAULTS = {
  basic: {
    program_type: 'basic',
    plan_mode: 'basic',
    monitoring_level: 'basic',
    morning_check_in_enabled: false,
  },
  phased: {
    program_type: 'phased',
    plan_mode: 'phased',
    monitoring_level: 'standard',
    morning_check_in_enabled: false,
  },
  performance: {
    program_type: 'phased',
    plan_mode: 'performance',
    monitoring_level: 'performance',
    morning_check_in_enabled: true,
  },
};

export function getPlanMode(plan) {
  if (PLAN_MODE_DEFAULTS[plan?.plan_mode]) return plan.plan_mode;
  if (plan?.program_type === 'basic') return 'basic';
  if (plan?.monitoring_level === 'performance') return 'performance';
  return 'phased';
}

export function getMonitoringLevel(plan) {
  if (['basic', 'standard', 'performance'].includes(plan?.monitoring_level)) {
    return plan.monitoring_level;
  }
  return PLAN_MODE_DEFAULTS[getPlanMode(plan)].monitoring_level;
}

export function isMorningCheckInEnabled(plan) {
  if (typeof plan?.morning_check_in_enabled === 'boolean') {
    return plan.morning_check_in_enabled;
  }
  return getPlanMode(plan) === 'performance';
}

export function resolveExerciseTrackingMode(exercise, plan) {
  const override = exercise?.tracking_mode;
  if (['basic', 'standard', 'performance'].includes(override)) return override;
  return getMonitoringLevel(plan);
}

export function applyPlanMode(current, planMode) {
  const defaults = PLAN_MODE_DEFAULTS[planMode] || PLAN_MODE_DEFAULTS.phased;
  return { ...current, ...defaults };
}

export const PLAN_MODE_LABELS = {
  basic: 'Basic Plan',
  phased: 'Phased Plan',
  performance: 'Performance Plan',
};
