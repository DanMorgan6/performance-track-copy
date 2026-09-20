import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Plus,
  Mail,
  Activity,
  ClipboardList,
  Edit,
  Trash2,
  MoreVertical,
  UserX,
  StopCircle,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import PhaseTimeline from "@/components/ui/PhaseTimeline";
import ExitCriteriaCard from "@/components/ui/ExitCriteriaCard";
import SendOutcomeMeasureDialog from "@/components/outcome/SendOutcomeMeasureDialog";
import InterventionForm from "@/components/intervention/InterventionForm";
import PatientProgressTimeline from "@/components/clinician/PatientProgressTimeline";
import AutoProgressReport from "@/components/reports/AutoProgressReport";
import PhaseTriggersManager from "@/components/outcome/PhaseTriggersManager";
import OutcomeMeasureTrendChart from "@/components/analytics/OutcomeMeasureTrendChart";
import PDFReportGenerator from "@/components/reports/PDFReportGenerator";
import ScheduledReportManager from "@/components/reports/ScheduledReportManager";
import MonthlyCalendarView from "@/components/calendar/MonthlyCalendarView";
import TestingMilestoneDialog from "@/components/milestone/TestingMilestoneDialog";
import TestOutcomesForm from "@/components/milestone/TestOutcomesForm";
import PatientOverview from "@/components/patient/PatientOverview";

