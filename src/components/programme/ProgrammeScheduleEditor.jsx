import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import PhasePanel from '@/components/programme/PhasePanel';
import DayCard from '@/components/programme/DayCard';
import DayEditor from '@/components/programme/DayEditor';
import ExerciseLibraryPanel from '@/components/programme/ExerciseLibraryPanel';
import WeeklyStats from '@/components/programme/WeeklyStats';
import { buildProgressionSessionBlock, mergeProgressionExitCriteria } from '@/components/programme/progressionBlockUtils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_DAY = (dayName) => ({
  day: dayName,
  emphasis: dayName === 'Saturday' || dayName === 'Sunday' ? 'rest' : 'strength',
  session_title: '',
  duration: '',
  load_target: '',
  session_note: '',
  blocks: [],
});

function createDefaultWeekDays() {
  return DAYS.map(DEFAULT_DAY);
}

// Converts the phases[].weeks[].daily_schedule format (old) into the new block-based format
function normalizeDaySchedule(schedule) {
  return DAYS.map((dayName) => {
    const saved = schedule?.find(d => d.day === dayName);
    if (!saved) return DEFAULT_DAY(dayName);
    // If already in new format (has blocks), use it directly
    if (saved.blocks) return { ...DEFAULT_DAY(dayName), ...saved };
    // Legacy format: convert exercises array to a single straight block
    const exercises = saved.exercises || [];
    return {
      ...DEFAULT_DAY(dayName),
      ...saved,
      emphasis: saved.type === 'rest' ? 'rest' : saved.type === 'conditioning' ? 'cardio' : 'strength',
      blocks: exercises.length > 0 ? [{
        type: 'straight',
        exercises: exercises.map(ex => ({
          name: ex.name || '',
          sets: String(ex.sets || 3),
          reps: ex.reps || '10',
          tempo: ex.tempo || '',
          rest: ex.rest || '60s',
          weight: ex.weight || '',
          hold: ex.hold || '',
          duration: ex.duration || '',
          notes: ex.notes || '',
          video_url: ex.video_url || '',
        })),
        rest_after: '',
        note: '',
      }] : [],
    };
  });
}

// Converts block-based day format back to the legacy daily_schedule format for saving
function denormalizeDaySchedule(weekDays) {
  return weekDays.map(day => {
    const exercises = [];
    (day.blocks || []).forEach(block => {
      (block.exercises || []).forEach(ex => exercises.push(ex));
    });
    return {
      day: day.day,
      type: day.emphasis === 'rest' ? 'rest' : day.emphasis === 'cardio' ? 'conditioning' : 'training',
      exercises,
      // Also persist new-format fields for WeeklyProgrammeBuilder compatibility
      emphasis: day.emphasis,
      session_title: day.session_title || '',
      duration: day.duration || '',
      load_target: day.load_target || '',
      session_note: day.session_note || '',
      blocks: day.blocks || [],
    };
  });
}

