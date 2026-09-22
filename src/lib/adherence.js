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

const formatYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Prescribed exercise count for a specific calendar date (0 before plan start or on rest days).
export const prescribedExercisesForDate = (activePlan, currentPhase, date) => {
  if (!activePlan?.start_date) return 0;
  const startDate = startOfDay(activePlan.start_date);
  const target = startOfDay(date);
  if (!startDate || !target || target < startDate) return 0;

  const dayName = DAY_NAMES[target.getDay()];
  const offsetDays = Math.floor((target - startDate) / DAY_MS);
  const weeks = currentPhase?.weeks;

  if (weeks && weeks.length > 0) {
    const week = weeks[Math.floor(offsetDays / 7) % weeks.length];
    const daySchedule = (week?.daily_schedule || []).find((d) => d.day === dayName);
    if (daySchedule && daySchedule.type !== 'rest') {
      return daySchedule.exercises?.length || 0;
    }
    return 0;
  }

  if (activePlan.program_type === 'basic' && activePlan.basic_config) {
    const cfg = activePlan.basic_config;
    const trainingDays = cfg.days_of_week_pattern || [];
    return trainingDays.includes(dayName) ? (cfg.exercise_bundle?.length || 0) : 0;
  }

  return currentPhase?.exercises?.length || 0;
};

// Completed exercise-log count for a yyyy-MM-dd date string.
export const completedExercisesForDate = (exerciseLogs, dateStr) =>
  exerciseLogs.filter((log) => log.date === dateStr && log.completed).length;

// Adherence over an arbitrary inclusive [rangeStart, rangeEnd] window for one patient.
export const calculateRangeAdherence = (activePlan, currentPhase, exerciseLogs, rangeStart, rangeEnd) => {
  if (!activePlan?.start_date) return { rate: 0, expected: 0, completed: 0 };
  const startDate = startOfDay(activePlan.start_date);
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  if (!startDate || !start || !end || end < startDate) return { rate: 0, expected: 0, completed: 0 };

  const effectiveStart = start < startDate ? startDate : start;
  const dayCount = Math.floor((end - effectiveStart) / DAY_MS) + 1;
  let expected = 0;
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(effectiveStart);
    d.setDate(d.getDate() + i);
    expected += prescribedExercisesForDate(activePlan, currentPhase, d);
  }
  const completed = exerciseLogs.filter((log) => {
    if (!log.date || !log.completed) return false;
    const d = startOfDay(log.date);
    return d && d >= effectiveStart && d <= end;
  }).length;
  const rate = expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0;
  return { rate, expected, completed };
};

// Daily adherence map {dateStr: {expected, completed}} for one patient over [startDate, endDate].
export const buildDailyAdherenceMap = (activePlan, currentPhase, exerciseLogs, startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  if (!start || !end || end < start) return {};
  const map = {};
  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = formatYmd(cursor);
    map[dateStr] = {
      expected: prescribedExercisesForDate(activePlan, currentPhase, cursor),
      completed: completedExercisesForDate(exerciseLogs, dateStr),
    };
    cursor.setDate(cursor.getDate() + 1);
  }
  return map;
};

// Clinic-wide daily adherence map, summing prescribed + completed across all patients with active plans.
export const buildClinicDailyAdherenceMap = (patients, plans, phases, exerciseLogs, startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  if (!start || !end || end < start) return {};
  const map = {};
  const ensure = (dateStr) => {
    if (!map[dateStr]) map[dateStr] = { expected: 0, completed: 0 };
    return map[dateStr];
  };

  patients.forEach((patient) => {
    const activePlan = plans.find((p) => p.patient_id === patient.id && p.status === 'active');
    if (!activePlan) return;
    const currentPhase = phases.find((ph) => ph.patient_id === patient.id && ph.status === 'active');
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = formatYmd(cursor);
      ensure(dateStr).expected += prescribedExercisesForDate(activePlan, currentPhase, cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  exerciseLogs.forEach((log) => {
    if (!log.date || !log.completed) return;
    const d = startOfDay(log.date);
    if (!d || d < start || d > end) return;
    ensure(log.date).completed += 1;
  });

  return map;
};

// Clinic-wide adherence over a range, summing expected + completed across all patients.
export const calculateClinicAdherence = (patients, plans, phases, exerciseLogs, rangeStart, rangeEnd) => {
  let expected = 0;
  let completed = 0;
  patients.forEach((patient) => {
    const activePlan = plans.find((p) => p.patient_id === patient.id && p.status === 'active');
    if (!activePlan) return;
    const currentPhase = phases.find((ph) => ph.patient_id === patient.id && ph.status === 'active');
    const res = calculateRangeAdherence(
      activePlan,
      currentPhase,
      exerciseLogs.filter((l) => l.patient_id === patient.id),
      rangeStart,
      rangeEnd
    );
    expected += res.expected;
    completed += res.completed;
  });
  const rate = expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0;
  return { rate, expected, completed };
};