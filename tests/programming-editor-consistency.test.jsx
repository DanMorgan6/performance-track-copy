import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('rehabilitation programming consistency', () => {
  it('uses the shared programming editors when an existing patient plan is edited', () => {
    const editPlan = readFileSync('src/pages/EditPlan.jsx', 'utf8');

    expect(editPlan).toContain("import ProgrammeScheduleEditor");
    expect(editPlan).toContain("import BasicProgramBuilder");
    expect(editPlan).toContain("<ProgrammeScheduleEditor");
    expect(editPlan).toContain("<BasicProgramBuilder");
    expect(editPlan).toContain("progressionBlocks={progressionBlocks}");
    expect(editPlan).toContain('className="performance-shell');
  });

  it('rehydrates and saves the complete weekly programme structure', () => {
    const editPlan = readFileSync('src/pages/EditPlan.jsx', 'utf8');

    expect(editPlan).toContain('function normalizePhase');
    expect(editPlan).toContain('weeks: phase.weeks || []');
    expect(editPlan).toContain("daily_schedule: phase.weeks?.[0]?.daily_schedule");
    expect(editPlan).toContain('use_daily_schedule: true');
    expect(editPlan).toContain('removedPhaseIds');
  });

  it('keeps phase duration and Quick Plan day selections synchronized', () => {
    const createPlan = readFileSync('src/pages/CreatePlan.jsx', 'utf8');
    const basicBuilder = readFileSync('src/components/plan/BasicProgramBuilder.jsx', 'utf8');

    expect(createPlan).toContain("if (field === 'duration_weeks')");
    expect(createPlan).toContain('updatedPhase.weeks = updatedPhase.weeks.slice(0, duration)');
    expect(createPlan).not.toContain("field === 'duration_weeks' && value !== newPhases[index].duration_weeks");
    expect(basicBuilder).toContain('planData.basic_config?.days_of_week_pattern');
    expect(basicBuilder).toContain('setSelectedDays(savedDays)');
  });
});
