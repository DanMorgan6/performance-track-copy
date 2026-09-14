import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isSubscriptionActive } from '@/components/utils/subscriptionUtils';
import BillingPaywall from '@/components/billing/BillingPaywall';
import { format } from 'date-fns';
import PROMMNotificationEngine from '@/components/outcome/PROMMNotificationEngine';
import { 
  Activity,
  Calendar,
  ClipboardList,
  MessageSquare,
  AlertCircle,
  Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PainSlider from "@/components/ui/PainSlider";
import OutcomeMeasureForm from "@/components/outcome/OutcomeMeasureForm";
import DailyCheckIn from "@/components/patient/DailyCheckIn";
import ProgressLogForm from "@/components/patient/ProgressLogForm";
import PatientOnboarding from "@/components/patient/PatientOnboarding";
import WeeklyOverview from "@/components/patient/WeeklyOverview";
import DayDetail from "@/components/patient/DayDetail";
import MonthlyCalendarView from "@/components/calendar/MonthlyCalendarView";
import PhaseStatusCard from "@/components/patient/PhaseStatusCard";
import PatientProfilePanel from "@/components/patient/PatientProfilePanel";
import DayTypeBannerCard from "@/components/patient/DayTypeBannerCard";
import PatientDashboardGrid from "@/components/patient/PatientDashboardGrid";

import PatientReportView from "@/components/report/PatientReportView";
import MotivationalBanner from "@/components/ai/MotivationalBanner";
import PatientMessaging from "@/components/messaging/PatientMessaging";
import PatientBottomTabs from "@/components/mobile/PatientBottomTabs";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import { getActivePhase } from "@/components/plan/PhaseProgressionEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PatientPortal() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [clinician, setClinician] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [isPatient, setIsPatient] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPainDialog, setShowPainDialog] = useState(false);
  const [selectedOutcomeMeasure, setSelectedOutcomeMeasure] = useState(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showQuickLogDialog, setShowQuickLogDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const restore = sessionStorage.getItem('portal_restore_tab');
      if (restore) { sessionStorage.removeItem('portal_restore_tab'); return restore; }
    } catch {}
    return 'dashboard';
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [painData, setPainData] = useState({
    pain_level: 3,
    pain_location: '',
    pain_type: 'aching',
    time_of_day: 'morning',
    activity_context: '',
    notes: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadedRef = React.useRef(false);

  useEffect(() => {
      const loadUser = async () => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Clinic staff should not access patient portal
        if (isPractitioner(currentUser)) {
          window.location.href = createPageUrl('CoachDashboard');
          return;
        }

        // Ensure user is patient
        setIsPatient(true);

      // Find patient by email
      const patients = await base44.entities.Patient.filter({ email: currentUser.email });
      if (patients.length > 0) {
        const foundPatient = patients[0];
        setPatient(foundPatient);

        // Clinician data not loaded (patients lack User list permission)
        // booking_url falls back to clinic.booking_url below
      } else if (!currentUser.onboarding_completed) {
        // Show onboarding if no patient record found
        setShowOnboarding(true);
      }

      // Load clinic branding from patient's clinic_id (preferred) or user's clinic_id
      const clinicId = patients[0]?.clinic_id || currentUser.clinic_id;
      if (clinicId) {
        const clinicData = await base44.entities.Clinic.filter({ id: clinicId });
        if (clinicData.length > 0) {
          setClinic(clinicData[0]);

          // Check if subscription is valid
          if (!isSubscriptionActive(clinicData[0])) {
            setShowPaywall(true);
          }

          // Apply brand colors dynamically
          document.documentElement.style.setProperty('--brand-primary', clinicData[0].brand_color_primary || '#9333ea');
          document.documentElement.style.setProperty('--brand-secondary', clinicData[0].brand_color_secondary || '#06b6d4');
        }
      }
    };
    loadUser();
  }, []);

  const { data: plans = [] } = useQuery({
    queryKey: ['my-plans', patient?.id],
    queryFn: async () => {
      // Security: Only fetch plans for the current patient
      if (!patient?.id) return [];
      // Multi-clinic isolation - use patient's clinic_id (patients may not have clinic_id on User record)
      const clinicId = patient.clinic_id || user?.clinic_id;
      if (!clinicId) return [];
      return base44.entities.RehabPlan.filter({ 
        patient_id: patient.id,
        clinic_id: clinicId
      }, '-created_date');
    },
    enabled: !!patient?.id
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['my-phases', patient?.id],
    queryFn: async () => {
      const allPhases = [];
      for (const plan of plans) {
        const planPhases = await base44.entities.RehabPhase.filter({ plan_id: plan.id });
        allPhases.push(...planPhases);
      }
      return allPhases;
    },
    enabled: !!plans.length
  });

  const { data: painLogs = [] } = useQuery({
    queryKey: ['my-pain', patient?.id],
    queryFn: async () => {
      // Security: Only fetch pain logs for the current patient
      if (!patient?.id) return [];
      return base44.entities.PainLog.filter({ patient_id: patient.id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['my-exercises', patient?.id],
    queryFn: async () => {
      // Security: Only fetch exercise logs for the current patient
      if (!patient?.id) return [];
      return base44.entities.ExerciseLog.filter({ patient_id: patient.id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['my-assessments', patient?.id],
    queryFn: async () => {
      // Security: Only fetch assessments for the current patient
      if (!patient?.id) return [];
      return base44.entities.ObjectiveAssessment.filter({ patient_id: patient.id }, '-assessment_date');
    },
    enabled: !!patient?.id
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['my-interventions', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Intervention.filter({ patient_id: patient.id }, '-intervention_date');
    },
    enabled: !!patient?.id
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['my-outcomes', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.PatientOutcomeMeasure.filter({ patient_id: patient.id }, '-sent_date');
    },
    enabled: !!patient?.id
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures'],
    queryFn: () => base44.entities.OutcomeMeasure.list()
  });

  const { data: dailyNotes = [] } = useQuery({
    queryKey: ['my-daily-notes', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.DailyNote.filter({ patient_id: patient.id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['my-milestones', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const clinicId = patient.clinic_id || user?.clinic_id;
      if (!clinicId) return [];
      return base44.entities.Milestone.filter({ 
        patient_id: patient.id,
        clinic_id: clinicId
      }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: visibleReports = [] } = useQuery({
    queryKey: ['my-visible-reports', patient?.id],
    queryFn: () => base44.entities.Report.filter({ patient_id: patient?.id, visible_to_patient: true }, '-date'),
    enabled: !!patient?.id
  });

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', patient?.id],
    queryFn: () => base44.entities.Patient.filter({ id: patient?.id }).then(res => res[0]),
    enabled: !!patient?.id
  });

  const submitOutcomeMeasureMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PatientOutcomeMeasure.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-outcomes'] });
      setSelectedOutcomeMeasure(null);
    }
  });

  const createPainLogMutation = useMutation({
    mutationFn: (data) => base44.entities.PainLog.create({
      ...data,
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      date: new Date().toISOString().split('T')[0]
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['my-pain', patient?.id] });
      const previous = queryClient.getQueryData(['my-pain', patient?.id]);
      const optimistic = { ...data, id: 'temp-' + Date.now(), patient_id: patient.id, date: new Date().toISOString().split('T')[0] };
      queryClient.setQueryData(['my-pain', patient?.id], (old = []) => [optimistic, ...old]);
      setShowPainDialog(false);
      setPainData({ pain_level: 3, pain_location: '', pain_type: 'aching', time_of_day: 'morning', activity_context: '', notes: '' });
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['my-pain', patient?.id], ctx?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-pain', patient?.id] })
  });

  const createExerciseLogMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLog.create({
      ...data,
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      phase_id: currentPhase?.id,
      date: new Date().toISOString().split('T')[0]
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['my-exercises', patient?.id] });
      const previous = queryClient.getQueryData(['my-exercises', patient?.id]);
      const optimistic = { ...data, id: 'temp-' + Date.now(), patient_id: patient.id, date: new Date().toISOString().split('T')[0] };
      queryClient.setQueryData(['my-exercises', patient?.id], (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['my-exercises', patient?.id], ctx?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-exercises', patient?.id] })
  });

  const createDailyNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyNote.create({
      ...data,
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      date: new Date().toISOString().split('T')[0]
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['my-daily-notes', patient?.id] });
      const previous = queryClient.getQueryData(['my-daily-notes', patient?.id]);
      const optimistic = { ...data, id: 'temp-' + Date.now(), patient_id: patient.id, date: new Date().toISOString().split('T')[0] };
      queryClient.setQueryData(['my-daily-notes', patient?.id], (old = []) => [optimistic, ...old]);
      setShowCheckInDialog(false);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['my-daily-notes', patient?.id], ctx?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-daily-notes', patient?.id] })
  });

  const activePlan = plans.find(p => p.status === 'active');
  const activePlanPhases = phases.filter(p => p.plan_id === activePlan?.id);
  
  // Use progression engine to determine actual active phase
  const activePhaseData = getActivePhase(activePlan, activePlanPhases);
  const currentPhase = activePhaseData;
  
  // Check which exercises are completed today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = exerciseLogs.filter(l => l.date === todayStr);
  const completedExercises = todayLogs.map(l => l.exercise_name);
  const todayNote = dailyNotes.find(n => n.date === todayStr);

  // Calculate progress
  const totalExercises = currentPhase?.exercises?.length || 0;
  const completedToday = completedExercises.length;
  const progressPercent = totalExercises > 0 ? (completedToday / totalExercises) * 100 : 0;

  const pendingOutcomes = patientOutcomeMeasures.filter(o => o.status === 'pending');

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Show billing paywall if subscription is invalid
  if (showPaywall) {
    return <BillingPaywall clinic={clinic} userRole={user?.role} />;
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <PatientOnboarding onComplete={async () => {
        // Reload patient data after onboarding
        const currentUser = await base44.auth.me();
        const patients = await base44.entities.Patient.filter({ email: currentUser.email });
        if (patients.length > 0) {
          setPatient(patients[0]);
        }
        setShowOnboarding(false);
      }} />
    );
  }

  // Show loading if no patient record yet
  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden items-stretch">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Profile Sidebar */}
      <aside className={cn(
        "fixed md:relative left-0 top-0 h-screen md:h-auto md:self-stretch z-40 w-72 flex-shrink-0 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <PatientProfilePanel
          patient={patient}
          activePlan={activePlan}
          user={user}
          clinic={clinic}
          clinician={clinician}
          exerciseLogs={exerciseLogs}
          patientOutcomeMeasures={patientOutcomeMeasures}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 select-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-800">Hey, {patient.full_name?.split(' ')[0]} 👋</p>
            <p className="text-xs text-slate-500">{format(new Date(), 'EEEE, MMM d')}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {patient?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <PullToRefresh
          className="flex-1"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
          onRefresh={() => queryClient.invalidateQueries()}
        >
        <div className="p-4 md:p-8" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
          {/* Desktop Welcome */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Hey, {patient.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <div className="flex items-center gap-3">
              {(clinician?.booking_url || clinic?.booking_url) && (
                <a
                  href={clinician?.booking_url || clinic?.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </a>
              )}
              <Button
                onClick={() => setShowQuickLogDialog(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl"
                size="sm"
              >
                <Activity className="w-4 h-4 mr-2" />
                Quick Log
              </Button>
            </div>
          </div>

          {/* Tabs for drill-down views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab navigation — hidden on dashboard tab, shown on inner tabs */}
            {activeTab !== 'dashboard' && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 select-none min-h-[44px]"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
                <TabsList className="bg-white border border-slate-200 rounded-xl p-1 grid w-full grid-cols-2 md:grid-cols-4 h-auto shadow-sm">
                  <TabsTrigger value="today" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    Today's Plan
                  </TabsTrigger>
                  <TabsTrigger value="month" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="outcomes" className="rounded-lg text-xs md:text-sm py-2 relative text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    Questionnaires
                    {pendingOutcomes.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {pendingOutcomes.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    Documents
                  </TabsTrigger>
                  {patient?.messaging_enabled && (
                    <TabsTrigger value="messages" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      💬 Messages
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            )}

            {/* DASHBOARD VIEW */}
            <TabsContent value="dashboard">
              <div className="space-y-5">
                {/* Day Type Banner (phased only) */}
                <DayTypeBannerCard
                  activePlan={activePlan}
                  currentPhase={currentPhase}
                  onViewToday={() => {
                    setActiveTab('today');
                    setSelectedDay(null);
                  }}
                />

                {/* Messaging preview on dashboard */}
                {patient?.messaging_enabled && (
                  <div
                    className="bg-white rounded-2xl border border-purple-100 p-4 cursor-pointer hover:border-purple-300 transition-colors"
                    onClick={() => setActiveTab('messages')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💬</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">Messages</p>
                        <p className="text-xs text-slate-500">Tap to message your clinician</p>
                      </div>
                      <span className="text-purple-500 text-sm">→</span>
                    </div>
                  </div>
                )}

                {/* AI Motivational Banner */}
                <MotivationalBanner
                  patient={patient}
                  exerciseLogs={exerciseLogs}
                  painLogs={painLogs}
                  dailyNotes={dailyNotes}
                  adherenceRate={progressPercent}
                  avgPainLevel={painLogs.slice(0,7).length > 0 ? painLogs.slice(0,7).reduce((s,l) => s + l.pain_level, 0) / painLogs.slice(0,7).length : null}
                />

              {/* Summary Cards Grid */}
                <PatientDashboardGrid
                  activePlan={activePlan}
                  currentPhase={currentPhase}
                  exerciseLogs={exerciseLogs}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  outcomeMeasures={outcomeMeasures}
                  dailyNotes={dailyNotes}
                  painLogs={painLogs}
                  interventions={interventions}
                  visibleReports={visibleReports}
                  onViewToday={() => {
                    setActiveTab('today');
                    setSelectedDay(null);
                  }}
                  onViewCalendar={() => setActiveTab('month')}
                  onLogPain={() => setShowPainDialog(true)}
                  onCheckIn={() => setShowCheckInDialog(true)}
                  onCompleteOutcome={() => setActiveTab('outcomes')}
                  onViewOutcomes={() => setActiveTab('outcomes')}
                  onViewReports={() => setActiveTab('reports')}
                />

                {/* Mobile quick actions */}
                <div className={`md:hidden grid gap-3 pt-2 ${(clinician?.booking_url || clinic?.booking_url) ? 'grid-cols-4' : 'grid-cols-3'}`}>
                 {(clinician?.booking_url || clinic?.booking_url) && (
                   <a href={clinician?.booking_url || clinic?.booking_url} target="_blank" rel="noopener noreferrer" className="contents">
                     <Button className="h-auto py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 flex-col gap-2 shadow-sm">
                       <Calendar className="w-5 h-5 text-purple-500" />
                       <span className="text-xs font-medium">Book</span>
                     </Button>
                   </a>
                 )}
                 <Button onClick={() => setShowQuickLogDialog(true)} className="h-auto min-h-[56px] py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 flex-col gap-2 shadow-sm select-none">
                   <Activity className="w-5 h-5 text-purple-500" />
                   <span className="text-xs font-medium">Log</span>
                 </Button>
                 <Button onClick={() => setShowPainDialog(true)} className="h-auto min-h-[56px] py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 flex-col gap-2 shadow-sm select-none">
                   <AlertCircle className="w-5 h-5 text-rose-500" />
                   <span className="text-xs font-medium">Pain</span>
                 </Button>
                 <Button onClick={() => setShowCheckInDialog(true)} className="h-auto min-h-[56px] py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 flex-col gap-2 shadow-sm select-none">
                   <MessageSquare className="w-5 h-5 text-emerald-500" />
                   <span className="text-xs font-medium">Check-In</span>
                 </Button>
                </div>
              </div>
            </TabsContent>

            {/* TODAY's PLAN */}
            <TabsContent value="today">
              <div className="space-y-4">
                {currentPhase && (
                  <PhaseStatusCard 
                    phase={currentPhase} 
                    status={currentPhase.status}
                    criteriaProgress={currentPhase.criteriaProgress}
                  />
                )}
                {currentPhase && (
                  selectedDay ? (
                    <DayDetail 
                      day={selectedDay}
                      dayIndex={selectedDayIndex}
                      currentPhase={currentPhase}
                      patient={patient}
                      onBack={() => { setSelectedDay(null); setSelectedDayIndex(null); }}
                    />
                  ) : (
                    <WeeklyOverview 
                      currentPhase={currentPhase}
                      plan={activePlan}
                      exerciseLogs={exerciseLogs}
                      onDayClick={(day, dayIndex) => { setSelectedDay(day); setSelectedDayIndex(dayIndex); }}
                    />
                  )
                )}
                {!activePlan && (
                  <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center shadow-sm">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Plan</h3>
                    <p className="text-slate-500">Your clinician will assign you a plan soon.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CALENDAR */}
            <TabsContent value="month">
              {activePlan && currentPhase ? (
                <>
                  <MonthlyCalendarView
                    currentPhase={currentPhase}
                    plan={activePlan}
                    milestones={milestones.filter(m => m.outcomes_published || m.tests?.every(t => t.outcome_status === 'pending'))}
                    exerciseLogs={exerciseLogs}
                    interventions={interventions.filter(i => i.visible_to_patient)}
                    outcomeMeasures={patientOutcomeMeasures}
                    checkins={dailyNotes}
                    startDate={activePlan.start_date}
                    showAddMilestone={false}
                    onDayClick={(date, dayInfo) => { setSelectedDay(dayInfo); setSelectedDayIndex(null); }}
                  />
                  {selectedDay && (
                    <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Day Details</DialogTitle></DialogHeader>
                        <DayDetail
                          day={selectedDay}
                          dayIndex={selectedDayIndex}
                          currentPhase={currentPhase}
                          patient={patient}
                          milestones={milestones.filter(m => m.outcomes_published || m.tests?.every(t => t.outcome_status === 'pending'))}
                          onBack={() => setSelectedDay(null)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center shadow-sm">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Plan</h3>
                  <p className="text-slate-500">Your clinician will assign you a plan soon.</p>
                </div>
              )}
            </TabsContent>

            {/* QUESTIONNAIRES */}
            <TabsContent value="outcomes">
              <div className="mb-6">
                <PROMMNotificationEngine patientOutcomeMeasures={patientOutcomeMeasures} outcomeMeasures={outcomeMeasures} />
              </div>
              {selectedOutcomeMeasure ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <OutcomeMeasureForm
                    outcomeMeasure={outcomeMeasures.find(m => m.id === selectedOutcomeMeasure.outcome_measure_id)}
                    onSubmit={(data) => submitOutcomeMeasureMutation.mutate({ id: selectedOutcomeMeasure.id, data })}
                    onCancel={() => setSelectedOutcomeMeasure(null)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">My Questionnaires</h3>
                  {patientOutcomeMeasures.length > 0 ? (
                    <div className="space-y-3">
                      {patientOutcomeMeasures.map((pom) => {
                        const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
                        return (
                          <div key={pom.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-4">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", pom.status === 'completed' ? "bg-emerald-500/20" : "bg-amber-500/20")}>
                                <ClipboardList className={cn("w-5 h-5", pom.status === 'completed' ? "text-emerald-400" : "text-amber-400")} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-slate-800">{measure?.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{measure?.condition}</p>
                                  </div>
                                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", pom.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                                    {pom.status}
                                  </span>
                                </div>
                                {pom.status === 'completed' && pom.completed_date && (
                                  <div className="mt-3">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xl font-bold text-purple-600">{pom.total_score}</span>
                                      <span className="text-slate-500 text-sm">/ {measure?.total_score_max}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Completed {format(new Date(pom.completed_date), 'MMM d, yyyy')}</p>
                                  </div>
                                )}
                                {pom.status === 'pending' && (
                                  <Button onClick={() => setSelectedOutcomeMeasure(pom)} className="mt-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl" size="sm">
                                    Complete Questionnaire
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6">No questionnaires yet</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* MESSAGES */}
            <TabsContent value="messages">
              <PatientMessaging patient={patient} user={user} />
            </TabsContent>

            {/* REPORTS */}
            <TabsContent value="reports">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Medical Documents</h3>
                <PatientReportView reports={visibleReports} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </PullToRefresh>
      </div>

        {/* Quick Progress Log Dialog */}
        <Dialog open={showQuickLogDialog} onOpenChange={setShowQuickLogDialog}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quick Progress Log</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ProgressLogForm
                currentPhase={currentPhase}
                onSubmit={(data) => {
                  createExerciseLogMutation.mutate(data);
                  setShowQuickLogDialog(false);
                }}
                onCancel={() => setShowQuickLogDialog(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Weekly Check-In Dialog */}
        <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Weekly Check-In</DialogTitle>
            </DialogHeader>
            <div className="py-4 overflow-y-auto flex-1">
              <DailyCheckIn
                existingNote={todayNote}
                onSubmit={(data) => createDailyNoteMutation.mutate(data)}
                onCancel={() => setShowCheckInDialog(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Pain Log Dialog */}
        <Dialog open={showPainDialog} onOpenChange={setShowPainDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Pain</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <PainSlider 
                value={painData.pain_level} 
                onChange={(val) => setPainData({...painData, pain_level: val})}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <input
                    type="text"
                    value={painData.pain_location}
                    onChange={(e) => setPainData({...painData, pain_location: e.target.value})}
                    placeholder="e.g., Left knee"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={painData.pain_type}
                    onChange={(e) => setPainData({...painData, pain_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="sharp">Sharp</option>
                    <option value="dull">Dull</option>
                    <option value="aching">Aching</option>
                    <option value="burning">Burning</option>
                    <option value="throbbing">Throbbing</option>
                    <option value="stabbing">Stabbing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Time of Day</Label>
                  <select
                    value={painData.time_of_day}
                    onChange={(e) => setPainData({...painData, time_of_day: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Activity</Label>
                  <input
                    type="text"
                    value={painData.activity_context}
                    onChange={(e) => setPainData({...painData, activity_context: e.target.value})}
                    placeholder="What were you doing?"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={painData.notes}
                  onChange={(e) => setPainData({...painData, notes: e.target.value})}
                  placeholder="Any additional details..."
                  className="rounded-xl"
                />
              </div>

              <Button 
                onClick={() => createPainLogMutation.mutate(painData)}
                disabled={createPainLogMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl select-none"
              >
                {createPainLogMutation.isPending ? 'Saving...' : 'Save Pain Log'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Mobile Bottom Navigation */}
      <PatientBottomTabs
        currentPageName="PatientPortal"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
