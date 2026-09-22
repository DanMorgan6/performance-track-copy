const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parsePrescriptionReps = (value) => {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

export const rirToRpe = (rir) => Math.max(0, 10 - Math.min(4, toNumber(rir)));

export const estimatedStrengthConfidence = (set) => {
  const reps = toNumber(set.reps);
  const rir = toNumber(set.rir);
  const technicallyValid = set.technique_acceptable !== false && set.rom_acceptable !== false;
  const clinicallyValid = technicallyValid && !set.pain_limited;

  if (clinicallyValid && reps >= 3 && reps <= 8 && rir >= 0 && rir <= 2) return 'high';
  if (clinicallyValid && reps >= 3 && reps <= 10 && rir >= 0 && rir <= 3) return 'moderate';
  return 'low';
};

export const estimateSetStrength = (set) => {
  const load = toNumber(set.external_load);
  const reps = toNumber(set.reps);
  const rir = toNumber(set.rir);
  const confidence = estimatedStrengthConfidence(set);
  const hasMeasurableLoad = load > 0;
  const validForTrend = hasMeasurableLoad
    && reps >= 3
    && reps <= 10
    && rir <= 3
    && set.technique_acceptable !== false
    && set.rom_acceptable !== false
    && !set.pain_limited;

  return {
    value: hasMeasurableLoad && reps > 0 ? load * (1 + ((reps + rir) / 30)) : null,
    confidence,
    validForTrend,
  };
};

export const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const summariseWorkingSets = (workingSets = [], movementType = 'dynamic_external_load') => {
  const completedSets = workingSets.filter((set) => set.completed !== false);
  const volumeLoad = movementType === 'dynamic_external_load'
    ? completedSets.reduce((sum, set) => sum + (toNumber(set.reps) * toNumber(set.external_load)), 0)
    : 0;
  const hardSets = completedSets.filter((set) => {
    const rir = toNumber(set.rir);
    const rpe = set.set_rpe == null || set.set_rpe === '' ? rirToRpe(rir) : toNumber(set.set_rpe);
    return rpe >= 7 || rir <= 3;
  }).length;

  const estimates = movementType === 'dynamic_external_load'
    ? completedSets
      .map(estimateSetStrength)
      .filter((estimate) => estimate.validForTrend)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
    : [];

  const estimateValue = median(estimates.map((estimate) => estimate.value));
  const confidenceRank = { high: 3, moderate: 2, low: 1 };
  const estimateConfidence = estimates.length
    ? estimates.reduce(
      (lowest, estimate) => confidenceRank[estimate.confidence] < confidenceRank[lowest] ? estimate.confidence : lowest,
      'high',
    )
    : 'not_eligible';

  return {
    volume_load: Math.round(volumeLoad * 10) / 10,
    hard_sets: hardSets,
    estimated_strength: estimateValue == null ? undefined : Math.round(estimateValue * 10) / 10,
    estimated_strength_confidence: estimateConfidence,
  };
};

export const exerciseComparisonKey = (log) => [
  log.exercise_key || log.exercise_name || 'Exercise',
  log.exercise_variation || '',
  log.equipment || '',
  log.setup || '',
  log.side || 'not_applicable',
  log.load_unit || 'kg',
].map((part) => String(part).trim().toLowerCase()).join('|');

export const calculateInternalSessionLoad = (durationMinutes, sessionRpe) => (
  Math.round(toNumber(durationMinutes) * toNumber(sessionRpe))
);

export const average = (values) => {
  const valid = values.map(toNumber).filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export const percentChange = (current, previous) => {
  const currentValue = toNumber(current);
  const previousValue = toNumber(previous);
  if (!previousValue) return null;
  return ((currentValue - previousValue) / previousValue) * 100;
};
