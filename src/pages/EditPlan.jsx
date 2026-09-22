import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Mail, Save } from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isPractitioner } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from '@/components/ui/MobileSelect';
import BasicProgramBuilder from '@/components/plan/BasicProgramBuilder';
import ProgrammeScheduleEditor from '@/components/programme/ProgrammeScheduleEditor.jsx';
import { generatePlanPDF, uploadAndEmailPDF } from '@/components/reports/PlanPDFGenerator';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function createDefaultWeek() {
  return DAYS.map((day) => ({
    day,
    type: day === 'Wednesday' || day === 'Sunday' ? 'rest' : day === 'Saturday' ? 'conditioning' : 'training',
    exercises: [],
  }));
}

function cloneSchedule(schedule) {
  return JSON.parse(JSON.stringify(schedule || createDefaultWeek()));
}

function normalizePhase(phase, index) {
  const savedWeeks = Array.isArray(phase.weeks) ? phase.weeks : [];
  const legacySchedule = phase.daily_schedule || createDefaultWeek();
  const duration = Math.max(1, Number(phase.duration_weeks) || savedWeeks.length || 1);
  const lastSavedSchedule = savedWeeks.at(-1)?.daily_schedule || legacySchedule;

  const weeks = Array.from({ length: duration }, (_, weekIndex) => ({
    ...(savedWeeks[weekIndex] || {}),
    week_number: weekIndex + 1,
    daily_schedule: cloneSchedule(savedWeeks[weekIndex]?.daily_schedule || lastSavedSchedule),
  }));

  return {
    ...phase,
    phase_number: index + 1,
    duration_weeks: duration,
    exit_criteria: phase.exit_criteria?.length
      ? phase.exit_criteria
      : [{ criterion: '', target_value: '', is_met: false }],
    exercises: phase.exercises || [],
    status: phase.status || (index === 0 ? 'active' : 'pending'),
    use_daily_schedule: true,
    weeks,
  };
}

