import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  calculateInternalSessionLoad,
  estimateSetStrength,
  summariseWorkingSets,
} from '../src/lib/trainingMetrics.js';
import {
  buildExerciseTrendGroups,
  buildInternalLoadSeries,
  buildReadinessSummary,
} from '../src/lib/trainingTrendData.js';

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

  it('creates distinct daily, seven-day and 28-day internal-load views', () => {
    const today = new Date().toISOString().slice(0, 10);
    const logs = [{ date: today, internal_session_load: 315, immediate_pain: 2, fatigue: 5, recovery: 7 }];

    expect(buildInternalLoadSeries(logs, 'daily').at(-1).value).toBe(315);
    expect(buildInternalLoadSeries(logs, 'weekly').at(-1).value).toBe(315);
    expect(buildInternalLoadSeries(logs, 'long').at(-1).value).toBe(315);
  });

  it('keeps exercise trend groups separate and builds a three-exposure strength trend', () => {
    const logs = [60, 62, 65].map((load, index) => ({
      date: `2026-09-${String(10 + index).padStart(2, '0')}`,
      exercise_name: 'Seated calf raise',
      exercise_key: 'seated calf raise | machine a',
      equipment: 'Machine A',
      side: 'left',
      load_unit: 'kg',
      movement_type: 'dynamic_external_load',
      working_sets: [
        { reps: 8, external_load: load, rir: 2, completed: true, technique_acceptable: true, rom_acceptable: true, pain_limited: false },
        { reps: 8, external_load: load, rir: 2, completed: true, technique_acceptable: true, rom_acceptable: true, pain_limited: false },
      ],
    }));

    const groups = buildExerciseTrendGroups(logs);
    expect(groups).toHaveLength(1);
    expect(groups[0].exposures).toHaveLength(3);
    expect(groups[0].exposures.at(-1).rollingStrength).toBeGreaterThan(groups[0].exposures[0].rollingStrength);
  });

  it('uses transparent readiness contributors rather than an automatic score', () => {
    const summary = buildReadinessSummary(
      [{ date: '2026-09-22', immediate_pain: 5, modified: true }],
      [
        { date: '2026-09-22', morning_symptoms: 5, fatigue: 8, recovery: 4, sleep_quality: 3 },
        { date: '2026-09-21', morning_symptoms: 4, fatigue: 8, recovery: 4, sleep_quality: 4 },
      ],
    );

    expect(summary.status).toBe('review');
    expect(summary.contributors).toContain('Fatigue 8.0/10');
    expect(summary.contributors.length).toBeGreaterThan(1);
  });

  it('adds patient capture and both patient and clinician dashboard views', () => {
    const dayDetail = readFileSync('src/components/patient/DayDetail.jsx', 'utf8');
    const exerciseForm = readFileSync('src/components/patient/ExercisePerformanceForm.jsx', 'utf8');
    const sessionForm = readFileSync('src/components/patient/PatientSessionSummary.jsx', 'utf8');
    const morningPrompt = readFileSync('src/components/patient/MorningCheckInPrompt.jsx', 'utf8');
    const portal = readFileSync('src/pages/PatientPortal.jsx', 'utf8');
    const dashboard = readFileSync('src/components/analytics/ResistanceTrainingDashboard.jsx', 'utf8');
    const charts = readFileSync('src/components/analytics/TrainingMonitoringCharts.jsx', 'utf8');
    const clinicianAnalytics = readFileSync('src/components/analytics/PatientAnalyticsTab.jsx', 'utf8');
    const patientInsights = readFileSync('src/pages/PatientInsights.jsx', 'utf8');

    expect(dayDetail).toContain('<ExercisePerformanceForm');
    expect(dayDetail).toContain('<PatientSessionSummary');
    expect(exerciseForm).toContain('Last time:');
    expect(exerciseForm).toContain('0 kg is recorded as bodyweight.');
    expect(exerciseForm).not.toContain('Equipment');
    expect(exerciseForm).toContain('Estimated Strength');
    expect(sessionForm).toContain('Internal Session Load');
    expect(sessionForm).not.toContain('next_morning_symptoms');
    expect(morningPrompt).toContain('Good morning — how are you today?');
    expect(morningPrompt).toContain('MorningCheckIn.create');
    expect(portal).toContain('<MorningCheckInPrompt patient={patient} />');
    expect(dashboard).toContain('Loads are never added across different exercises');
    expect(dashboard).toContain('exit criteria and clinician approval still control progression');
    expect(dashboard).toContain('<TrainingMonitoringCharts');
    expect(charts).toContain("['daily', 'Daily']");
    expect(charts).toContain("['weekly', '7-day']");
    expect(charts).toContain("['long', '28-day']");
    expect(charts).toContain('This is a transparent review prompt, not a readiness score.');
    expect(clinicianAnalytics).toContain('<ResistanceTrainingDashboard');
    expect(patientInsights).toContain('<ResistanceTrainingDashboard');
  });
});
