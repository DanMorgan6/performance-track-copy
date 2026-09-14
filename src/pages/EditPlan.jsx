import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Target,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import MobileSelect from "@/components/ui/MobileSelect";

export default function EditPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');

  const [saving, setSaving] = useState(false);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [planData, setPlanData] = useState(null);
  const [phases, setPhases] = useState([]);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySource, setCopySource] = useState(null);
  const [copyPhase, setCopyPhase] = useState(null);

  // Security: Only clinic staff can edit plans
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => base44.entities.RehabPlan.filter({ id: planId }).then(res => res[0])
  });

  const { data: existingPhases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['plan-phases', planId],
    queryFn: async () => {
      if (!planId) return [];
      const user = await base44.auth.me();
      // Multi-clinic isolation: verify plan belongs to user's clinic
      const plan = await base44.entities.RehabPlan.filter({ id: planId }).then(res => res[0]);
      if (!plan || plan.clinic_id !== user.clinic_id) {
        throw new Error('Unauthorized');
      }
      return base44.entities.RehabPhase.filter({ plan_id: planId });
    },
    enabled: !!planId
  });

  useEffect(() => {
    if (plan) {
      setPlanData(plan);
    }
  }, [plan]);

  useEffect(() => {
    if (existingPhases.length > 0) {
      const sortedPhases = existingPhases.sort((a, b) => a.phase_number - b.phase_number);
      // Add daily schedule if not present
      const phasesWithSchedule = sortedPhases.map(p => ({
        ...p,
        use_daily_schedule: p.use_daily_schedule !== false,
        daily_schedule: p.daily_schedule || [
          { day: 'Monday', type: 'training', exercises: p.exercises || [] },
          { day: 'Tuesday', type: 'training', exercises: [] },
          { day: 'Wednesday', type: 'rest', exercises: [] },
          { day: 'Thursday', type: 'training', exercises: [] },
          { day: 'Friday', type: 'training', exercises: [] },
          { day: 'Saturday', type: 'conditioning', exercises: [] },
          { day: 'Sunday', type: 'rest', exercises: [] }
        ]
      }));
      setPhases(phasesWithSchedule);
    }
  }, [existingPhases]);

  const addPhase = () => {
    setPhases([...phases, {
      phase_number: phases.length + 1,
      name: `Phase ${phases.length + 1}`,
      description: '',
      duration_weeks: 2,
      exit_criteria: [{ criterion: '', target_value: '', is_met: false }],
      exercises: [{ name: '', description: '', sets: 3, reps: '10', frequency: 'Daily', video_url: '' }],
      status: 'pending',
      isNew: true,
      use_daily_schedule: true,
      daily_schedule: [
        { day: 'Monday', type: 'training', exercises: [] },
        { day: 'Tuesday', type: 'training', exercises: [] },
        { day: 'Wednesday', type: 'rest', exercises: [] },
        { day: 'Thursday', type: 'training', exercises: [] },
        { day: 'Friday', type: 'training', exercises: [] },
        { day: 'Saturday', type: 'conditioning', exercises: [] },
        { day: 'Sunday', type: 'rest', exercises: [] }
      ]
    }]);
    setSelectedPhaseIndex(phases.length);
  };

  const removePhase = async (index) => {
    const phase = phases[index];
    if (phase.id) {
      await base44.entities.RehabPhase.delete(phase.id);
    }
    const newPhases = phases.filter((_, i) => i !== index);
    setPhases(newPhases.map((p, i) => ({ ...p, phase_number: i + 1 })));
  };

  const updatePhase = (index, field, value) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const toggleCriteriaMet = (phaseIndex, criteriaIndex) => {
    const newPhases = [...phases];
    const criteria = newPhases[phaseIndex].exit_criteria[criteriaIndex];
    criteria.is_met = !criteria.is_met;
    setPhases(newPhases);
  };

  const addExitCriterion = (phaseIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria.push({ criterion: '', target_value: '', is_met: false });
    setPhases(newPhases);
  };

  const updateExitCriterion = (phaseIndex, criteriaIndex, field, value) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria[criteriaIndex][field] = value;
    setPhases(newPhases);
  };

  const removeExitCriterion = (phaseIndex, criteriaIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria = newPhases[phaseIndex].exit_criteria.filter((_, i) => i !== criteriaIndex);
    setPhases(newPhases);
  };

  const addExercise = (phaseIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exercises.push({ name: '', description: '', sets: 3, reps: '10', frequency: 'Daily', video_url: '' });
    setPhases(newPhases);
  };

  const updateExercise = (phaseIndex, exerciseIndex, field, value) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exercises[exerciseIndex][field] = value;
    setPhases(newPhases);
  };

  const removeExercise = (phaseIndex, exerciseIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exercises = newPhases[phaseIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setPhases(newPhases);
  };

  const updateDaySchedule = (phaseIndex, dayIndex, field, value) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].daily_schedule[dayIndex][field] = value;
    setPhases(newPhases);
  };

  const updateDayExercise = (phaseIndex, dayIndex, exerciseIndex, field, value) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].daily_schedule[dayIndex].exercises[exerciseIndex][field] = value;
    setPhases(newPhases);
  };

  const removeDayExercise = (phaseIndex, dayIndex, exerciseIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].daily_schedule[dayIndex].exercises = 
      newPhases[phaseIndex].daily_schedule[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setPhases(newPhases);
  };

  const addDayExercise = (phaseIndex, dayIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].daily_schedule[dayIndex].exercises.push({ 
      name: '', 
      description: '', 
      sets: 3, 
      reps: '10', 
      frequency: 'Daily', 
      video_url: ''
    });
    setPhases(newPhases);
  };

  const copyDayToAnotherDay = (targetDayIndex) => {
    if (!copySource) return;
    
    const newPhases = [...phases];
    const sourceExercises = newPhases[copySource.phaseIndex].daily_schedule[copySource.dayIndex].exercises;
    
    newPhases[copySource.phaseIndex].daily_schedule[targetDayIndex].exercises = 
      sourceExercises.map(ex => ({ ...ex }));
    
    setPhases(newPhases);
    setShowCopyDialog(false);
    setCopySource(null);
  };

  const advancePhase = async (currentPhaseIndex) => {
    if (currentPhaseIndex < phases.length - 1) {
      // Mark current phase as completed
      const currentPhase = phases[currentPhaseIndex];
      if (currentPhase.id) {
        await base44.entities.RehabPhase.update(currentPhase.id, { status: 'completed' });
      }
      
      // Activate next phase
      const nextPhase = phases[currentPhaseIndex + 1];
      if (nextPhase.id) {
        await base44.entities.RehabPhase.update(nextPhase.id, { status: 'active' });
      }

      // Update plan current phase
      await base44.entities.RehabPlan.update(planId, { current_phase: currentPhaseIndex + 2 });
      
      queryClient.invalidateQueries({ queryKey: ['plan-phases'] });
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Update plan
    await base44.entities.RehabPlan.update(planId, {
      ...planData,
      total_phases: phases.length
    });

    // Update/create phases
    for (const phase of phases) {
      const phaseData = {
        clinic_id: planData.clinic_id,
        patient_id: planData.patient_id,
        plan_id: planId,
        phase_number: phase.phase_number,
        name: phase.name,
        description: phase.description,
        duration_weeks: phase.duration_weeks,
        exit_criteria: phase.exit_criteria,
        exercises: phase.exercises,
        status: phase.status
      };

      if (phase.id) {
        await base44.entities.RehabPhase.update(phase.id, phaseData);
      } else {
        await base44.entities.RehabPhase.create(phaseData);
      }
    }

    queryClient.invalidateQueries();
    navigate(createPageUrl(`PatientDetail?id=${planData.patient_id}`));
  };

  if (planLoading || phasesLoading || !planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <Link 
          to={createPageUrl(`PatientDetail?id=${planData.patient_id}`)}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Edit Rehabilitation Plan</h1>
            <p className="text-slate-500 mt-1">Update plan details and phase progression</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Plan Details */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-700">Plan Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Plan Title *</Label>
                  <Input
                    required
                    value={planData.title}
                    onChange={(e) => setPlanData({...planData, title: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={planData.description || ''}
                    onChange={(e) => setPlanData({...planData, description: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                   <Label>Status</Label>
                   <MobileSelect
                     label="Status"
                     value={planData.status}
                     onChange={(e) => setPlanData({...planData, status: e.target.value})}
                     options={[
                       { value: 'draft', label: 'Draft' },
                       { value: 'active', label: 'Active' },
                       { value: 'paused', label: 'Paused' },
                       { value: 'completed', label: 'Completed' },
                     ]}
                   />
                 </div>

                <div className="space-y-2">
                  <Label>Target End Date</Label>
                  <Input
                    type="date"
                    value={planData.target_end_date || ''}
                    onChange={(e) => setPlanData({...planData, target_end_date: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Phase Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-700">Weekly Schedule</h2>
                <Button type="button" onClick={addPhase} variant="outline" className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Phase
                </Button>
              </div>

              {/* Phase Navigation */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {phases.map((phase, phaseIndex) => (
                  <button
                    key={phaseIndex}
                    type="button"
                    onClick={() => setSelectedPhaseIndex(phaseIndex)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                      selectedPhaseIndex === phaseIndex
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Phase {phase.phase_number}
                  </button>
                ))}
              </div>

              {/* Selected Phase */}
              {phases.map((phase, phaseIndex) => phaseIndex === selectedPhaseIndex && (
                <div key={phaseIndex} className="space-y-4">
                  {/* Phase Info Bar */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex-1">
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(phaseIndex, 'name', e.target.value)}
                        placeholder="Phase name"
                        className="border-0 bg-transparent font-semibold text-lg p-0 h-auto focus-visible:ring-0"
                      />
                      <p className="text-sm text-slate-500 mt-1">{phase.duration_weeks} weeks duration</p>
                    </div>
                    {phases.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhase(phaseIndex)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Weekly Calendar View */}
                  <div className="grid grid-cols-7 gap-4 lg:gap-6">
                    {phase.daily_schedule?.map((day, dayIndex) => (
                      <div 
                        key={dayIndex}
                        className={cn(
                          "bg-white rounded-xl border-2 overflow-hidden",
                          day.type === 'training' && "border-purple-200",
                          day.type === 'rest' && "border-slate-200 bg-slate-50",
                          day.type === 'conditioning' && "border-blue-200"
                        )}
                      >
                        {/* Day Header */}
                        <div className={cn(
                          "p-3 border-b-2",
                          day.type === 'training' && "bg-purple-50 border-purple-200",
                          day.type === 'rest' && "bg-slate-100 border-slate-200",
                          day.type === 'conditioning' && "bg-blue-50 border-blue-200"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-bold text-slate-600">
                              {day.day.substring(0, 3).toUpperCase()}
                            </div>
                            {day.type !== 'rest' && day.exercises?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                   setCopySource({ phaseIndex, dayIndex });
                                   setCopyPhase(phase);
                                   setShowCopyDialog(true);
                                 }}
                                className="text-slate-400 hover:text-purple-600 transition-colors"
                                title="Copy to another day"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <MobileSelect
                            label="Day Type"
                            value={day.type}
                            onChange={(e) => updateDaySchedule(phaseIndex, dayIndex, 'type', e.target.value)}
                            options={[
                              { value: 'training', label: 'Training' },
                              { value: 'rest', label: 'Rest' },
                              { value: 'conditioning', label: 'Conditioning' },
                            ]}
                            className="text-xs"
                          />
                        </div>

                        {/* Exercises */}
                        <div className="p-3 space-y-3 min-h-[280px] text-[12px]">
                          {day.type !== 'rest' ? (
                            <>
                              {day.exercises?.map((exercise, exerciseIndex) => (
                                <div key={exerciseIndex} className="p-2 rounded-lg bg-slate-50 group relative transition-colors">
                                  <div className="flex gap-1 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => removeDayExercise(phaseIndex, dayIndex, exerciseIndex)}
                                      className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center"
                                    >
                                      <span className="text-xs">×</span>
                                    </button>
                                  </div>
                                  <div className="font-medium text-slate-700 mb-1">
                                    {exercise.name || 'Unnamed'}
                                  </div>
                                  <div className="text-[9px] text-slate-500 space-y-0.5">
                                    <div>{exercise.sets}×{exercise.reps}</div>
                                  </div>
                                  {exercise.description && (
                                    <div className="text-[9px] text-slate-400 mb-1 line-clamp-1">
                                      {exercise.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addDayExercise(phaseIndex, dayIndex)}
                                className="w-full py-1.5 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-colors text-[10px] font-medium"
                              >
                                + Add Exercise
                              </button>
                            </>
                          ) : (
                            <div className="text-center py-8 text-slate-400 text-[10px]">
                              Rest Day
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phase Details Section */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
                    <div className="space-y-2">
                      <Label>Duration (weeks)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={phase.duration_weeks}
                        onChange={(e) => updatePhase(phaseIndex, 'duration_weeks', parseInt(e.target.value))}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={phase.description || ''}
                        onChange={(e) => updatePhase(phaseIndex, 'description', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    {/* Exit Criteria */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-teal-500" />
                          Exit Criteria
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => addExitCriterion(phaseIndex)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {phase.exit_criteria?.map((criteria, criteriaIndex) => (
                        <div key={criteriaIndex} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={criteria.criterion}
                              onChange={(e) => updateExitCriterion(phaseIndex, criteriaIndex, 'criterion', e.target.value)}
                              placeholder="Criterion"
                              className="rounded-lg"
                            />
                            <Input
                              value={criteria.target_value}
                              onChange={(e) => updateExitCriterion(phaseIndex, criteriaIndex, 'target_value', e.target.value)}
                              placeholder="Target value"
                              className="rounded-lg"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExitCriterion(phaseIndex, criteriaIndex)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl(`PatientDetail?id=${planData.patient_id}`)}>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Copy Day Dialog */}
        {showCopyDialog && copySource && copyPhase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Copy Exercises</h3>
                <button
                  onClick={() => {
                    setShowCopyDialog(false);
                    setCopySource(null);
                    setCopyPhase(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Copy exercises from <strong>{copyPhase.daily_schedule[copySource.dayIndex].day}</strong> to:
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {copyPhase.daily_schedule.map((day, dayIndex) => (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => {
                      copyDayToAnotherDay(dayIndex);
                      setShowCopyDialog(false);
                      setCopySource(null);
                      setCopyPhase(null);
                    }}
                    disabled={dayIndex === copySource.dayIndex || day.type === 'rest'}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all font-medium",
                      dayIndex === copySource.dayIndex
                        ? "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50 text-slate-500"
                        : day.type === 'rest'
                        ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-50 text-slate-500"
                        : "border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50 cursor-pointer"
                    )}
                  >
                    <div>{day.day.substring(0, 3)}</div>
                    <div className="text-xs text-slate-400 capitalize mt-1">{day.type}</div>
                  </button>
                ))}
              </div>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowCopyDialog(false);
                  setCopySource(null);
                  setCopyPhase(null);
                }}
                className="w-full mt-4 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
