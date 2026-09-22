import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, subDays } from 'date-fns';
import { Users, Activity, Clock, Star, Search, ChevronRight, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/dashboard/StatCard';
import AdherenceMetricsChart from '@/components/analytics/AdherenceMetricsChart.jsx';
import InjuryTypeDistribution from '@/components/analytics/InjuryTypeDistribution.jsx';
import RecoveryTimeAnalysis from '@/components/analytics/RecoveryTimeAnalysis.jsx';
import PatientSatisfactionTrends from '@/components/analytics/PatientSatisfactionTrends.jsx';
import AdherenceHeatmap from '@/components/analytics/AdherenceHeatmap';
import PatientAlerts from '@/components/analytics/PatientAlerts';
import PatientDeepDive from '@/components/analytics/PatientDeepDive';
import OutcomeTrendsChart from '@/components/analytics/OutcomeTrendsChart';
import AnalyticsExport from '@/components/analytics/AnalyticsExport';
import { cn } from '@/lib/utils';
import { calculatePlanAdherence, calculateRangeAdherence, calculateClinicAdherence, buildClinicDailyAdherenceMap } from '@/lib/adherence';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'patients', label: 'Patient Breakdown' },
  { id: 'outcomes', label: 'Outcome Trends' },
  { id: 'alerts', label: 'Alerts' },
];