export default function ProgrammeScheduleEditor({
  phases,
  setPhases,
  libraryExercises = [],
  progressionBlocks = [],
  selectedPhaseIndex,
  setSelectedPhaseIndex,
  selectedWeekIndex,
  setSelectedWeekIndex,
  onAddPhase,
  onRemovePhase,
  onUpdatePhase,
  onAddExitCriterion,
  onUpdateExitCriterion,
  onRemoveExitCriterion,
}) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [copiedDay, setCopiedDay] = useState(null);

  const selectedPhaseIndexRef = useRef(selectedPhaseIndex);
  useEffect(() => { selectedPhaseIndexRef.current = selectedPhaseIndex; }, [selectedPhaseIndex]);
  const selectedWeekIndexRef = useRef(selectedWeekIndex);
  useEffect(() => { selectedWeekIndexRef.current = selectedWeekIndex; }, [selectedWeekIndex]);

  const activePhase = phases[selectedPhaseIndex] || null;
  const totalWeeks = activePhase?.duration_weeks || 1;

  // Get current week days in block-based format
  const currentWeekDays = useMemo(() => {
    const savedSchedule = activePhase?.weeks?.[selectedWeekIndex]?.daily_schedule;
    if (savedSchedule) return normalizeDaySchedule(savedSchedule);
    return createDefaultWeekDays();
  }, [activePhase, selectedWeekIndex]);

  const updateDay = (dayIndex, updated) => {
    const phaseIdx = selectedPhaseIndexRef.current;
    const weekIdx = selectedWeekIndexRef.current;

    setPhases(prev => {
      const newPhases = [...prev];
      const phase = { ...newPhases[phaseIdx] };
      const weeks = [...(phase.weeks || [])];
      if (!weeks[weekIdx]) {
        weeks[weekIdx] = { week_number: weekIdx + 1, daily_schedule: createDefaultWeekDays().map(d => ({ ...d, type: 'training', exercises: [] })) };
      }
      const savedSchedule = weeks[weekIdx]?.daily_schedule;
      const latestWeekDays = savedSchedule ? normalizeDaySchedule(savedSchedule) : createDefaultWeekDays();
      const newDays = [...latestWeekDays];
      newDays[dayIndex] = updated;
      weeks[weekIdx] = {
        ...weeks[weekIdx],
        daily_schedule: denormalizeDaySchedule(newDays),
      };
      phase.weeks = weeks;
      newPhases[phaseIdx] = phase;
      return newPhases;
    });
  };

  const updateEmphasis = (dayIndex, emphasis) => {
    const phaseIdx = selectedPhaseIndexRef.current;
    const weekIdx = selectedWeekIndexRef.current;
    setPhases(prev => {
      const newPhases = [...prev];
      const phase = { ...newPhases[phaseIdx] };
      const weeks = [...(phase.weeks || [])];
      if (!weeks[weekIdx]) {
        weeks[weekIdx] = { week_number: weekIdx + 1, daily_schedule: createDefaultWeekDays().map(d => ({ ...d, type: 'training', exercises: [] })) };
      }
      const savedSchedule = weeks[weekIdx]?.daily_schedule;
      const latestWeekDays = savedSchedule ? normalizeDaySchedule(savedSchedule) : createDefaultWeekDays();
      const newDays = [...latestWeekDays];
      newDays[dayIndex] = { ...latestWeekDays[dayIndex], emphasis };
      weeks[weekIdx] = { ...weeks[weekIdx], daily_schedule: denormalizeDaySchedule(newDays) };
      phase.weeks = weeks;
      newPhases[phaseIdx] = phase;
      return newPhases;
    });
  };

  const addExerciseToDay = (libraryExercise) => {
    if (selectedDayIndex === null) return;
    const phaseIdx = selectedPhaseIndexRef.current;
    const weekIdx = selectedWeekIndexRef.current;
    const dayIdx = selectedDayIndex;
    setPhases(prev => {
      const newPhases = [...prev];
      const phase = { ...newPhases[phaseIdx] };
      const weeks = [...(phase.weeks || [])];
      if (!weeks[weekIdx]) {
        weeks[weekIdx] = { week_number: weekIdx + 1, daily_schedule: createDefaultWeekDays().map(d => ({ ...d, type: 'training', exercises: [] })) };
      }
      const savedSchedule = weeks[weekIdx]?.daily_schedule;
      const latestWeekDays = savedSchedule ? normalizeDaySchedule(savedSchedule) : createDefaultWeekDays();
      const day = latestWeekDays[dayIdx];
      const blocks = [...(day.blocks || []), {
        type: 'straight',
        exercises: [{
          name: libraryExercise.name,
          sets: String(libraryExercise.default_sets || 3),
          reps: libraryExercise.default_reps || '10',
          tempo: '', rest: '60s', weight: '', hold: '', duration: '',
          notes: libraryExercise.description || '',
          video_url: libraryExercise.video_url || '',
        }],
        rest_after: '',
        note: '',
      }];
      const newDays = [...latestWeekDays];
      newDays[dayIdx] = { ...day, blocks };
      weeks[weekIdx] = { ...weeks[weekIdx], daily_schedule: denormalizeDaySchedule(newDays) };
      phase.weeks = weeks;
      newPhases[phaseIdx] = phase;
      return newPhases;
    });
  };

  const addProgressionLevelToDay = (progressionBlock, level, levelIndex) => {
    if (selectedDayIndex === null || !(level.exercises || []).length) return;
    const phaseIdx = selectedPhaseIndexRef.current;
    const weekIdx = selectedWeekIndexRef.current;
    const dayIdx = selectedDayIndex;

    setPhases(prev => {
      const newPhases = [...prev];
      const phase = { ...newPhases[phaseIdx] };
      const weeks = [...(phase.weeks || [])];
      if (!weeks[weekIdx]) {
        weeks[weekIdx] = { week_number: weekIdx + 1, daily_schedule: createDefaultWeekDays().map(d => ({ ...d, type: 'training', exercises: [] })) };
      }
      const savedSchedule = weeks[weekIdx]?.daily_schedule;
      const latestWeekDays = savedSchedule ? normalizeDaySchedule(savedSchedule) : createDefaultWeekDays();
      const day = latestWeekDays[dayIdx];
      const blocks = [
        ...(day.blocks || []),
        buildProgressionSessionBlock(progressionBlock, level, levelIndex),
      ];
      const newDays = [...latestWeekDays];
      newDays[dayIdx] = { ...day, emphasis: day.emphasis === 'rest' ? 'strength' : day.emphasis, blocks };
      weeks[weekIdx] = { ...weeks[weekIdx], daily_schedule: denormalizeDaySchedule(newDays) };
      phase.weeks = weeks;
      phase.exit_criteria = mergeProgressionExitCriteria(
        phase.exit_criteria || [],
        level.exit_criteria || []
      );
      newPhases[phaseIdx] = phase;
      return newPhases;
    });
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId !== 'exercise-library') return;
    if (selectedDayIndex === null) return;

    const exerciseId = draggableId.replace('library-', '');
    const exercise = libraryExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newExercise = {
      name: exercise.name,
      sets: String(exercise.default_sets || 3),
      reps: exercise.default_reps || '10',
      tempo: '',
      rest: '60s',
      weight: '',
      hold: '',
      duration: '',
      notes: exercise.description || '',
      video_url: exercise.video_url || '',
    };

    // Drop onto an existing block (block-{index})
    if (destination.droppableId.startsWith('block-')) {
      const blockIdx = parseInt(destination.droppableId.replace('block-', ''), 10);
      const phaseIdx = selectedPhaseIndexRef.current;
      const weekIdx = selectedWeekIndexRef.current;
      const dayIdx = selectedDayIndex;
      setPhases(prev => {
        const newPhases = [...prev];
        const phase = { ...newPhases[phaseIdx] };
        const weeks = [...(phase.weeks || [])];
        if (!weeks[weekIdx]) return prev;
        const savedSchedule = weeks[weekIdx]?.daily_schedule;
        const latestWeekDays = savedSchedule ? normalizeDaySchedule(savedSchedule) : createDefaultWeekDays();
        const day = latestWeekDays[dayIdx];
        const blocks = [...(day.blocks || [])];
        if (!blocks[blockIdx]) return prev;
        const block = { ...blocks[blockIdx] };
        const exercises = [...(block.exercises || []), newExercise];
        blocks[blockIdx] = { ...block, exercises };
        const newDays = [...latestWeekDays];
        newDays[dayIdx] = { ...day, blocks };
        weeks[weekIdx] = { ...weeks[weekIdx], daily_schedule: denormalizeDaySchedule(newDays) };
        phase.weeks = weeks;
        newPhases[phaseIdx] = phase;
        return newPhases;
      });
      return;
    }

    // Drop onto the generic day drop zone — create a new straight block
    if (destination.droppableId === 'day-editor-drop') {
      addExerciseToDay(exercise);
    }
  };

  const handleCriteriaToggle = (criteriaIndex) => {
    const phase = phases[selectedPhaseIndex];
    const updatedCriteria = [...(phase.exit_criteria || [])];
    updatedCriteria[criteriaIndex] = {
      ...updatedCriteria[criteriaIndex],
      is_met: !updatedCriteria[criteriaIndex].is_met,
    };
    onUpdatePhase(selectedPhaseIndex, 'exit_criteria', updatedCriteria);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className="space-y-5">
      {/* Phase Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {phases.map((phase, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setSelectedPhaseIndex(i); setSelectedWeekIndex(0); setSelectedDayIndex(null); }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              selectedPhaseIndex === i
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            Phase {i + 1}
          </button>
        ))}
        <Button type="button" onClick={onAddPhase} variant="outline" size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Add Phase
        </Button>
        {phases.length > 1 && (
          <Button
            type="button"
            onClick={() => { onRemovePhase(selectedPhaseIndex); setSelectedPhaseIndex(Math.max(0, selectedPhaseIndex - 1)); }}
            variant="outline"
            size="sm"
            className="rounded-xl text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Remove Phase
          </Button>
        )}
      </div>

      {activePhase && (
        <>
          {/* Phase Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Phase Name</Label>
                <Input
                  value={activePhase.name}
                  onChange={(e) => onUpdatePhase(selectedPhaseIndex, 'name', e.target.value)}
                  placeholder="e.g. Phase 1: Acute Recovery"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (weeks)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={activePhase.duration_weeks}
                  onChange={(e) => onUpdatePhase(selectedPhaseIndex, 'duration_weeks', parseInt(e.target.value) || 1)}
                  className="rounded-xl"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Phase Description</Label>
                <Textarea
                  value={activePhase.description}
                  onChange={(e) => onUpdatePhase(selectedPhaseIndex, 'description', e.target.value)}
                  placeholder="Goals and focus of this phase..."
                  className="rounded-xl"
                  rows={2}
                />
              </div>
            </div>

            {/* Exit Criteria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exit Criteria</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => onAddExitCriterion(selectedPhaseIndex)} className="rounded-lg text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Criterion
                </Button>
              </div>
              <div className="space-y-2">
                {(activePhase.exit_criteria || []).map((criterion, ci) => (
                  <div key={ci} className="flex gap-2 items-center">
                    <Input
                      value={criterion.criterion}
                      onChange={(e) => onUpdateExitCriterion(selectedPhaseIndex, ci, 'criterion', e.target.value)}
                      placeholder="e.g. Pain ≤ 3/10 at rest"
                      className="rounded-xl flex-1"
                    />
                    <Input
                      value={criterion.target_value}
                      onChange={(e) => onUpdateExitCriterion(selectedPhaseIndex, ci, 'target_value', e.target.value)}
                      placeholder="Target"
                      className="rounded-xl w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveExitCriterion(selectedPhaseIndex, ci)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase Panel Summary */}
          <PhasePanel
            phase={activePhase}
            phases={phases}
            currentPhaseIndex={selectedPhaseIndex}
            onCriteriaToggle={handleCriteriaToggle}
          />

          {/* Week Selector */}
          {totalWeeks > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setSelectedWeekIndex(Math.max(0, selectedWeekIndex - 1)); setSelectedDayIndex(null); }}
                disabled={selectedWeekIndex === 0}
                className="p-1.5 hover:bg-white rounded-lg disabled:opacity-40 border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">Week {selectedWeekIndex + 1} / {totalWeeks}</span>
              <button
                type="button"
                onClick={() => { setSelectedWeekIndex(Math.min(totalWeeks - 1, selectedWeekIndex + 1)); setSelectedDayIndex(null); }}
                disabled={selectedWeekIndex === totalWeeks - 1}
                className="p-1.5 hover:bg-white rounded-lg disabled:opacity-40 border border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Weekly Stats */}
          <WeeklyStats days={currentWeekDays} />

          {/* Day Cards Row */}
          <div className="grid grid-cols-7 gap-2 lg:gap-3">
            {currentWeekDays.map((day, i) => (
              <DayCard
                key={i}
                day={day}
                dayIndex={i}
                isSelected={selectedDayIndex === i}
                onSelect={setSelectedDayIndex}
                onEmphasisChange={updateEmphasis}
                onCopy={() => setCopiedDay(JSON.parse(JSON.stringify(day)))}
                onPaste={copiedDay ? () => updateDay(i, { ...JSON.parse(JSON.stringify(copiedDay)), day: day.day }) : null}
                hasCopied={!!copiedDay}
              />
            ))}
          </div>

          {/* Bottom Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <div className="h-[600px] lg:h-[680px]">
              <ExerciseLibraryPanel
                exercises={libraryExercises}
                progressionBlocks={progressionBlocks}
                onAddExercise={addExerciseToDay}
                onAddProgressionLevel={addProgressionLevelToDay}
                selectedDayIndex={selectedDayIndex}
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[600px] lg:h-[680px]">
              <DayEditor
                day={selectedDayIndex !== null ? currentWeekDays[selectedDayIndex] : null}
                dayIndex={selectedDayIndex}
                phase={activePhase}
                onUpdate={(updated) => selectedDayIndex !== null && updateDay(selectedDayIndex, updated)}
                onClose={() => setSelectedDayIndex(null)}
                allDays={currentWeekDays}
                weekNumber={selectedWeekIndex}
                libraryExercises={libraryExercises}
                onCopyDay={selectedDayIndex !== null ? () => setCopiedDay(JSON.parse(JSON.stringify(currentWeekDays[selectedDayIndex]))) : null}
                onPasteDay={copiedDay && selectedDayIndex !== null ? () => updateDay(selectedDayIndex, { ...JSON.parse(JSON.stringify(copiedDay)), day: currentWeekDays[selectedDayIndex].day }) : null}
                hasCopiedDay={!!copiedDay}
              />
            </div>
          </div>
        </>
      )}
    </div>
    </DragDropContext>
  );
}