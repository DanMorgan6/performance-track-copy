import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DayNotesEditor from '@/components/patient/DayNotesEditor';
import ExerciseVideoPreview from '@/components/exercise/ExerciseVideoPreview';
import ExercisePerformanceForm from '@/components/patient/ExercisePerformanceForm';
import StandardExerciseCompletionForm from '@/components/patient/StandardExerciseCompletionForm';
import PatientSessionSummary from '@/components/patient/PatientSessionSummary';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Info, TestTube, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getMonitoringLevel, resolveExerciseTrackingMode } from '@/lib/planModes';
import { parsePrescriptionReps } from '@/lib/trainingMetrics';

export default function DayDetail({ day, dayIndex, currentPhase, plan, onBack, onPrevious, onNext, hasPrevious = false, hasNext = false, patient, selectedDate = null, milestones = [] }) {
  const queryClient = useQueryClient();
  const dateStr = day?.date || new Date().toISOString().split('T')[0];

  const { data: dayNote } = useQuery({
    queryKey: ['day-notes', dateStr],
    queryFn: async () => {
      if (!patient?.id) return null;
      const results = await base44.entities.DayNote.filter({
        patient_id: patient.id,
        date: dateStr
      });
      return results.length > 0 ? results[0] : null;
    },
    enabled: !!patient?.id
  });

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const { data: dayExerciseLogs = [] } = useQuery({
    queryKey: ['day-exercise-logs', patient?.id, dateStr],
    queryFn: async () => {
      if (!patient?.id || !dateStr) return [];
      return base44.entities.ExerciseLog.filter({
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        date: dateStr
      });
    },
    enabled: !!patient?.id && !!dateStr
  });
  const { data: exerciseHistory = [] } = useQuery({
    queryKey: ['exercise-history', patient?.clinic_id, patient?.id],
    queryFn: () => base44.entities.ExerciseLog.filter({
      patient_id: patient.id,
      clinic_id: patient.clinic_id,
    }, '-date', 200),
    enabled: !!patient?.id && !!patient?.clinic_id,
  });

  const completedNames = new Set(
    (dayExerciseLogs || []).map((l) => l.exercise_name).filter(Boolean)
  );

  const createExerciseLogMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLog.create({
      ...data,
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      plan_id: currentPhase?.plan_id,
      phase_id: currentPhase?.is_basic ? undefined : currentPhase?.id,
      date: dateStr
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['day-exercise-logs'] });
      setShowLogDialog(false);
      setSelectedExercise(null);
      toast({ title: 'Exercise logged', description: 'Your performance has been saved.' });
    },
    onError: (error) => {
      toast({
        title: 'Could not save exercise log',
        description: String(error?.message || error || 'Please try again.'),
        variant: 'destructive',
      });
    }
  });

  const openExerciseLog = (exercise) => {
    setSelectedExercise(exercise);
    setShowLogDialog(true);
  };

  const quickCompleteExercise = (exercise) => {
    const previous = exerciseHistory.find((entry) => entry.exercise_name === exercise.name && entry.date !== dateStr);
    const previousSets = (previous?.working_sets || []).filter((set) => set.completed !== false);
    const plannedSetCount = Math.max(1, Number(exercise.sets) || 1);
    const plannedReps = parsePrescriptionReps(exercise.reps);
    const plannedLoad = Number.parseFloat(exercise.weight) || 0;
    const workingSets = Array.from({ length: previousSets.length || plannedSetCount }, (_, index) => {
      const prior = previousSets[index] || previousSets[0];
      return {
        set_number: index + 1,
        completed: true,
        reps: Number(prior?.reps) || plannedReps,
        external_load: Number(prior?.external_load) || plannedLoad,
        technique_acceptable: true,
        rom_acceptable: true,
        pain_limited: false,
      };
    });
    const totalReps = workingSets.reduce((sum, set) => sum + set.reps, 0);
    const volume = workingSets.reduce((sum, set) => sum + (set.reps * set.external_load), 0);
    const averageLoad = workingSets.reduce((sum, set) => sum + set.external_load, 0) / workingSets.length;

    createExerciseLogMutation.mutate({
      exercise_name: exercise.name,
      exercise_key: [exercise.name, exercise.side || 'not_applicable'].join(' | '),
      movement_type: averageLoad > 0 ? 'dynamic_external_load' : 'bodyweight',
      side: exercise.side || 'not_applicable',
      load_unit: averageLoad > 0 ? 'kg' : 'bodyweight',
      working_sets: workingSets,
      planned_sets: plannedSetCount,
      planned_reps: exercise.reps || '',
      planned_weight: exercise.weight || '',
      sets_completed: workingSets.length,
      reps_completed: String(totalReps),
      weight: averageLoad,
      volume_load: volume,
      hard_sets: 0,
      estimated_strength_confidence: 'not_eligible',
      pain_during: 0,
      pain_limited: false,
      technique_acceptable: true,
      rom_acceptable: true,
      modified: false,
      completed: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        {onPrevious || onNext ? (
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="h-11 w-11 rounded-xl border border-slate-200 disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 text-center">
              <h2 className="truncate text-xl font-bold text-slate-800">{day?.day || 'Day Details'}</h2>
              <p className="text-sm text-slate-500 capitalize">{day?.type ? `${day.type} Day` : ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!hasNext}
              className="h-11 w-11 rounded-xl border border-slate-200 disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-lg"
              aria-label="Back to calendar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{day?.day || (selectedDate ? format(new Date(selectedDate), 'EEEE') : 'Day Details')}</h2>
              <p className="text-sm text-slate-500 capitalize">{day?.type ? `${day.type} Day` : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Testing Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 border-b-2 border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <TestTube className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">{milestone.title}</h3>
                    {milestone.notes && (
                      <p className="text-sm text-blue-700 mt-1">{milestone.notes}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Planned Tests</h4>
                {milestone.tests.map((test, testIdx) => (
                  <div key={testIdx} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-800">{test.test_name}</h5>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {test.category}
                          </Badge>
                          {test.expected_benchmark && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              Target: {test.expected_benchmark}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {test.notes && (
                      <p className="text-sm text-slate-600 mb-2">{test.notes}</p>
                    )}

                    {/* Show outcomes if published */}
                    {milestone.outcomes_published && test.outcome_value && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600">Result</span>
                          {test.outcome_status === 'pass' && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pass
                            </Badge>
                          )}
                          {test.outcome_status === 'fail' && (
                            <Badge className="bg-rose-100 text-rose-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Fail
                            </Badge>
                          )}
                          {test.outcome_status === 'partial' && (
                            <Badge className="bg-amber-100 text-amber-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Partial
                            </Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {test.outcome_value} {test.outcome_unit}
                        </div>
                        {test.outcome_notes && (
                          <p className="text-sm text-slate-600 mt-2">{test.outcome_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercises List */}
      {day && day.type !== 'rest' && day.exercises && day.exercises.length > 0 ? (
        <div className="space-y-3">
          {day.exercises.map((exercise, index) => {
            const isCompleted = completedNames.has(exercise.name);
            const trackingMode = resolveExerciseTrackingMode(exercise, plan);
            return (
            <div key={index} className={cn(
              "bg-white rounded-2xl border-2 overflow-hidden transition-all",
              isCompleted ? "border-emerald-200" : exercise.superset_group ? "border-amber-200" : "border-slate-100"
            )}>
              {/* Exercise Header */}
              <div className={cn(
                "p-4 border-b-2",
                exercise.superset_group ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {exercise.superset_group && (
                      <div className="text-xs font-bold text-amber-600 mb-1">
                        Superset {exercise.superset_group}{exercise.superset_position}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                      {exercise.name}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </h3>
                    {exercise.description && (
                      <p className="text-sm text-slate-600 mt-1">{exercise.description}</p>
                    )}
                  </div>
                  {exercise.video_url && (
                    <ExerciseVideoPreview
                      videoUrl={exercise.video_url}
                      thumbnailUrl={exercise.thumbnail_url}
                      exerciseName={exercise.name}
                      variant="button"
                    />
                  )}
                </div>
              </div>

              {/* Exercise Details */}
              <div className="p-4 space-y-3">
                {/* Main Parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Sets:</span>
                    <span className="text-lg font-bold text-slate-800">{exercise.sets}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Reps:</span>
                    <span className="text-lg font-bold text-slate-800">{exercise.reps}</span>
                  </div>
                </div>

                {/* Additional Parameters */}
                {(exercise.weight || exercise.hold || exercise.tempo || exercise.duration || exercise.rest || exercise.rpe) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {exercise.weight && (
                      <div className="text-sm">
                        <span className="text-slate-500">Weight:</span>
                        <span className="ml-2 font-medium text-blue-600">{exercise.weight}</span>
                      </div>
                    )}
                    {exercise.hold && (
                      <div className="text-sm">
                        <span className="text-slate-500">Hold:</span>
                        <span className="ml-2 font-medium text-purple-600">{exercise.hold}</span>
                      </div>
                    )}
                    {exercise.tempo && (
                      <div className="text-sm">
                        <span className="text-slate-500">Tempo:</span>
                        <span className="ml-2 font-medium text-green-600">{exercise.tempo}</span>
                      </div>
                    )}
                    {exercise.duration && (
                      <div className="text-sm">
                        <span className="text-slate-500">Duration:</span>
                        <span className="ml-2 font-medium text-orange-600">{exercise.duration}</span>
                      </div>
                    )}
                    {exercise.rest && (
                      <div className="text-sm">
                        <span className="text-slate-500">Rest:</span>
                        <span className="ml-2 font-medium text-slate-600">{exercise.rest}</span>
                      </div>
                    )}
                    {exercise.rpe && (
                      <div className="text-sm">
                        <span className="text-slate-500">RPE:</span>
                        <span className="ml-2 font-medium text-rose-600">{exercise.rpe}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Clinician Notes */}
                {exercise.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-blue-800 mb-1">Coach's Notes</div>
                        <p className="text-sm text-blue-700">{exercise.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monitoring follows the plan default, with clinician overrides per exercise. */}
                {trackingMode === 'basic' ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => isCompleted ? openExerciseLog(exercise) : quickCompleteExercise(exercise)}
                      disabled={createExerciseLogMutation.isPending}
                      className={cn(
                        "w-full rounded-xl mt-2",
                        isCompleted
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      )}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isCompleted ? "Completed — adjust details" : "Mark complete"}
                    </Button>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => openExerciseLog(exercise)}
                        className="w-full text-xs font-medium text-slate-500 underline-offset-4 hover:text-purple-700 hover:underline"
                      >
                        Change load, repetitions or report a problem
                      </button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => openExerciseLog(exercise)}
                    className={cn(
                      "w-full rounded-xl mt-2",
                      isCompleted
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    )}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isCompleted ? "Completed — Log Again" : trackingMode === 'performance' ? "Log Performance" : "Log Completion"}
                  </Button>
                )}
              </div>
            </div>
            );
          })}

          {getMonitoringLevel(plan) === 'performance' && (
            <PatientSessionSummary
              patient={patient}
              planId={currentPhase?.plan_id}
              phaseId={currentPhase?.is_basic ? undefined : currentPhase?.id}
              date={dateStr}
            />
          )}

          {/* Day Notes */}
          {showNotes ? (
            <DayNotesEditor
              dayNote={dayNote}
              date={dateStr}
              patientId={patient.id}
              planId={currentPhase?.plan_id}
              clinicId={patient.clinic_id}
              onSave={() => {
                setShowNotes(false);
                queryClient.invalidateQueries({ queryKey: ['day-notes'] });
              }}
              onCancel={() => setShowNotes(false)}
            />
          ) : dayNote ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              {dayNote.clinician_note && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Clinician Note</p>
                  <p className="text-sm text-blue-800">{dayNote.clinician_note}</p>
                </div>
              )}
              {dayNote.patient_note && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Patient Note</p>
                  <p className="text-sm text-blue-800">{dayNote.patient_note}</p>
                </div>
              )}
              <button
                onClick={() => setShowNotes(true)}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Edit Notes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNotes(true)}
              className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-700 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 transition-colors"
            >
              + Add Day Notes
            </button>
          )}
        </div>
      ) : day && day.type === 'rest' ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Rest Day</h3>
          <p className="text-slate-500">Take today to recover and let your body heal.</p>
        </div>
      ) : !day && milestones.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Activities Scheduled</h3>
          <p className="text-slate-500">Nothing planned for this day.</p>
        </div>
      ) : null}

      {/* Exercise performance log */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="performance-shell max-w-2xl border-white/10 bg-[#171719] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Log exercise performance</DialogTitle>
          </DialogHeader>
          {selectedExercise && resolveExerciseTrackingMode(selectedExercise, plan) === 'performance' ? (
            <ExercisePerformanceForm
              key={selectedExercise.name}
              exercise={selectedExercise}
              patient={patient}
              onSubmit={(data) => createExerciseLogMutation.mutate(data)}
              isSaving={createExerciseLogMutation.isPending}
            />
          ) : selectedExercise ? (
            <StandardExerciseCompletionForm
              key={selectedExercise.name}
              exercise={selectedExercise}
              patient={patient}
              onSubmit={(data) => createExerciseLogMutation.mutate(data)}
              isSaving={createExerciseLogMutation.isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}