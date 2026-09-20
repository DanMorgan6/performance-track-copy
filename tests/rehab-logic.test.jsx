import { describe, expect, it } from 'vitest';
import {
  areExitCriteriaMet,
  createBasicDeliveryPhase,
  getPhaseStatus,
  getWeekScheduleForDate
} from '../src/components/plan/PhaseProgressionEngine.jsx';

describe('criteria-led phase progression', () => {
  it('never treats a phase without exit criteria as complete', () => {
    expect(areExitCriteriaMet({ exit_criteria: [] })).toBe(false);
  });

  it('only reports criteria met when every criterion is explicitly met', () => {
    expect(areExitCriteriaMet({
      exit_criteria: [{ is_met: true }, { is_met: false }]
    })).toBe(false);
    expect(areExitCriteriaMet({
      exit_criteria: [{ is_met: true }, { is_met: true }]
    })).toBe(true);
  });

  it('uses elapsed time only to request review, never to complete a phase', () => {
    const plan = { start_date: '2026-01-01', current_phase: 1 };
    const phase = {
      phase_number: 1,
      status: 'active',
      duration_weeks: 1,
      exit_criteria: [{ is_met: false }]
    };

    expect(getPhaseStatus(phase, plan, new Date('2026-01-20'))).toBe('review_due');
  });
});

describe('Quick Plan patient delivery', () => {
  const plan = {
    id: 'plan-1',
    title: 'Knee capacity',
    program_type: 'basic',
    start_date: '2026-01-05',
    basic_config: {
      days_of_week_pattern: ['Monday', 'Friday'],
      exercise_bundle: [{ name: 'Split squat', sets: 3, reps: '8' }]
    }
  };

  it('maps the selected days to training and the other days to rest', () => {
    const delivery = createBasicDeliveryPhase(plan);
    const monday = delivery.weeks[0].daily_schedule[0];
    const tuesday = delivery.weeks[0].daily_schedule[1];
    const friday = delivery.weeks[0].daily_schedule[4];

    expect(delivery.is_basic).toBe(true);
    expect(monday.type).toBe('training');
    expect(monday.exercises).toHaveLength(1);
    expect(tuesday.type).toBe('rest');
    expect(tuesday.exercises).toHaveLength(0);
    expect(friday.type).toBe('training');
  });

  it('repeats the weekly schedule without creating a clinical phase', () => {
    const delivery = createBasicDeliveryPhase(plan);
    const followingMonday = getWeekScheduleForDate(
      delivery,
      plan,
      new Date('2026-01-12')
    );

    expect(delivery.id).toBeNull();
    expect(followingMonday.week_number).toBe(1);
    expect(followingMonday.daily_schedule[0].day).toBe('Monday');
  });
});
