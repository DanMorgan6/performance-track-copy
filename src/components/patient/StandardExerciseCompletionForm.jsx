import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, History, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parsePrescriptionReps } from '@/lib/trainingMetrics';

const createSet = (index, exercise) => ({
  set_number: index + 1,
  completed: true,
  reps: parsePrescriptionReps(exercise?.reps),
  external_load: Number.parseFloat(exercise?.weight) || 0,
  technique_acceptable: true,
  rom_acceptable: true,
  pain_limited: false,
});

export default function StandardExerciseCompletionForm({ exercise, patient, onSubmit, isSaving = false }) {
  const count = Math.min(10, Math.max(1, Number(exercise?.sets) || 1));
  const [sets, setSets] = useState(Array.from({ length: count }, (_, index) => createSet(index, exercise)));
  const [painDuring, setPainDuring] = useState(0);
  const [modified, setModified] = useState(false);
  const [reason, setReason] = useState('');
  const hydrated = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['previous-standard-exercise', patient?.clinic_id, patient?.id, exercise?.name],
    queryFn: () => base44.entities.ExerciseLog.filter({
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      exercise_name: exercise.name,
    }, '-date', 10),
    enabled: Boolean(patient?.clinic_id && patient?.id && exercise?.name),
  });

  const previous = history.find((entry) => entry.date < today) || history[0] || null;
  const previousSets = (previous?.working_sets || []).filter((set) => set.completed !== false);

  useEffect(() => {
    if (!previousSets.length || hydrated.current) return;
    hydrated.current = true;
    setSets((current) => current.map((set, index) => {
      const prior = previousSets[index] || previousSets[0];
      return prior ? {
        ...set,
        reps: Number(prior.reps) || set.reps,
        external_load: Number(prior.external_load) || 0,
      } : set;
    }));
  }, [previous]);

  const updateSet = (index, field, value) => {
    setSets((current) => current.map((set, itemIndex) => itemIndex === index ? { ...set, [field]: value } : set));
  };

  const removeSet = (index) => {
    setSets((current) => current
      .filter((_, itemIndex) => itemIndex !== index)
      .map((set, itemIndex) => ({ ...set, set_number: itemIndex + 1 })));
  };

  const addSet = () => {
    const prior = sets.at(-1);
    setSets((current) => [...current, {
      ...createSet(current.length, exercise),
      reps: prior?.reps ?? parsePrescriptionReps(exercise?.reps),
      external_load: prior?.external_load ?? 0,
    }]);
  };

  const save = () => {
    const completed = sets.filter((set) => set.completed !== false);
    const hasLoad = completed.some((set) => Number(set.external_load) > 0);
    const volume = completed.reduce((sum, set) => sum + ((Number(set.reps) || 0) * (Number(set.external_load) || 0)), 0);
    const totalReps = completed.reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
    const averageLoad = completed.length
      ? completed.reduce((sum, set) => sum + (Number(set.external_load) || 0), 0) / completed.length
      : 0;

    onSubmit({
      exercise_name: exercise?.name,
      exercise_key: [exercise?.name, exercise?.side || 'not_applicable'].join(' | '),
      movement_type: hasLoad ? 'dynamic_external_load' : 'bodyweight',
      side: exercise?.side || 'not_applicable',
      load_unit: hasLoad ? 'kg' : 'bodyweight',
      working_sets: completed.map((set, index) => ({
        ...set,
        set_number: index + 1,
        reps: Number(set.reps) || 0,
        external_load: Number(set.external_load) || 0,
        pain_limited: set.pain_limited === true,
      })),
      planned_sets: Number(exercise?.sets) || count,
      planned_reps: exercise?.reps || '',
      planned_weight: exercise?.weight || '',
      sets_completed: completed.length,
      reps_completed: String(totalReps),
      weight: averageLoad,
      volume_load: volume,
      hard_sets: 0,
      estimated_strength_confidence: 'not_eligible',
      pain_during: Number(painDuring) || 0,
      pain_limited: completed.some((set) => set.pain_limited),
      technique_acceptable: true,
      rom_acceptable: true,
      modified,
      modification_reason: modified ? reason : '',
      completed: true,
    });
  };

  const prior = previousSets[0];

  return (
    <div className="space-y-4 text-white">
      <div className="rounded-2xl border border-teal-300/15 bg-teal-300/[0.05] p-3 text-xs text-teal-200">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          {isLoading
            ? 'Finding your last entry…'
            : prior
              ? `Last time: ${previousSets.length} sets × ${Number(prior.reps) || 0} reps · ${Number(prior.external_load) > 0 ? `${prior.external_load} kg` : 'bodyweight'}. Pre-filled below.`
              : 'First recorded session for this exercise.'}
        </div>
      </div>

      <div className="space-y-2">
        {sets.map((set, index) => (
          <div key={set.set_number} className="rounded-2xl border border-white/[0.08] bg-[#171719] p-3">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
              <span className="pb-2 text-xs font-bold text-zinc-500">#{index + 1}</span>
              <label className="space-y-1 text-[11px] text-zinc-400">
                Reps
                <Input type="number" min="0" value={set.reps} onChange={(event) => updateSet(index, 'reps', event.target.value)} />
              </label>
              <label className="space-y-1 text-[11px] text-zinc-400">
                Load kg
                <Input type="number" min="0" step="0.5" value={set.external_load} onChange={(event) => updateSet(index, 'external_load', event.target.value)} />
              </label>
              <button type="button" onClick={() => removeSet(index)} disabled={sets.length === 1} className="mb-1 rounded-lg p-2 text-zinc-600 hover:text-rose-300 disabled:opacity-20" aria-label={`Remove set ${index + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {Number(set.external_load) === 0 && <p className="mt-2 text-[11px] text-zinc-500">0 kg is recorded as bodyweight.</p>}
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <Checkbox checked={set.pain_limited} onCheckedChange={(checked) => updateSet(index, 'pain_limited', checked === true)} />
              I stopped this set because of pain
            </label>
          </div>
        ))}
      </div>

      <button type="button" onClick={addSet} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-sm text-zinc-400 hover:text-[#d8ff5f]">
        <Plus className="h-4 w-4" /> Add set
      </button>

      <label className="block space-y-1 text-xs text-zinc-400">
        Pain during (0–10)
        <Input type="number" min="0" max="10" value={painDuring} onChange={(event) => setPainDuring(event.target.value)} />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#171719] p-3 text-sm text-zinc-200">
        <Checkbox checked={modified} onCheckedChange={(checked) => setModified(checked === true)} />
        I changed or could not complete the prescribed exercise
      </label>
      {modified && <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly tell your clinician what changed" />}

      <Button onClick={save} disabled={isSaving} className="w-full rounded-xl bg-[#d8ff5f] py-6 font-bold text-[#171719] hover:bg-[#c8ef50]">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        {isSaving ? 'Saving…' : 'Save exercise'}
      </Button>
    </div>
  );
}
