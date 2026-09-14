import React from 'react';
import { format } from 'date-fns';
import { Target, Calendar, ChevronRight, ClipboardList, AlertCircle, FileText, Zap, CheckCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeekScheduleForDate } from '@/components/plan/PhaseProgressionEngine';

// ── Current Plan Card ───────────────────────────────────────────
function CurrentPlanCard({ activePlan, currentPhase, exerciseLogs, onViewToday, onViewCalendar }) {
  const today = new Date();
  const todayName = format(today, 'EEEE');
  const todayStr = today.toISOString().split('T')[0];

  const weekSchedule = activePlan && currentPhase?.weeks
    ? getWeekScheduleForDate(currentPhase, activePlan, today)
    : null;
  const todayDay = weekSchedule?.daily_schedule?.find(d => d.day === todayName);
  const dayType = todayDay?.type || (activePlan ? 'training' : null);
  const exerciseCount = todayDay?.exercises?.length || 0;
  const todayLogs = exerciseLogs.filter(l => l.date === todayStr);
  const completedCount = todayLogs.length;
  const progress = exerciseCount > 0 ? Math.round((completedCount / exerciseCount) * 100) : 0;

  const criteria = currentPhase?.exit_criteria || [];
  const metCriteria = criteria.filter(c => c.is_met).length;

  if (!activePlan) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Current Plan</h3>
        </div>
        <p className="text-slate-500 text-sm">No active plan assigned yet. Your clinician will set this up for you.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm w-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{activePlan.title}</h3>
            {currentPhase && (
              <p className="text-xs text-slate-500 mt-0.5">
                Phase {currentPhase.phase_number}: {currentPhase.name}
              </p>
            )}
          </div>
        </div>
        {dayType && (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold border",
            dayType === 'training' && "bg-purple-100 text-purple-700 border-purple-200",
            dayType === 'conditioning' && "bg-blue-100 text-blue-700 border-blue-200",
            dayType === 'rest' && "bg-slate-100 text-slate-600 border-slate-200"
          )}>
            {dayType === 'training' ? 'Strength' : dayType === 'conditioning' ? 'Conditioning' : 'Rest'} Day
          </span>
        )}
      </div>

      {/* Progress bar */}
      {exerciseCount > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Today's Progress</span>
            <span>{completedCount}/{exerciseCount} exercises</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Exit criteria */}
      {criteria.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Exit criteria: {metCriteria}/{criteria.length} met</span>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        {dayType !== 'rest' && (
          <button
            onClick={onViewToday}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-all"
          >
            View Today
          </button>
        )}
        <button
          onClick={onViewCalendar}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all border border-slate-200"
        >
          Calendar
        </button>
      </div>
    </div>
  );
}

