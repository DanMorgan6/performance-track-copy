import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import jsPDF from 'jspdf';

export default function PDFReportGenerator({ 
  patient, 
  assessments, 
  painLogs, 
  exerciseLogs,
  patientOutcomeMeasures,
  outcomeMeasures,
  interventions,
  currentPhase 
}) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState({
    summary: true,
    progress: true,
    assessments: true,
    outcomes: true,
    pain: true,
    exercises: true,
    interventions: true
  });

  const toggleSection = (section) => {
    setSections({ ...sections, [section]: !sections[section] });
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.text('Rehabilitation Progress Report', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text(`Patient: ${patient.full_name}`, 20, yPos);
      yPos += 7;
      doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 20, yPos);
      yPos += 15;

      // Summary Section
      if (sections.summary) {
        doc.setFontSize(14);
        doc.text('Patient Summary', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.text(`Condition: ${patient.injury_type || 'N/A'}`, 25, yPos);
        yPos += 5;
        doc.text(`Status: ${patient.status}`, 25, yPos);
        yPos += 5;
        if (currentPhase) {
          doc.text(`Current Phase: ${currentPhase.name}`, 25, yPos);
          yPos += 5;
        }
        yPos += 10;
      }

      // Progress Section
      if (sections.progress) {
        const last30Days = exerciseLogs.filter(log => {
          const daysDiff = (Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        });
        const completed = last30Days.filter(l => l.completed).length;
        const adherence = last30Days.length > 0 ? Math.round((completed / last30Days.length) * 100) : 0;

        doc.setFontSize(14);
        doc.text('Exercise Progress (Last 30 Days)', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.text(`Adherence Rate: ${adherence}%`, 25, yPos);
        yPos += 5;
        doc.text(`Total Exercises Logged: ${last30Days.length}`, 25, yPos);
        yPos += 5;
        doc.text(`Completed: ${completed}`, 25, yPos);
        yPos += 10;
      }

      // Assessments Section
      if (sections.assessments && assessments.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Recent Assessments', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        assessments.slice(0, 5).forEach(assessment => {
          doc.text(`${assessment.test_name}: ${assessment.value} ${assessment.unit}`, 25, yPos);
          yPos += 5;
          doc.text(`  Date: ${format(new Date(assessment.assessment_date), 'MMM d, yyyy')}`, 25, yPos);
          yPos += 5;
        });
        yPos += 5;
      }

      // Outcome Measures Section
      if (sections.outcomes && patientOutcomeMeasures.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Outcome Measures', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        patientOutcomeMeasures.filter(o => o.status === 'completed').slice(0, 5).forEach(pom => {
          const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
          doc.text(`${measure?.name}: ${pom.total_score}/${measure?.total_score_max}`, 25, yPos);
          yPos += 5;
          doc.text(`  Date: ${format(new Date(pom.completed_date), 'MMM d, yyyy')}`, 25, yPos);
          yPos += 5;
        });
        yPos += 5;
      }

      // Pain Tracking Section
      if (sections.pain && painLogs.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        const avgPain = painLogs.slice(0, 7).reduce((sum, log) => sum + log.pain_level, 0) / Math.min(7, painLogs.length);
        doc.setFontSize(14);
        doc.text('Pain Tracking', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.text(`Average Pain (Last 7 Days): ${avgPain.toFixed(1)}/10`, 25, yPos);
        yPos += 5;
        doc.text('Recent Pain Logs:', 25, yPos);
        yPos += 5;
        painLogs.slice(0, 5).forEach(log => {
          doc.text(`${format(new Date(log.date), 'MMM d')}: ${log.pain_level}/10 - ${log.pain_type || 'General'}`, 30, yPos);
          yPos += 5;
        });
        yPos += 5;
      }

      // Interventions Section
      if (sections.interventions && interventions.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Interventions', 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        interventions.slice(0, 5).forEach(intervention => {
          doc.text(`${intervention.intervention_type.replace('_', ' ')} - ${intervention.location || ''}`, 25, yPos);
          yPos += 5;
          doc.text(`  Date: ${format(new Date(intervention.intervention_date), 'MMM d, yyyy')}`, 25, yPos);
          yPos += 5;
        });
      }

      // Save PDF
      doc.save(`${patient.full_name.replace(' ', '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGenerating(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="rounded-xl"
      >
        <Download className="w-4 h-4 mr-2" />
        Generate PDF Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate PDF Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">Select sections to include in the report:</p>
            
            <div className="space-y-3">
              {Object.entries({
                summary: 'Patient Summary',
                progress: 'Exercise Progress',
                assessments: 'Assessments',
                outcomes: 'Outcome Measures',
                pain: 'Pain Tracking',
                exercises: 'Exercise Logs',
                interventions: 'Interventions'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={sections[key]}
                    onCheckedChange={() => toggleSection(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={generatePDF}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}