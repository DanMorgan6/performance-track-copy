// Adherence is measured from the plan start date through today, against the
// exercises actually prescribed in the phase weekly schedule — not a fixed
// 30-day window and not a flat "exercises x 30" denominator.

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const startOfDay = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

// Returns { rate, expected, completed, daysElapsed }.
//  - expected: prescribed exercises from start date through today, cycling the
//    phase weekly schedule (rest days contribute zero).
//  - completed: ExerciseLog entries marked completed within the same window.
//  - rate: completed / expected, clamped to 0-100 and rounded.
export const calculatePlanAdherence = (activePlan, currentPhase, exerciseLogs = []) => {
  if (!activePlan?.start_date) {
    return { rate: 0, expected: 0, completed: 0, daysElapsed: 0 };
  }

  const startDate = startOfDay(activePlan.start_date);
  const today = startOfDay(new Date());
  if (!startDate || !today || today < startDate) {
    return { rate: 0, expected: 0, completed: 0, daysElapsed: 0 };
  }

  const daysElapsed = Math.floor((today - startDate) / DAY_MS) + 1; // inclusive of start day
  const weeks = currentPhase?.weeks;
  let expectedExercises = 0;

  if (weeks && weeks.length > 0) {
    for (let offset = 0; offset < daysElapsed; offset++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + offset);
      const dayName = DAY_NAMES[dayDate.getDay()];
      const week = weeks[Math.floor(offset / 7) % weeks.length];
      const daySchedule = (week?.daily_schedule || []).find((d) => d.day === dayName);
      if (daySchedule && daySchedule.type !== 'rest') {
        expectedExercises += daySchedule.exercises?.length || 0;
      }
    }
  } else if (activePlan.program_type === 'basic' && activePlan.basic_config) {
    // Basic plan: prescribe the configured exercise bundle on each configured training day.
    const cfg = activePlan.basic_config;
    const exerciseCount = cfg.exercise_bundle?.length || 0;
    const trainingDays = cfg.days_of_week_pattern || [];
    for (let offset = 0; offset < daysElapsed; offset++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + offset);
      const dayName = DAY_NAMES[dayDate.getDay()];
      if (trainingDays.includes(dayName)) {
        expectedExercises += exerciseCount;
      }
    }
  } else {
    // Legacy phase without a weekly schedule: fall back to the flat exercise list per elapsed day.
    expectedExercises = (currentPhase?.exercises?.length || 0) * daysElapsed;
  }

  const completedExercises = exerciseLogs.filter((log) => {
    if (!log.date || !log.completed) return false;
    const d = startOfDay(log.date);
    return d && d >= startDate && d <= today;
  }).length;

  const rate = expectedExercises > 0
    ? Math.min(100, Math.round((completedExercises / expectedExercises) * 100))
    : 0;

  return { rate, expected: expectedExercises, completed: completedExercises, daysElapsed };
};