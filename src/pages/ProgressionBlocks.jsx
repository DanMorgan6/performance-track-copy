import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Dumbbell, Layers3, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isPractitioner } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const BODY_PARTS = ['ankle', 'knee', 'hip', 'lower_body', 'upper_body', 'shoulder', 'back', 'neck', 'core', 'full_body'];
const CATEGORIES = ['strength', 'flexibility', 'balance', 'cardiovascular', 'mobility', 'stability', 'coordination', 'plyometric', 'functional'];

const emptyLevel = (levelNumber = 1) => ({
  level_number: levelNumber,
  name: `Level ${levelNumber}`,
  description: '',
  exit_criteria: [],
  exercises: [],
});

const emptyForm = () => ({
  name: '',
  description: '',
  body_part: 'lower_body',
  category: 'strength',
  levels: [emptyLevel(1)],
  is_active: true,
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

export default function ProgressionBlocks() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
        return;
      }
      setUser(currentUser);
    });
  }, []);

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library', user?.clinic_id],
    queryFn: () => base44.entities.ExerciseLibrary.filter({ clinic_id: user.clinic_id }, 'name'),
    enabled: !!user?.clinic_id,
  });

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['progression-blocks', user?.clinic_id],
    queryFn: () => base44.entities.ProgressionBlock.filter({ clinic_id: user.clinic_id }, 'name'),
    enabled: !!user?.clinic_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        clinic_id: user.clinic_id,
        created_by_clinician: user.email,
        levels: form.levels.map((level, index) => ({
          ...level,
          level_number: index + 1,
          name: level.name || `Level ${index + 1}`,
        })),
      };
      return editingId
        ? base44.entities.ProgressionBlock.update(editingId, payload)
        : base44.entities.ProgressionBlock.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-blocks'] });
      setForm(emptyForm());
      setEditingId(null);
      setShowEditor(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.ProgressionBlock.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progression-blocks'] }),
  });

  const filteredBlocks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return blocks;
    return blocks.filter(block =>
      block.name?.toLowerCase().includes(term) ||
      block.description?.toLowerCase().includes(term) ||
      block.body_part?.toLowerCase().includes(term)
    );
  }, [blocks, search]);

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowEditor(true);
  };

  const startEdit = block => {
    setEditingId(block.id);
    setForm({
      name: block.name || '',
      description: block.description || '',
      body_part: block.body_part || 'lower_body',
      category: block.category || 'strength',
      levels: block.levels?.length ? JSON.parse(JSON.stringify(block.levels)) : [emptyLevel(1)],
      is_active: block.is_active !== false,
    });
    setShowEditor(true);
  };

  const duplicate = block => {
    setEditingId(null);
    setForm({
      name: `${block.name} (Copy)`,
      description: block.description || '',
      body_part: block.body_part || 'lower_body',
      category: block.category || 'strength',
      levels: JSON.parse(JSON.stringify(block.levels || [emptyLevel(1)])),
      is_active: true,
    });
    setShowEditor(true);
  };

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

  const addExercise = (levelIndex, exerciseId) => {
    const exercise = exercises.find(item => item.id === exerciseId);
    if (!exercise) return;
    const level = form.levels[levelIndex];
    if (level.exercises?.some(item => item.library_exercise_id === exerciseId)) return;
    updateLevel(levelIndex, { exercises: [...(level.exercises || []), snapshotExercise(exercise)] });
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

  return (
    <div className="performance-shell min-h-screen bg-[#171719] px-4 py-6 text-zinc-100 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('ExerciseLibrary')} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff5f]">Reusable programming</p>
              <h1 className="text-2xl font-bold">Progression Blocks</h1>
              <p className="mt-1 text-sm text-zinc-400">Group exercises into criteria-led levels, then insert them into any phase or week.</p>
            </div>
          </div>
          <Button onClick={startNew} className="rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c8ef50]">
            <Plus className="mr-2 h-4 w-4" /> New progression block
          </Button>
        </div>

        {!showEditor ? (
          <>
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search progression blocks..." className="border-white/10 bg-black/20 pl-9 text-white" />
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-zinc-500">Loading progression blocks…</div>
            ) : filteredBlocks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
                <Layers3 className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
                <h2 className="font-semibold text-white">No progression blocks yet</h2>
                <p className="mt-2 text-sm text-zinc-500">Create a reusable sequence such as Calf Preparation with Level 1, Level 2 and Level 3.</p>
                <Button onClick={startNew} variant="outline" className="mt-5 rounded-xl border-white/15 bg-white/5 text-white">
                  Create your first block
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredBlocks.map(block => (
                  <article key={block.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#d8ff5f]/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-[#d8ff5f]">{block.body_part?.replace('_', ' ')}</span>
                          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-300">{block.category}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white">{block.name}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{block.description || 'No description added.'}</p>
                      </div>
                      <Layers3 className="h-5 w-5 shrink-0 text-zinc-500" />
                    </div>
                    <div className="space-y-2">
                      {(block.levels || []).map((level, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-zinc-200">{level.name || `Level ${index + 1}`}</p>
                            <p className="text-[10px] text-zinc-500">{level.exercises?.length || 0} exercises · {level.exit_criteria?.length || 0} criteria</p>
                          </div>
                          <span className="text-xs font-bold text-[#d8ff5f]">L{index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button onClick={() => startEdit(block)} size="sm" className="flex-1 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200">Edit</Button>
                      <Button onClick={() => duplicate(block)} size="icon" variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white"><Copy className="h-4 w-4" /></Button>
                      <Button onClick={() => { if (window.confirm(`Delete “${block.name}”? Existing patient plans will not be affected.`)) deleteMutation.mutate(block.id); }} size="icon" variant="outline" className="rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 lg:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8ff5f]">{editingId ? 'Edit block' : 'New block'}</p>
                <h2 className="mt-1 text-xl font-bold">{form.name || 'Untitled progression block'}</h2>
              </div>
              <button onClick={() => setShowEditor(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
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

            <div className="mt-7 space-y-4">
              {form.levels.map((level, levelIndex) => (
                <section key={levelIndex} className="rounded-2xl border border-white/10 bg-black/20 p-4">
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
                      <Label>Exercises</Label>
                      <select defaultValue="" onChange={event => { addExercise(levelIndex, event.target.value); event.target.value = ''; }} className="h-9 max-w-xs rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-white">
                        <option value="">+ Add from exercise library</option>
                        {exercises.map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                      </select>
                    </div>

                    {(level.exercises || []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-zinc-500">No exercises added to this level.</div>
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
                </section>
              ))}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <Button type="button" onClick={addLevel} variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white"><Plus className="mr-2 h-4 w-4" /> Add level</Button>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setShowEditor(false)} variant="ghost" className="rounded-xl text-zinc-300">Cancel</Button>
                <Button type="button" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || form.levels.some(level => !(level.exercises || []).length) || saveMutation.isPending} className="rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c8ef50]">
                  <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? 'Saving…' : 'Save block'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}