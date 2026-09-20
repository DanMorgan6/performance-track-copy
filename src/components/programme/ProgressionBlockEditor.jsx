import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { ArrowDown, ArrowUp, Dumbbell, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ExerciseLibraryPanel from '@/components/programme/ExerciseLibraryPanel';

const BODY_PARTS = ['ankle', 'knee', 'hip', 'lower_body', 'upper_body', 'shoulder', 'back', 'neck', 'core', 'full_body'];
const CATEGORIES = ['strength', 'flexibility', 'balance', 'cardiovascular', 'mobility', 'stability', 'coordination', 'plyometric', 'functional'];

const emptyLevel = (levelNumber = 1) => ({
  level_number: levelNumber,
  name: `Level ${levelNumber}`,
  description: '',
  exit_criteria: [],
  exercises: [],
});

function snapshotExercise(exercise) {
  return {
    library_exercise_id: exercise.id,
    name: exercise.name,
    description: exercise.description || '',
    sets: String(exercise.default_sets || 3),
    reps: exercise.default_reps || '10',
    tempo: '',
    rest: '60s',
    weight: '',
    hold: '',
    duration: '',
    notes: '',
    video_url: exercise.video_url || '',
    thumbnail_url: exercise.thumbnail_url || '',
  };
}

export default function ProgressionBlockEditor({ form, setForm, exercises, editingId, onSave, onCancel, savePending }) {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);

  const updateLevel = (levelIndex, updates) => {
    setForm(current => ({
      ...current,
      levels: current.levels.map((level, index) => index === levelIndex ? { ...level, ...updates } : level),
    }));
  };

  const addLevel = () => {
    setForm(current => ({
      ...current,
      levels: [...current.levels, emptyLevel(current.levels.length + 1)],
    }));
  };

  const removeLevel = levelIndex => {
    setForm(current => ({
      ...current,
      levels: current.levels
        .filter((_, index) => index !== levelIndex)
        .map((level, index) => ({ ...level, level_number: index + 1 })),
    }));
  };

  const moveLevel = (levelIndex, direction) => {
    const target = levelIndex + direction;
    if (target < 0 || target >= form.levels.length) return;
    setForm(current => {
      const levels = [...current.levels];
      [levels[levelIndex], levels[target]] = [levels[target], levels[levelIndex]];
      return { ...current, levels: levels.map((level, index) => ({ ...level, level_number: index + 1 })) };
    });
  };

  const addExerciseToLevel = (levelIndex, exercise) => {
    setForm(current => {
      const level = current.levels[levelIndex];
      if (!level || level.exercises?.some(item => item.library_exercise_id === exercise.id)) return current;
      const levels = current.levels.map((l, i) =>
        i === levelIndex ? { ...l, exercises: [...(l.exercises || []), snapshotExercise(exercise)] } : l
      );
      return { ...current, levels };
    });
  };

  const updateExercise = (levelIndex, exerciseIndex, field, value) => {
    const exercisesForLevel = [...(form.levels[levelIndex].exercises || [])];
    exercisesForLevel[exerciseIndex] = { ...exercisesForLevel[exerciseIndex], [field]: value };
    updateLevel(levelIndex, { exercises: exercisesForLevel });
  };

  const removeExercise = (levelIndex, exerciseIndex) => {
    updateLevel(levelIndex, {
      exercises: (form.levels[levelIndex].exercises || []).filter((_, index) => index !== exerciseIndex),
    });
  };

  const updateCriteria = (levelIndex, text) => {
    const exit_criteria = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(criterion => ({ criterion, target_value: '' }));
    updateLevel(levelIndex, { exit_criteria });
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId !== 'exercise-library') return;
    if (!destination.droppableId.startsWith('level-')) return;
    const levelIndex = parseInt(destination.droppableId.replace('level-', ''), 10);
    if (Number.isNaN(levelIndex)) return;
    const exercise = exercises.find(item => item.id === draggableId.replace('library-', ''));
    if (!exercise) return;
    addExerciseToLevel(levelIndex, exercise);
    setSelectedLevelIndex(levelIndex);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 lg:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8ff5f]">{editingId ? 'Edit block' : 'New block'}</p>
          <h2 className="mt-1 text-xl font-bold">{form.name || 'Untitled progression block'}</h2>
        </div>
        <button onClick={onCancel} className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Block name</Label>
          <Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Calf Preparation" className="border-white/10 bg-black/20 text-white" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Body area</Label>
            <select value={form.body_part} onChange={event => setForm({ ...form, body_part: event.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white">
              {BODY_PARTS.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white">
              {CATEGORIES.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Clinical purpose and intended use..." className="border-white/10 bg-black/20 text-white" />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="mt-7 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="h-[600px] lg:h-[680px]">
            <ExerciseLibraryPanel
              exercises={exercises}
              onAddExercise={(exercise) => { if (selectedLevelIndex !== null) addExerciseToLevel(selectedLevelIndex, exercise); }}
              selectedDayIndex={selectedLevelIndex}
            />
          </div>

          <div className="space-y-4">
            <p className="text-xs text-zinc-500">Drag exercises from the library into a level, or use the + Add button (select a level first).</p>

            {form.levels.map((level, levelIndex) => (
              <Droppable droppableId={`level-${levelIndex}`} key={levelIndex}>
                {(provided, snapshot) => (
                  <section
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => setSelectedLevelIndex(levelIndex)}
                    className={cn(
                      'rounded-2xl border bg-black/20 p-4 transition-colors',
                      selectedLevelIndex === levelIndex ? 'border-[#d8ff5f]/40' : 'border-white/10',
                      snapshot.isDraggingOver && 'border-[#d8ff5f] bg-[#d8ff5f]/5'
                    )}
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#d8ff5f] px-2.5 py-1 text-xs font-bold text-zinc-950">Level {levelIndex + 1}</span>
                      <Input value={level.name || ''} onChange={event => updateLevel(levelIndex, { name: event.target.value })} className="h-9 min-w-48 flex-1 border-white/10 bg-white/5 text-white" />
                      <Button type="button" onClick={() => moveLevel(levelIndex, -1)} disabled={levelIndex === 0} size="icon" variant="ghost" className="text-zinc-400"><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" onClick={() => moveLevel(levelIndex, 1)} disabled={levelIndex === form.levels.length - 1} size="icon" variant="ghost" className="text-zinc-400"><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" onClick={() => removeLevel(levelIndex)} disabled={form.levels.length === 1} size="icon" variant="ghost" className="text-rose-400"><Trash2 className="h-4 w-4" /></Button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Level description</Label>
                        <Textarea value={level.description || ''} onChange={event => updateLevel(levelIndex, { description: event.target.value })} placeholder="What changes at this level?" className="border-white/10 bg-white/5 text-white" rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Exit criteria — one per line</Label>
                        <Textarea value={(level.exit_criteria || []).map(item => item.criterion).join('\n')} onChange={event => updateCriteria(levelIndex, event.target.value)} placeholder={"Pain ≤ 3/10 during session\n24-hour response acceptable\nTarget strength achieved"} className="border-white/10 bg-white/5 text-white" rows={3} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Label>Exercises ({(level.exercises || []).length})</Label>
                      </div>

                      {(level.exercises || []).length === 0 ? (
                        <div className={cn(
                          'rounded-xl border border-dashed py-8 text-center text-xs',
                          snapshot.isDraggingOver ? 'border-[#d8ff5f] text-[#d8ff5f]' : 'border-white/10 text-zinc-500'
                        )}>
                          Drop exercises here to add to this level.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(level.exercises || []).map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 md:grid-cols-[minmax(180px,1fr)_80px_110px_90px_40px] md:items-end">
                              <div>
                                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-white"><Dumbbell className="h-3.5 w-3.5 text-[#d8ff5f]" />{exercise.name}</p>
                                <Input value={exercise.notes || ''} onChange={event => updateExercise(levelIndex, exerciseIndex, 'notes', event.target.value)} placeholder="Level-specific cue or note" className="h-8 border-white/10 bg-black/20 text-xs text-white" />
                              </div>
                              <div><Label className="text-[10px]">Sets</Label><Input value={exercise.sets || ''} onChange={event => updateExercise(levelIndex, exerciseIndex, 'sets', event.target.value)} className="h-8 border-white/10 bg-black/20 text-xs text-white" /></div>
                              <div><Label className="text-[10px]">Reps/time</Label><Input value={exercise.reps || ''} onChange={event => updateExercise(levelIndex, exerciseIndex, 'reps', event.target.value)} className="h-8 border-white/10 bg-black/20 text-xs text-white" /></div>
                              <div><Label className="text-[10px]">Rest</Label><Input value={exercise.rest || ''} onChange={event => updateExercise(levelIndex, exerciseIndex, 'rest', event.target.value)} className="h-8 border-white/10 bg-black/20 text-xs text-white" /></div>
                              <Button type="button" onClick={() => removeExercise(levelIndex, exerciseIndex)} size="icon" variant="ghost" className="text-rose-400"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {provided.placeholder}
                  </section>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <Button type="button" onClick={addLevel} variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white"><Plus className="mr-2 h-4 w-4" /> Add level</Button>
        <div className="flex gap-2">
          <Button type="button" onClick={onCancel} variant="ghost" className="rounded-xl text-zinc-300">Cancel</Button>
          <Button type="button" onClick={onSave} disabled={!form.name.trim() || form.levels.some(level => !(level.exercises || []).length) || savePending} className="rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c8ef50]">
            <Save className="mr-2 h-4 w-4" /> {savePending ? 'Saving…' : 'Save block'}
          </Button>
        </div>
      </div>
    </div>
  );
}