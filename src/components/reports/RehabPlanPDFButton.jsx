import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { generatePlanPDF, uploadAndEmailPDF } from './PlanPDFGenerator';
import { Button } from '@/components/ui/button';
import { Download, Mail, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * A self-contained button that fetches phase data for a saved plan,
 * generates a branded PDF, and lets the user download or email it.
 *
 * Props:
 *   plan    – RehabPlan record (must have .id, .title, etc.)
 *   phases  – array of RehabPhase records for this plan
 *   patient – Patient record (must have .full_name, .email)
 */
export default function RehabPlanPDFButton({ plan, phases, patient }) {
  const [loading, setLoading] = useState(false);

  if (!plan) return null;

  const buildPdf = async () => {
    // Flatten phase data into what PlanPDFGenerator expects
    const phaseData = phases.map(ph => {
      // Use the first week's schedule as the representative schedule
      const firstWeek = ph.weeks?.[0];
      return {
        ...ph,
        daily_schedule: firstWeek?.daily_schedule || [],
      };
    });

    return generatePlanPDF(plan, phaseData, patient);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const pdf = await buildPdf();
      pdf.save(`${plan.title?.replace(/\s+/g, '_') || 'rehab_plan'}.pdf`);
    } catch (e) {
      alert('Failed to generate PDF. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!patient?.email) {
      alert('No patient email on record.');
      return;
    }
    setLoading(true);
    try {
      const pdf = await buildPdf();
      await uploadAndEmailPDF(pdf, plan, patient.email, patient.full_name);
      alert(`PDF sent to ${patient.email}`);
    } catch (e) {
      alert('Failed to email PDF. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="rounded-xl"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full mr-2" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Generating…' : 'Export Plan'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail} disabled={loading || !patient?.email}>
          <Mail className="w-4 h-4 mr-2" />
          Email to Patient
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}