// ── Week Strip Card ──────────────────────────────────────────────
function WeekOverviewCard({ currentPhase, activePlan, exerciseLogs, onViewWeek }) {
  if (!currentPhase?.weeks) return null;
  const today = new Date();
  const todayName = format(today, 'EEEE');
  const weekSchedule = activePlan ? getWeekScheduleForDate(currentPhase, activePlan, today) : currentPhase.weeks[0];
  const days = weekSchedule?.daily_schedule || [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">This Week</h3>
        </div>
        <button onClick={onViewWeek} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-1.5">
        {days.map((day, i) => {
          const isToday = day.day === todayName;
          const dayLogs = exerciseLogs.filter(l => format(new Date(l.date), 'EEEE') === day.day);
          const done = dayLogs.length > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-semibold text-slate-400">{day.day.substring(0, 2).toUpperCase()}</span>
              <div className={cn(
                "w-full aspect-square max-w-[28px] rounded-lg flex items-center justify-center",
                isToday && "ring-2 ring-purple-500",
                day.type === 'training' && (done ? "bg-purple-500" : "bg-purple-100"),
                day.type === 'conditioning' && (done ? "bg-blue-500" : "bg-blue-100"),
                day.type === 'rest' && "bg-slate-100"
              )}>
                {done ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : day.type === 'rest' ? (
                  <span className="text-[8px] text-slate-400">—</span>
                ) : (
                  <span className="text-[8px] text-slate-500">{day.exercises?.length || 0}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PROM Card ────────────────────────────────────────────────────
function PROMCard({ patientOutcomeMeasures, outcomeMeasures, onComplete, onViewTab }) {
  const pending = patientOutcomeMeasures.filter(o => o.status === 'pending');
  const completed = patientOutcomeMeasures.filter(o => o.status === 'completed');
  const latest = completed[0];
  const latestMeasure = latest ? outcomeMeasures.find(m => m.id === latest.outcome_measure_id) : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Questionnaires</h3>
        </div>
        {pending.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
            {pending.length}
          </span>
        )}
      </div>

      {pending.length > 0 ? (
        <div className="mb-4">
          <p className="text-sm text-amber-600 font-medium mb-3">{pending.length} questionnaire{pending.length > 1 ? 's' : ''} waiting</p>
          <button
            onClick={onComplete}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all"
          >
            Complete Now
          </button>
        </div>
      ) : latest ? (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">Latest: {latestMeasure?.name}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{latest.total_score}</span>
            {latestMeasure?.total_score_max && (
              <span className="text-slate-500 text-sm">/{latestMeasure.total_score_max}</span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4">No questionnaires yet</p>
      )}

      <button onClick={onViewTab} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2">
        View all <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Check-In Card ───────────────────────────────────────────────
function CheckInCard({ dailyNotes, onCheckIn }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = dailyNotes.some(n => n.date === todayStr);
  const latest = dailyNotes[0];

  const moodColors = {
    great: 'text-emerald-400',
    good: 'text-green-400',
    okay: 'text-yellow-400',
    struggling: 'text-orange-400',
    difficult: 'text-red-400',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Check-In</h3>
      </div>

      {doneToday ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-emerald-600">✓ Done today</span>
          </div>
          {latest?.mood && (
            <p className={cn("text-sm font-medium capitalize", moodColors[latest.mood])}>
              Feeling: {latest.mood}
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-500 mb-4">Log how you're feeling today</p>
          <button
            onClick={onCheckIn}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all"
          >
            Check In Now
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pain Card ───────────────────────────────────────────────────
function PainCard({ painLogs, onLog }) {
  const latest = painLogs[0];
  const prev = painLogs[1];
  const trend = latest && prev ? latest.pain_level - prev.pain_level : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-rose-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Pain / Symptoms</h3>
      </div>

      {latest ? (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-800">{latest.pain_level}</span>
            <span className="text-slate-500 text-sm">/10</span>
            {trend !== null && (
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                trend < 0 ? "bg-emerald-100 text-emerald-700" : trend > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
              )}>
                {trend < 0 ? `↓ ${Math.abs(trend)}` : trend > 0 ? `↑ ${trend}` : '→ Same'}
              </span>
            )}
          </div>
          {latest.pain_location && (
            <p className="text-xs text-slate-500 mt-1">{latest.pain_location}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">{latest.date}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4">No pain logged yet</p>
      )}

      <button
        onClick={onLog}
        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all"
      >
        Log Pain
      </button>
    </div>
  );
}

// ── Interventions Card ───────────────────────────────────────────
function InterventionsCard({ interventions }) {
  const visible = interventions.filter(i => i.visible_to_patient);
  const upcoming = visible.filter(i => i.status === 'planned').slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
          <Zap className="w-5 h-5 text-cyan-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Appointments</h3>
      </div>
      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((inv, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{inv.title || inv.intervention_type}</p>
                <p className="text-xs text-slate-500">{inv.intervention_date}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No upcoming appointments</p>
      )}
    </div>
  );
}

// ── Reports Card ────────────────────────────────────────────────
function ReportsCard({ reports, onViewReports }) {
  if (reports.length === 0) return null;
  const latest = reports[0];
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Documents</h3>
        </div>
        <button onClick={onViewReports} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 capitalize truncate">{latest.type?.replace('_', ' ')}</p>
          <p className="text-xs text-slate-500">{latest.date}</p>
        </div>
      </div>
      {reports.length > 1 && (
        <p className="text-xs text-slate-400 mt-2">{reports.length - 1} more document{reports.length > 2 ? 's' : ''}</p>
      )}
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────
export default function PatientDashboardGrid({
  activePlan, currentPhase, exerciseLogs = [], patientOutcomeMeasures = [],
  outcomeMeasures = [], dailyNotes = [], painLogs = [], interventions = [],
  visibleReports = [], onViewToday, onViewCalendar, onLogPain, onCheckIn, onCompleteOutcome, onViewOutcomes, onViewReports
}) {
  return (
    <div className="space-y-5">
      {/* Row 1: Current Plan (full width) + Week Overview below on same row if plan exists */}
      <CurrentPlanCard
        activePlan={activePlan}
        currentPhase={currentPhase}
        exerciseLogs={exerciseLogs}
        onViewToday={onViewToday}
        onViewCalendar={onViewCalendar}
      />
      {activePlan && (
        <WeekOverviewCard
          currentPhase={currentPhase}
          activePlan={activePlan}
          exerciseLogs={exerciseLogs}
          onViewWeek={onViewCalendar}
        />
      )}

      {/* Row 2: 3 column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <PROMCard
          patientOutcomeMeasures={patientOutcomeMeasures}
          outcomeMeasures={outcomeMeasures}
          onComplete={onCompleteOutcome}
          onViewTab={onViewOutcomes}
        />
        <CheckInCard
          dailyNotes={dailyNotes}
          onCheckIn={onCheckIn}
        />
        <PainCard
          painLogs={painLogs}
          onLog={onLogPain}
        />
      </div>

      {/* Row 3: Interventions + Reports (conditional) */}
      {(interventions.filter(i => i.visible_to_patient).length > 0 || visibleReports.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InterventionsCard interventions={interventions} />
          <ReportsCard reports={visibleReports} onViewReports={onViewReports} />
        </div>
      )}
    </div>
  );
}