import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Zap, Moon, TestTube, CheckCircle2, ClipboardList } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getWeekScheduleForDate } from '@/components/plan/PhaseProgressionEngine';
import CalendarFilterToggle from './CalendarFilterToggle';
import InterventionBadge from './InterventionBadge';

export default function MonthlyCalendarView({ 
  currentPhase,
  plan,
  milestones = [], 
  exerciseLogs = [],
  interventions = [],
  outcomeMeasures = [],
  checkins = [],
  onDayClick,
  onAddMilestone,
  showAddMilestone = false,
  startDate 
}) {
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  const [filters, setFilters] = useState({ 
    plan: true, 
    interventions: true, 
    prompts: true, 
    checkins: true 
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get day info from plan using progression engine (handles auto-repeat)
  const getDayInfo = (date) => {
    if (!currentPhase?.weeks) return null;

    const dayName = format(date, 'EEEE');
    
    // Use progression engine if we have plan data
    if (plan) {
      const weekSchedule = getWeekScheduleForDate(currentPhase, plan, date);
      if (!weekSchedule) return null;
      return weekSchedule.daily_schedule?.find(d => d.day === dayName);
    }

    // Fallback to old logic
    const planStartDate = startDate ? new Date(startDate) : monthStart;
    const daysSinceStart = Math.floor((date - planStartDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStart < 0) return null;

    const weekIndex = Math.floor(daysSinceStart / 7);
    const week = currentPhase.weeks[weekIndex];
    if (!week) return null;

    const daySchedule = week.daily_schedule?.find(d => d.day === dayName);
    return daySchedule;
  };

  // Get milestones for a specific date
  const getDayMilestones = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return milestones.filter(m => m.date === dateStr);
  };

  // Get interventions for a specific date
  const getDayInterventions = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return interventions.filter(i => i.intervention_date === dateStr);
  };

  // Get PROMs for a specific date
  const getDayOutcomeMeasures = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return outcomeMeasures.filter(o => o.sent_date === dateStr);
  };

  // Get check-ins for a specific date
  const getDayCheckins = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return checkins.filter(c => c.date === dateStr);
  };

  // Check completion status
  const getDayCompletion = (date, dayInfo) => {
    if (!dayInfo || dayInfo.type === 'rest') return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = exerciseLogs.filter(log => log.date === dateStr);
    const exerciseCount = dayInfo.exercises?.length || 0;
    
    if (exerciseCount === 0) return null;
    
    const completedCount = dayLogs.length;
    return {
      total: exerciseCount,
      completed: completedCount,
      isComplete: completedCount >= exerciseCount
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6">
      {/* Filter Toggle */}
      <CalendarFilterToggle filters={filters} onChange={setFilters} />

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-lg h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-lg text-xs md:text-sm h-8 md:h-9"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-lg h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
          <span className="text-slate-600">Training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-100 border border-cyan-300"></div>
          <span className="text-slate-600">Conditioning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div>
          <span className="text-slate-600">Rest</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-slate-500 py-1 md:py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((day, index) => {
          const dayInfo = getDayInfo(day);
          const dayMilestones = getDayMilestones(day);
          const dayInterventions = getDayInterventions(day);
          const dayOutcomeMeasures = getDayOutcomeMeasures(day);
          const dayCheckins = getDayCheckins(day);
          const completion = getDayCompletion(day, dayInfo);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <button
              key={index}
              onClick={() => onDayClick && onDayClick(day, dayInfo, dayMilestones, dayInterventions, dayOutcomeMeasures, dayCheckins)}
              className={cn(
                "relative min-h-[70px] md:min-h-[90px] p-1.5 md:p-2 rounded-lg border transition-all",
                !isCurrentMonth && "bg-slate-50/50 border-slate-100 opacity-40",
                isCurrentMonth && dayInfo?.type === 'training' && "bg-purple-50 border-purple-300 hover:bg-purple-100 hover:shadow-md",
                isCurrentMonth && dayInfo?.type === 'conditioning' && "bg-cyan-50 border-cyan-300 hover:bg-cyan-100 hover:shadow-md",
                isCurrentMonth && dayInfo?.type === 'rest' && "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:shadow-md",
                isCurrentMonth && !dayInfo && "bg-white border-slate-200 hover:border-slate-300",
                isDayToday && "ring-2 ring-purple-500 ring-offset-1"
              )}
            >
              {/* Date & Status */}
              <div className="flex items-start justify-between mb-1">
                <div className={cn(
                  "text-xs md:text-sm font-bold",
                  !isCurrentMonth && "text-slate-300",
                  isCurrentMonth && dayInfo?.type === 'training' && "text-purple-700",
                  isCurrentMonth && dayInfo?.type === 'conditioning' && "text-cyan-700",
                  isCurrentMonth && dayInfo?.type === 'rest' && "text-slate-500",
                  isCurrentMonth && !dayInfo && "text-slate-600",
                  isDayToday && "text-purple-600"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Completion Badge */}
                {isCurrentMonth && completion && (
                  <div className={cn(
                    "flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full",
                    completion.isComplete 
                      ? "bg-emerald-500" 
                      : "bg-amber-400"
                  )}>
                    {completion.isComplete ? (
                      <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                    ) : (
                      <span className="text-[8px] md:text-[9px] font-bold text-white">
                        {completion.completed}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Day Content */}
              {isCurrentMonth && (
                <div className="space-y-1">
                  {/* Day Type Icon */}
                  {dayInfo && (
                    <div className="flex items-center gap-1">
                      {dayInfo.type === 'training' && (
                        <div className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600" />
                          <span className="text-[9px] md:text-[10px] font-medium text-purple-700">
                            {dayInfo.exercises?.length || 0}
                          </span>
                        </div>
                      )}
                      {dayInfo.type === 'conditioning' && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-600" />
                          <span className="text-[9px] md:text-[10px] font-medium text-cyan-700">
                            {dayInfo.exercises?.length || 0}
                          </span>
                        </div>
                      )}
                      {dayInfo.type === 'rest' && (
                        <div className="flex items-center gap-1">
                          <Moon className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                          <span className="text-[9px] md:text-[10px] text-slate-500">Rest</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges Row */}
                  <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                    {/* Milestones */}
                    {filters.prompts && dayMilestones.length > 0 && (
                      <div className="flex items-center gap-0.5 bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                        <TestTube className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[9px] font-medium">
                          {dayMilestones.length}
                        </span>
                      </div>
                    )}
                    {/* Interventions */}
                    {filters.interventions && dayInterventions.length > 0 && (
                      <InterventionBadge interventions={dayInterventions} />
                    )}
                    {/* PROMs */}
                    {filters.prompts && dayOutcomeMeasures.length > 0 && (
                      <div className="flex items-center gap-0.5 bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                        <ClipboardList className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[9px] font-medium">
                          {dayOutcomeMeasures.length}
                        </span>
                      </div>
                    )}
                    {/* Check-ins */}
                    {filters.checkins && dayCheckins.length > 0 && (
                      <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 text-white">
                        <span className="text-[8px] md:text-[9px] font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Add Milestone Button - Desktop Only */}
                  {showAddMilestone && onAddMilestone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddMilestone(day);
                      }}
                      className="hidden md:flex w-full text-[9px] text-slate-400 hover:text-purple-600 items-center justify-center gap-1 py-1 mt-1 border border-dashed border-slate-200 rounded hover:border-purple-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}