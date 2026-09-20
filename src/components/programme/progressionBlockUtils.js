export function mergeProgressionExitCriteria(existingCriteria = [], additionalCriteria = []) {
  const normalized = new Set(
    existingCriteria
      .map(item => item?.criterion?.trim().toLowerCase())
      .filter(Boolean)
  );
  const additions = additionalCriteria
    .map(item => typeof item === 'string' ? item : item?.criterion)
    .map(criterion => criterion?.trim())
    .filter(criterion => criterion && !normalized.has(criterion.toLowerCase()))
    .map(criterion => {
      normalized.add(criterion.toLowerCase());
      return {
        criterion,
        criterion_type: 'other',
        operator: 'clinician_confirmed',
        target_value: '',
        is_met: false,
      };
    });
  return [...existingCriteria, ...additions];
}

export function buildProgressionSessionBlock(progressionBlock, level, levelIndex = 0) {
  if (!progressionBlock?.id || !progressionBlock?.name) {
    throw new Error('A saved progression block is required.');
  }
  if (!(level?.exercises || []).length) {
    throw new Error('The selected progression level has no exercises.');
  }

  const levelNumber = level.level_number || levelIndex + 1;
  const levelName = level.name || `Level ${levelNumber}`;

  return {
    type: 'straight',
    source_type: 'progression_block',
    progression_block_id: progressionBlock.id,
    progression_block_name: progressionBlock.name,
    progression_level_number: levelNumber,
    progression_level_name: levelName,
    progression_exit_criteria: (level.exit_criteria || []).map(item => item.criterion).filter(Boolean),
    exercises: level.exercises.map(exercise => ({
      library_exercise_id: exercise.library_exercise_id || '',
      name: exercise.name || '',
      description: exercise.description || '',
      sets: String(exercise.sets || 3),
      reps: exercise.reps || '10',
      tempo: exercise.tempo || '',
      rest: exercise.rest || '60s',
      weight: exercise.weight || '',
      hold: exercise.hold || '',
      duration: exercise.duration || '',
      notes: exercise.notes || exercise.description || '',
      video_url: exercise.video_url || '',
      thumbnail_url: exercise.thumbnail_url || '',
    })),
    rest_after: '',
    note: `${progressionBlock.name} · ${levelName}`,
  };
}
