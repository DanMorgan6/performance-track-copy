import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WeeklyPlanView({ currentPhase }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Convert Sunday=0 to Sunday=6
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  
  if (!currentPhase) return null;

  // Get the weekly schedule from the exact phase structure saved by clinician
  const getWeeklySchedule = () => {
    // NEW: Check if phase has weeks structure (multi-week phases)
    if (currentPhase.weeks && currentPhase.weeks.length > 0) {
      const currentWeek = currentPhase.weeks[selectedWeekIndex] || currentPhase.weeks[0];
      if (currentWeek.daily_schedule && currentWeek.daily_schedule.length > 0) {
        return currentWeek.daily_schedule.map(day => ({
          day: day.day,
          type: day.type,
          exercises: day.exercises || []
        }));
      }
    }
    
    // Fallback: If phase has daily_schedule directly (older format)
    if (currentPhase.daily_schedule && currentPhase.daily_schedule.length > 0) {
      return currentPhase.daily_schedule.map(day => ({
        day: day.day,
        type: day.type,
        exercises: day.exercises || []
      }));
    }
    
    // Fallback: Split exercises across Mon/Wed/Fri (legacy)
    const allExercises = currentPhase.exercises || [];
    const exercisesPerDay = Math.ceil(allExercises.length / 3);
    
    return [
      { day: 'Monday', type: 'training', exercises: allExercises.slice(0, exercisesPerDay) },
      { day: 'Tuesday', type: 'rest', exercises: [] },
      { day: 'Wednesday', type: 'training', exercises: allExercises.slice(exercisesPerDay, exercisesPerDay * 2) },
      { day: 'Thursday', type: 'rest', exercises: [] },
      { day: 'Friday', type: 'training', exercises: allExercises.slice(exercisesPerDay * 2) },
      { day: 'Saturday', type: 'rest', exercises: [] },
      { day: 'Sunday', type: 'rest', exercises: [] }
    ];
  };

  const schedule = getWeeklySchedule();
  const hasMultipleWeeks = currentPhase.weeks && currentPhase.weeks.length > 1;
  const selectedDay = schedule[selectedDayIndex];
  const currentDate = addDays(weekStart, selectedDayIndex);
  const todayExercises = selectedDay.exercises;

  const goToPreviousDay = () => {
    setSelectedDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
  };

  const goToNextDay = () => {
    setSelectedDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
  };

  const typeIcons = {
    'training': Dumbbell,
    'rest': Calendar,
    'conditioning': Zap
  };

  const typeColors = {
    'training': 'bg-purple-50 text-purple-700 border-purple-200',
    'rest': 'bg-slate-50 text-slate-500 border-slate-200',
    'conditioning': 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const TypeIcon = typeIcons[selectedDay.type] || Calendar;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Weekly Training Plan</h3>
        {hasMultipleWeeks && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekIndex(Math.max(0, selectedWeekIndex - 1))}
              disabled={selectedWeekIndex === 0}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-slate-600">
              Week {selectedWeekIndex + 1}/{currentPhase.weeks.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekIndex(Math.min(currentPhase.weeks.length - 1, selectedWeekIndex + 1))}
              disabled={selectedWeekIndex === currentPhase.weeks.length - 1}
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Day Selector */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
          className="rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <div className="text-sm text-slate-500">
            {format(currentDate, 'EEEE')}
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {format(currentDate, 'MMM d, yyyy')}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          className="rounded-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Overview */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {schedule.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          const isSelected = index === selectedDayIndex;
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                isSelected && "bg-purple-100 border-2 border-purple-500",
                !isSelected && day.type === 'rest' && "bg-slate-50",
                !isSelected && day.type === 'training' && "bg-purple-50",
                !isSelected && day.type === 'conditioning' && "bg-blue-50",
                isToday && !isSelected && "ring-2 ring-purple-300"
              )}
            >
              <div className="text-xs text-slate-500 font-medium">
                {day.day}
              </div>
              <div className="text-sm font-semibold mt-1">
                {format(dayDate, 'd')}
              </div>
              {day.type !== 'rest' && day.exercises.length > 0 && (
                <div className="text-[10px] text-purple-600 font-medium mt-1">
                  {day.exercises.length} ex
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Details */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <TypeIcon className={cn(
              "w-6 h-6",
              selectedDay.type === 'training' && "text-purple-600",
              selectedDay.type === 'conditioning' && "text-blue-600",
              selectedDay.type === 'rest' && "text-slate-400"
            )} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-lg">{selectedDay.day}</h4>
            <p className="text-sm text-slate-600">
              {selectedDay.type === 'rest' ? 'Rest and recovery day' : 
               selectedDay.type === 'conditioning' ? 'Conditioning day' :
               `${todayExercises.length} exercise${todayExercises.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Exercise List */}
        {todayExercises.length > 0 ? (
          <div className="space-y-2">
            {todayExercises.map((exercise, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                   {exercise.superset_group && (
                     <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                       {exercise.superset_group}{exercise.superset_position}
                     </span>
                   )}
                   <p className="font-medium text-slate-800">{exercise.name}</p>
                 </div>
                 {exercise.description && (
                   <p className="text-xs text-slate-600 mt-1">{exercise.description}</p>
                 )}
                 <div className="flex flex-wrap items-center gap-2 mt-2">
                   <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                     {exercise.sets} × {exercise.reps}
                   </span>
                   {exercise.weight && (
                     <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                       ⚖️ {exercise.weight}
                     </span>
                   )}
                   {exercise.hold && (
                     <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                       ⏱️ {exercise.hold}
                     </span>
                   )}
                   {exercise.tempo && (
                     <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                       🔄 {exercise.tempo}
                     </span>
                   )}
                   {exercise.duration && (
                     <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                       ⏳ {exercise.duration}
                     </span>
                   )}
                   {exercise.frequency && (
                     <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                       {exercise.frequency}
                     </span>
                   )}
                 </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Rest Day</p>
            <p className="text-sm text-slate-400 mt-1">No exercises scheduled - Focus on recovery</p>
          </div>
        )}
      </div>
    </div>
  );
}