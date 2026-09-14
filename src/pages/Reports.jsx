import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Plus,
  Settings,
  BarChart3,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientProgressReport from "@/components/reports/PatientProgressReport";
import ClinicianPerformanceReport from "@/components/reports/ClinicianPerformanceReport";
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    report_type: 'patient_progress',
    frequency: 'monthly',
    patient_id: '',
    clinician_email: ''
  });
  const [generatingReport, setGeneratingReport] = useState(null);

  // Security: Only admins can access reports
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = '/';
      }
    };
    checkAccess();
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', currentUser?.clinic_id],
    queryFn: async () => {
      if (!currentUser?.clinic_id) return [];
      return base44.entities.Patient.filter({ clinic_id: currentUser.clinic_id });
    },
    enabled: !!currentUser?.clinic_id
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-generated_date')
  });

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      const user = currentUser || await base44.auth.me();
      return base44.entities.Report.create({ ...data, clinic_id: user.clinic_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowConfigDialog(false);
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.Report.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  });

  const generateReport = async (type, patientId = null) => {
    setGeneratingReport(type);
    
    try {
      let reportData = {};
      const now = new Date();
      const periodStart = subMonths(now, 1);
      const periodEnd = now;

      if (type === 'patient_progress' && patientId) {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) throw new Error('Patient not found');
        
        const painLogs = await base44.entities.PainLog.filter({ patient_id: patientId }, '-date');
        const exerciseLogs = await base44.entities.ExerciseLog.filter({ patient_id: patientId }, '-date');
        const assessments = await base44.entities.ObjectiveAssessment.filter({ patient_id: patientId }, '-assessment_date');
        const plans = await base44.entities.RehabPlan.filter({ patient_id: patientId });
        
        const recentPainLogs = painLogs.filter(log => new Date(log.date) >= periodStart);
        const recentExerciseLogs = exerciseLogs.filter(log => new Date(log.date) >= periodStart);
        const recentAssessments = assessments.filter(a => new Date(a.assessment_date) >= periodStart);

        reportData = {
          patient_name: patient?.full_name || '',
          patient_email: patient?.email || '',
          injury_type: patient?.injury_type || 'Unknown',
          period: `${format(periodStart, 'MMM d, yyyy')} - ${format(periodEnd, 'MMM d, yyyy')}`,
          pain_metrics: {
            avg_pain: recentPainLogs.length > 0 
              ? (recentPainLogs.reduce((sum, l) => sum + l.pain_level, 0) / recentPainLogs.length).toFixed(1)
              : 'N/A',
            total_logs: recentPainLogs.length,
            trend: recentPainLogs.length >= 2 
              ? (recentPainLogs[0].pain_level - recentPainLogs[recentPainLogs.length - 1].pain_level).toFixed(1)
              : 0
          },
          exercise_metrics: {
            total_completed: recentExerciseLogs.filter(e => e.completed).length,
            total_logged: recentExerciseLogs.length,
            completion_rate: recentExerciseLogs.length > 0 
              ? ((recentExerciseLogs.filter(e => e.completed).length / recentExerciseLogs.length) * 100).toFixed(0)
              : 0
          },
          assessment_metrics: {
            total_assessments: recentAssessments.length,
            assessments: recentAssessments.slice(0, 5).map(a => ({
              test_name: a.test_name,
              value: a.value,
              unit: a.unit,
              date: a.assessment_date
            }))
          },
          active_plan: plans.find(p => p.status === 'active')?.title || 'No active plan'
        };

        await createReportMutation.mutateAsync({
          report_type: 'patient_progress',
          frequency: 'on_demand',
          patient_id: patientId,
          report_data: reportData,
          generated_date: format(now, 'yyyy-MM-dd'),
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd')
        });
      } else if (type === 'clinician_performance') {
        const allPlans = await base44.entities.RehabPlan.list();
        const allExerciseLogs = await base44.entities.ExerciseLog.list('-date');
        const allPainLogs = await base44.entities.PainLog.list('-date');
        const user = currentUser || await base44.auth.me();

        const activePatients = patients.filter(p => p.status === 'active');
        const activePlans = allPlans.filter(p => p.status === 'active');
        
        const recentExerciseLogs = allExerciseLogs.filter(log => new Date(log.date) >= periodStart);
        const completedExercises = recentExerciseLogs.filter(e => e.completed);

        reportData = {
          clinician_name: user?.full_name || 'Unknown',
          clinician_email: user?.email || '',
          period: `${format(periodStart, 'MMM d, yyyy')} - ${format(periodEnd, 'MMM d, yyyy')}`,
          patient_metrics: {
            total_patients: patients.length,
            active_patients: activePatients.length,
            active_plans: activePlans.length,
            avg_engagement: completedExercises.length > 0 
              ? ((completedExercises.length / recentExerciseLogs.length) * 100).toFixed(0)
              : 0
          },
          engagement_metrics: {
            total_exercise_logs: recentExerciseLogs.length,
            completed_exercises: completedExercises.length,
            completion_rate: recentExerciseLogs.length > 0 
              ? ((completedExercises.length / recentExerciseLogs.length) * 100).toFixed(0)
              : 0
          },
          top_patients: activePatients.slice(0, 5).map(p => ({
            name: p.full_name,
            status: p.status,
            injury: p.injury_type
          }))
        };

        await createReportMutation.mutateAsync({
          report_type: 'clinician_performance',
          frequency: 'on_demand',
          clinician_email: user?.email || '',
          report_data: reportData,
          generated_date: format(now, 'yyyy-MM-dd'),
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd')
        });
      }

      setSelectedReport({ type, data: reportData });
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingReport(null);
    }
  };

  const patientReports = reports.filter(r => r.report_type === 'patient_progress');
  const clinicianReports = reports.filter(r => r.report_type === 'clinician_performance');

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Reports</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Track patient progress and clinician performance</p>
          </div>
          <Button
            onClick={() => setShowConfigDialog(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Configure Report
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Patient Progress Report</h3>
                <p className="text-sm text-slate-500">Last 30 days overview</p>
              </div>
            </div>
            <Select onValueChange={(value) => generateReport('patient_progress', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Performance Summary</h3>
                <p className="text-sm text-slate-500">Your clinical metrics</p>
              </div>
            </div>
            <Button
              onClick={() => generateReport('clinician_performance')}
              disabled={generatingReport === 'clinician_performance'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {generatingReport === 'clinician_performance' ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Current Report View */}
        {selectedReport && (
          <div className="mb-8">
            {selectedReport.type === 'patient_progress' ? (
              <PatientProgressReport data={selectedReport.data} />
            ) : (
              <ClinicianPerformanceReport data={selectedReport.data} />
            )}
          </div>
        )}

        {/* Report History */}
        <Tabs defaultValue="patient" className="w-full">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 mb-0 h-auto">
            <TabsTrigger value="patient" className="rounded-lg text-xs sm:text-sm py-2">Patient Reports</TabsTrigger>
            <TabsTrigger value="clinician" className="rounded-lg text-xs sm:text-sm py-2">Performance Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="mt-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Patient Reports</h3>
              {patientReports.length > 0 ? (
                <div className="space-y-3">
                  {patientReports.map(report => {
                    const patient = patients.find(p => p.id === report.patient_id);
                    return (
                      <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{patient?.full_name}</p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(report.period_start), 'MMM d')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport({ type: 'patient_progress', data: report.report_data })}
                          >
                            View Report
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteReportMutation.mutate(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-400">No reports generated yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clinician" className="mt-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Performance Reports</h3>
              {clinicianReports.length > 0 ? (
                <div className="space-y-3">
                  {clinicianReports.map(report => (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">Performance Summary</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(report.period_start), 'MMM d')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport({ type: 'clinician_performance', data: report.report_data })}
                        >
                          View Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteReportMutation.mutate(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-400">No reports generated yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Config Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Automated Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportConfig.report_type}
                  onValueChange={(value) => setReportConfig({ ...reportConfig, report_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient_progress">Patient Progress</SelectItem>
                    <SelectItem value="clinician_performance">Clinician Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={reportConfig.frequency}
                  onValueChange={(value) => setReportConfig({ ...reportConfig, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="on_demand">On Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportConfig.report_type === 'patient_progress' && (
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={reportConfig.patient_id}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, patient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfigDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => createReportMutation.mutate(reportConfig)}
                  disabled={reportConfig.report_type === 'patient_progress' && !reportConfig.patient_id}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Configure
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}