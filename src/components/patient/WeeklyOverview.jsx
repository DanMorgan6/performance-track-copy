import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getWeekScheduleForDate } from '@/components/plan/PhaseProgressionEngine';

export default function WeeklyOverview({ currentPhase, plan, onDayClick, exerciseLogs = [] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  
  if (!currentPhase?.weeks || currentPhase.weeks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
        <p className="text-slate-400">No weekly schedule available</p>
      </div>
    );
  }

  // Calculate the target date for this week offset
  const weekStartDate = startOfWeek(addDays(new Date(), weekOffset * 7));
  
  // Get week data using progression engine (handles auto-repeat)
  const currentWeek = plan 
    ? getWeekScheduleForDate(currentPhase, plan, weekStartDate)
    : currentPhase.weeks[weekOffset] || currentPhase.weeks[0];
  
  const hasMultipleWeeks = currentPhase.weeks.length > 1;

  // Get today's day name
  const today = format(new Date(), 'EEEE');
  
  // Calculate completion status for each day
  const todayStr = new Date().toISOString().split('T')[0];
  const recentLogs = exerciseLogs.filter(log => {
    const daysDiff = (Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });

  return (
     <div className="space-y-4">
       {/* Week Navigation */}
       {hasMultipleWeeks && (
         <div className="bg-white rounded-lg md:rounded-2xl p-3 md:p-4 border border-slate-100 flex items-center justify-between gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
             disabled={weekOffset === 0}
             className="rounded-lg text-xs md:text-sm"
           >
             <ChevronLeft className="w-3 md:w-4 h-3 md:h-4" />
             <span className="hidden sm:inline ml-1">Previous</span>
           </Button>
           <span className="text-xs md:text-sm font-semibold text-slate-700">
             Week {currentWeek.week_number}/{currentPhase.weeks.length}
           </span>
           <Button
             variant="outline"
             size="sm"
             onClick={() => setWeekOffset(Math.min(currentPhase.weeks.length - 1, weekOffset + 1))}
             disabled={weekOffset === currentPhase.weeks.length - 1}
             className="rounded-lg text-xs md:text-sm"
           >
             <span className="hidden sm:inline mr-1">Next</span>
             <ChevronRight className="w-3 md:w-4 h-3 md:h-4" />
           </Button>
         </div>
       )}

       {/* Weekly Grid - Desktop, Horizontal Scroll - Mobile */}
       <div className="hidden md:grid md:grid-cols-7 gap-3 lg:gap-4">
        {currentWeek.daily_schedule?.map((day, dayIndex) => {
          const isToday = day.day === today;
          const exerciseCount = day.exercises?.length || 0;
          
          // Check completion for this day
          const dayLogs = recentLogs.filter(log => {
            const logDay = format(new Date(log.date), 'EEEE');
            return logDay === day.day;
          });
          const completedCount = dayLogs.length;
          const isCompleted = exerciseCount > 0 && completedCount >= exerciseCount;
          
          return (
            <button
              key={dayIndex}
              onClick={() => onDayClick(day, dayIndex)}
              className={cn(
                "bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg",
                day.type === 'training' && "border-purple-200 hover:border-purple-400",
                day.type === 'rest' && "border-slate-200 bg-slate-50",
                day.type === 'conditioning' && "border-blue-200 hover:border-blue-400",
                isToday && "ring-2 ring-purple-500 ring-offset-2"
              )}
            >
              {/* Day Header */}
              <div className={cn(
                "p-3 border-b-2",
                day.type === 'training' && "bg-purple-50 border-purple-200",
                day.type === 'rest' && "bg-slate-100 border-slate-200",
                day.type === 'conditioning' && "bg-blue-50 border-blue-200"
              )}>
                <div className="text-xs font-bold text-slate-600 text-center">
                  {day.day.substring(0, 3).toUpperCase()}
                </div>
                {isToday && (
                  <div className="text-[9px] text-purple-600 font-semibold text-center mt-0.5">
                    TODAY
                  </div>
                )}
              </div>

              {/* Day Summary */}
              <div className="p-3 min-h-[100px] flex flex-col items-center justify-center">
                {day.type !== 'rest' ? (
                  <>
                    <div className="text-2xl font-bold text-slate-700 mb-1">
                      {exerciseCount}
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">
                      {exerciseCount === 1 ? 'exercise' : 'exercises'}
                    </div>
                    {isCompleted ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-4 h-4" />
                        <span className="text-[9px] font-medium">Complete</span>
                      </div>
                    ) : completedCount > 0 ? (
                      <div className="text-[9px] text-amber-600 font-medium">
                        {completedCount}/{exerciseCount}
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400">
                        Not started
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400 text-[10px]">
                    Rest Day
                  </div>
                )}
              </div>
            </button>
          );
          })}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden -mx-3 px-3 overflow-x-auto">
          <div className="flex gap-2 pb-2">
          {currentWeek.daily_schedule?.map((day, dayIndex) => {
            const isToday = day.day === today;
            const exerciseCount = day.exercises?.length || 0;

            const dayLogs = recentLogs.filter(log => {
              const logDay = format(new Date(log.date), 'EEEE');
              return logDay === day.day;
            });
            const completedCount = dayLogs.length;
            const isCompleted = exerciseCount > 0 && completedCount >= exerciseCount;

            return (
              <button
                key={dayIndex}
                onClick={() => onDayClick(day, dayIndex)}
                className={cn(
                  "flex-shrink-0 w-20 bg-white rounded-lg border-2 overflow-hidden transition-all",
                  day.type === 'training' && "border-purple-200",
                  day.type === 'rest' && "border-slate-200 bg-slate-50",
                  day.type === 'conditioning' && "border-blue-200",
                  isToday && "ring-2 ring-purple-500 ring-offset-2"
                )}
              >
                {/* Day Header */}
                <div className={cn(
                  "p-2 border-b-2 text-center",
                  day.type === 'training' && "bg-purple-50 border-purple-200",
                  day.type === 'rest' && "bg-slate-100 border-slate-200",
                  day.type === 'conditioning' && "bg-blue-50 border-blue-200"
                )}>
                  <div className="text-xs font-bold text-slate-600">
                    {day.day.substring(0, 1).toUpperCase()}
                  </div>
                  {isToday && (
                    <div className="text-[8px] text-purple-600 font-semibold">
                      NOW
                    </div>
                  )}
                </div>

                {/* Day Summary */}
                <div className="p-2 flex flex-col items-center justify-center gap-1">
                  {day.type !== 'rest' ? (
                    <>
                      <div className="text-lg font-bold text-slate-700">
                        {exerciseCount}
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-0.5 text-emerald-600">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : completedCount > 0 ? (
                        <div className="text-[8px] text-amber-600 font-medium">
                          {completedCount}/{exerciseCount}
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-400 text-[9px] font-medium">
                      Rest
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          </div>
          </div>
          </div>
          );
          }