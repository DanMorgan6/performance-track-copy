import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyPlanMode,
  getMonitoringLevel,
  getPlanMode,
  isMorningCheckInEnabled,
  resolveExerciseTrackingMode,
} from '../src/lib/planModes.js';

describe('plan modes and proportional monitoring', () => {
  it('maps the three clinician choices to the correct structure and monitoring', () => {
    expect(applyPlanMode({}, 'basic')).toMatchObject({
      program_type: 'basic',
      plan_mode: 'basic',
      monitoring_level: 'basic',
      morning_check_in_enabled: false,
    });
    expect(applyPlanMode({}, 'phased')).toMatchObject({
      program_type: 'phased',
      monitoring_level: 'standard',
      morning_check_in_enabled: false,
    });
    expect(applyPlanMode({}, 'performance')).toMatchObject({
      program_type: 'phased',
      monitoring_level: 'performance',
      morning_check_in_enabled: true,
    });
  });

  it('keeps legacy plans compatible and allows per-exercise overrides', () => {
    expect(getPlanMode({ program_type: 'basic' })).toBe('basic');
    expect(getPlanMode({ program_type: 'phased' })).toBe('phased');
    expect(getMonitoringLevel({ plan_mode: 'performance' })).toBe('performance');
    expect(isMorningCheckInEnabled({ plan_mode: 'performance' })).toBe(true);
    expect(resolveExerciseTrackingMode(
      { tracking_mode: 'basic' },
      { plan_mode: 'performance', monitoring_level: 'performance' },
    )).toBe('basic');
  });

  it('shows three plan choices while keeping AI inside each workflow', () => {
    const selector = readFileSync('src/components/plan/ProgramTypeSelector.jsx', 'utf8');
    const createPlan = readFileSync('src/pages/CreatePlan.jsx', 'utf8');

    expect(selector).toContain("id: 'basic'");
    expect(selector).toContain("id: 'phased'");
    expect(selector).toContain("id: 'performance'");
    expect(selector).not.toContain("id: 'ai_assisted'");
    expect(createPlan).toContain('AI Generate');
    expect(createPlan).toContain("setCreationMode('ai_assisted')");
    expect(createPlan).toContain('Never use elapsed time alone to progress a phase.');
    expect(createPlan).toContain('Prefer exact exercise names from the clinic library');
  });

  it('changes patient capture according to the plan and exercise monitoring level', () => {
    const portal = readFileSync('src/pages/PatientPortal.jsx', 'utf8');
    const dayDetail = readFileSync('src/components/patient/DayDetail.jsx', 'utf8');

    expect(portal).toContain('isMorningCheckInEnabled(activePlan)');
    expect(dayDetail).toContain("trackingMode === 'basic'");
    expect(dayDetail).toContain('quickCompleteExercise(exercise)');
    expect(dayDetail).toContain('<StandardExerciseCompletionForm');
    expect(dayDetail).toContain('<ExercisePerformanceForm');
    expect(dayDetail).toContain("getMonitoringLevel(plan) === 'performance'");
  });
});