export default function EditPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planId = new URLSearchParams(window.location.search).get('id');
  const hydratedPlanRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [phases, setPhases] = useState([]);
  const [removedPhaseIds, setRemovedPhaseIds] = useState([]);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      const user = await base44.auth.me();
      if (!isPractitioner(user)) {
        window.location.assign(createPageUrl('PatientPortal'));
        return;
      }
      setCurrentUser(user);
    };
    checkAccess();
  }, []);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', planId, currentUser?.clinic_id],
    queryFn: () => base44.entities.RehabPlan
      .filter({ id: planId, clinic_id: currentUser.clinic_id })
      .then((results) => results[0]),
    enabled: !!planId && !!currentUser?.clinic_id,
  });

  const { data: existingPhases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['plan-phases', planId, currentUser?.clinic_id],
    queryFn: () => base44.entities.RehabPhase.filter({
      plan_id: planId,
      clinic_id: currentUser.clinic_id,
    }),
    enabled: !!planId && !!currentUser?.clinic_id,
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', plan?.patient_id, currentUser?.clinic_id],
    queryFn: () => base44.entities.Patient
      .filter({ id: plan.patient_id, clinic_id: currentUser.clinic_id })
      .then((results) => results[0]),
    enabled: !!plan?.patient_id && !!currentUser?.clinic_id,
  });

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library', currentUser?.clinic_id],
    queryFn: () => base44.entities.ExerciseLibrary.filter(
      { clinic_id: currentUser.clinic_id },
      '-created_date'
    ),
    enabled: !!currentUser?.clinic_id,
  });

  const { data: progressionBlocks = [] } = useQuery({
    queryKey: ['progression-blocks', currentUser?.clinic_id],
    queryFn: () => base44.entities.ProgressionBlock.filter(
      { clinic_id: currentUser.clinic_id, is_active: true },
      'name'
    ),
    enabled: !!currentUser?.clinic_id,
  });

  useEffect(() => {
    if (!plan || hydratedPlanRef.current === plan.id) return;
    setPlanData({
      ...plan,
      program_type: plan.program_type || 'phased',
      basic_config: plan.basic_config || {
        frequency_per_week: 3,
        weekend_rest_days: true,
        days_of_week_pattern: ['Monday', 'Wednesday', 'Friday'],
        exercise_bundle: [],
      },
    });
    hydratedPlanRef.current = plan.id;
  }, [plan]);

  useEffect(() => {
    if (!plan || plan.program_type === 'basic' || phasesLoading) return;
    if (hydratedPlanRef.current !== plan.id || phases.length > 0) return;

    const normalized = [...existingPhases]
      .sort((a, b) => a.phase_number - b.phase_number)
      .map(normalizePhase);

    setPhases(normalized.length ? normalized : [normalizePhase({
      name: 'Phase 1: Initial Recovery',
      description: '',
      duration_weeks: 2,
      status: 'active',
    }, 0)]);
  }, [existingPhases, phases.length, phasesLoading, plan]);

  const addPhase = () => {
    const nextIndex = phases.length;
    const newPhase = normalizePhase({
      name: `Phase ${nextIndex + 1}`,
      description: '',
      duration_weeks: 2,
      exit_criteria: [{ criterion: '', target_value: '', is_met: false }],
      exercises: [],
      status: 'pending',
    }, nextIndex);

    setPhases((current) => [...current, newPhase]);
    setSelectedPhaseIndex(nextIndex);
    setSelectedWeekIndex(0);
  };

  const removePhase = (index) => {
    if (phases.length <= 1) return;
    const phase = phases[index];
    if (phase?.id) {
      setRemovedPhaseIds((current) => [...new Set([...current, phase.id])]);
    }

    setPhases((current) => current
      .filter((_, phaseIndex) => phaseIndex !== index)
      .map((item, phaseIndex) => ({ ...item, phase_number: phaseIndex + 1 })));
    setSelectedPhaseIndex((current) => Math.max(0, Math.min(current - 1, phases.length - 2)));
    setSelectedWeekIndex(0);
  };

  const updatePhase = (index, field, value) => {
    setPhases((current) => current.map((phase, phaseIndex) => {
      if (phaseIndex !== index) return phase;

      const updated = {
        ...phase,
        weeks: [...(phase.weeks || [])],
        [field]: value,
      };

      if (field === 'duration_weeks') {
        const duration = Math.max(1, Number(value) || 1);
        const existingWeeks = phase.weeks || [];
        const fallbackSchedule = existingWeeks.at(-1)?.daily_schedule || createDefaultWeek();
        updated.duration_weeks = duration;
        updated.weeks = Array.from({ length: duration }, (_, weekIndex) => ({
          ...(existingWeeks[weekIndex] || {}),
          week_number: weekIndex + 1,
          daily_schedule: cloneSchedule(existingWeeks[weekIndex]?.daily_schedule || fallbackSchedule),
        }));
        setSelectedWeekIndex(0);
      }

      return updated;
    }));
  };

  const addExitCriterion = (phaseIndex) => {
    setPhases((current) => current.map((phase, index) => index === phaseIndex
      ? {
          ...phase,
          exit_criteria: [
            ...(phase.exit_criteria || []),
            { criterion: '', target_value: '', is_met: false },
          ],
        }
      : phase));
  };

  const updateExitCriterion = (phaseIndex, criterionIndex, field, value) => {
    setPhases((current) => current.map((phase, index) => index === phaseIndex
      ? {
          ...phase,
          exit_criteria: (phase.exit_criteria || []).map((criterion, itemIndex) => itemIndex === criterionIndex
            ? { ...criterion, [field]: value }
            : criterion),
        }
      : phase));
  };

  const removeExitCriterion = (phaseIndex, criterionIndex) => {
    setPhases((current) => current.map((phase, index) => index === phaseIndex
      ? {
          ...phase,
          exit_criteria: (phase.exit_criteria || []).filter((_, itemIndex) => itemIndex !== criterionIndex),
        }
      : phase));
  };

  const addNewExercisesToLibrary = async () => {
    const allExercises = phases.flatMap((phase) => [
      ...(phase.exercises || []),
      ...(phase.weeks || []).flatMap((week) => (week.daily_schedule || [])
        .flatMap((day) => day.exercises || [])),
    ]);
    const existingNames = new Set(libraryExercises.map((exercise) => exercise.name?.trim().toLowerCase()));
    const newByName = new Map();

    allExercises.forEach((exercise) => {
      const key = exercise.name?.trim().toLowerCase();
      if (key && !existingNames.has(key) && !newByName.has(key)) {
        newByName.set(key, exercise);
      }
    });

    if (newByName.size === 0) return;

    await base44.entities.ExerciseLibrary.bulkCreate(
      [...newByName.values()].map((exercise) => ({
        clinic_id: currentUser.clinic_id,
        name: exercise.name,
        description: exercise.description || exercise.notes || '',
        category: 'functional',
        body_part: 'full_body',
        difficulty_level: 'intermediate',
        default_sets: Number(exercise.sets) || 3,
        default_reps: exercise.reps || '10',
        default_frequency: exercise.frequency || 'Daily',
        video_url: exercise.video_url || '',
      }))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!planData || !currentUser?.clinic_id || saving) return;

    setSaving(true);
    setSaveError('');

    try {
      await base44.entities.RehabPlan.update(planId, {
        title: planData.title,
        description: planData.description || '',
        start_date: planData.start_date || null,
        target_end_date: planData.target_end_date || null,
        status: planData.status,
        program_type: planData.program_type,
        basic_config: planData.program_type === 'basic' ? planData.basic_config : null,
        total_phases: planData.program_type === 'phased' ? phases.length : null,
        current_phase: planData.program_type === 'phased' ? (planData.current_phase || 1) : null,
        publication_state: planData.publication_state || 'published',
        version: (planData.version || 1) + 1,
        last_updated_at: new Date().toISOString(),
      });

      if (planData.program_type === 'phased') {
        await addNewExercisesToLibrary();

        for (const [index, phase] of phases.entries()) {
          const payload = {
            clinic_id: currentUser.clinic_id,
            patient_id: planData.patient_id,
            plan_id: planId,
            phase_number: index + 1,
            name: phase.name,
            description: phase.description || '',
            duration_weeks: phase.duration_weeks,
            exit_criteria: phase.exit_criteria || [],
            exercises: phase.exercises || [],
            status: phase.status || (index === 0 ? 'active' : 'pending'),
            use_daily_schedule: true,
            weeks: phase.weeks || [],
            daily_schedule: phase.weeks?.[0]?.daily_schedule || phase.daily_schedule || createDefaultWeek(),
          };

          if (phase.id) {
            await base44.entities.RehabPhase.update(phase.id, payload);
          } else {
            await base44.entities.RehabPhase.create(payload);
          }
        }

        for (const removedId of removedPhaseIds) {
          await base44.entities.RehabPhase.delete(removedId);
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['plan', planId] }),
        queryClient.invalidateQueries({ queryKey: ['plan-phases', planId] }),
        queryClient.invalidateQueries({ queryKey: ['patient-plans', planData.patient_id] }),
        queryClient.invalidateQueries({ queryKey: ['exercise-library', currentUser.clinic_id] }),
      ]);

      navigate(createPageUrl(`PatientDetail?id=${planData.patient_id}`));
    } catch (error) {
      console.error('Failed to update rehabilitation plan:', error);
      setSaveError('The plan could not be saved. Your changes remain on this page—please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!planData) return;
    setExportingPDF(true);
    try {
      const pdf = await generatePlanPDF(planData, phases, patient);
      pdf.save(`${planData.title || 'Rehabilitation-Plan'}.pdf`);
    } catch (error) {
      console.error(error);
      setSaveError('The PDF could not be generated. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleEmailPDF = async () => {
    if (!patient?.email || !planData) return;
    setExportingPDF(true);
    try {
      const pdf = await generatePlanPDF(planData, phases, patient);
      await uploadAndEmailPDF(pdf, planData, patient.email, patient.full_name);
    } catch (error) {
      console.error(error);
      setSaveError('The PDF could not be emailed. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const isLoading = !currentUser || planLoading || phasesLoading || (plan && !planData);

  if (isLoading) {
    return (
      <div className="performance-shell min-h-screen flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d8ff5f] border-t-transparent" />
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="performance-shell min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#242427] p-6 text-center">
          <h1 className="text-xl font-bold text-white">Plan not found</h1>
          <p className="mt-2 text-sm text-zinc-400">This plan is unavailable or does not belong to your clinic.</p>
          <Link to={createPageUrl('CoachDashboard')}>
            <Button className="mt-5 rounded-xl">Return to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBasic = planData.program_type === 'basic';
  const patientRoute = createPageUrl(`PatientDetail?id=${planData.patient_id}`);

  return (
    <div className="performance-shell min-h-screen overflow-x-hidden bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <Link
          to={patientRoute}
          className="mb-8 inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient
        </Link>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:p-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-500">Rehabilitation programming</p>
              <h1 className="text-2xl font-bold text-slate-800">Edit Rehabilitation Plan</h1>
              <p className="mt-1 text-slate-500">
                {patient?.full_name ? `For ${patient.full_name}` : 'Update the patient programme without losing its weekly structure.'}
              </p>
            </div>
            <span className="w-fit rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-600">
              {isBasic ? 'Quick Plan' : 'Phased Rehab'}
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
                event.preventDefault();
              }
            }}
            className="space-y-8"
          >
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-700">Plan Details</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Plan Title *</Label>
                  <Input
                    required
                    value={planData.title || ''}
                    onChange={(event) => setPlanData((current) => ({ ...current, title: event.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={planData.description || ''}
                    onChange={(event) => setPlanData((current) => ({ ...current, description: event.target.value }))}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={planData.start_date || ''}
                    onChange={(event) => setPlanData((current) => ({ ...current, start_date: event.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target End Date</Label>
                  <Input
                    type="date"
                    value={planData.target_end_date || ''}
                    onChange={(event) => setPlanData((current) => ({ ...current, target_end_date: event.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <MobileSelect
                    label="Status"
                    value={planData.status || 'active'}
                    onChange={(event) => setPlanData((current) => ({ ...current, status: event.target.value }))}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'active', label: 'Active' },
                      { value: 'paused', label: 'Paused' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                  />
                </div>
              </div>
            </section>

            {isBasic ? (
              <BasicProgramBuilder
                planData={planData}
                setPlanData={setPlanData}
                libraryExercises={libraryExercises}
              />
            ) : (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-700">Weekly Schedule</h2>
                <ProgrammeScheduleEditor
                  phases={phases}
                  setPhases={setPhases}
                  libraryExercises={libraryExercises}
                  progressionBlocks={progressionBlocks}
                  selectedPhaseIndex={selectedPhaseIndex}
                  setSelectedPhaseIndex={setSelectedPhaseIndex}
                  selectedWeekIndex={selectedWeekIndex}
                  setSelectedWeekIndex={setSelectedWeekIndex}
                  onAddPhase={addPhase}
                  onRemovePhase={removePhase}
                  onUpdatePhase={updatePhase}
                  onAddExitCriterion={addExitCriterion}
                  onUpdateExitCriterion={updateExitCriterion}
                  onRemoveExitCriterion={removeExitCriterion}
                />
              </section>
            )}

            {saveError && (
              <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {saveError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link to={patientRoute}>
                <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportingPDF || !planData.title}
                className="rounded-xl"
              >
                {exportingPDF
                  ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                  : <Download className="mr-2 h-4 w-4" />}
                Export PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleEmailPDF}
                disabled={exportingPDF || !planData.title || !patient?.email}
                className="rounded-xl"
                title={!patient?.email ? 'Patient email not available' : ''}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email PDF
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                {saving
                  ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
