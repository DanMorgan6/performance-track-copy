import { describe, expect, it } from 'vitest';
import { buildProgressionSessionBlock, mergeProgressionExitCriteria } from '../src/components/programme/progressionBlockUtils';

describe('progression blocks', () => {
  it('creates an editable patient-specific exercise snapshot', () => {
    const master = {
      id: 'block-1',
      name: 'Calf Preparation',
    };
    const level = {
      level_number: 2,
      name: 'Level 2',
      exit_criteria: [{ criterion: '20 controlled single-leg raises' }],
      exercises: [{
        library_exercise_id: 'exercise-1',
        name: 'Single-leg calf raise',
        sets: '4',
        reps: '8',
        description: 'Controlled calf raise',
        video_url: 'https://example.com/calf.mov',
      }],
    };

    const result = buildProgressionSessionBlock(master, level, 1);

    expect(result.progression_block_id).toBe('block-1');
    expect(result.progression_level_number).toBe(2);
    expect(result.progression_exit_criteria).toEqual(['20 controlled single-leg raises']);
    expect(result.exercises[0]).toMatchObject({
      name: 'Single-leg calf raise',
      sets: '4',
      reps: '8',
      notes: 'Controlled calf raise',
    });

    result.exercises[0].sets = '5';
    expect(level.exercises[0].sets).toBe('4');
  });

  it('rejects an empty level', () => {
    expect(() => buildProgressionSessionBlock(
      { id: 'block-1', name: 'Calf Preparation' },
      { name: 'Level 1', exercises: [] },
      0
    )).toThrow('no exercises');
  });

  it('merges new block criteria into phase criteria without duplicates', () => {
    const existing = [{
      criterion: 'Pain <= 3',
      criterion_type: 'pain',
      operator: 'less_than_or_equal',
      target_value: '3',
      is_met: true,
    }];

    const result = mergeProgressionExitCriteria(existing, [
      ' pain <= 3 ',
      { criterion: '20 controlled single-leg raises' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(existing[0]);
    expect(result[1]).toEqual({
      criterion: '20 controlled single-leg raises',
      criterion_type: 'other',
      operator: 'clinician_confirmed',
      target_value: '',
      is_met: false,
    });
  });
});
