import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPractitioner } from '@/lib/roles';
import PhasePanel from '@/components/programme/PhasePanel';
import DayCard from '@/components/programme/DayCard';
import DayEditor from '@/components/programme/DayEditor';
import ExerciseLibraryPanel from '@/components/programme/ExerciseLibraryPanel';
import WeeklyStats from '@/components/programme/WeeklyStats';
import { buildProgressionSessionBlock } from '@/components/programme/progressionBlockUtils';

const DEFAULT_DAY = (dayName) => ({
  day: dayName,
  emphasis: dayName === 'Saturday' || dayName === 'Sunday' ? 'rest' : 'strength',
  session_title: '',
  duration: '',
  load_target: '',
  session_note: '',
  blocks: [],
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function createDefaultWeek() {
  return DAYS.map(DEFAULT_DAY);
}

export default function WeeklyProgrammeBuilder() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patient_id');
  const planId = urlParams.get('plan_id');
  const phaseId = urlParams.get('phase_id');

  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [weekDays, setWeekDays] = useState(createDefaultWeek());
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Security check
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!isPractitioner(user)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    });
  }, []);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => base44.entities.Patient.filter({ id: patientId }).then(r => r[0]),
    enabled: !!patientId
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', patientId],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.RehabPlan.filter({ patient_id: patientId, clinic_id: user.clinic_id }, '-created_date');
    },
    enabled: !!patientId
  });

  const activePlan = plans.find(p => p.status === 'active') || plans[0];

  const { data: phases = [] } = useQuery({
    queryKey: ['phases', activePlan?.id],
    queryFn: () => base44.entities.RehabPhase.filter({ plan_id: activePlan.id }),
    enabled: !!activePlan?.id
  });

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ExerciseLibrary.filter({ clinic_id: user.clinic_id }, '-created_date');
    }
  });

  const { data: progressionBlocks = [] } = useQuery({
    queryKey: ['progression-blocks'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ProgressionBlock.filter({ clinic_id: user.clinic_id, is_active: true }, 'name');
    }
  });

  const activePhase = phases[currentPhaseIndex] || null;

  // Load phase week data into editor when phase changes
  useEffect(() => {
    if (activePhase?.weeks?.[weekIndex]?.daily_schedule) {
      const loaded = activePhase.weeks[weekIndex].daily_schedule;
      setWeekDays(DAYS.map((dayName, i) => {
        const saved = loaded.find(d => d.day === dayName);
        return saved ? { ...DEFAULT_DAY(dayName), ...saved } : DEFAULT_DAY(dayName);
      }));
    } else {
      setWeekDays(createDefaultWeek());
    }
  }, [activePhase?.id, weekIndex]);

  const updatePhaseWeekMutation = useMutation({
    mutationFn: async () => {
      if (!activePhase?.id) return;
      const weeks = [...(activePhase.weeks || [])];
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = { week_number: weekIndex + 1, daily_schedule: [] };
      }
      weeks[weekIndex] = { ...weeks[weekIndex], daily_schedule: weekDays };
      await base44.entities.RehabPhase.update(activePhase.id, { weeks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', activePlan?.id] });
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePhaseWeekMutation.mutateAsync();
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex, updated) => {
    const days = [...weekDays];
    days[dayIndex] = updated;
    setWeekDays(days);
  };

  const updateEmphasis = (dayIndex, emphasis) => {
    updateDay(dayIndex, { ...weekDays[dayIndex], emphasis });
  };

  const handleCriteriaToggle = async (criteriaIndex) => {
    if (!activePhase) return;
    const updatedCriteria = [...(activePhase.exit_criteria || [])];
    updatedCriteria[criteriaIndex] = {
      ...updatedCriteria[criteriaIndex],
      is_met: !updatedCriteria[criteriaIndex].is_met
    };
    await base44.entities.RehabPhase.update(activePhase.id, { exit_criteria: updatedCriteria });
    queryClient.invalidateQueries({ queryKey: ['phases', activePlan?.id] });
  };

  const addExerciseToDay = (libraryExercise) => {
    if (selectedDayIndex === null) return;
    const day = weekDays[selectedDayIndex];
    const blocks = [...(day.blocks || [])];
    blocks.push({
      type: 'straight',
      exercises: [{
        name: libraryExercise.name,
        sets: String(libraryExercise.default_sets || 3),
        reps: libraryExercise.default_reps || '10',
        tempo: '',
        rest: '60s',
        notes: libraryExercise.description || '',
        video_url: libraryExercise.video_url || '',
        thumbnail_url: libraryExercise.thumbnail_url || '',
      }],
      rest_after: '',
      note: libraryExercise.description || '',
    });
    updateDay(selectedDayIndex, { ...day, emphasis: day.emphasis === 'rest' ? 'strength' : day.emphasis, blocks });
  };

  const addProgressionLevelToDay = (progressionBlock, level, levelIndex) => {
    if (selectedDayIndex === null || !(level.exercises || []).length) return;
    const day = weekDays[selectedDayIndex];
    const block = buildProgressionSessionBlock(progressionBlock, level, levelIndex);
    updateDay(selectedDayIndex, {
      ...day,
      emphasis: day.emphasis === 'rest' ? 'strength' : day.emphasis,
      blocks: [...(day.blocks || []), block],
    });
  };

  const totalWeeks = activePhase?.duration_weeks || 1;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl(patientId ? `PatientDetail?id=${patientId}` : 'CoachDashboard')}
              className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-slate-700 border border-transparent hover:border-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Weekly Programme Builder</h1>
              {patient && <p className="text-xs text-slate-500">{patient.full_name} {activePlan ? `· ${activePlan.title}` : ''}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Phase selector */}
            {phases.length > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => { setCurrentPhaseIndex(Math.max(0, currentPhaseIndex - 1)); setWeekIndex(0); }}
                  disabled={currentPhaseIndex === 0}
                  className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-1">Phase {currentPhaseIndex + 1}/{phases.length}</span>
                <button
                  onClick={() => { setCurrentPhaseIndex(Math.min(phases.length - 1, currentPhaseIndex + 1)); setWeekIndex(0); }}
                  disabled={currentPhaseIndex === phases.length - 1}
                  className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Week selector */}
            {totalWeeks > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
                  disabled={weekIndex === 0}
                  className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-1">Week {weekIndex + 1}/{totalWeeks}</span>
                <button
                  onClick={() => setWeekIndex(Math.min(totalWeeks - 1, weekIndex + 1))}
                  disabled={weekIndex === totalWeeks - 1}
                  className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !activePhase}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm"
              size="sm"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Week
            </Button>
          </div>
        </div>

        {/* No plan state */}
        {!activePlan && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mb-6">
            <p className="text-slate-500 text-sm">No active rehabilitation plan found.</p>
            {patientId && (
              <Link to={createPageUrl(`CreatePlan?patient_id=${patientId}`)}>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl" size="sm">
                  Create Plan
                </Button>
              </Link>
            )}
          </div>
        )}

        {activePlan && (
          <>
            {/* Phase Panel */}
            <PhasePanel
              phase={activePhase}
              phases={phases}
              currentPhaseIndex={currentPhaseIndex}
              onCriteriaToggle={handleCriteriaToggle}
            />

            {/* Weekly Stats */}
            <WeeklyStats days={weekDays} />

            {/* Weekly Day Row */}
            <div className="grid grid-cols-7 gap-2 lg:gap-3 mb-5">
              {weekDays.map((day, i) => (
                <DayCard
                  key={i}
                  day={day}
                  dayIndex={i}
                  isSelected={selectedDayIndex === i}
                  onSelect={setSelectedDayIndex}
                  onEmphasisChange={updateEmphasis}
                />
              ))}
            </div>

            {/* Bottom Two-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              {/* Left: Exercise Library */}
              <div className="h-[600px] lg:h-[680px]">
                <ExerciseLibraryPanel
                  exercises={libraryExercises}
                  progressionBlocks={progressionBlocks}
                  onAddExercise={addExerciseToDay}
                  onAddProgressionLevel={addProgressionLevelToDay}
                  selectedDayIndex={selectedDayIndex}
                />
              </div>

              {/* Right: Day Editor */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[600px] lg:h-[680px]">
                <DayEditor
                  day={selectedDayIndex !== null ? weekDays[selectedDayIndex] : null}
                  dayIndex={selectedDayIndex}
                  phase={activePhase}
                  onUpdate={(updated) => selectedDayIndex !== null && updateDay(selectedDayIndex, updated)}
                  onClose={() => setSelectedDayIndex(null)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
