import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Dumbbell, History, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parsePrescriptionReps, rirToRpe, summariseWorkingSets } from '@/lib/trainingMetrics';

const makeSet = (setNumber, exercise) => ({
  set_number: setNumber,
  completed: true,
  reps: parsePrescriptionReps(exercise?.reps),
  external_load: Number.parseFloat(exercise?.weight) || 0,
  rir: 3,
  set_rpe: 7,
  hold_seconds: Number.parseFloat(exercise?.hold || exercise?.duration) || 0,
  technique_acceptable: true,
  rom_acceptable: true,
  pain_limited: false,
  notes: '',
});

const latestSetSummary = (log) => {
  const sets = (log?.working_sets || []).filter((set) => set.completed !== false);
  if (!sets.length) return null;
  const representative = sets[0];
  return {
    load: Number(representative.external_load) || 0,
    reps: Number(representative.reps) || 0,
    rir: representative.rir == null ? null : Number(representative.rir),
    sets: sets.length,
  };
};

export default function ExercisePerformanceForm({ exercise, patient, onSubmit, isSaving = false }) {
  const plannedSetCount = Math.min(10, Math.max(1, Number(exercise?.sets) || 1));
  const isIsometric = Number.parseFloat(exercise?.hold || exercise?.duration) > 0;
  const side = exercise?.side || 'not_applicable';
  const [workingSets, setWorkingSets] = useState(
    Array.from({ length: plannedSetCount }, (_, index) => makeSet(index + 1, exercise)),
  );
  const [painDuring, setPainDuring] = useState(0);
  const [modified, setModified] = useState(false);
  const [modificationReason, setModificationReason] = useState('');
  const hydratedFromPrevious = useRef(false);

  const { data: previousLogs = [], isLoading: loadingPrevious } = useQuery({
    queryKey: ['previous-exercise-performance', patient?.clinic_id, patient?.id, exercise?.name],
    queryFn: () => base44.entities.ExerciseLog.filter({
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      exercise_name: exercise.name,
    }, '-date', 10),
    enabled: Boolean(patient?.clinic_id && patient?.id && exercise?.name),
  });

  const today = new Date().toISOString().slice(0, 10);
  const previousLog = previousLogs.find((log) => log.date < today) || previousLogs[0] || null;
  const previousSummary = latestSetSummary(previousLog);

  useEffect(() => {
    if (!previousLog?.working_sets?.length || hydratedFromPrevious.current) return;
    hydratedFromPrevious.current = true;
    const completedPrevious = previousLog.working_sets.filter((set) => set.completed !== false);
    setWorkingSets((current) => current.map((set, index) => {
      const prior = completedPrevious[index] || completedPrevious[0];
      if (!prior) return set;
      return {
        ...set,
        reps: Number(prior.reps) || set.reps,
        external_load: Number(prior.external_load) || 0,
        rir: prior.rir == null ? set.rir : Number(prior.rir),
        set_rpe: prior.rir == null ? set.set_rpe : rirToRpe(Number(prior.rir)),
        hold_seconds: Number(prior.hold_seconds) || set.hold_seconds,
      };
    }));
  }, [previousLog]);

  const movementType = isIsometric
    ? 'isometric'
    : workingSets.some((set) => Number(set.external_load) > 0)
      ? 'dynamic_external_load'
      : 'bodyweight';

  const summary = useMemo(
    () => summariseWorkingSets(workingSets, movementType),
    [workingSets, movementType],
  );

  const updateSet = (index, field, value) => {
    setWorkingSets((sets) => sets.map((set, setIndex) => {
      if (setIndex !== index) return set;
      const next = { ...set, [field]: value };
      if (field === 'rir') next.set_rpe = rirToRpe(value);
      return next;
    }));
  };

  const addSet = () => {
    const previous = workingSets.at(-1);
    setWorkingSets((sets) => [...sets, {
      ...makeSet(sets.length + 1, exercise),
      reps: previous?.reps ?? parsePrescriptionReps(exercise?.reps),
      external_load: previous?.external_load ?? 0,
      rir: previous?.rir ?? 3,
      set_rpe: previous?.set_rpe ?? 7,
    }]);
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
    const submittedMovementType = isIsometric
      ? 'isometric'
      : completedSets.some((set) => Number(set.external_load) > 0)
        ? 'dynamic_external_load'
        : 'bodyweight';

    onSubmit({
      exercise_name: exercise?.name,
      exercise_key: [exercise?.name, side].filter(Boolean).join(' | '),
      movement_type: submittedMovementType,
      side,
      load_unit: submittedMovementType === 'dynamic_external_load' ? 'kg' : submittedMovementType === 'bodyweight' ? 'bodyweight' : 'none',
      working_sets: completedSets.map((set, index) => ({
        ...set,
        set_number: index + 1,
        reps: Number(set.reps) || 0,
        external_load: Number(set.external_load) || 0,
        rir: Number(set.rir),
        set_rpe: rirToRpe(Number(set.rir)),
        hold_seconds: Number(set.hold_seconds) || 0,
        technique_acceptable: true,
        rom_acceptable: true,
        pain_limited: set.pain_limited === true,
      })),
      planned_sets: Number(exercise?.sets) || plannedSetCount,
      planned_reps: exercise?.reps || '',
      planned_weight: exercise?.weight || '',
      sets_completed: completedSets.length,
      reps_completed: String(totalReps),
      weight: averageLoad,
      volume_load: summary.volume_load,
      hard_sets: summary.hard_sets,
      estimated_strength: summary.estimated_strength,
      estimated_strength_confidence: summary.estimated_strength_confidence,
      hold_duration_seconds: summary.hold_duration_seconds,
      pain_during: Number(painDuring) || 0,
      pain_limited: completedSets.some((set) => set.pain_limited),
      technique_acceptable: true,
      rom_acceptable: true,
      modified,
      modification_reason: modified ? modificationReason : '',
      completed: true,
    });
  };

  return (
    <div className="space-y-4 text-white">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-[#d8ff5f]" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white">{exercise?.name}</h3>
            <p className="mt-1 text-xs text-zinc-400">
              {exercise?.sets || plannedSetCount} sets · {exercise?.reps || (isIsometric ? exercise?.hold : 'record reps')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-300/15 bg-teal-300/[0.05] p-3">
        <div className="flex items-center gap-2 text-xs text-teal-200">
          <History className="h-4 w-4" />
          {loadingPrevious ? (
            <span>Finding your last entry…</span>
          ) : previousSummary ? (
            <span>
              Last time: {previousSummary.sets} sets × {previousSummary.reps} reps · {previousSummary.load > 0 ? `${previousSummary.load} kg` : 'bodyweight'}
              {previousSummary.rir == null ? '' : ` · ${previousSummary.rir} RIR`}. Pre-filled below.
            </span>
          ) : (
            <span>First recorded session for this exercise.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {workingSets.map((set, index) => (
          <div key={set.set_number} className="rounded-2xl border border-white/[0.08] bg-[#171719] p-3">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-end gap-2">
              <label className="pb-2 text-xs font-bold text-zinc-500">#{index + 1}</label>
              <label className="space-y-1 text-[11px] text-zinc-400">
                {isIsometric ? 'Hold (sec)' : 'Reps'}
                <Input
                  type="number"
                  min="0"
                  value={isIsometric ? set.hold_seconds : set.reps}
                  onChange={(event) => updateSet(index, isIsometric ? 'hold_seconds' : 'reps', event.target.value)}
                  className="h-10"
                />
              </label>
              {!isIsometric && (
                <label className="space-y-1 text-[11px] text-zinc-400">
                  Load kg
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={set.external_load}
                    onChange={(event) => updateSet(index, 'external_load', event.target.value)}
                    className="h-10"
                  />
                </label>
              )}
              <label className="space-y-1 text-[11px] text-zinc-400">
                Reps left
                <select
                  value={set.rir}
                  onChange={(event) => updateSet(index, 'rir', Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-white/10 bg-[#242427] px-2 text-sm text-white"
                  aria-label={`Repetitions in reserve for set ${index + 1}`}
                >
                  {[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value === 4 ? '4+' : value}</option>)}
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeSet(index)}
                disabled={workingSets.length === 1}
                className="mb-1 rounded-lg p-2 text-zinc-600 hover:bg-white/[0.05] hover:text-rose-300 disabled:opacity-20"
                aria-label={`Remove set ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {!isIsometric && Number(set.external_load) === 0 && (
              <p className="mt-2 text-[11px] text-zinc-500">0 kg is recorded as bodyweight.</p>
            )}
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <Checkbox checked={set.pain_limited} onCheckedChange={(checked) => updateSet(index, 'pain_limited', checked === true)} />
              I stopped this set because of pain
            </label>
          </div>
        ))}
      </div>

      <button type="button" onClick={addSet} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-sm text-zinc-400 hover:border-[#d8ff5f]/30 hover:text-[#d8ff5f]">
        <Plus className="h-4 w-4" /> Add set
      </button>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-zinc-400">
          Pain during (0–10)
          <Input type="number" min="0" max="10" value={painDuring} onChange={(event) => setPainDuring(event.target.value)} />
        </label>
        <div className="rounded-xl border border-[#d8ff5f]/15 bg-[#d8ff5f]/[0.05] p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Work completed</p>
          <p className="mt-1 font-bold text-white">{summary.hard_sets} working sets</p>
          <p className="text-xs text-zinc-500">{summary.volume_load > 0 ? `${summary.volume_load.toFixed(0)} kg volume` : isIsometric ? `${summary.hold_duration_seconds || 0}s holds` : 'Bodyweight'}</p>
        </div>
      </div>

      {summary.estimated_strength && (
        <div className="rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-3 text-sm">
          <span className="font-bold text-violet-200">Estimated Strength: {summary.estimated_strength.toFixed(1)} kg</span>
          <span className="ml-2 text-xs text-zinc-500">({summary.estimated_strength_confidence} confidence)</span>
        </div>
      )}

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#171719] p-3 text-sm text-zinc-200">
        <Checkbox checked={modified} onCheckedChange={(checked) => setModified(checked === true)} />
        I changed the prescribed exercise
      </label>
      {modified && (
        <Textarea value={modificationReason} onChange={(event) => setModificationReason(event.target.value)} placeholder="Briefly tell your clinician what changed" />
      )}

      {workingSets.some((set) => set.pain_limited) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Pain-limited sets will be visible to your clinician and excluded from Estimated Strength.
        </div>
      )}

      <Button
        onClick={submit}
        disabled={isSaving}
        className="w-full rounded-xl bg-[#d8ff5f] py-6 font-bold text-[#171719] hover:bg-[#c8ef50]"
      >
        <CheckCircle2 className="mr-2 h-5 w-5" />
        {isSaving ? 'Saving…' : 'Save exercise'}
      </Button>
    </div>
  );
}