import ReportUploadDialog from "@/components/report/ReportUploadDialog";
import PatientRiskPanel from "@/components/ai/PatientRiskPanel";
import SmartClinicalNotes from "@/components/ai/SmartClinicalNotes";
import RehabPlanPDFButton from "@/components/reports/RehabPlanPDFButton";
import SaveTemplateDialog from "@/components/reports/SaveTemplateDialog";
import EditPatientDialog from "@/components/patient/EditPatientDialog";
import AssessmentsTab from "@/components/patientdetail/AssessmentsTab";
import PatientWorkspaceNav from "@/components/patientdetail/PatientWorkspaceNav";
import CriteriaLedPhaseRibbon from "@/components/patientdetail/CriteriaLedPhaseRibbon";
import LoadRecoveryPanel from "@/components/patientdetail/LoadRecoveryPanel";
import ClinicalPhaseDecision from "@/components/patientdetail/ClinicalPhaseDecision";
import ClinicianMessaging from "@/components/messaging/ClinicianMessaging";
import PainTab from "@/components/patientdetail/PainTab";
import PatientAnalyticsTab from "@/components/analytics/PatientAnalyticsTab";
import PatientDeepDiveTab from "@/components/analytics/PatientDeepDiveTab";
import ReportList from "@/components/report/ReportList";
import AIExtractionReview from "@/components/report/AIExtractionReview";
import { injuryDiagnosisLibrary } from "@/components/injury/injuryDiagnosisLibrary";
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import { titleCaseName } from '@/lib/nameFormat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function PatientDetail() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id');
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [activePatientTab, setActivePatientTab] = useState('overview');
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [showSendOutcomeDialog, setShowSendOutcomeDialog] = useState(false);
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [viewWeekIndex, setViewWeekIndex] = useState(0);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    condition_type: ''
  });
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [selectedMilestoneDate, setSelectedMilestoneDate] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [showMilestoneOutcomes, setShowMilestoneOutcomes] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [selectedReportForExtraction, setSelectedReportForExtraction] = useState(null);

  // Security: Only clinic staff can access patient details
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => base44.entities.Patient.filter({ id: patientId }).then(res => res[0])
  });



  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ['patient-plans', patientId],
    queryFn: async () => {
       if (!patientId) return [];
       const user = await base44.auth.me();
       // Multi-clinic isolation: only fetch plans for this clinic
       const result = await base44.entities.RehabPlan.filter({ 
         patient_id: patientId,
         clinic_id: user.clinic_id
       }, '-created_date');
       return result;
     },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'stale'
  });

  // Force refetch when page loads or patient changes
  React.useEffect(() => {
    if (patientId) {
      // Small delay to ensure navigation is complete
      const timer = setTimeout(() => refetchPlans(), 100);
      return () => clearTimeout(timer);
    }
  }, [patientId, refetchPlans]);

  const { data: phases = [] } = useQuery({
    queryKey: ['patient-phases', patientId],
    queryFn: async () => {
      const patientPlans = await base44.entities.RehabPlan.filter({ patient_id: patientId });
      const allPhases = [];
      for (const plan of patientPlans) {
        const planPhases = await base44.entities.RehabPhase.filter({ plan_id: plan.id });
        allPhases.push(...planPhases);
      }
      return allPhases;
    }
  });

  const { data: painLogs = [] } = useQuery({
    queryKey: ['patient-pain', patientId],
    queryFn: () => base44.entities.PainLog.filter({ patient_id: patientId }, '-date')
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['patient-exercises', patientId],
    queryFn: () => base44.entities.ExerciseLog.filter({ patient_id: patientId }, '-date')
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['patient-assessments', patientId],
    queryFn: () => base44.entities.ObjectiveAssessment.filter({ patient_id: patientId }, '-assessment_date')
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.ObjectiveAssessment.create({ ...data, clinic_id: patient?.clinic_id, patient_id: patientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments'] });
      setShowAssessmentForm(false);
      setEditingAssessment(null);
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ObjectiveAssessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments'] });
      setShowAssessmentForm(false);
      setEditingAssessment(null);
    }
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id) => base44.entities.ObjectiveAssessment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments'] });
    }
  });

  const { data: outcomeMeasures = [] } = useQuery({
    queryKey: ['outcome-measures'],
    queryFn: () => base44.entities.OutcomeMeasure.list()
  });

  const { data: dailyNotes = [] } = useQuery({
    queryKey: ['patient-daily-notes', patientId],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.DailyNote.filter({ patient_id: patient.id }, '-date');
    },
    enabled: !!patient?.id
  });

  const { data: patientOutcomeMeasures = [] } = useQuery({
    queryKey: ['patient-outcomes', patientId],
    queryFn: () => base44.entities.PatientOutcomeMeasure.filter({ patient_id: patientId }, '-sent_date')
  });

  const sendOutcomeMeasureMutation = useMutation({
    mutationFn: async (data) => {
      const { patient_email, ...measureData } = data;
      
      // Create the outcome measure record
      await base44.entities.PatientOutcomeMeasure.create({ ...measureData, clinic_id: patient?.clinic_id, patient_id: patientId });
      
      // Send email notification to patient
      const measure = outcomeMeasures.find(m => m.id === measureData.outcome_measure_id);
      const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
      
      await base44.integrations.Core.SendEmail({
        to: patient_email,
        subject: 'New Questionnaire Available',
        body: `Hi ${patient.full_name},\n\nYour clinician has sent you a new outcome measure questionnaire: ${measure?.name}\n\n${measureData.notes ? `Note from your clinician: ${measureData.notes}\n\n` : ''}Please log in to your portal to complete it: ${portalUrl}\n\nFrequency: ${measureData.frequency === 'one-time' ? 'Complete once' : `You'll receive this ${measureData.frequency}`}\n\nBest regards,\nYour Rehabilitation Team`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-outcomes'] });
    }
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['patient-interventions', patientId],
    queryFn: () => base44.entities.Intervention.filter({ patient_id: patientId }, '-intervention_date')
  });

  const createInterventionMutation = useMutation({
    mutationFn: (data) => base44.entities.Intervention.create({ ...data, clinic_id: patient?.clinic_id, patient_id: patientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-interventions'] });
      setShowInterventionForm(false);
      setEditingIntervention(null);
    }
  });

  const updateInterventionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Intervention.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-interventions'] });
      setShowInterventionForm(false);
      setEditingIntervention(null);
    }
  });

  const deleteInterventionMutation = useMutation({
    mutationFn: (id) => base44.entities.Intervention.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-interventions'] });
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.update(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      setShowEditPatient(false);
    }
  });

  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      // Delete all patient's plans first
      const patientPlans = await base44.entities.RehabPlan.filter({ patient_id: patientId });
      for (const plan of patientPlans) {
        await base44.entities.RehabPlan.delete(plan.id);
      }
      // Then delete the patient
      await base44.entities.Patient.delete(patientId);
    },
    onSuccess: () => {
      window.location.href = createPageUrl('CoachDashboard');
    }
  });

  const sendPortalAccessEmailMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject: `Welcome to ${currentUser.full_name}'s Rehabilitation Program`,
        body: `
Hi ${patient.full_name},

Welcome to your personalized rehabilitation program!

You can access your patient portal here:
${portalUrl}

Log in with your email (${patient.email}) to:
• View your rehabilitation plan
• Track your progress
• Log exercises and pain levels
• Complete assessments

If you need any assistance, please contact your clinician.

Best regards,
${currentUser.full_name}
        `
      });

      await base44.entities.Patient.update(patientId, {
        portal_access_sent: true,
        portal_access_sent_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RehabPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
    }
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: async () => {
      // Get the current plan's phases
      const planPhases = activePlanPhases.map(phase => ({
        phase_number: phase.phase_number,
        name: phase.name,
        description: phase.description,
        duration_weeks: phase.duration_weeks,
        exit_criteria: phase.exit_criteria || [],
        exercises: phase.exercises || []
      }));

      // Create template
      return base44.entities.RehabTemplate.create({
        name: templateData.name,
        description: templateData.description,
        condition_type: templateData.condition_type,
        clinic_id: patient?.clinic_id,
        total_phases: planPhases.length,
        estimated_duration_weeks: planPhases.reduce((sum, p) => sum + (p.duration_weeks || 0), 0),
        phases: planPhases,
        is_public: false
      });
    },
    onSuccess: () => {
      setShowSaveTemplateDialog(false);
      setTemplateData({ name: '', description: '', condition_type: '' });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Milestone.create({
        ...data,
        patient_id: patientId,
        plan_id: activePlan?.id,
        clinic_id: user.clinic_id,
        created_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-milestones'] });
      setShowMilestoneDialog(false);
      setSelectedMilestoneDate(null);
    }
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Milestone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-milestones'] });
      setShowMilestoneOutcomes(null);
      setEditingMilestone(null);
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (reminderType) => {
      const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
      
      let subject = '';
      let body = '';
      
      if (reminderType === 'exercises') {
        subject = 'Reminder: Log Your Exercises Today';
        body = `Hi ${patient.full_name},

This is a friendly reminder to log your exercises for today.

Visit your portal to:
• View your daily exercise plan
• Log completed exercises
• Track your progress

${portalUrl}

Your consistent effort is key to recovery!

Best regards,
Your Rehabilitation Team`;
      } else if (reminderType === 'pain') {
        subject = 'Reminder: Log Your Pain Level';
        body = `Hi ${patient.full_name},

Please take a moment to log your current pain level.

This helps us:
• Monitor your recovery progress
• Adjust your treatment plan if needed
• Ensure optimal healing

${portalUrl}

Best regards,
Your Rehabilitation Team`;
      } else if (reminderType === 'outcomes') {
        const pendingOutcomes = patientOutcomeMeasures.filter(o => o.status === 'pending');
        subject = 'Reminder: Complete Your Questionnaires';
        body = `Hi ${patient.full_name},

You have ${pendingOutcomes.length} pending questionnaire${pendingOutcomes.length > 1 ? 's' : ''} to complete.

These assessments help us track your progress and adjust your treatment plan.

Please complete them at your earliest convenience:
${portalUrl}

Best regards,
Your Rehabilitation Team`;
      }

      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject: subject,
        body: body
      });
    }
  });



  const activePlan = plans.find(p => p.status === 'active');
  const activePlanPhases = phases.filter(p => p.plan_id === activePlan?.id);
  const currentPhase = activePlanPhases.find(p => p.status === 'active');

  const { data: phaseTriggers = [] } = useQuery({
    queryKey: ['phase-triggers', activePlan?.id],
    queryFn: async () => {
      if (!activePlan?.id) return [];
      return base44.entities.PhaseOutcomeTrigger.filter({ plan_id: activePlan.id });
    },
    enabled: !!activePlan?.id
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['patient-milestones', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const user = await base44.auth.me();
      return base44.entities.Milestone.filter({ 
        patient_id: patientId,
        clinic_id: user.clinic_id
      }, '-date');
    },
    enabled: !!patientId
  });

  const { data: dayNotes = [] } = useQuery({
    queryKey: ['day-notes-patient', patientId],
    queryFn: () => base44.entities.DayNote.filter({ patient_id: patientId }, '-date'),
    enabled: !!patientId
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['patient-reports', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const user = await base44.auth.me();
      return base44.entities.Report.filter({ patient_id: patientId, clinic_id: user.clinic_id }, '-date');
    },
    enabled: !!patientId
  });

  const { data: extractions = [] } = useQuery({
    queryKey: ['patient-extractions', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const user = await base44.auth.me();
      return base44.entities.DiagnosisExtraction.filter({ patient_id: patientId, clinic_id: user.clinic_id }, '-approved_date');
    },
    enabled: !!patientId
  });

  // Pain chart data
  const painChartData = painLogs.slice(0, 30).reverse().map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    pain: log.pain_level,
    fullDate: log.date
  }));

  // Calculate metrics for auto-suggestions and status updates
  const last30DaysLogs = exerciseLogs.filter(log => {
    const daysDiff = (Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  });
  
  const expectedExercises = currentPhase?.exercises?.length * 30 || 1;
  const completedExercises = last30DaysLogs.filter(l => l.completed).length;
  const adherenceRate = (completedExercises / expectedExercises) * 100;

  const recentPainLogs = painLogs.slice(0, 7);
  const avgPainLevel = recentPainLogs.length > 0 
    ? recentPainLogs.reduce((sum, log) => sum + log.pain_level, 0) / recentPainLogs.length 
    : null;

  // Note: Removed auto-status updates - plan status should only be changed by explicit clinician actions

  // Initialize edit form when edit dialog opens
  React.useEffect(() => {
    if (patient && showEditPatient) {
      setEditFormData({
        full_name: patient.full_name,
        email: patient.email,
        phone: patient.phone || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        injury_type: patient.injury_type || '',
        injury_date: patient.injury_date || '',
        medications: patient.medications || '',
        medical_conditions: patient.medical_conditions || '',
        notes: patient.notes || ''
      });
    }
  }, [patient, showEditPatient]);

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-10 text-center">
        <p className="text-slate-500">Patient not found</p>
        <Link to={createPageUrl('CoachDashboard')} className="text-teal-600 hover:text-teal-700 mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-5 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Navigation */}
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <Link 
            to={createPageUrl('CoachDashboard')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Patient Header Card - Clean & Prominent */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Patient Avatar & Key Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {patient.full_name?.charAt(0)?.toUpperCase()}
              </div>
              
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">{titleCaseName(patient.full_name)}</h1>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    patient.status === 'active' && "bg-emerald-100 text-emerald-700",
                    patient.status === 'paused' && "bg-amber-100 text-amber-700",
                    patient.status === 'completed' && "bg-blue-100 text-blue-700",
                    patient.status === 'discharged' && "bg-slate-100 text-slate-600"
                  )}>
                    {patient.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  {patient.email}
                  {patient.injury_type && ` • ${patient.injury_type}`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button 
                onClick={() => setShowEditPatient(true)}
                variant="outline"
                className="rounded-xl"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Link to={createPageUrl(`CreatePlan?patient_id=${patientId}`)}>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => sendPortalAccessEmailMutation.mutate()}
                    disabled={sendPortalAccessEmailMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Portal Access
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => sendReminderMutation.mutate('exercises')}
                    disabled={sendReminderMutation.isPending}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Exercise Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => sendReminderMutation.mutate('pain')}
                    disabled={sendReminderMutation.isPending}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Pain Log Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => sendReminderMutation.mutate('outcomes')}
                    disabled={sendReminderMutation.isPending}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Outcome Reminder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updatePatientMutation.mutate({ status: 'paused' })}>
                    Pause Patient
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePatientMutation.mutate({ status: 'completed' })}>
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePatientMutation.mutate({ status: 'discharged' })}>
                    Discharge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePatientMutation.mutate({ status: 'active' })}>
                    Reactivate
                  </DropdownMenuItem>
                  {activePlan && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => updatePlanMutation.mutate({ id: activePlan.id, data: { status: 'completed' }})}
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Complete Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updatePlanMutation.mutate({ id: activePlan.id, data: { status: 'paused' }})}
                      >
                        Pause Plan
                      </DropdownMenuItem>
                    </>
                  )}
                  {plans.length > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          const toDelete = plans.slice(1);
                          let deleted = 0;
                          for (const p of toDelete) {
                            try {
                              await base44.entities.RehabPlan.delete(p.id);
                              deleted++;
                            } catch (e) {
                              console.log('Plan already deleted:', p.id);
                            }
                          }
                          queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
                          alert(`Deleted ${deleted} duplicate plans`);
                        }}
                        className="text-amber-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clean Up Plans
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-rose-600"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Delete Patient
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Quick Status Metrics Row */}
        {activePlan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Adherence */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-1">Adherence</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(adherenceRate)}%</p>
              <p className="text-xs text-slate-500 mt-1">{last30DaysLogs.length} ex / 30d</p>
            </div>

            {/* Current Phase */}
            {currentPhase && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-600 mb-1">Phase</p>
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{currentPhase.name}</p>
                <p className="text-xs text-slate-500 mt-1">{currentPhase.phase_number}/{activePlan.total_phases}</p>
              </div>
            )}

            {/* Avg Pain */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-1">Avg Pain (7d)</p>
              <p className="text-2xl font-bold text-amber-600">{avgPainLevel ? avgPainLevel.toFixed(1) : '—'}</p>
              <p className="text-xs text-slate-500 mt-1">/10</p>
            </div>

            {/* PROMs Due */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-1">PROMs Due</p>
              <p className="text-2xl font-bold text-rose-600">{patientOutcomeMeasures.filter(o => o.status === 'pending').length}</p>
              <Button
                onClick={() => setShowSendOutcomeDialog(true)}
                size="xs"
                variant="ghost"
                className="text-xs text-purple-600 hover:text-purple-700 mt-1 p-0"
              >
                Send →
              </Button>
            </div>
          </div>
        )}

        {activePlan && (
          <CriteriaLedPhaseRibbon
            phases={activePlanPhases}
            currentPhase={currentPhase}
            onPhaseClick={(phase) => {
              setSelectedPhase(phase);
              setActivePatientTab('plan');
            }}
          />
        )}

        {/* Two-Column Layout with Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Column (Left) - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Content */}
            <Tabs value={activePatientTab} onValueChange={setActivePatientTab} className="w-full">
              <PatientWorkspaceNav activeTab={activePatientTab} onChange={setActivePatientTab} />

              <TabsContent value="overview" className="mt-6">
                <PatientOverview
                  patient={patient}
                  activePlan={activePlan}
                  currentPhase={currentPhase}
                  activePlanPhases={activePlanPhases}
                  adherenceRate={adherenceRate}
                  avgPainLevel={avgPainLevel}
                  exerciseLogs={exerciseLogs}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  interventions={interventions}
                  dayNotes={dayNotes}
                  onSendProm={() => setShowSendOutcomeDialog(true)}
                  onAddNote={() => setShowNoteDialog(true)}
                  onViewExitCriteria={() => {
                    setSelectedPhase(currentPhase);
                  }}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6 mx-3 lg:mx-0">
                {activePlan && currentPhase ? (
                  <>
                    <MonthlyCalendarView
                      currentPhase={currentPhase}
                      milestones={milestones}
                      exerciseLogs={exerciseLogs}
                      startDate={activePlan.start_date}
                      showAddMilestone={true}
                      onAddMilestone={(date) => {
                        setSelectedMilestoneDate(format(date, 'yyyy-MM-dd'));
                        setEditingMilestone(null);
                        setShowMilestoneDialog(true);
                      }}
                      onDayClick={(date, dayInfo, dayMilestones) => {
                        setSelectedCalendarDay({ date, dayInfo, milestones: dayMilestones });
                      }}
                    />

                    {/* Day Detail Dialog */}
                    {selectedCalendarDay && (
                      <Dialog open={!!selectedCalendarDay} onOpenChange={() => setSelectedCalendarDay(null)}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{format(selectedCalendarDay.date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            {/* Testing Milestones */}
                            {selectedCalendarDay.milestones?.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800">Testing Milestones</h4>
                                {selectedCalendarDay.milestones.map((milestone) => (
                                  <div key={milestone.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <h5 className="font-semibold text-blue-900">{milestone.title}</h5>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setShowMilestoneOutcomes(milestone);
                                          setSelectedCalendarDay(null);
                                        }}
                                        className="rounded-lg"
                                      >
                                        Enter Results
                                      </Button>
                                    </div>
                                    {milestone.notes && (
                                      <p className="text-sm text-blue-700 mb-3">{milestone.notes}</p>
                                    )}
                                    <div className="space-y-2">
                                      {milestone.tests.map((test, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-3">
                                          <div className="font-medium text-slate-800">{test.test_name}</div>
                                          <div className="text-sm text-slate-600 mt-1">
                                            {test.category} • {test.expected_benchmark || 'No target set'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Rehab Exercises */}
                            {selectedCalendarDay.dayInfo && selectedCalendarDay.dayInfo.type !== 'rest' && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800">Exercise Plan</h4>
                                {selectedCalendarDay.dayInfo.exercises?.map((exercise, idx) => (
                                  <div key={idx} className="bg-slate-50 rounded-xl p-4">
                                    <h5 className="font-semibold text-slate-800 mb-2">{exercise.name}</h5>
                                    {exercise.description && (
                                      <p className="text-sm text-slate-600 mb-3">{exercise.description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div><span className="text-slate-500">Sets:</span> <span className="font-medium">{exercise.sets}</span></div>
                                      <div><span className="text-slate-500">Reps:</span> <span className="font-medium">{exercise.reps}</span></div>
                                      {exercise.weight && <div><span className="text-slate-500">Weight:</span> <span className="font-medium text-blue-600">{exercise.weight}</span></div>}
                                      {exercise.tempo && <div><span className="text-slate-500">Tempo:</span> <span className="font-medium text-green-600">{exercise.tempo}</span></div>}
                                      {exercise.hold && <div><span className="text-slate-500">Hold:</span> <span className="font-medium text-purple-600">{exercise.hold}</span></div>}
                                      {exercise.rpe && <div><span className="text-slate-500">RPE:</span> <span className="font-medium text-rose-600">{exercise.rpe}</span></div>}
                                    </div>
                                    {exercise.notes && (
                                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
                                        <p className="text-sm text-blue-800"><strong>Coach's Notes:</strong> {exercise.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Interventions */}
                            {selectedCalendarDay.interventions?.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800">Interventions</h4>
                                {selectedCalendarDay.interventions.map((intervention) => (
                                  <div key={intervention.id} className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
                                    <h5 className="font-semibold text-rose-900 capitalize">{intervention.intervention_type.replace('_', ' ')}</h5>
                                    {intervention.title && <p className="text-sm text-rose-700 mt-1">{intervention.title}</p>}
                                    {intervention.location && <p className="text-sm text-rose-700">Location: {intervention.location}</p>}
                                    {intervention.medication_or_details && <p className="text-sm text-rose-700">{intervention.medication_or_details}</p>}
                                    {intervention.status && (
                                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                                        intervention.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        intervention.status === 'planned' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {intervention.status}
                                      </span>
                                    )}
                                    {intervention.notes && <p className="text-sm text-rose-700 mt-2">{intervention.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {selectedCalendarDay.dayInfo?.type === 'rest' && !selectedCalendarDay.milestones?.length && !selectedCalendarDay.interventions?.length && (
                              <div className="text-center py-10 text-slate-400">
                                Rest day - no activities scheduled
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
                    <p className="text-slate-500">Create an active plan to view the monthly calendar</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <PatientAnalyticsTab
                  patient={patient}
                  patientId={patientId}
                  exerciseLogs={exerciseLogs}
                  painLogs={painLogs}
                  assessments={assessments}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  currentPhase={currentPhase}
                  adherenceRate={adherenceRate}
                  avgPainLevel={avgPainLevel}
                  dailyNotes={dailyNotes}
                />
              </TabsContent>

              <TabsContent value="deepdive" className="mt-6 mx-3 lg:mx-0">
                <PatientDeepDiveTab
                  patient={patient}
                  exerciseLogs={exerciseLogs}
                  painLogs={painLogs}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  outcomeMeasures={outcomeMeasures}
                  assessments={assessments}
                  activePlan={activePlan}
                />
              </TabsContent>

              <TabsContent value="load-recovery" className="mt-6 mx-3 lg:mx-0">
                <LoadRecoveryPanel patient={patient} />
              </TabsContent>

              <TabsContent value="report" className="mt-6 space-y-4 lg:space-y-6 mx-3 lg:mx-0">
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Report Generation</h3>
                    <div className="flex gap-2">
                      <PDFReportGenerator
                        patient={patient}
                        assessments={assessments}
                        painLogs={painLogs}
                        exerciseLogs={exerciseLogs}
                        patientOutcomeMeasures={patientOutcomeMeasures}
                        outcomeMeasures={outcomeMeasures}
                        interventions={interventions}
                        currentPhase={currentPhase}
                      />
                    </div>
                  </div>
                  <ScheduledReportManager
                    patientId={patientId}
                    patientName={patient.full_name}
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">AI Progress Report</h3>
                    <p className="text-sm text-slate-500">Automated analysis of patient data</p>
                  </div>
                  <AutoProgressReport
                    patient={patient}
                    exerciseLogs={exerciseLogs}
                    painLogs={painLogs}
                    assessments={assessments}
                    outcomeMeasures={patientOutcomeMeasures}
                    currentPhase={currentPhase}
                    days={30}
                  />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6 mx-3 lg:mx-0">
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Patient Progress Timeline</h3>
                  <PatientProgressTimeline exerciseLogs={exerciseLogs} painLogs={painLogs} outcomeMeasures={patientOutcomeMeasures} dailyNotes={dailyNotes} limit={30} />
                </div>
              </TabsContent>

            <TabsContent value="plan" className="mt-6 space-y-4 lg:space-y-6 mx-3 lg:mx-0">
                {/* All Plans List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Rehabilitation Plans</h3>
                    <Link to={createPageUrl(`CreatePlan?patient_id=${patientId}`)}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        New Plan
                      </Button>
                    </Link>
                  </div>

                  {plans.length > 0 ? (
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <div key={plan.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-800">{plan.title}</h4>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                plan.status === 'active' && "bg-emerald-100 text-emerald-700",
                                plan.status === 'completed' && "bg-blue-100 text-blue-700",
                                plan.status === 'paused' && "bg-amber-100 text-amber-700",
                                plan.status === 'draft' && "bg-slate-200 text-slate-700"
                              )}>
                                {plan.status}
                              </span>
                            </div>
                            {plan.description && (
                              <p className="text-sm text-slate-500">{plan.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              {plan.start_date && <span>{format(new Date(plan.start_date), 'MMM d, yyyy')}</span>}
                              {plan.total_phases && <span>• {plan.total_phases} phases</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {plan.status !== 'active' && (
                              <Button
                                onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'active' }})}
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-emerald-600 hover:text-emerald-700"
                              >
                                Reactivate
                              </Button>
                            )}
                            <Link to={createPageUrl(`EditPlan?id=${plan.id}`)}>
                              <Button variant="outline" size="sm" className="rounded-xl">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              onClick={() => updatePlanMutation.mutate({ id: plan.id, data: { status: 'paused' }})}
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                            >
                              Pause
                            </Button>
                            <Button
                              onClick={async () => {
                                if (window.confirm('Delete this plan and all its data? This cannot be undone.')) {
                                  await base44.entities.RehabPlan.delete(plan.id);
                                  queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No plans yet</p>
                    </div>
                  )}
                </div>

                {/* Active Plan Details */}
                {activePlan ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">{activePlan.title}</h2>
                        <p className="text-slate-500 text-sm mt-1">{activePlan.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <RehabPlanPDFButton
                          plan={activePlan}
                          phases={activePlanPhases}
                          patient={patient}
                        />
                        <Button
                          onClick={() => {
                            setTemplateData({
                              name: activePlan.title,
                              description: activePlan.description || '',
                              condition_type: patient?.injury_type || ''
                            });
                            setShowSaveTemplateDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Save as Template
                        </Button>
                      </div>
                    </div>

                    <PhaseTimeline 
                      phases={activePlanPhases}
                      currentPhase={activePlan.current_phase}
                      onPhaseClick={(phase) => setSelectedPhase(phase)}
                    />

                    {/* Automated Triggers */}
                    <div className="mt-6">
                      <PhaseTriggersManager planId={activePlan.id} phases={activePlanPhases} />
                    </div>

                    {/* Weekly Schedule - 7-Day Calendar View */}
                    {(selectedPhase || currentPhase) && (() => {
                          const phase = selectedPhase || currentPhase;
                          
                          // Check if phase has weekly structure
                          if (!phase?.weeks || phase.weeks.length === 0) {
                            return (
                              <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Schedule</h3>
                                <div className="space-y-3">
                                  <p className="text-sm text-slate-500 mb-4">
                                    This phase uses a general exercise list (no day-by-day schedule).
                                  </p>
                                  {phase?.exercises && phase.exercises.length > 0 ? (
                                    phase.exercises.map((exercise, idx) => (
                                      <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="font-medium text-slate-700 mb-2">{exercise.name}</div>
                                        <div className="text-sm text-slate-500 space-y-1">
                                          <div>{exercise.sets} sets × {exercise.reps} reps</div>
                                          <div className="text-xs text-slate-400">{exercise.frequency}</div>
                                          {exercise.description && <p className="text-xs mt-2">{exercise.description}</p>}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-slate-400 py-10">No exercises defined</p>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          const currentWeek = phase.weeks[viewWeekIndex] || phase.weeks[0];
                          
                          return (
                            <div className="mt-6 space-y-4">
                              {/* Week Navigation */}
                              {phase.weeks.length > 1 && (
                                <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewWeekIndex(Math.max(0, viewWeekIndex - 1))}
                                    disabled={viewWeekIndex === 0}
                                    className="rounded-lg"
                                  >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous Week
                                  </Button>
                                  <span className="text-sm font-semibold text-slate-700">
                                    Week {currentWeek.week_number} of {phase.weeks.length}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewWeekIndex(Math.min(phase.weeks.length - 1, viewWeekIndex + 1))}
                                    disabled={viewWeekIndex === phase.weeks.length - 1}
                                    className="rounded-lg"
                                  >
                                    Next Week
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </div>
                              )}

                              {/* 7-Day Calendar Grid */}
                              <div className="grid grid-cols-7 gap-1 sm:gap-2 overflow-x-auto pb-2" style={{minWidth:'480px'}}>
                                {currentWeek.daily_schedule?.map((day, dayIndex) => (
                                  <div 
                                    key={dayIndex}
                                    className={cn(
                                      "bg-white rounded-xl border-2 overflow-hidden",
                                      day.type === 'training' && "border-purple-200",
                                      day.type === 'rest' && "border-slate-200 bg-slate-50",
                                      day.type === 'conditioning' && "border-blue-200"
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
                                    </div>

                                    {/* Exercises */}
                                    <div className="p-3 space-y-3 min-h-[280px] text-[12px]">
                                      {day.type !== 'rest' ? (
                                        <>
                                          {day.exercises && day.exercises.length > 0 ? (
                                            day.exercises.map((exercise, exerciseIndex) => (
                                              <div key={exerciseIndex} className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                exercise.superset_group ? "bg-amber-50 border border-amber-200" : "bg-slate-50"
                                              )}>
                                                <div className="flex items-start gap-1 mb-1">
                                                  {exercise.superset_group && (
                                                    <span className="font-bold text-amber-600">
                                                      {exercise.superset_group}{exercise.superset_position}
                                                    </span>
                                                  )}
                                                  <span className="font-medium text-slate-700 flex-1">
                                                    {exercise.name || 'Unnamed'}
                                                  </span>
                                                </div>

                                                <div className="text-[9px] text-slate-500 mb-1 space-y-0.5">
                                                  <div>{exercise.sets}×{exercise.reps}</div>
                                                  {exercise.weight && <div className="text-blue-600">⚖️ {exercise.weight}</div>}
                                                  {exercise.hold && <div className="text-purple-600">⏱️ Hold: {exercise.hold}</div>}
                                                  {exercise.tempo && <div className="text-green-600">🔄 {exercise.tempo}</div>}
                                                  {exercise.duration && <div className="text-orange-600">⏳ {exercise.duration}</div>}
                                                </div>

                                                {exercise.description && (
                                                  <div className="text-[9px] text-slate-400 mb-1 line-clamp-1">
                                                    {exercise.description}
                                                  </div>
                                                )}
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-center py-6 text-slate-400 text-[10px]">
                                              No exercises assigned
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-center py-8 text-slate-400 text-[10px]">
                                          Rest Day
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Phase Details */}
                        {(selectedPhase || currentPhase) && (
                          <div className="mt-6 p-6 bg-slate-50 rounded-2xl">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                              {(selectedPhase || currentPhase)?.name}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                              {(selectedPhase || currentPhase)?.description}
                            </p>

                            <ExitCriteriaCard 
                              criteria={(selectedPhase || currentPhase)?.exit_criteria}
                              editable={true}
                              onToggle={async (index) => {
                                const phaseToUpdate = selectedPhase || currentPhase;
                                const updatedCriteria = [...phaseToUpdate.exit_criteria];
                                updatedCriteria[index].is_met = !updatedCriteria[index].is_met;

                                await base44.entities.RehabPhase.update(phaseToUpdate.id, {
                                  exit_criteria: updatedCriteria
                                });

                                queryClient.invalidateQueries({ queryKey: ['patient-phases'] });

                                const allMet = updatedCriteria.length > 0 &&
                                  updatedCriteria.every((criterion) => criterion.is_met);

                                await base44.entities.RehabPhase.update(phaseToUpdate.id, {
                                  clinical_decision: 'pending',
                                  last_criteria_reviewed_at: new Date().toISOString()
                                });

                                if (activePlan) {
                                  await base44.entities.RehabPlan.update(activePlan.id, {
                                    clinical_review_required: allMet,
                                    last_updated_at: new Date().toISOString(),
                                    publication_state: 'updated'
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
                                }

                              }}
                            />

                            <ClinicalPhaseDecision
                              phase={selectedPhase || currentPhase}
                              plan={activePlan}
                              phases={activePlanPhases}
                              patient={patient}
                              phaseTriggers={phaseTriggers}
                              outcomeMeasures={outcomeMeasures}
                              onCompleted={async () => {
                                setSelectedPhase(null);
                                await Promise.all([
                                  queryClient.invalidateQueries({ queryKey: ['patient-phases'] }),
                                  queryClient.invalidateQueries({ queryKey: ['patient-plans'] }),
                                  queryClient.invalidateQueries({ queryKey: ['patient-outcomes'] }),
                                  queryClient.invalidateQueries({ queryKey: ['phase-triggers'] })
                                ]);
                              }}
                            />
                            </div>
                            )}
                      </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center">
                    <p className="text-slate-500 mb-4">Create a plan above to get started</p>
                  </div>
                )}
                </TabsContent>

              <TabsContent value="assessments" className="mt-6 mx-3 lg:mx-0">
                <AssessmentsTab
                  assessments={assessments}
                  showAssessmentForm={showAssessmentForm}
                  setShowAssessmentForm={setShowAssessmentForm}
                  editingAssessment={editingAssessment}
                  setEditingAssessment={setEditingAssessment}
                  patientId={patientId}
                  onSubmit={(data) => {
                    if (editingAssessment) {
                      updateAssessmentMutation.mutate({ id: editingAssessment.id, data });
                    } else {
                      createAssessmentMutation.mutate(data);
                    }
                  }}
                  onDelete={(id) => deleteAssessmentMutation.mutate(id)}
                  onDataExtracted={(list) => list.forEach(a => createAssessmentMutation.mutate({
                    ...a,
                    assessment_date: a.assessment_date || new Date().toISOString().split('T')[0],
                    assessment_type: a.assessment_type || 'other',
                    side: a.side || 'n/a'
                  }))}
                />
              </TabsContent>

              <TabsContent value="interventions" className="mt-6 mx-3 lg:mx-0">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Interventions</h3>
                    <Button
                      onClick={() => {
                        setEditingIntervention(null);
                        setShowInterventionForm(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Intervention
                    </Button>
                  </div>

                  {showInterventionForm && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                      <InterventionForm
                        intervention={editingIntervention}
                        onSubmit={(data) => {
                          if (editingIntervention) {
                            updateInterventionMutation.mutate({ id: editingIntervention.id, data });
                          } else {
                            createInterventionMutation.mutate(data);
                          }
                        }}
                        onCancel={() => {
                          setShowInterventionForm(false);
                          setEditingIntervention(null);
                        }}
                      />
                    </div>
                  )}

                  {interventions.length > 0 ? (
                    <div className="space-y-3">
                      {interventions.map((intervention) => (
                        <div key={intervention.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-6 h-6 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 capitalize">
                                  {intervention.intervention_type.replace('_', ' ')}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                  {intervention.location && <span>{intervention.location}</span>}
                                  {intervention.location && intervention.medication_or_details && <span>•</span>}
                                  {intervention.medication_or_details && <span>{intervention.medication_or_details}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingIntervention(intervention);
                                    setShowInterventionForm(true);
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteInterventionMutation.mutate(intervention.id)}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {intervention.notes && (
                              <p className="text-sm text-slate-600 mt-2">{intervention.notes}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span>{format(new Date(intervention.intervention_date), 'MMM d, yyyy')}</span>
                              {intervention.performed_by && <span>• {intervention.performed_by}</span>}
                              {intervention.follow_up_date && (
                                <span>• Follow-up: {format(new Date(intervention.follow_up_date), 'MMM d, yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      No interventions recorded yet
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="outcomes" className="mt-6 mx-3 lg:mx-0">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Outcome Measure Trends</h3>
                  <OutcomeMeasureTrendChart 
                    patientOutcomeMeasures={patientOutcomeMeasures}
                    outcomeMeasures={outcomeMeasures}
                  />
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Outcome Measures</h3>
                    <div className="flex gap-2">
                      <Link to={createPageUrl('CreateOutcomeMeasure')}>
                        <Button variant="outline" className="rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Custom
                        </Button>
                      </Link>
                      <Button
                        onClick={() => setShowSendOutcomeDialog(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Send Outcome Measure
                      </Button>
                    </div>
                  </div>

                  {patientOutcomeMeasures.length > 0 ? (
                    <div className="space-y-3">
                      {patientOutcomeMeasures.map((pom) => {
                        const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
                        return (
                          <div key={pom.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                              pom.status === 'completed' ? "bg-emerald-100" : "bg-amber-100"
                            )}>
                              <ClipboardList className={cn(
                                "w-6 h-6",
                                pom.status === 'completed' ? "text-emerald-600" : "text-amber-600"
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-slate-800">{measure?.name}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{measure?.condition}</p>
                                </div>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  pom.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  {pom.status}
                                </span>
                              </div>
                              {pom.status === 'completed' && (
                                <div className="mt-3 flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-purple-600">{pom.total_score}</span>
                                  <span className="text-slate-500 text-sm">/ {measure?.total_score_max}</span>
                                  <span className="text-xs text-slate-400 ml-2">
                                    Completed {format(new Date(pom.completed_date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              )}
                              {pom.status === 'pending' && (
                                <p className="text-sm text-slate-500 mt-2">
                                  Sent {format(new Date(pom.sent_date), 'MMM d, yyyy')} - Waiting for patient to complete
                                </p>
                              )}
                              {pom.notes && (
                                <p className="text-sm text-slate-600 mt-2">{pom.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      No outcome measures sent yet
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pain" className="mt-6 mx-3 lg:mx-0">
                <PainTab painLogs={painLogs} painChartData={painChartData} />
              </TabsContent>

              <TabsContent value="exercises" className="mt-6 mx-3 lg:mx-0">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Exercise Completion</h3>
                  {exerciseLogs.length > 0 ? (
                    <div className="space-y-3">
                      {exerciseLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">{log.exercise_name}</p>
                            <p className="text-xs text-slate-400">{log.sets_completed} sets × {log.reps_completed} • {format(new Date(log.date), 'MMM d, yyyy')}</p>
                          </div>
                          <span className={cn("px-2 py-1 rounded-full text-xs", log.difficulty === 'too_easy' && "bg-blue-100 text-blue-600", log.difficulty === 'appropriate' && "bg-emerald-100 text-emerald-600", log.difficulty === 'challenging' && "bg-amber-100 text-amber-600", log.difficulty === 'too_hard' && "bg-rose-100 text-rose-600")}>{log.difficulty?.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">No exercises logged yet</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="mt-6 mx-3 lg:mx-0">
                <ClinicianMessaging patient={patient} patientId={patientId} />
              </TabsContent>

              <TabsContent value="ai" className="mt-6 space-y-4 mx-3 lg:mx-0">
                <PatientRiskPanel
                  patient={patient}
                  exerciseLogs={exerciseLogs}
                  painLogs={painLogs}
                  assessments={assessments}
                  patientOutcomeMeasures={patientOutcomeMeasures}
                  adherenceRate={adherenceRate}
                  avgPainLevel={avgPainLevel}
                />
                <SmartClinicalNotes
                  patient={patient}
                  exerciseLogs={exerciseLogs}
                  painLogs={painLogs}
                  assessments={assessments}
                  interventions={interventions}
                  currentPhase={currentPhase}
                  adherenceRate={adherenceRate}
                  avgPainLevel={avgPainLevel}
                />
              </TabsContent>

               <TabsContent value="reports" className="space-y-6">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-800">Reports & Documents</h3>
                    <Button
                      onClick={() => setShowReportUpload(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>

                  <ReportList 
                    reports={reports}
                    patientId={patientId}
                    onExtractClick={(report) => setSelectedReportForExtraction(report)}
                  />
                </div>

                {extractions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Extraction History</h3>
                    <div className="space-y-3">
                      {extractions.map((extraction) => (
                        <div key={extraction.id} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {extraction.extraction_data?.length || 0} diagnoses extracted
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {extraction.status === 'approved' && `Approved ${format(new Date(extraction.approved_date), 'MMM d, yyyy')}`}
                              </p>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              extraction.status === 'approved' && "bg-emerald-100 text-emerald-700",
                              extraction.status === 'pending_review' && "bg-amber-100 text-amber-700"
                            )}>
                              {extraction.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
               </TabsContent>
               </Tabs>
               </div>

               {/* Secondary Column (Right) - 1/3 width - Quick Status Cards */}
               <div className="lg:col-span-1 space-y-6">
              {/* Active Plan Status Card */}
              {activePlan && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Active Plan</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{activePlan.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{activePlan.description}</p>
                  </div>
                  {currentPhase && (
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-xs text-purple-700 font-medium">Current Phase</p>
                      <p className="text-sm font-semibold text-purple-900">{currentPhase.name}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        Phase {currentPhase.phase_number} of {activePlan.total_phases}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* PROMs Due Card */}
              {patientOutcomeMeasures.filter(o => o.status === 'pending').length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900 text-sm">PROMs Due</h3>
                </div>
                <p className="text-2xl font-bold text-amber-700 mb-3">
                  {patientOutcomeMeasures.filter(o => o.status === 'pending').length}
                </p>
                <Button 
                  onClick={() => setShowSendOutcomeDialog(true)}
                  size="sm"
                  className="w-full rounded-lg text-sm bg-amber-600 hover:bg-amber-700 text-white"
                >
                  View
                </Button>
              </div>
              )}

              {/* Upcoming Interventions Card */}
              {interventions.filter(i => i.status === 'planned').length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 bg-rose-50">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-rose-900 text-sm">Interventions Planned</h3>
                </div>
                <p className="text-2xl font-bold text-rose-700 mb-3">
                  {interventions.filter(i => i.status === 'planned').length}
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {interventions.filter(i => i.status === 'planned').slice(0, 3).map(int => (
                    <div key={int.id} className="text-xs text-rose-700 bg-white rounded-lg p-2">
                      <p className="font-medium capitalize">{int.intervention_type.replace('_', ' ')}</p>
                      <p className="text-rose-600">{format(new Date(int.intervention_date), 'MMM d')}</p>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Recent Notes Card */}
              {dayNotes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Latest Note</h3>
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="text-xs text-slate-500 mb-2">
                    {format(new Date(dayNotes[0].date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-slate-700 line-clamp-3">
                    {dayNotes[0].clinician_note || dayNotes[0].patient_note || 'No note content'}
                  </p>
                </div>
              </div>
              )}

              {/* AI Risk Panel (sidebar) */}
              <PatientRiskPanel
                patient={patient}
                exerciseLogs={exerciseLogs}
                painLogs={painLogs}
                assessments={assessments}
                patientOutcomeMeasures={patientOutcomeMeasures}
                adherenceRate={adherenceRate}
                avgPainLevel={avgPainLevel}
              />

              {/* Recent Reports Card */}
              {reports.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Latest Report</h3>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700">{reports[0].type?.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 mt-1">{format(new Date(reports[0].date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <SendOutcomeMeasureDialog
          open={showSendOutcomeDialog}
          onOpenChange={setShowSendOutcomeDialog}
          outcomeMeasures={outcomeMeasures}
          patientId={patientId}
          patientEmail={patient?.email}
          onSend={(data) => sendOutcomeMeasureMutation.mutate(data)}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {titleCaseName(patient?.full_name)}? This will permanently remove all their data including plans, assessments, and logs. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePatientMutation.mutate()}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete Patient
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Testing Milestone Dialog */}
        <TestingMilestoneDialog
          open={showMilestoneDialog}
          onOpenChange={setShowMilestoneDialog}
          selectedDate={selectedMilestoneDate}
          existingMilestone={editingMilestone}
          onSave={(data) => {
            if (editingMilestone) {
              updateMilestoneMutation.mutate({ id: editingMilestone.id, data });
            } else {
              createMilestoneMutation.mutate({ ...data, date: selectedMilestoneDate });
            }
          }}
        />

        {/* Test Outcomes Dialog */}
        {showMilestoneOutcomes && (
          <Dialog open={!!showMilestoneOutcomes} onOpenChange={() => setShowMilestoneOutcomes(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Test Outcomes</DialogTitle>
              </DialogHeader>
              <TestOutcomesForm
                milestone={showMilestoneOutcomes}
                onSave={(data) => updateMilestoneMutation.mutate({ id: showMilestoneOutcomes.id, data })}
                onCancel={() => setShowMilestoneOutcomes(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Patient Dialog */}
        <EditPatientDialog
          open={showEditPatient}
          onOpenChange={setShowEditPatient}
          formData={editFormData}
          setFormData={setEditFormData}
          onSave={() => updatePatientMutation.mutate({ ...editFormData, full_name: titleCaseName(editFormData.full_name) })}
          saving={updatePatientMutation.isPending}
        />

        {/* Report Upload Dialog */}
        <ReportUploadDialog
          open={showReportUpload}
          onOpenChange={setShowReportUpload}
          patientId={patientId}
          clinicId={patient?.clinic_id}
          onSuccess={() => setShowReportUpload(false)}
        />

        {/* AI Extraction Review Dialog */}
        {selectedReportForExtraction && (
          <AIExtractionReview
            open={!!selectedReportForExtraction}
            onOpenChange={() => setSelectedReportForExtraction(null)}
            report={selectedReportForExtraction}
            patientId={patientId}
            clinicId={patient?.clinic_id}
            injuryLibrary={injuryDiagnosisLibrary}
            onSuccess={() => {
              setSelectedReportForExtraction(null);
              queryClient.invalidateQueries({ queryKey: ['patient-extractions'] });
            }}
          />
        )}

        {/* Save as Template Dialog */}
        <SaveTemplateDialog
          open={showSaveTemplateDialog}
          onOpenChange={setShowSaveTemplateDialog}
          templateData={templateData}
          setTemplateData={setTemplateData}
          activePlanPhases={activePlanPhases}
          onSave={() => saveAsTemplateMutation.mutate()}
          saving={saveAsTemplateMutation.isPending}
        />
      </div>
    );
  }