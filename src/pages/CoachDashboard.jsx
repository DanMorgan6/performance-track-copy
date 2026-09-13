import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isSubscriptionActive } from '@/components/utils/subscriptionUtils';
import BillingPaywall from '@/components/billing/BillingPaywall';
import { format } from 'date-fns';
import { 
  Users, 
  ClipboardList, 
  Activity, 
  AlertCircle,
  Plus,
  ChevronRight,
  Search,
  Filter,
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
import ClinicianInviteDialog from '@/components/clinician/ClinicianInviteDialog';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PullToRefresh from "@/components/ui/PullToRefresh";
import MobileSelect from "@/components/ui/MobileSelect";
import { useQueryClient } from '@tanstack/react-query';

export default function CoachDashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [aiInsights, setAiInsights] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'glance'
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [clinic, setClinic] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Security: Only clinic staff can access clinician dashboard
  useEffect(() => {
    const checkAccess = async () => {
      const user = await base44.auth.me();
      // Only admin, clinic_admin and clinician roles can access
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('PatientPortal');
        return;
      }
      // Check if onboarding is complete
      if (!user.onboarding_completed) {
        window.location.href = createPageUrl('ClinicOnboarding');
        return;
      }
      setCurrentUser(user);

      // Check subscription status
      if (user.clinic_id) {
        const clinics = await base44.entities.Clinic.filter({ id: user.clinic_id });
        if (clinics.length > 0) {
          setClinic(clinics[0]);
          if (!isSubscriptionActive(clinics[0])) {
            setShowPaywall(true);
          }
        }
      }
    };
    checkAccess();
  }, []);

  // Only load patients assigned to current clinician
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', currentUser?.email],
    queryFn: async () => {
      const fetchedPatients = await base44.entities.Patient.filter({ assigned_coach: currentUser.email }, '-created_date');
      // Sort alphabetically by surname
      return fetchedPatients.sort((a, b) => {
        const surnameA = a.full_name?.split(' ').pop()?.toLowerCase() || '';
        const surnameB = b.full_name?.split(' ').pop()?.toLowerCase() || '';
        return surnameA.localeCompare(surnameB);
      });
    },
    enabled: !!currentUser?.email
  });

  // Only load plans for this clinician's patients
  const { data: plans = [] } = useQuery({
    queryKey: ['plans', currentUser?.email],
    queryFn: async () => {
      const allPlans = await base44.entities.RehabPlan.list('-created_date');
      const patientIds = patients.map(p => p.id);
      return allPlans.filter(plan => patientIds.includes(plan.patient_id));
    },
    enabled: !!currentUser?.email && patients.length > 0
  });

  // Only load pain logs for this clinician's patients
  const { data: recentPainLogs = [] } = useQuery({
    queryKey: ['recent-pain', currentUser?.email],
    queryFn: async () => {
      const allLogs = await base44.entities.PainLog.list('-date', 100);
      const patientIds = patients.map(p => p.id);
      return allLogs.filter(log => patientIds.includes(log.patient_id));
    },
    enabled: !!currentUser?.email && patients.length > 0
  });

  // Only load exercise logs for this clinician's patients
  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['recent-exercise-logs', currentUser?.email],
    queryFn: async () => {
      const allLogs = await base44.entities.ExerciseLog.list('-created_date', 500);
      const patientIds = patients.map(p => p.id);
      return allLogs.filter(log => patientIds.includes(log.patient_id));
    },
    enabled: !!currentUser?.email && patients.length > 0
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['all-patient-outcomes', currentUser?.email],
    queryFn: async () => {
      const allOutcomes = await base44.entities.PatientOutcomeMeasure.list('-sent_date', 500);
      const patientIds = patients.map(p => p.id);
      return allOutcomes.filter(om => patientIds.includes(om.patient_id));
    },
    enabled: !!currentUser?.email && patients.length > 0
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
  
  // Get high pain alerts (pain > 7 in last week)
  const highPainAlerts = recentPainLogs.filter(log => log.pain_level >= 7);

  // Calculate adherence for each patient
  const patientAdherence = patients.map(patient => {
    const patientLogs = exerciseLogs.filter(log => log.patient_id === patient.id);
    
    // Get last 7 days of logs
    const last7Days = patientLogs.filter(log => {
      const logDate = new Date(log.date);
      const daysDiff = Math.floor((new Date() - logDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    
    const completedCount = last7Days.filter(log => log.completed).length;
    const totalCount = last7Days.length;
    const adherenceRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return {
      ...patient,
      adherenceRate: Math.round(adherenceRate),
      recentLogs: last7Days.length
    };
  });

  const avgAdherence = patientAdherence.length > 0
    ? Math.round(patientAdherence.reduce((sum, p) => sum + p.adherenceRate, 0) / patientAdherence.length)
    : 0;

  const handleLogout = () => {
    base44.auth.logout();
  };

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
      className="min-h-screen bg-slate-50 overflow-x-hidden"
      onRefresh={() => queryClient.invalidateQueries()}
    >
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Clinic Logo - centered and prominent */}
          <div className="flex flex-col items-center gap-3">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="h-20 w-auto object-contain" />
            ) : (
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6946eba1f08e607df3f62d4a/7490e353e_ChatGPTImageJan26202610_22_18PM.png"
                alt="Performance Track +"
                className="h-20 w-auto object-contain"
              />
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
              <p className="text-slate-500 mt-0.5 text-sm">Manage your patients and rehabilitation plans</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {currentUser?.role === 'clinic_admin' && (
              <Button 
                onClick={() => setShowInviteDialog(true)}
                variant="outline"
                className="rounded-xl border-slate-200 text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite Clinician
              </Button>
            )}
            <Link to={createPageUrl('ClinicalProfile')}>
              <Button variant="outline" className="rounded-xl text-sm" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" className="rounded-xl text-sm" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Link to={createPageUrl('CreatePatient')}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            value={highPainAlerts.length}
            subtitle="Needs attention"
            icon={AlertCircle}
            color={highPainAlerts.length > 0 ? "rose" : "emerald"}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 mb-4 md:mb-6 h-auto w-full grid grid-cols-2">
            <TabsTrigger value="patients" className="rounded-lg text-xs sm:text-sm select-none min-h-[44px]">Patients</TabsTrigger>
            <TabsTrigger value="glance" className="rounded-lg text-xs sm:text-sm select-none min-h-[44px]">At-a-Glance</TabsTrigger>

          </TabsList>

          <TabsContent value="glance">
            <div className="space-y-5">
              {/* AI Insights Generator */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Patient Overview</h3>
                    <p className="text-sm text-slate-500">Quick summary with AI-powered insights</p>
                  </div>
                  <AIInsightsGenerator
                    patients={patients}
                    exerciseLogs={exerciseLogs}
                    painLogs={recentPainLogs}
                    onInsightsGenerated={setAiInsights}
                  />
                </div>
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
                <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center shadow-sm">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No patients found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="patients">
        {/* Patient List */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-800">Patients</h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Bulk messaging toggle */}
                {patients.length > 0 && (() => {
                  const allEnabled = patients.every(p => p.messaging_enabled);
                  const anyEnabled = patients.some(p => p.messaging_enabled);
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs whitespace-nowrap"
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
                    className="pl-9 rounded-xl border-slate-200"
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
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
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
                 <div key={patient.id} className="flex items-center gap-2 md:gap-5 p-3 md:p-5 hover:bg-slate-50 transition-colors group">
                 <Link 
                   to={createPageUrl(`PatientDetail?id=${patient.id}`)}
                   className="flex-1 flex items-center gap-3 md:gap-5 min-w-0 select-none"
                 >
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
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
                        {latestPain?.pain_level && (
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
                       {latestPain?.pain_level && (
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
                      className="hidden md:block px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap"
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
