import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from 'lucide-react';
import { cn } from "@/lib/utils";

const FREQUENCY_PATTERNS = {
  2: { days: ['Tuesday', 'Friday'], label: '2x/week (Tue, Fri)' },
  3: { days: ['Monday', 'Wednesday', 'Friday'], label: '3x/week (Mon, Wed, Fri)' },
  4: { days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], label: '4x/week (Mon-Tue, Thu-Fri)' },
  7: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], label: 'Daily (Mon-Sun)' }
};

export default function BasicProgramBuilder({ 
  planData, 
  setPlanData, 
  libraryExercises = [],
  onComplete = null
}) {
  const [selectedDays, setSelectedDays] = useState(FREQUENCY_PATTERNS[3].days);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekendDays = ['Saturday', 'Sunday'];

  const handleFrequencyChange = (freq) => {
    const pattern = FREQUENCY_PATTERNS[freq];
    let days = [...pattern.days];
    
    if (freq !== 7 && planData.basic_config?.weekend_rest_days) {
      days = days.filter(d => !weekendDays.includes(d));
    }
    
    setSelectedDays(days);
    setPlanData({
      ...planData,
      basic_config: {
        ...planData.basic_config,
        frequency_per_week: freq,
        days_of_week_pattern: days
      }
    });
  };

  const handleWeekendToggle = () => {
    const newWeekendRest = !planData.basic_config?.weekend_rest_days;
    const freq = planData.basic_config?.frequency_per_week || 3;
    let days = [...FREQUENCY_PATTERNS[freq].days];
    
    if (newWeekendRest && freq !== 7) {
      days = days.filter(d => !weekendDays.includes(d));
    }
    
    setSelectedDays(days);
    setPlanData({
      ...planData,
      basic_config: {
        ...planData.basic_config,
        weekend_rest_days: newWeekendRest,
        days_of_week_pattern: days
      }
    });
  };

  const toggleDay = (day) => {
    let newDays;
    if (selectedDays.includes(day)) {
      newDays = selectedDays.filter(d => d !== day);
    } else {
      newDays = [...selectedDays, day];
    }
    
    const freq = planData.basic_config?.frequency_per_week || 3;
    if (newDays.length === freq) {
      setSelectedDays(newDays);
      setPlanData({
        ...planData,
        basic_config: {
          ...planData.basic_config,
          days_of_week_pattern: newDays
        }
      });
    }
  };

  const addExercise = (libraryExercise) => {
    const exerciseData = {
      name: libraryExercise.name,
      description: libraryExercise.description,
      sets: libraryExercise.default_sets,
      reps: libraryExercise.default_reps,
      video_url: libraryExercise.video_url
    };
    
    const bundle = planData.basic_config?.exercise_bundle || [];
    setPlanData({
      ...planData,
      basic_config: {
        ...planData.basic_config,
        exercise_bundle: [...bundle, exerciseData]
      }
    });
    
    setExerciseSearch('');
  };

  const removeExercise = (index) => {
    const bundle = planData.basic_config?.exercise_bundle || [];
    setPlanData({
      ...planData,
      basic_config: {
        ...planData.basic_config,
        exercise_bundle: bundle.filter((_, i) => i !== index)
      }
    });
  };

  const updateExercise = (index, field, value) => {
    const bundle = planData.basic_config?.exercise_bundle || [];
    const updated = [...bundle];
    updated[index] = { ...updated[index], [field]: value };
    setPlanData({
      ...planData,
      basic_config: {
        ...planData.basic_config,
        exercise_bundle: updated
      }
    });
  };

  const freq = planData.basic_config?.frequency_per_week || 3;
  const bundle = planData.basic_config?.exercise_bundle || [];

  return (
    <div className="space-y-6">
      {/* Duration */}
      <div className="space-y-2">
        <Label>Program Duration</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Start Date</Label>
            <Input
              type="date"
              value={planData.start_date}
              onChange={(e) => setPlanData({...planData, start_date: e.target.value})}
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">End Date</Label>
            <Input
              type="date"
              value={planData.target_end_date}
              onChange={(e) => setPlanData({...planData, target_end_date: e.target.value})}
              className="rounded-xl mt-1"
            />
          </div>
        </div>
      </div>

      {/* Frequency Selection */}
      <div className="space-y-3">
        <Label>Weekly Frequency</Label>
        <div className="grid grid-cols-2 gap-2">
          {[2, 3, 4, 7].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleFrequencyChange(f)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium transition-all border-2",
                freq === f
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-slate-200 text-slate-700 hover:border-purple-300"
              )}
            >
              {FREQUENCY_PATTERNS[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekend Rest Toggle */}
      {freq !== 7 && (
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={planData.basic_config?.weekend_rest_days !== false}
              onChange={handleWeekendToggle}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Rest on weekends (Sat & Sun)</span>
          </label>
        </div>
      )}

      {/* Day Selection (optional override) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Exercise Days (optional customize)</Label>
          <span className="text-xs text-slate-500">{selectedDays.length}/{freq} days</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {allDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              disabled={selectedDays.length === freq && !selectedDays.includes(day)}
              className={cn(
                "py-2 px-1 rounded-lg text-xs font-medium transition-all border",
                selectedDays.includes(day)
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-slate-200 text-slate-600 hover:border-slate-300",
                selectedDays.length === freq && !selectedDays.includes(day) && "opacity-50 cursor-not-allowed"
              )}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Bundle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercise Bundle ({bundle.length})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowExercisePicker(true)}
            className="rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Exercise
          </Button>
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          {bundle.map((exercise, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-slate-800">{exercise.name}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(idx)}
                  className="text-slate-400 hover:text-rose-500 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Sets</label>
                  <Input
                    type="number"
                    min="1"
                    value={exercise.sets || 3}
                    onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value))}
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Reps</label>
                  <Input
                    value={exercise.reps || '10'}
                    onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                    placeholder="10 or 30s"
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Weight</label>
                  <Input
                    value={exercise.weight || ''}
                    onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                    placeholder="kg/lbs"
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Hold</label>
                  <Input
                    value={exercise.hold || ''}
                    onChange={(e) => updateExercise(idx, 'hold', e.target.value)}
                    placeholder="Duration"
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Tempo</label>
                  <Input
                    value={exercise.tempo || ''}
                    onChange={(e) => updateExercise(idx, 'tempo', e.target.value)}
                    placeholder="2-1-3"
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Rest</label>
                  <Input
                    value={exercise.rest || ''}
                    onChange={(e) => updateExercise(idx, 'rest', e.target.value)}
                    placeholder="60s"
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
              </div>

              <textarea
                value={exercise.load_notes || ''}
                onChange={(e) => updateExercise(idx, 'load_notes', e.target.value)}
                placeholder="Load/technique notes..."
                className="w-full p-2 text-sm border border-slate-200 rounded-lg resize-none"
                rows="2"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Picker Dropdown */}
      {showExercisePicker && (
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="pl-9 rounded-lg h-8"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {libraryExercises
              .filter(ex => ex.name?.toLowerCase().includes(exerciseSearch.toLowerCase()))
              .slice(0, 10)
              .map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    addExercise(exercise);
                    setShowExercisePicker(false);
                  }}
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-white transition-colors"
                >
                  <div className="font-medium text-slate-800">{exercise.name}</div>
                  <div className="text-xs text-slate-500">{exercise.category} • {exercise.default_sets}×{exercise.default_reps}</div>
                </button>
              ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExercisePicker(false)}
            className="w-full h-8 text-xs"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}