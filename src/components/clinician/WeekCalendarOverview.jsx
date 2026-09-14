import React, { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, Dumbbell } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function WeekCalendarOverview({
  currentPhase,
  plan,
  exerciseLogs,
  patientOutcomeMeasures,
  interventions,
  dayNotes,
  onDayClick
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  if (!currentPhase || !currentPhase.weeks || currentPhase.weeks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
        <p className="text-slate-500">No weekly schedule available</p>
      </div>
    );
  }

  const currentWeek = currentPhase.weeks[0]; // Show current week by default
  const planStartDate = new Date(plan.start_date);
  const weekStartDate = startOfWeek(new Date(planStartDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000));

  const getDayData = (dayIndex) => {
    const dayInfo = currentWeek.daily_schedule?.[dayIndex];
    const dateStr = format(addDays(weekStartDate, dayIndex), 'yyyy-MM-dd');
    
    const dayExerciseLogs = exerciseLogs.filter(log => log.date === dateStr);
    const dayOutcomeMeasures = patientOutcomeMeasures.filter(o => o.sent_date === dateStr);
    const dayInterventions = interventions.filter(i => i.intervention_date === dateStr);
    const dayNote = dayNotes.find(n => n.date === dateStr);

    return {
      dayInfo,
      dateStr,
      dayExerciseLogs,
      dayOutcomeMeasures,
      dayInterventions,
      dayNote,
      badges: [
        dayNote && { icon: 'note', label: 'Note' },
        dayOutcomeMeasures.length > 0 && { icon: 'prom', label: 'PROM' },
        dayInterventions.length > 0 && { icon: 'intervention', label: 'Intervention' },
        dayExerciseLogs.length > 0 && { icon: 'exercise', label: 'Logged' }
      ].filter(Boolean)
    };
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-800">Week Overview</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">
            {format(weekStartDate, 'MMM d')} - {format(addDays(weekStartDate, 6), 'MMM d')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid - 7 Columns with breathing room */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
          const data = getDayData(dayIndex);
          const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
          const dayDate = format(addDays(weekStartDate, dayIndex), 'd');
          const isRestDay = data.dayInfo?.type === 'rest';

          return (
            <button
              key={dayIndex}
              onClick={() => onDayClick?.(addDays(weekStartDate, dayIndex), data.dayInfo, data)}
              className={cn(
                'p-4 rounded-2xl transition-all border-2 cursor-pointer min-h-[160px] flex flex-col items-center justify-center',
                isRestDay 
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50'
              )}
            >
              {/* Day Header */}
              <div className="text-center mb-3 pb-3 border-b border-slate-200 w-full">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{dayName}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{dayDate}</p>
              </div>

              {/* Day Content */}
              <div className="flex flex-col items-center gap-2 w-full">
                {isRestDay ? (
                  <p className="text-xs text-slate-500 font-medium">Rest</p>
                ) : (
                  <>
                    {/* Exercise Count */}
                    {data.dayInfo?.exercises && data.dayInfo.exercises.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg text-xs">
                        <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-blue-700 font-semibold">
                          {data.dayInfo.exercises.length}
                        </span>
                      </div>
                    )}

                    {/* Badges - Dots */}
                    {data.badges.length > 0 && (
                      <div className="flex gap-1.5 justify-center mt-1">
                        {data.badges.map((badge, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'w-2 h-2 rounded-full',
                              badge.icon === 'note' && 'bg-blue-500',
                              badge.icon === 'prom' && 'bg-purple-500',
                              badge.icon === 'intervention' && 'bg-teal-500',
                              badge.icon === 'exercise' && 'bg-emerald-500'
                            )}
                            title={badge.label}
                          />
                        ))}
                      </div>
                    )}

                    {/* Completion Status */}
                    {data.dayExerciseLogs.length > 0 && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-1" />
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Day Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>PROM Sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span>Intervention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Exercises Logged</span>
        </div>
      </div>
    </div>
  );
}