import { average, exerciseComparisonKey, summariseWorkingSets } from './trainingMetrics';

const DAY_MS = 24 * 60 * 60 * 1000;

const asDate = (value) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (date) => date.toISOString().slice(0, 10);

const startOfWeek = (value) => {
  const date = typeof value === 'string' ? asDate(value) : new Date(value);
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return dateKey(date);
};

const formatShortDate = (value) => {
  const date = asDate(value);
  return date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : value;
};

const meanOrNull = (values) => {
  const valid = values.map(Number).filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export const logSummary = (log) => {
  if (log.working_sets?.length) return summariseWorkingSets(log.working_sets, log.movement_type);
  const reps = Number.parseFloat(log.reps_completed) || 0;
  return {
    volume_load: Number(log.volume_load) || ((Number(log.sets_completed) || 0) * reps * (Number(log.weight) || 0)),
    hard_sets: Number(log.hard_sets) || 0,
    estimated_strength: Number(log.estimated_strength) || undefined,
    estimated_strength_confidence: log.estimated_strength_confidence || 'not_eligible',
  };
};

export const buildDailySessionSeries = (sessionLogs = [], days = 84) => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today.getTime() - ((days - 1) * DAY_MS));
  const byDate = new Map();

  sessionLogs.forEach((session) => {
    const date = asDate(session.date);
    if (!date || date < start || date > today) return;
    const key = dateKey(date);
    const current = byDate.get(key) || [];
    current.push(session);
    byDate.set(key, current);
  });

  const rows = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start.getTime() + (index * DAY_MS));
    const key = dateKey(date);
    const sessions = byDate.get(key) || [];
    const load = sessions.reduce((sum, session) => sum + (Number(session.internal_session_load) || 0), 0);
    rows.push({
      date: key,
      label: formatShortDate(key),
      sessionLoad: load,
      immediatePain: meanOrNull(sessions.map((session) => session.immediate_pain)),
      nextMorning: meanOrNull(sessions.map((session) => session.next_morning_symptoms)),
      fatigue: meanOrNull(sessions.map((session) => session.fatigue)),
      recovery: meanOrNull(sessions.map((session) => session.recovery)),
      sessions: sessions.length,
    });
  }

  return rows.map((row, index) => ({
    ...row,
    rolling7: rows.slice(Math.max(0, index - 6), index + 1).reduce((sum, item) => sum + item.sessionLoad, 0),
    rolling28: rows.slice(Math.max(0, index - 27), index + 1).reduce((sum, item) => sum + item.sessionLoad, 0),
  }));
};

export const buildInternalLoadSeries = (sessionLogs = [], view = 'daily') => {
  const daily = buildDailySessionSeries(sessionLogs, 84);

  if (view === 'daily') {
    return daily.slice(-14).map((row) => ({ ...row, value: row.sessionLoad }));
  }

  if (view === 'weekly') {
    const weeks = new Map();
    daily.forEach((row) => {
      const week = startOfWeek(row.date);
      const current = weeks.get(week) || { date: week, value: 0, sessions: 0 };
      current.value += row.sessionLoad;
      current.sessions += row.sessions;
      weeks.set(week, current);
    });
    return [...weeks.values()].slice(-10).map((row) => ({ ...row, label: formatShortDate(row.date) }));
  }

  return daily
    .filter((_, index) => index % 7 === 6)
    .slice(-10)
    .map((row) => ({ ...row, value: row.rolling28 }));
};

export const buildResponseSeries = (sessionLogs = []) => [...sessionLogs]
  .filter((session) => session.date)
  .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  .slice(-14)
  .map((session) => ({
    date: session.date,
    label: formatShortDate(session.date),
    immediatePain: session.immediate_pain == null ? null : Number(session.immediate_pain),
    nextMorning: session.next_morning_symptoms == null ? null : Number(session.next_morning_symptoms),
    fatigue: session.fatigue == null ? null : Number(session.fatigue),
    recovery: session.recovery == null ? null : Number(session.recovery),
  }));

export const buildExerciseTrendGroups = (exerciseLogs = []) => {
  const groups = new Map();

  exerciseLogs.forEach((rawLog) => {
    const log = { ...rawLog, summary: logSummary(rawLog) };
    const key = exerciseComparisonKey(log);
    const group = groups.get(key) || {
      key,
      name: log.exercise_name || 'Exercise',
      side: log.side || 'not_applicable',
      unit: log.load_unit || 'kg',
      equipment: log.equipment || '',
      variation: log.exercise_variation || '',
      logs: [],
    };
    group.logs.push(log);
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => {
    const logs = [...group.logs].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const weeks = new Map();
    logs.forEach((log) => {
      const week = startOfWeek(log.date);
      const current = weeks.get(week) || { date: week, volumeLoad: 0, hardSets: 0 };
      current.volumeLoad += Number(log.summary.volume_load) || 0;
      current.hardSets += Number(log.summary.hard_sets) || 0;
      weeks.set(week, current);
    });

    const exposures = logs
      .filter((log) => Number(log.summary.estimated_strength) > 0)
      .map((log, index, all) => {
        const window = all.slice(Math.max(0, index - 2), index + 1);
        return {
          date: log.date,
          label: formatShortDate(log.date),
          estimatedStrength: Number(log.summary.estimated_strength),
          rollingStrength: average(window.map((item) => Number(item.summary.estimated_strength))),
          confidence: log.summary.estimated_strength_confidence,
        };
      });

    return {
      ...group,
      weekly: [...weeks.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
        .map((row) => ({ ...row, label: formatShortDate(row.date) })),
      exposures: exposures.slice(-12),
      latestDate: logs.at(-1)?.date || '',
    };
  }).sort((a, b) => String(b.latestDate).localeCompare(String(a.latestDate)));
};

export const buildReadinessSummary = (sessionLogs = []) => {
  const recent = [...sessionLogs]
    .filter((session) => session.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);

  if (recent.length < 2) {
    return {
      status: 'insufficient',
      label: 'Insufficient information',
      detail: 'At least two recent session responses are needed before interpreting readiness.',
      contributors: [],
    };
  }

  const contributors = [];
  const avgPain = meanOrNull(recent.flatMap((session) => [session.immediate_pain, session.next_morning_symptoms]).filter((value) => value != null));
  const avgFatigue = meanOrNull(recent.map((session) => session.fatigue).filter((value) => value != null));
  const avgRecovery = meanOrNull(recent.map((session) => session.recovery).filter((value) => value != null));
  const modified = recent.some((session) => session.modified || session.completion_status === 'stopped');

  if (avgPain != null && avgPain > 3) contributors.push(`Pain response ${avgPain.toFixed(1)}/10`);
  if (avgFatigue != null && avgFatigue >= 8) contributors.push(`Fatigue ${avgFatigue.toFixed(1)}/10`);
  if (avgRecovery != null && avgRecovery < 5) contributors.push(`Recovery ${avgRecovery.toFixed(1)}/10`);
  if (modified) contributors.push('Recent session modified or stopped');

  if (contributors.length) {
    return {
      status: 'review',
      label: 'Review suggested',
      detail: 'One or more recent responses may warrant clinical review before increasing load.',
      contributors,
    };
  }

  return {
    status: 'responding',
    label: 'Responding well',
    detail: 'Recent recorded responses are stable. This does not confirm phase readiness.',
    contributors: ['No recent response threshold exceeded'],
  };
};
