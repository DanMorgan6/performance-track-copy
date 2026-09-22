import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isPractitioner } from '@/lib/roles';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsightsAtAGlance from '@/components/patient/InsightsAtAGlance.jsx';
import AssessmentsSummary from '@/components/patient/AssessmentsSummary.jsx';
import OutcomeMeasuresTrends from '@/components/patient/OutcomeMeasuresTrends.jsx';
import InterventionsTimeline from '@/components/patient/InterventionsTimeline.jsx';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientPortalSplash from '@/components/patient/PatientPortalSplash';

function responseData(response) {
  return response?.data || response || {};
}

export default function PatientInsights() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const currentUser = await base44.auth.me();
        if (!active) return;
        setUser(currentUser);

        // Clinic staff should not access patient insights.
        if (isPractitioner(currentUser)) {
          window.location.assign(createPageUrl('CoachDashboard'));
          return;
        }

        // Resolve through the protected ownership repair so stale patient IDs and
        // newly refreshed sessions behave exactly like PatientPortal.
        let resolvedPatient = null;
        try {
          const linkResult = await base44.functions.invoke('linkPatientAccount', {});
          resolvedPatient = responseData(linkResult).patient || null;
        } catch (repairError) {
          console.warn('Patient insights account reconciliation failed', repairError);
        }

        if (!resolvedPatient && currentUser.patient_id && currentUser.clinic_id) {
          const linkedPatients = await base44.entities.Patient.filter({
            id: currentUser.patient_id,
            clinic_id: currentUser.clinic_id,
          });
          resolvedPatient = linkedPatients[0] || null;
        }

        if (!resolvedPatient) {
          throw new Error('No securely linked patient record was found.');
        }

        if (active) setPatient(resolvedPatient);
      } catch (error) {
        console.error('Patient insights startup failed', error);
        if (active) {
          setLoadError('We could not load your progress insights. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const retryLoad = () => {
    setPatient(null);
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Fetch all canonical data sources (same as PatientPortal)
  const { data: painLogs = [] } = useQuery({
    queryKey: ['my-pain', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.PainLog.filter({ patient_id: patient.id, clinic_id: patient.clinic_id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['my-assessments', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.ObjectiveAssessment.filter({ patient_id: patient.id, clinic_id: patient.clinic_id }, '-assessment_date');
    },
    enabled: !!patient?.id
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['my-interventions', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      // Only show interventions visible to patient
      return base44.entities.Intervention.filter({ patient_id: patient.id, clinic_id: patient.clinic_id, visible_to_patient: true }, '-intervention_date');
    },
    enabled: !!patient?.id
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['my-outcomes', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.PatientOutcomeMeasure.filter({ patient_id: patient.id, clinic_id: patient.clinic_id }, '-sent_date');
    },
    enabled: !!patient?.id
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures', patient?.clinic_id],
    queryFn: () => base44.entities.OutcomeMeasure.filter({ clinic_id: patient.clinic_id }),
    enabled: !!patient?.clinic_id
  });

  const { data: dailyNotes = [] } = useQuery({
    queryKey: ['my-daily-notes', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.DailyNote.filter({ patient_id: patient.id, clinic_id: patient.clinic_id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: visibleReports = [] } = useQuery({
    queryKey: ['my-visible-reports', patient?.id],
    queryFn: () => base44.entities.Report.filter({ patient_id: patient?.id, clinic_id: patient?.clinic_id, visible_to_patient: true }, '-date'),
    enabled: !!patient?.id
  });

  if (loading) {
    return <PatientPortalSplash status="Building your progress insights" />;
  }

  if (loadError || !user || !patient) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-black/20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Insights could not load</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loadError || 'Your patient session could not be verified.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={retryLoad}>Try again</Button>
            <Button variant="outline" onClick={() => base44.auth.logout()}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 md:px-8">
        <Link
          to={createPageUrl('PatientPortal')}
          className="inline-flex min-w-0 items-center gap-1 rounded-xl px-2 text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-right">
          <TrendingUp className="h-5 w-5 shrink-0 text-purple-600" />
          <span className="truncate text-sm font-semibold text-slate-800">Your Progress</span>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Recovery Insights</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your recovery journey and see meaningful progress</p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:grid-cols-4">
            <TabsTrigger value="overview" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="rounded-lg text-xs md:text-sm py-2 relative text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Outcome Measures
              {patientOutcomeMeasures.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {patientOutcomeMeasures.filter(o => o.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="assessments" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Test Results
            </TabsTrigger>
            <TabsTrigger value="interventions" className="rounded-lg text-xs md:text-sm py-2 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Treatments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
           <InsightsAtAGlance
             painLogs={painLogs}
             patientOutcomeMeasures={patientOutcomeMeasures}
             outcomeMeasures={outcomeMeasures}
             assessments={assessments}
             dailyNotes={dailyNotes}
           />
          </TabsContent>

          {/* Outcome Measures Tab */}
          <TabsContent value="outcomes" className="space-y-6">
            {patientOutcomeMeasures.filter(o => o.status === 'pending').length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-700">
                      {patientOutcomeMeasures.filter(o => o.status === 'pending').length} Questionnaire{patientOutcomeMeasures.filter(o => o.status === 'pending').length > 1 ? 's' : ''} Pending
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                      Please complete these to help track your progress
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <OutcomeMeasuresTrends
                patientOutcomeMeasures={patientOutcomeMeasures}
                outcomeMeasures={outcomeMeasures}
              />
            </div>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <AssessmentsSummary assessments={assessments} />
            </div>
          </TabsContent>

          {/* Interventions Tab */}
          <TabsContent value="interventions">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <InterventionsTimeline interventions={interventions} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
