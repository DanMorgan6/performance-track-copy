import React from 'react';
import { format } from 'date-fns';
import { Activity, AlertCircle, ClipboardList, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PatientProgressTimeline({ 
  exerciseLogs = [], 
  painLogs = [], 
  outcomeMeasures = [],
  dailyNotes = [],
  limit = 20 
}) {
  // Combine all logs into a single timeline
  const allLogs = [
    ...exerciseLogs.map(log => ({ ...log, type: 'exercise', date: log.date, time: log.created_date })),
    ...painLogs.map(log => ({ ...log, type: 'pain', date: log.date, time: log.created_date })),
    ...outcomeMeasures.map(log => ({ ...log, type: 'outcome', date: log.completed_date, time: log.completed_date })),
    ...dailyNotes.map(log => ({ ...log, type: 'note', date: log.date, time: log.created_date }))
  ].sort((a, b) => new Date(b.time || b.date) - new Date(a.time || a.date))
    .slice(0, limit);

  if (allLogs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No progress logs yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allLogs.map((log, idx) => {
        if (log.type === 'exercise') {
          return (
            <div key={`ex-${idx}`} className="flex gap-3 p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-800">{log.exercise_name}</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                  {log.sets_completed && <span>Sets: {log.sets_completed}</span>}
                  {log.sets_completed && log.reps_completed && <span>•</span>}
                  {log.reps_completed && <span>Reps: {log.reps_completed}</span>}
                  {log.difficulty && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        log.difficulty === 'too_easy' && "bg-blue-100 text-blue-700",
                        log.difficulty === 'appropriate' && "bg-emerald-100 text-emerald-700",
                        log.difficulty === 'challenging' && "bg-amber-100 text-amber-700",
                        log.difficulty === 'too_hard' && "bg-rose-100 text-rose-700"
                      )}>
                        {log.difficulty.replace('_', ' ')}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full",
                    log.pain_during <= 3 && "bg-emerald-100 text-emerald-700",
                    log.pain_during > 3 && log.pain_during <= 6 && "bg-amber-100 text-amber-700",
                    log.pain_during > 6 && "bg-rose-100 text-rose-700"
                  )}>
                    Pain during: {log.pain_during}/10
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full",
                    log.pain_after <= 3 && "bg-emerald-100 text-emerald-700",
                    log.pain_after > 3 && log.pain_after <= 6 && "bg-amber-100 text-amber-700",
                    log.pain_after > 6 && "bg-rose-100 text-rose-700"
                  )}>
                    Pain after: {log.pain_after}/10
                  </span>
                </div>
                {log.notes && (
                  <p className="text-sm text-slate-600 mt-2 italic">&ldquo;{log.notes}&rdquo;</p>
                )}
              </div>
            </div>
          );
        }

        if (log.type === 'pain') {
          return (
            <div key={`pain-${idx}`} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                log.pain_level <= 3 && "bg-emerald-100",
                log.pain_level > 3 && log.pain_level <= 6 && "bg-amber-100",
                log.pain_level > 6 && "bg-rose-100"
              )}>
                <AlertCircle className={cn(
                  "w-5 h-5",
                  log.pain_level <= 3 && "text-emerald-600",
                  log.pain_level > 3 && log.pain_level <= 6 && "text-amber-600",
                  log.pain_level > 6 && "text-rose-600"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-800">Pain Log</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    log.pain_level <= 3 && "bg-emerald-100 text-emerald-700",
                    log.pain_level > 3 && log.pain_level <= 6 && "bg-amber-100 text-amber-700",
                    log.pain_level > 6 && "bg-rose-100 text-rose-700"
                  )}>
                    Pain: {log.pain_level}/10
                  </span>
                  {log.pain_location && <span>• {log.pain_location}</span>}
                  {log.pain_type && <span>• {log.pain_type}</span>}
                  {log.time_of_day && <span>• {log.time_of_day}</span>}
                </div>
                {log.notes && (
                  <p className="text-sm text-slate-600 mt-2 italic">&ldquo;{log.notes}&rdquo;</p>
                )}
              </div>
            </div>
          );
        }

        if (log.type === 'outcome' && log.status === 'completed') {
          return (
            <div key={`outcome-${idx}`} className="flex gap-3 p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-800">Outcome Measure Completed</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.completed_date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-blue-600">{log.total_score}</span>
                  <span className="text-sm text-slate-500">points</span>
                </div>
              </div>
            </div>
          );
        }

        if (log.type === 'note') {
          return (
            <div key={`note-${idx}`} className="flex gap-3 p-4 bg-teal-50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-800">Daily Check-In</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(log.date), 'MMM d')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  {log.mood && (
                    <span className="px-2 py-0.5 bg-white rounded-full capitalize">
                      {log.mood}
                    </span>
                  )}
                  {log.energy_level && (
                    <span className="px-2 py-0.5 bg-white rounded-full">
                      Energy: {log.energy_level}/10
                    </span>
                  )}
                  {log.sleep_quality && (
                    <span className="px-2 py-0.5 bg-white rounded-full capitalize">
                      Sleep: {log.sleep_quality}
                    </span>
                  )}
                </div>
                {log.notes && (
                  <p className="text-sm text-slate-600 mt-2 italic">&ldquo;{log.notes}&rdquo;</p>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}