export default function ClinicianAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('3m');
  const [activeTab, setActiveTab] = useState('overview');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: patients = [] } = useQuery({
    queryKey: ['analytics-patients', user?.email],
    queryFn: () => base44.entities.Patient.filter({ assigned_coach: user.email }),
    enabled: !!user?.email,
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['analytics-exercise', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const p of patients) {
        const logs = await base44.entities.ExerciseLog.filter({ patient_id: p.id });
        all.push(...logs);
      }
      return all;
    },
    enabled: patients.length > 0,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['analytics-plans', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const p of patients) {
        const pp = await base44.entities.RehabPlan.filter({ patient_id: p.id });
        all.push(...pp);
      }
      return all;
    },
    enabled: patients.length > 0,
  });

  const activePlanIds = plans.filter(p => p.status === 'active').map(p => p.id);
  const { data: phases = [] } = useQuery({
    queryKey: ['analytics-phases', activePlanIds.join(',')],
    queryFn: async () => {
      const groups = await Promise.all(activePlanIds.map(id => base44.entities.RehabPhase.filter({ plan_id: id })));
      return groups.flat();
    },
    enabled: activePlanIds.length > 0,
  });

  const { data: dailyNotes = [] } = useQuery({
    queryKey: ['analytics-notes', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const p of patients) {
        const notes = await base44.entities.DailyNote.filter({ patient_id: p.id });
        all.push(...notes);
      }
      return all;
    },
    enabled: patients.length > 0,
  });

  const { data: painLogs = [] } = useQuery({
    queryKey: ['analytics-pain', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const p of patients) {
        const logs = await base44.entities.PainLog.filter({ patient_id: p.id });
        all.push(...logs);
      }
      return all;
    },
    enabled: patients.length > 0,
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['analytics-outcomes', patients.map(p => p.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const p of patients) {
        const outcomes = await base44.entities.PatientOutcomeMeasure.filter({ patient_id: p.id });
        all.push(...outcomes);
      }
      return all;
    },
    enabled: patients.length > 0,
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures-analytics'],
    queryFn: () => base44.entities.OutcomeMeasure.list(),
  });

  // Date range filter
  const rangeStart = (() => {
    const today = new Date();
    if (dateRange === '3m') return subDays(today, 90);
    if (dateRange === '6m') return subDays(today, 180);
    return subDays(today, 365);
  })();

  const recentExerciseLogs = exerciseLogs.filter(l => new Date(l.date) >= rangeStart);
  const recentPlans = plans.filter(p => new Date(p.created_date) >= rangeStart);
  const recentNotes = dailyNotes.filter(n => new Date(n.date) >= rangeStart);

  // Key metrics — clinic-wide adherence = completed / prescribed across all active plans.
  const clinicAdherence = calculateClinicAdherence(patients, plans, phases, exerciseLogs, rangeStart, new Date());
  const adherenceRate = clinicAdherence.rate;
  const chartDays = dateRange === '3m' ? 90 : dateRange === '6m' ? 180 : 365;
  const clinicDailyMap = buildClinicDailyAdherenceMap(patients, plans, phases, exerciseLogs, subDays(new Date(), chartDays - 1), new Date());

  const avgRecoveryTime = (() => {
    const done = recentPlans.filter(p => p.status === 'completed' && p.start_date && p.target_end_date);
    if (!done.length) return 0;
    return Math.round(done.reduce((s, p) => s + differenceInDays(new Date(p.target_end_date), new Date(p.start_date)), 0) / done.length);
  })();

  const avgSatisfaction = (() => {
    const moodValues = { great: 5, good: 4, okay: 3, struggling: 2, difficult: 1 };
    if (!recentNotes.length) return 0;
    return (recentNotes.reduce((s, n) => s + (moodValues[n.mood] || 0), 0) / recentNotes.length).toFixed(1);
  })();

  const injuryMap = patients.reduce((acc, p) => {
    if (p.injury_type) acc[p.injury_type] = (acc[p.injury_type] || 0) + 1;
    return acc;
  }, {});

  // Per-patient adherence for breakdown table
  const patientStats = patients.map(p => {
    const logs = exerciseLogs.filter(l => l.patient_id === p.id);
    const activePlan = plans.find(pl => pl.patient_id === p.id && pl.status === 'active');
    const currentPhase = phases.find(ph => ph.patient_id === p.id && ph.status === 'active');
    const overall = calculatePlanAdherence(activePlan, currentPhase, logs);
    const adherence = overall.expected > 0 ? overall.rate : null;
    const recent7 = calculateRangeAdherence(activePlan, currentPhase, logs, subDays(new Date(), 7), new Date());
    const recentAdherence = recent7.expected > 0 ? recent7.rate : null;
    const pains = painLogs.filter(l => l.patient_id === p.id);
    const avgPain = pains.length > 0 ? (pains.reduce((s, l) => s + l.pain_level, 0) / pains.length).toFixed(1) : null;
    const pending = patientOutcomeMeasures.filter(o => o.patient_id === p.id && o.status === 'pending').length;
    return { patient: p, adherence, recentAdherence, avgPain, pending };
  });

  const filteredPatientStats = patientStats.filter(s =>
    s.patient.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    s.patient.injury_type?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Alert count
  const alertCount = patients.reduce((count, p) => {
    const logs = exerciseLogs.filter(l => l.patient_id === p.id);
    const activePlan = plans.find(pl => pl.patient_id === p.id && pl.status === 'active');
    const currentPhase = phases.find(ph => ph.patient_id === p.id && ph.status === 'active');
    const recent7 = calculateRangeAdherence(activePlan, currentPhase, logs, subDays(new Date(), 7), new Date());
    if (recent7.expected > 0 && recent7.rate < 50) count++;
    const latestPain = painLogs.filter(l => l.patient_id === p.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (latestPain?.pain_level >= 8 && new Date(latestPain.date) >= subDays(new Date(), 7)) count++;
    return count;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 overflow-x-hidden pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Advanced Analytics</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Track performance, outcomes, and patient progress</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AnalyticsExport
              patients={patients}
              exerciseLogs={exerciseLogs}
              painLogs={painLogs}
              patientOutcomeMeasures={patientOutcomeMeasures}
              outcomeMeasures={outcomeMeasures}
            />
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {['3m', '6m', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                    dateRange === range
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range === '3m' ? '3M' : range === '6m' ? '6M' : '1Y'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Activity} title="Adherence Rate" value={`${adherenceRate}%`} subtitle="Patient exercise completion" color={adherenceRate > 75 ? 'emerald' : 'amber'} />
          <StatCard icon={Users} title="Active Patients" value={patients.filter(p => p.status === 'active').length} subtitle={`${patients.length} total`} color="purple" />
          <StatCard icon={Clock} title="Avg Recovery" value={avgRecoveryTime ? `${avgRecoveryTime}d` : 'N/A'} subtitle="For completed plans" color="blue" />
          <StatCard icon={Star} title="Satisfaction" value={avgSatisfaction || 'N/A'} subtitle="Mood score /5" color={parseFloat(avgSatisfaction) >= 4 ? 'emerald' : 'amber'} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
              {tab.id === 'alerts' && alertCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">{alertCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Adherence Over Time</h3>
              <AdherenceMetricsChart dailyData={clinicDailyMap} dateRange={dateRange} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Injury Type Distribution</h3>
              <InjuryTypeDistribution injuries={injuryMap} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Recovery Time Analysis</h3>
              <RecoveryTimeAnalysis plans={recentPlans} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Patient Satisfaction Trends</h3>
              <PatientSatisfactionTrends dailyNotes={recentNotes} />
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Clinic-Wide Exercise Adherence Heatmap</h3>
              <AdherenceHeatmap dailyData={clinicDailyMap} days={chartDays} />
            </div>
          </div>
        )}

        {/* PATIENT BREAKDOWN TAB */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-800 flex-1">Patient Performance Breakdown</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Patient</th>
                    <th className="px-5 py-3 font-medium">Overall Adherence</th>
                    <th className="px-5 py-3 font-medium">Last 7 Days</th>
                    <th className="px-5 py-3 font-medium">Avg Pain</th>
                    <th className="px-5 py-3 font-medium">Pending Outcomes</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatientStats.map(({ patient, adherence, recentAdherence, avgPain, pending }) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{patient.full_name}</p>
                        <p className="text-xs text-slate-400">{patient.injury_type || '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        {adherence !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', adherence >= 80 ? 'bg-emerald-500' : adherence >= 60 ? 'bg-amber-400' : 'bg-rose-400')}
                                style={{ width: `${adherence}%` }}
                              />
                            </div>
                            <span className={cn('text-xs font-medium', adherence >= 80 ? 'text-emerald-600' : adherence >= 60 ? 'text-amber-600' : 'text-rose-600')}>
                              {adherence}%
                            </span>
                          </div>
                        ) : <span className="text-slate-300 text-xs">No data</span>}
                      </td>
                      <td className="px-5 py-3">
                        {recentAdherence !== null ? (
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', recentAdherence >= 80 ? 'bg-emerald-100 text-emerald-700' : recentAdherence >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>
                            {recentAdherence}%
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {avgPain ? (
                          <span className={cn('text-sm font-medium', parseFloat(avgPain) <= 3 ? 'text-emerald-600' : parseFloat(avgPain) <= 6 ? 'text-amber-600' : 'text-rose-600')}>
                            {avgPain}/10
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {pending > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{pending} pending</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium transition-opacity"
                        >
                          Deep Dive <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPatientStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No patients found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OUTCOME TRENDS TAB */}
        {activeTab === 'outcomes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Clinic-Wide Outcome Measure Trends</h3>
              <p className="text-xs text-slate-400 mb-4">Score percentages across all patients — click measures to toggle</p>
              <OutcomeTrendsChart
                patientOutcomeMeasures={patientOutcomeMeasures}
                outcomeMeasures={outcomeMeasures}
              />
            </div>

            {/* Summary table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Outcome Measure Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide text-left">
                      <th className="px-5 py-3 font-medium">Measure</th>
                      <th className="px-5 py-3 font-medium">Completed</th>
                      <th className="px-5 py-3 font-medium">Pending</th>
                      <th className="px-5 py-3 font-medium">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {outcomeMeasures.map(measure => {
                      const all = patientOutcomeMeasures.filter(o => o.outcome_measure_id === measure.id);
                      const done = all.filter(o => o.status === 'completed');
                      const pending = all.filter(o => o.status === 'pending');
                      const avgScore = done.length > 0
                        ? (done.reduce((s, o) => s + (o.total_score || 0), 0) / done.length).toFixed(1)
                        : null;
                      const avgPct = avgScore && measure.total_score_max
                        ? Math.round((avgScore / measure.total_score_max) * 100)
                        : null;
                      if (all.length === 0) return null;
                      return (
                        <tr key={measure.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800">{measure.name}</p>
                            <p className="text-xs text-slate-400">{measure.condition}</p>
                          </td>
                          <td className="px-5 py-3 text-emerald-600 font-medium">{done.length}</td>
                          <td className="px-5 py-3 text-amber-600 font-medium">{pending.length}</td>
                          <td className="px-5 py-3">
                            {avgScore ? (
                              <div className="flex items-center gap-2">
                                <span className="text-purple-700 font-medium">{avgScore}/{measure.total_score_max}</span>
                                {avgPct && <span className="text-xs text-slate-400">({avgPct}%)</span>}
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-800">Patient Alerts & Flags</h3>
            </div>
            <PatientAlerts
              patients={patients}
              exerciseLogs={exerciseLogs}
              painLogs={painLogs}
              patientOutcomeMeasures={patientOutcomeMeasures}
            />
          </div>
        )}
      </div>

      {/* Patient Deep Dive Modal */}
      {selectedPatient && (
        <PatientDeepDive
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}