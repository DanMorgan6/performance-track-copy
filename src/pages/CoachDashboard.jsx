import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isSubscriptionActive } from '@/components/utils/subscriptionUtils';
import { isClinicAdmin, isPractitioner } from '@/lib/roles';
import BillingPaywall from '@/components/billing/BillingPaywall';
import { 
  Users, 
  ClipboardList, 
  Activity, 
  AlertCircle,
  Plus,
  ChevronRight,
  Search,
  Key,
  Copy,
  User,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatCard from '@/components/dashboard/StatCard';
import PatientGlanceCard from '@/components/dashboard/PatientGlanceCard';
import AIInsightsGenerator from '@/components/dashboard/AIInsightsGenerator';
import PatientAlerts from '@/components/analytics/PatientAlerts';
import ClinicianInviteDialog from '@/components/clinician/ClinicianInviteDialog';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PullToRefresh from "@/components/ui/PullToRefresh";
import MobileSelect from "@/components/ui/MobileSelect";
import { useQueryClient } from '@tanstack/react-query';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isWithinPastDays(dateValue, numberOfDays) {
  if (!dateValue) return false;

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return false;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dateUtc = Date.UTC(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate()
  );
  const daysAgo = Math.round((todayUtc - dateUtc) / DAY_IN_MS);

  return daysAgo >= 0 && daysAgo < numberOfDays;
}

async function fetchRecordsByPatient(entity, patientIds, sort, limit) {
  if (patientIds.length === 0) return [];

  const recordGroups = [];
  const chunkSize = 10;

  for (let index = 0; index < patientIds.length; index += chunkSize) {
    const patientIdChunk = patientIds.slice(index, index + chunkSize);
    const chunkResults = await Promise.all(
      patientIdChunk.map((patientId) => entity.filter({ patient_id: patientId }, sort, limit))
    );
    recordGroups.push(...chunkResults);
  }

  return recordGroups.flat();
}

export default function CoachDashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [aiInsights, setAiInsights] = useState({});
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [clinic, setClinic] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState('');

  // Security: Only clinic staff can access clinician dashboard
  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;

        // Base44 exposes clinic practitioners through the admin role.
        if (!isPractitioner(user)) {
          window.location.replace(createPageUrl('PatientPortal'));
          return;
        }

        if (!user.onboarding_completed) {
          window.location.replace(createPageUrl('ClinicOnboarding'));
          return;
        }

        if (!user.clinic_id) {
          setAccessError('Your practitioner account is not linked to a clinic workspace.');
          return;
        }

        setCurrentUser(user);

        const clinics = await base44.entities.Clinic.filter({ id: user.clinic_id });
        if (!active) return;

        if (clinics.length === 0) {
          setAccessError('Your clinic workspace could not be found. Please contact support.');
          return;
        }

        setClinic(clinics[0]);
        setShowPaywall(!isSubscriptionActive(clinics[0]));
      } catch (error) {
        if (!active) return;
        console.error('Unable to load clinician dashboard access:', error);
        setAccessError('We could not verify access to this clinic workspace. Please refresh and try again.');
      } finally {
        if (active) setIsCheckingAccess(false);
      }
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, []);

  // Only load patients assigned to current clinician
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', currentUser?.email],
    queryFn: async () => {
      const fetchedPatients = await base44.entities.Patient.filter({
        assigned_coach: currentUser.email,
        clinic_id: currentUser.clinic_id
      }, '-created_date');
      // Sort alphabetically by surname
      return fetchedPatients.sort((a, b) => {
        const surnameA = a.full_name?.split(' ').pop()?.toLowerCase() || '';
        const surnameB = b.full_name?.split(' ').pop()?.toLowerCase() || '';
        return surnameA.localeCompare(surnameB);
      });
    },
    enabled: !!currentUser?.email && !!currentUser?.clinic_id
  });

  const patientIds = patients.map((patient) => patient.id);

  // Only load plans for this clinician's patients
  const { data: plans = [] } = useQuery({
    queryKey: ['plans', currentUser?.email, patientIds],
    queryFn: () => fetchRecordsByPatient(
      base44.entities.RehabPlan,
      patientIds,
      '-created_date'
    ),
    enabled: !!currentUser?.email && patientIds.length > 0
  });

  // Only load pain logs for this clinician's patients
  const { data: recentPainLogs = [] } = useQuery({
    queryKey: ['recent-pain', currentUser?.email, patientIds],
    queryFn: () => fetchRecordsByPatient(
      base44.entities.PainLog,
      patientIds,
      '-date',
      100
    ),
    enabled: !!currentUser?.email && patientIds.length > 0
  });

  // Only load exercise logs for this clinician's patients
  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['recent-exercise-logs', currentUser?.email, patientIds],
    queryFn: () => fetchRecordsByPatient(
      base44.entities.ExerciseLog,
      patientIds,
      '-created_date',
      500
    ),
    enabled: !!currentUser?.email && patientIds.length > 0
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['all-patient-outcomes', currentUser?.email, patientIds],
    queryFn: () => fetchRecordsByPatient(
      base44.entities.PatientOutcomeMeasure,
      patientIds,
      '-sent_date',
      500
    ),
    enabled: !!currentUser?.email && patientIds.length > 0
  });

  const activePlanIds = plans
    .filter((plan) => plan.status === 'active')
    .map((plan) => plan.id);

  const { data: phases = [] } = useQuery({
    queryKey: ['dashboard-phases', activePlanIds],
    queryFn: async () => {
      const phaseGroups = await Promise.all(
        activePlanIds.map((planId) => base44.entities.RehabPhase.filter({ plan_id: planId }))
      );
      return phaseGroups.flat();
    },
    enabled: activePlanIds.length > 0
  });

  const { data: allPatientInvites = [] } = useQuery({
    queryKey: ['all-patient-invites', currentUser?.clinic_id],
    queryFn: async () => {
      if (!currentUser?.clinic_id) return [];
      return base44.entities.PatientInvite.filter({ clinic_id: currentUser.clinic_id }, '-created_date');
    },
    enabled: !!currentUser?.clinic_id
  });

  const activePatients = patients.filter(p => p.status === 'active');
  const activePlans = plans.filter(p => p.status === 'active');
  
  // Count patients with a high pain entry in the last seven calendar days.
  const highPainAlertCount = new Set(
    recentPainLogs
      .filter((log) => log.pain_level >= 7 && isWithinPastDays(log.date, 7))
      .map((log) => log.patient_id)
  ).size;

  // Calculate adherence for each patient
  const patientAdherence = patients.map(patient => {
    const patientLogs = exerciseLogs.filter(log => log.patient_id === patient.id);
    
    // Get last 7 days of logs
    const last7Days = patientLogs.filter((log) => isWithinPastDays(log.date, 7));
    
    const completedCount = last7Days.filter(log => log.completed).length;
    const totalCount = last7Days.length;
    const adherenceRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return {
      ...patient,
      adherenceRate: Math.round(adherenceRate),
      recentLogs: last7Days.length
    };
  });

  const patientsWithRecentLogs = patientAdherence.filter((patient) => patient.recentLogs > 0);
  const avgAdherence = patientsWithRecentLogs.length > 0
    ? Math.round(patientsWithRecentLogs.reduce((sum, p) => sum + p.adherenceRate, 0) / patientsWithRecentLogs.length)
    : 0;

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d8ff5f] border-t-transparent" aria-label="Loading dashboard" />
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-rose-300" />
          <h1 className="font-bold text-white">Dashboard unavailable</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{accessError}</p>
        </div>
      </div>
    );
  }

  // Show billing paywall if subscription is invalid
  if (showPaywall) {
    return <BillingPaywall clinic={clinic} userRole={currentUser?.role} />;
  }

  // Calculate patient metrics for glance view
  const patientMetrics = patients.map(patient => {
    const patientPainLogs = recentPainLogs.filter(l => l.patient_id === patient.id).slice(0, 7);
    const avgPainLevel = patientPainLogs.length > 0
      ? patientPainLogs.reduce((sum, log) => sum + (log.pain_level || 0), 0) / patientPainLogs.length
      : null;

    // Calculate pain trend
    let painTrend = 'stable';
    if (patientPainLogs.length >= 3) {
      const recentAvg = patientPainLogs.slice(0, 3).reduce((s, l) => s + (l.pain_level || 0), 0) / 3;
      const olderAvg = patientPainLogs.slice(3).reduce((s, l) => s + (l.pain_level || 0), 0) / (patientPainLogs.length - 3);
      if (recentAvg > olderAvg + 1) painTrend = 'increasing';
      else if (recentAvg < olderAvg - 1) painTrend = 'decreasing';
    }

    const adherenceData = patientAdherence.find(p => p.id === patient.id);
    const pendingOutcomes = patientOutcomeMeasures.filter(
      om => om.patient_id === patient.id && om.status === 'pending'
    ).length;

    return {
      patient,
      adherenceRate: adherenceData?.adherenceRate || 0,
      avgPainLevel,
      painTrend,
      pendingOutcomes,
      aiInsight: aiInsights[patient.id]
    };
  });

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PullToRefresh
      className="min-h-screen overflow-x-hidden"
      onRefresh={() => queryClient.invalidateQueries()}
    >
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Dashboard command header */}
        <div className="mb-8 flex flex-col gap-5 rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8ff5f]/15 bg-[#d8ff5f]/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d8ff5f]">
              <Activity className="h-3.5 w-3.5" />
              Clinic command centre
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              Welcome back{currentUser?.full_name ? `, ${currentUser.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
              Review patient progress, spot clinical priorities and keep every rehabilitation plan moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {isClinicAdmin(currentUser) && (
              <Button 
                onClick={() => setShowInviteDialog(true)}
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.03] text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite Clinician
              </Button>
            )}
            <Link to={createPageUrl('ClinicalProfile')}>
              <Button variant="outline" className="rounded-xl border-white/10 bg-white/[0.03] text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" className="rounded-xl border-white/10 bg-white/[0.03] text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Link to={createPageUrl('CreatePatient')}>
              <Button className="rounded-xl bg-[#d8ff5f] text-sm font-bold text-zinc-950 shadow-[0_0_22px_rgba(216,255,95,0.15)] hover:bg-[#e4ff91]" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Active Patients"
            value={activePatients.length}
            subtitle={`${patients.length} total`}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Active Plans"
            value={activePlans.length}
            subtitle={`${plans.length} total`}
            icon={ClipboardList}
            color="blue"
          />
          <StatCard
            title="Avg Adherence"
            value={`${avgAdherence}%`}
            subtitle="Last 7 days"
            icon={Activity}
            color={avgAdherence >= 80 ? "emerald" : avgAdherence >= 60 ? "amber" : "rose"}
          />
          <StatCard
            title="Pain Alerts"
            value={highPainAlertCount}
            subtitle="Needs attention"
            icon={AlertCircle}
            color={highPainAlertCount > 0 ? "rose" : "emerald"}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="mb-4 grid h-auto w-full max-w-md grid-cols-2 rounded-2xl border border-white/[0.08] bg-[#242427] p-1 md:mb-6">
            <TabsTrigger value="patients" className="min-h-[44px] select-none rounded-xl text-xs text-zinc-500 sm:text-sm">Patients</TabsTrigger>
            <TabsTrigger value="glance" className="min-h-[44px] select-none rounded-xl text-xs text-zinc-500 sm:text-sm">At-a-Glance</TabsTrigger>

          </TabsList>

          <TabsContent value="glance">
            <div className="space-y-5">
              {/* AI Insights Generator */}
              <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-5 shadow-xl shadow-black/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Patient overview</h3>
                    <p className="text-sm text-zinc-500">A concise summary with practitioner-approved AI support</p>
                  </div>
                  <AIInsightsGenerator
                    patients={patients}
                    exerciseLogs={exerciseLogs}
                    painLogs={recentPainLogs}
                    onInsightsGenerated={setAiInsights}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-5 shadow-xl shadow-black/10">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">Clinical priorities</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Criteria reviews, pain changes, adherence, PROMs and inactivity that may need attention.
                  </p>
                </div>
                <PatientAlerts
                  patients={patients}
                  exerciseLogs={exerciseLogs}
                  painLogs={recentPainLogs}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  plans={plans}
                  phases={phases}
                />
              </div>

              {/* Patient Glance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientMetrics
                  .filter(pm => {
                    const matchesSearch = pm.patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                         pm.patient.email?.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter === 'all' || pm.patient.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((metrics) => (
                    <PatientGlanceCard
                      key={metrics.patient.id}
                      patient={metrics.patient}
                      adherenceRate={metrics.adherenceRate}
                      avgPainLevel={metrics.avgPainLevel}
                      painTrend={metrics.painTrend}
                      pendingOutcomes={metrics.pendingOutcomes}
                      aiInsight={metrics.aiInsight}
                    />
                  ))}
              </div>

              {patientMetrics.length === 0 && (
                <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-10 text-center shadow-xl shadow-black/10">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No patients found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="patients">
        {/* Patient List */}
        <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#242427] shadow-2xl shadow-black/10">
          <div className="border-b border-white/[0.08] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Patients</h2>
                <p className="mt-1 text-xs text-zinc-500">{filteredPatients.length} shown · {activePatients.length} active</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Bulk messaging toggle */}
                {patients.length > 0 && (() => {
                  const allEnabled = patients.every(p => p.messaging_enabled);
                  const anyEnabled = patients.some(p => p.messaging_enabled);
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap rounded-xl border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                      onClick={async () => {
                        const newState = !allEnabled;
                        await Promise.all(
                          patients.map(p => base44.entities.Patient.update(p.id, { messaging_enabled: newState }))
                        );
                        queryClient.invalidateQueries({ queryKey: ['patients'] });
                      }}
                    >
                      <MessageSquare className="w-3 h-3 mr-1.5" />
                      {allEnabled ? 'Disable All Messaging' : 'Enable All Messaging'}
                    </Button>
                  );
                })()}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border-white/10 bg-black/10 pl-9 text-white"
                  />
                </div>
                <MobileSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filter by Status"
                  className="w-full sm:w-auto"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'discharged', label: 'Discharged' },
                  ]}
                />
              </div>
            </div>
          </div>

          {patientsLoading ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d8ff5f] border-t-transparent" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No patients found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => {
                const patientPlans = plans.filter(p => p.patient_id === patient.id);
                const activePlan = patientPlans.find(p => p.status === 'active');
                const patientPainLogs = recentPainLogs.filter(l => l.patient_id === patient.id);
                const latestPain = patientPainLogs[0];
                const adherenceData = patientAdherence.find(p => p.id === patient.id);
                const activeInvite = allPatientInvites.find(inv => inv.patient_email === patient.email && inv.status === 'active');

                return (
                 <div key={patient.id} className="group flex items-center gap-2 p-3 transition-colors hover:bg-white/[0.035] md:gap-5 md:p-5">
                 <Link 
                   to={createPageUrl(`PatientDetail?id=${patient.id}`)}
                   className="flex-1 flex items-center gap-3 md:gap-5 min-w-0 select-none"
                 >
                   <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#d8ff5f] text-base font-black text-zinc-950 md:h-12 md:w-12 md:rounded-2xl">
                     {patient.full_name?.charAt(0)?.toUpperCase()}
                   </div>

                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold text-slate-800">{patient.full_name}</h3>
                     <div className="flex flex-wrap items-center gap-2 mt-1">
                       <p className="text-sm text-slate-400">{patient.injury_type || 'No injury specified'}</p>
                       {activeInvite && (
                         <button
                           onClick={(e) => {
                             e.preventDefault();
                             navigator.clipboard.writeText(activeInvite.invite_code);
                             alert('Access code copied: ' + activeInvite.invite_code);
                           }}
                           className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md text-xs font-medium transition-colors"
                           title="Click to copy access code"
                         >
                           <Key className="w-3 h-3" />
                           {activeInvite.invite_code}
                           <Copy className="w-3 h-3" />
                         </button>
                       )}
                        {activePlan && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium md:hidden">
                            Phase {activePlan.current_phase}/{activePlan.total_phases}
                          </span>
                        )}
                        {Number.isFinite(latestPain?.pain_level) && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium md:hidden",
                            latestPain.pain_level <= 3 && "bg-emerald-100 text-emerald-700",
                            latestPain.pain_level > 3 && latestPain.pain_level <= 6 && "bg-amber-100 text-amber-700",
                            latestPain.pain_level > 6 && "bg-rose-100 text-rose-700"
                          )}>
                            Pain: {latestPain.pain_level}/10
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:block text-right">
                      {activePlan ? (
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                          Phase {activePlan.current_phase}/{activePlan.total_phases}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                          No active plan
                        </span>
                      )}
                    </div>

                    <div className="hidden md:block text-right">
                      {adherenceData && adherenceData.recentLogs > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Adherence:</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            adherenceData.adherenceRate >= 80 && "bg-emerald-100 text-emerald-700",
                            adherenceData.adherenceRate >= 60 && adherenceData.adherenceRate < 80 && "bg-amber-100 text-amber-700",
                            adherenceData.adherenceRate < 60 && "bg-rose-100 text-rose-700"
                          )}>
                            {adherenceData.adherenceRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No data</span>
                      )}
                    </div>

                    <div className="hidden md:block text-right">
                       {Number.isFinite(latestPain?.pain_level) && (
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400">Last pain:</span>
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-xs font-medium",
                             latestPain.pain_level <= 3 && "bg-emerald-100 text-emerald-700",
                             latestPain.pain_level > 3 && latestPain.pain_level <= 6 && "bg-amber-100 text-amber-700",
                             latestPain.pain_level > 6 && "bg-rose-100 text-rose-700"
                           )}>
                             {latestPain.pain_level}/10
                           </span>
                         </div>
                       )}
                     </div>

                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium shrink-0",
                      patient.status === 'active' && "bg-emerald-100 text-emerald-700",
                      patient.status === 'paused' && "bg-amber-100 text-amber-700",
                      patient.status === 'completed' && "bg-blue-100 text-blue-700",
                      patient.status === 'discharged' && "bg-slate-100 text-slate-600"
                    )}>
                      {patient.status}
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-300" />
                    </Link>
                    <Link 
                      to={createPageUrl(`CreatePlan?patient_id=${patient.id}`)}
                      className="hidden whitespace-nowrap rounded-xl bg-[#d8ff5f] px-3 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-[#e4ff91] md:block"
                    >
                      Create Plan
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Clinician Invite Dialog */}
      <ClinicianInviteDialog 
        clinicId={currentUser?.clinic_id}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
    </PullToRefresh>
  );
}