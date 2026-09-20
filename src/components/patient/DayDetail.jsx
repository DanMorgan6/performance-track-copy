import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DayNotesEditor from '@/components/patient/DayNotesEditor';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, CheckCircle, Info, TestTube, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

export default function DayDetail({ day, dayIndex, currentPhase, onBack, patient, selectedDate = null, milestones = [] }) {
  const queryClient = useQueryClient();
  const dateStr = day ? day.date : new Date().toISOString().split('T')[0];

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
  const [logData, setLogData] = useState({
    sets_completed: 0,
    reps_completed: '',
    weight: 0,
    pain_during: 0,
    pain_after: 0,
    difficulty: 'appropriate',
    notes: '',
    completed: false
  });

  const createExerciseLogMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLog.create({
      ...data,
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      plan_id: currentPhase?.plan_id,
      phase_id: currentPhase?.is_basic ? undefined : currentPhase?.id,
      date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exercises'] });
      setShowLogDialog(false);
      setSelectedExercise(null);
      setLogData({
        sets_completed: 0,
        reps_completed: '',
        weight: 0,
        pain_during: 0,
        pain_after: 0,
        difficulty: 'appropriate',
        notes: '',
        completed: false
      });
    }
  });

  const handleLogExercise = (exercise) => {
    setSelectedExercise(exercise);
    setLogData({
      ...logData,
      sets_completed: exercise.sets || 0,
      reps_completed: exercise.reps || '',
      exercise_name: exercise.name
    });
    setShowLogDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">{day?.day || (selectedDate ? format(new Date(selectedDate), 'EEEE') : 'Day Details')}</h2>
            <p className="text-sm text-slate-500 capitalize">{day?.type ? `${day.type} Day` : ''}</p>
          </div>
        </div>
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
          {day.exercises.map((exercise, index) => (
            <div key={index} className={cn(
              "bg-white rounded-2xl border-2 overflow-hidden transition-all",
              exercise.superset_group ? "border-amber-200" : "border-slate-100"
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
                    <h3 className="text-lg font-semibold text-slate-800">{exercise.name}</h3>
                    {exercise.description && (
                      <p className="text-sm text-slate-600 mt-1">{exercise.description}</p>
                    )}
                  </div>
                  {exercise.video_url && (
                    <a 
                      href={exercise.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      <Play className="w-4 h-4" />
                      Video
                    </a>
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

                {/* Log Exercise Button */}
                <Button
                  onClick={() => handleLogExercise(exercise)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl mt-2"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Log Completion
                </Button>
              </div>
            </div>
          ))}

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

      {/* Exercise Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <h4 className="font-semibold text-slate-800">{selectedExercise?.name}</h4>
              <p className="text-sm text-slate-500 mt-1">
                Target: {selectedExercise?.sets} sets × {selectedExercise?.reps} reps
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sets Completed</Label>
                <Input
                  type="number"
                  value={logData.sets_completed}
                  onChange={(e) => setLogData({...logData, sets_completed: parseInt(e.target.value)})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Reps Completed</Label>
                <Input
                  value={logData.reps_completed}
                  onChange={(e) => setLogData({...logData, reps_completed: e.target.value})}
                  placeholder="e.g., 10"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>How Difficult?</Label>
              <select
                value={logData.difficulty}
                onChange={(e) => setLogData({...logData, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="too_easy">Too Easy</option>
                <option value="appropriate">Just Right</option>
                <option value="challenging">Challenging</option>
                <option value="too_hard">Too Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={logData.notes}
                onChange={(e) => setLogData({...logData, notes: e.target.value})}
                placeholder="How did it feel? Any issues?"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLogDialog(false);
                  setSelectedExercise(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createExerciseLogMutation.mutate(logData)}
                disabled={createExerciseLogMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {createExerciseLogMutation.isPending ? 'Saving...' : 'Save Log'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}