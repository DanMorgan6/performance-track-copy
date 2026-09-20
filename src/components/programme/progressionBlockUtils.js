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
