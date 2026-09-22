import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  calculateInternalSessionLoad,
  estimateSetStrength,
  summariseWorkingSets,
} from '../src/lib/trainingMetrics.js';

describe('rehabilitation training monitoring', () => {
  it('calculates RIR-adjusted Estimated Strength with confidence and validity', () => {
    const estimate = estimateSetStrength({
      reps: 8,
      external_load: 60,
      rir: 2,
      technique_acceptable: true,
      rom_acceptable: true,
      pain_limited: false,
    });

    expect(estimate.value).toBeCloseTo(80, 5);
    expect(estimate.confidence).toBe('high');
    expect(estimate.validForTrend).toBe(true);
  });

  it('excludes pain-limited and technically altered sets from the strength trend', () => {
    const summary = summariseWorkingSets([
      { reps: 8, external_load: 60, rir: 2, completed: true, technique_acceptable: true, rom_acceptable: true, pain_limited: false },
      { reps: 8, external_load: 100, rir: 1, completed: true, technique_acceptable: true, rom_acceptable: true, pain_limited: true },
      { reps: 8, external_load: 62, rir: 2, completed: true, technique_acceptable: true, rom_acceptable: true, pain_limited: false },
    ]);

    expect(summary.estimated_strength).toBeCloseTo(81.3, 1);
    expect(summary.estimated_strength_confidence).toBe('high');
  });

  it('keeps volume load and internal session load as separate calculations', () => {
    const summary = summariseWorkingSets([
      { reps: 8, external_load: 60, rir: 2, completed: true },
      { reps: 8, external_load: 60, rir: 2, completed: true },
      { reps: 8, external_load: 60, rir: 2, completed: true },
    ]);

    expect(summary.volume_load).toBe(1440);
    expect(summary.hard_sets).toBe(3);
    expect(calculateInternalSessionLoad(45, 7)).toBe(315);
  });

  it('adds patient capture and both patient and clinician dashboard views', () => {
    const dayDetail = readFileSync('src/components/patient/DayDetail.jsx', 'utf8');
    const exerciseForm = readFileSync('src/components/patient/ExercisePerformanceForm.jsx', 'utf8');
    const sessionForm = readFileSync('src/components/patient/PatientSessionSummary.jsx', 'utf8');
    const dashboard = readFileSync('src/components/analytics/ResistanceTrainingDashboard.jsx', 'utf8');
    const clinicianAnalytics = readFileSync('src/components/analytics/PatientAnalyticsTab.jsx', 'utf8');
    const patientInsights = readFileSync('src/pages/PatientInsights.jsx', 'utf8');

    expect(dayDetail).toContain('<ExercisePerformanceForm');
    expect(dayDetail).toContain('<PatientSessionSummary');
    expect(exerciseForm).toContain('How many more good-quality repetitions');
    expect(exerciseForm).toContain('Estimated Strength');
    expect(sessionForm).toContain('Internal Session Load');
    expect(sessionForm).toContain('next_morning_symptoms');
    expect(dashboard).toContain('Loads are never added across different exercises');
    expect(dashboard).toContain('exit criteria and clinician approval still control progression');
    expect(clinicianAnalytics).toContain('<ResistanceTrainingDashboard');
    expect(patientInsights).toContain('<ResistanceTrainingDashboard');
  });
});
