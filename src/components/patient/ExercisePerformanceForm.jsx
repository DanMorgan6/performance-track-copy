import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Dumbbell, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parsePrescriptionReps, rirToRpe, summariseWorkingSets } from '@/lib/trainingMetrics';

const MOVEMENT_TYPES = [
  { value: 'dynamic_external_load', label: 'Weights / machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'banded', label: 'Banded' },
  { value: 'assisted', label: 'Assisted' },
  { value: 'isometric', label: 'Isometric hold' },
  { value: 'balance_control', label: 'Balance / control' },
  { value: 'other', label: 'Other' },
];

const makeSet = (setNumber, exercise) => ({
  set_number: setNumber,
  completed: true,
  reps: parsePrescriptionReps(exercise?.reps),
  external_load: Number.parseFloat(exercise?.weight) || 0,
  rir: 3,
  set_rpe: 7,
  hold_seconds: Number.parseFloat(exercise?.hold || exercise?.duration) || 0,
  peak_force: '',
  average_force: '',
  force_unit: 'N',
  technique_acceptable: true,
  rom_acceptable: true,
  pain_limited: false,
  notes: '',
});

export default function ExercisePerformanceForm({ exercise, onSubmit, isSaving = false }) {
  const plannedSetCount = Math.min(10, Math.max(1, Number(exercise?.sets) || 1));
  const [movementType, setMovementType] = useState(
    Number.parseFloat(exercise?.weight) > 0 ? 'dynamic_external_load' : 'bodyweight',
  );
  const [loadUnit, setLoadUnit] = useState('kg');
  const [equipment, setEquipment] = useState('');
  const [variation, setVariation] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState('');
  const [rangePosition, setRangePosition] = useState('');
  const [side, setSide] = useState('not_applicable');
  const [workingSets, setWorkingSets] = useState(
    Array.from({ length: plannedSetCount }, (_, index) => makeSet(index + 1, exercise)),
  );
  const [painDuring, setPainDuring] = useState(0);
  const [painAfter, setPainAfter] = useState(0);
  const [difficulty, setDifficulty] = useState('appropriate');
  const [modified, setModified] = useState(false);
  const [modificationReason, setModificationReason] = useState('');
  const [notes, setNotes] = useState('');

  const summary = useMemo(
    () => summariseWorkingSets(workingSets, movementType),
    [workingSets, movementType],
  );
  const isMeasurable = movementType === 'dynamic_external_load';

  const updateSet = (index, field, value) => {
    setWorkingSets((sets) => sets.map((set, setIndex) => {
      if (setIndex !== index) return set;
      const next = { ...set, [field]: value };
      if (field === 'rir') next.set_rpe = rirToRpe(value);
      return next;
    }));
  };

  const addSet = () => {
    setWorkingSets((sets) => [...sets, makeSet(sets.length + 1, exercise)]);
  };

  const removeSet = (index) => {
    setWorkingSets((sets) => sets
      .filter((_, setIndex) => setIndex !== index)
      .map((set, setIndex) => ({ ...set, set_number: setIndex + 1 })));
  };

  const submit = () => {
    const completedSets = workingSets.filter((set) => set.completed !== false);
    const totalReps = completedSets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
    const averageLoad = completedSets.length
      ? completedSets.reduce((sum, set) => sum + (Number(set.external_load) || 0), 0) / completedSets.length
      : 0;

    onSubmit({
      exercise_name: exercise?.name,
      exercise_key: [exercise?.name, variation, equipment, side, loadUnit].filter(Boolean).join(' | '),
      equipment,
      exercise_variation: variation,
      assistance_level: assistanceLevel,
      range_position: rangePosition,
      movement_type: movementType,
      side,
      load_unit: isMeasurable ? loadUnit : movementType === 'bodyweight' ? 'bodyweight' : 'none',
      working_sets: workingSets.map((set) => ({
        ...set,
        reps: Number(set.reps) || 0,
        external_load: isMeasurable ? Number(set.external_load) || 0 : 0,
        rir: Math.min(4, Math.max(0, Number(set.rir) || 0)),
        set_rpe: Math.min(10, Math.max(0, Number(set.set_rpe) || 0)),
        hold_seconds: movementType === 'isometric' ? Number(set.hold_seconds) || 0 : undefined,
        peak_force: movementType === 'isometric' && set.peak_force !== '' ? Number(set.peak_force) : undefined,
        average_force: movementType === 'isometric' && set.average_force !== '' ? Number(set.average_force) : undefined,
        force_unit: movementType === 'isometric' && (set.peak_force !== '' || set.average_force !== '') ? set.force_unit : undefined,
        force_duration: movementType === 'isometric' && set.average_force !== '' ? Number(set.average_force) * (Number(set.hold_seconds) || 0) : undefined,
      })),
      sets_completed: completedSets.length,
      reps_completed: String(totalReps),
      weight: isMeasurable ? Math.round(averageLoad * 10) / 10 : 0,
      planned_sets: Number(exercise?.sets) || 0,
      planned_reps: String(exercise?.reps || ''),
      planned_weight: String(exercise?.weight || ''),
      ...summary,
      pain_during: Number(painDuring),
      pain_after: Number(painAfter),
      difficulty,
      technique_acceptable: completedSets.every((set) => set.technique_acceptable !== false),
      rom_acceptable: completedSets.every((set) => set.rom_acceptable !== false),
      pain_limited: completedSets.some((set) => set.pain_limited),
      modified,
      modification_reason: modified ? modificationReason : '',
      notes,
      completed: true,
    });
  };

  return (
    <div className="performance-shell max-h-[75dvh] space-y-5 overflow-y-auto bg-[#171719] p-1 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#242427] p-4">
        <h4 className="font-bold text-white">{exercise?.name}</h4>
        <p className="mt-1 text-sm text-zinc-400">
          Planned: {exercise?.sets || '—'} sets × {exercise?.reps || '—'} reps
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-200">Exercise type</Label>
        <select
          value={movementType}
          onChange={(event) => setMovementType(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#242427] px-3 py-3 text-white"
        >
          {MOVEMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <Input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="Equipment / machine" />
          <Input value={variation} onChange={(event) => setVariation(event.target.value)} placeholder="Variation / setup" />
          <Input value={assistanceLevel} onChange={(event) => setAssistanceLevel(event.target.value)} placeholder="Assistance level" />
          <Input value={rangePosition} onChange={(event) => setRangePosition(event.target.value)} placeholder="Range / position" />
        </div>
        <select
          value={side}
          onChange={(event) => setSide(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#242427] px-3 py-3 text-white"
        >
          <option value="not_applicable">Side: not applicable</option>
          <option value="left">Left side</option>
          <option value="right">Right side</option>
          <option value="bilateral">Both sides</option>
        </select>
      </div>

      <div className="space-y-3">
        <div>
          <h5 className="font-bold text-white">Working sets</h5>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            RIR means “How many more good-quality repetitions could you have completed?” 0 = none, 1 = one, up to 4+.
          </p>
        </div>

        {workingSets.map((set, index) => (
          <div key={set.set_number} className="space-y-3 rounded-2xl border border-white/10 bg-[#242427] p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Set {index + 1}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <Checkbox checked={set.completed !== false} onCheckedChange={(checked) => updateSet(index, 'completed', checked === true)} />
                  Completed
                </label>
                {workingSets.length > 1 && (
                  <button type="button" onClick={() => removeSet(index)} aria-label={`Remove set ${index + 1}`} className="text-zinc-500 hover:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className={`grid gap-3 ${isMeasurable ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <label className="space-y-1 text-xs text-zinc-400">
                Reps
                <Input type="number" min="0" value={set.reps} onChange={(event) => updateSet(index, 'reps', event.target.value)} />
              </label>
              {isMeasurable && (
                <label className="space-y-1 text-xs text-zinc-400">
                  Load
                  <div className="flex gap-1">
                    <Input type="number" min="0" step="0.5" value={set.external_load} onChange={(event) => updateSet(index, 'external_load', event.target.value)} />
                    <select value={loadUnit} onChange={(event) => setLoadUnit(event.target.value)} className="rounded-lg border border-white/10 bg-[#171719] px-1 text-xs text-white">
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                </label>
              )}
              <label className="space-y-1 text-xs text-zinc-400">
                RIR
                <select value={set.rir} onChange={(event) => updateSet(index, 'rir', event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-[#171719] px-2 text-white">
                  <option value="0">0 · RPE 10</option>
                  <option value="1">1 · RPE 9</option>
                  <option value="2">2 · RPE 8</option>
                  <option value="3">3 · RPE 7</option>
                  <option value="4">4+ · RPE ≤6</option>
                </select>
              </label>
            </div>

            {movementType === 'isometric' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-zinc-400">
                  Hold duration (seconds)
                  <Input type="number" min="0" value={set.hold_seconds} onChange={(event) => updateSet(index, 'hold_seconds', event.target.value)} />
                </label>
                <label className="space-y-1 text-xs text-zinc-400">
                  Force unit
                  <select value={set.force_unit} onChange={(event) => updateSet(index, 'force_unit', event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-[#171719] px-2 text-white">
                    <option value="N">N</option>
                    <option value="kgf">kgf</option>
                    <option value="lb">lb</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs text-zinc-400">
                  Peak force (optional)
                  <Input type="number" min="0" value={set.peak_force} onChange={(event) => updateSet(index, 'peak_force', event.target.value)} />
                </label>
                <label className="space-y-1 text-xs text-zinc-400">
                  Average force (optional)
                  <Input type="number" min="0" value={set.average_force} onChange={(event) => updateSet(index, 'average_force', event.target.value)} />
                </label>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['technique_acceptable', 'Good technique'],
                ['rom_acceptable', 'Usual range'],
                ['pain_limited', 'Stopped by pain'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 text-xs text-zinc-300">
                  <Checkbox checked={set[field] === true} onCheckedChange={(checked) => updateSet(index, field, checked === true)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addSet} className="w-full border-white/10 bg-transparent text-white hover:bg-white/5">
          <Plus className="mr-2 h-4 w-4" /> Add working set
        </Button>
      </div>

      <div className="rounded-2xl border border-[#d8ff5f]/20 bg-[#d8ff5f]/[0.06] p-4">
        <div className="flex items-start gap-3">
          <Dumbbell className="mt-0.5 h-5 w-5 text-[#d8ff5f]" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Performance summary</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
              <span>Hard sets: <strong className="text-white">{summary.hard_sets}</strong></span>
              <span>Volume load: <strong className="text-white">{isMeasurable ? `${summary.volume_load} ${loadUnit}` : 'Not applicable'}</strong></span>
              <span className="col-span-2">Estimated Strength: <strong className="text-white">{summary.estimated_strength ? `${summary.estimated_strength} ${loadUnit}` : 'Not eligible from these sets'}</strong></span>
              <span className="col-span-2 text-zinc-500">Confidence: {summary.estimated_strength_confidence.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-zinc-400">Pain during (0–10)<Input type="number" min="0" max="10" value={painDuring} onChange={(event) => setPainDuring(event.target.value)} /></label>
        <label className="space-y-1 text-xs text-zinc-400">Pain after (0–10)<Input type="number" min="0" max="10" value={painAfter} onChange={(event) => setPainAfter(event.target.value)} /></label>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-200">How difficult was it?</Label>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#242427] px-3 py-3 text-white">
          <option value="too_easy">Too easy</option>
          <option value="appropriate">Appropriate</option>
          <option value="challenging">Challenging</option>
          <option value="too_hard">Too hard</option>
        </select>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#242427] p-3 text-sm text-zinc-200">
        <Checkbox checked={modified} onCheckedChange={(checked) => setModified(checked === true)} />
        I changed or could not complete the prescribed exercise
      </label>
      {modified && <Textarea value={modificationReason} onChange={(event) => setModificationReason(event.target.value)} placeholder="What did you change, and why?" />}
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional exercise notes" />

      {(Number(painDuring) > 3 || workingSets.some((set) => set.pain_limited)) && (
        <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          This response will be highlighted for clinician review. It will not automatically change your phase.
        </div>
      )}

      <Button onClick={submit} disabled={isSaving} className="w-full rounded-xl bg-[#d8ff5f] py-6 font-bold text-[#171719] hover:bg-[#c8ef50]">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        {isSaving ? 'Saving…' : 'Save exercise log'}
      </Button>
    </div>
  );
}
