import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Activity,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PatientGlanceCard({ 
  patient, 
  adherenceRate, 
  avgPainLevel, 
  painTrend,
  pendingOutcomes,
  aiInsight 
}) {
  const [showInsight, setShowInsight] = useState(false);

  const sendReminderMutation = useMutation({
    mutationFn: async (type) => {
      const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
      let subject = '';
      let body = '';

      if (type === 'exercise') {
        subject = 'Reminder: Complete Your Exercises';
        body = `Hi ${patient.full_name},\n\nThis is a friendly reminder to complete your exercises today.\n\nVisit your portal: ${portalUrl}\n\nBest regards,\nYour Rehabilitation Team`;
      } else if (type === 'outcomes') {
        subject = 'Reminder: Complete Your Questionnaires';
        body = `Hi ${patient.full_name},\n\nYou have ${pendingOutcomes} pending questionnaire(s) to complete.\n\nVisit your portal: ${portalUrl}\n\nBest regards,\nYour Rehabilitation Team`;
      }

      await base44.integrations.Core.SendEmail({
        to: patient.email,
        subject,
        body
      });
    }
  });

  const hasPainData = Number.isFinite(avgPainLevel);
  const painColor = !hasPainData ? 'text-slate-400' : avgPainLevel <= 3 ? 'text-emerald-600' : avgPainLevel <= 6 ? 'text-amber-600' : 'text-rose-600';
  const adherenceColor = adherenceRate >= 75 ? 'text-emerald-600' : adherenceRate >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <article className="group rounded-[24px] border border-white/[0.08] bg-[#242427] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d8ff5f]/25 hover:shadow-2xl hover:shadow-black/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#d8ff5f] text-lg font-black text-zinc-950 shadow-[0_0_22px_rgba(216,255,95,0.12)]">
            {patient.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white">{patient.full_name}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{patient.injury_type || 'No condition'}</p>
          </div>
        </div>
        <Link to={createPageUrl(`PatientDetail?id=${patient.id}`)}>
          <Button variant="ghost" size="sm" className="rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white" aria-label={`View ${patient.full_name}`}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-white/[0.06] bg-black/[0.15] p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-600">Adherence</span>
          </div>
          <p className={cn("text-lg font-bold", adherenceColor)}>
            {Math.round(adherenceRate)}%
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/[0.15] p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-600">Pain</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <p className={cn("text-lg font-bold", painColor)}>
              {hasPainData ? avgPainLevel.toFixed(1) : 'N/A'}
            </p>
            {painTrend !== 'stable' && (
              painTrend === 'increasing' ? 
                <TrendingUp className="w-3 h-3 text-rose-500" /> : 
                <TrendingDown className="w-3 h-3 text-emerald-500" />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/[0.15] p-2 text-center">
          <span className="text-xs text-slate-600 block mb-1">Pending</span>
          <p className="text-lg font-bold text-slate-900">
            {pendingOutcomes}
          </p>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowInsight(!showInsight)}
            aria-expanded={showInsight}
            className="w-full rounded-xl border border-[#d8ff5f]/15 bg-[#d8ff5f]/[0.07] p-3 text-left transition-colors hover:bg-[#d8ff5f]/10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#d8ff5f]" />
              <span className="text-sm font-semibold text-[#d8ff5f]">AI Insight</span>
            </div>
            {showInsight && (
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">{aiInsight}</p>
            )}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => sendReminderMutation.mutate('exercise')}
          disabled={sendReminderMutation.isPending}
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.07] hover:text-white"
        >
          <Mail className="w-3 h-3 mr-1" />
          Exercise
        </Button>
        {pendingOutcomes > 0 && (
          <Button
            onClick={() => sendReminderMutation.mutate('outcomes')}
            disabled={sendReminderMutation.isPending}
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.07] hover:text-white"
          >
            <Mail className="w-3 h-3 mr-1" />
            Outcomes
          </Button>
        )}
      </div>
    </article>
  );
}
