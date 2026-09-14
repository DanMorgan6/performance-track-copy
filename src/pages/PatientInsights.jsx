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

export default function PatientInsights() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Clinic staff should not access patient insights
        if (isPractitioner(currentUser)) {
          window.location.href = createPageUrl('CoachDashboard');
          return;
        }

        // Find patient by email
        const patients = await base44.entities.Patient.filter({ email: currentUser.email });
        if (patients.length > 0) {
          setPatient(patients[0]);
        }
      } catch (e) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    loadUser();
  }, []);

  // Fetch all canonical data sources (same as PatientPortal)
  const { data: painLogs = [] } = useQuery({
    queryKey: ['my-pain', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.PainLog.filter({ patient_id: patient.id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['my-assessments', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.ObjectiveAssessment.filter({ patient_id: patient.id }, '-assessment_date');
    },
    enabled: !!patient?.id
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['my-interventions', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      // Only show interventions visible to patient
      return base44.entities.Intervention.filter({ patient_id: patient.id, visible_to_patient: true }, '-intervention_date');
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

  const { data: visibleReports = [] } = useQuery({
    queryKey: ['my-visible-reports', patient?.id],
    queryFn: () => base44.entities.Report.filter({ patient_id: patient?.id, visible_to_patient: true }, '-date'),
    enabled: !!patient?.id
  });

  if (!user || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 h-14 flex items-center justify-between">
        <Link
          to={createPageUrl('PatientPortal')}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span className="text-slate-800 font-semibold text-sm">Your Progress</span>
        </div>
        <div className="w-24" />
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Recovery Insights</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your recovery journey and see meaningful progress</p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white border border-slate-200 rounded-xl p-1 mb-6 grid w-full grid-cols-2 md:grid-cols-4 h-auto shadow-sm">
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
