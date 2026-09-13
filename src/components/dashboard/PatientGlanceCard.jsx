import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Activity,
  Mail,
  ChevronRight,
  Sparkles,
  Check,
  X
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
  const queryClient = useQueryClient();
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

  const painColor = !avgPainLevel ? 'text-slate-400' : avgPainLevel <= 3 ? 'text-emerald-600' : avgPainLevel <= 6 ? 'text-amber-600' : 'text-rose-600';
  const adherenceColor = adherenceRate >= 75 ? 'text-emerald-600' : adherenceRate >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {patient.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{patient.full_name}</h3>
            <p className="text-xs text-slate-500">{patient.injury_type || 'No condition'}</p>
          </div>
        </div>
        <Link to={createPageUrl(`PatientDetail?id=${patient.id}`)}>
          <Button variant="ghost" size="sm" className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-600">Adherence</span>
          </div>
          <p className={cn("text-lg font-bold", adherenceColor)}>
            {Math.round(adherenceRate)}%
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-600">Pain</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <p className={cn("text-lg font-bold", painColor)}>
              {avgPainLevel ? avgPainLevel.toFixed(1) : 'N/A'}
            </p>
            {painTrend !== 'stable' && (
              painTrend === 'increasing' ? 
                <TrendingUp className="w-3 h-3 text-rose-500" /> : 
                <TrendingDown className="w-3 h-3 text-emerald-500" />
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-2 text-center">
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
            onClick={() => setShowInsight(!showInsight)}
            className="w-full text-left p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Insight</span>
            </div>
            {showInsight && (
              <p className="text-xs text-purple-700 mt-2">{aiInsight}</p>
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
          className="flex-1 rounded-xl text-xs"
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
            className="flex-1 rounded-xl text-xs"
          >
            <Mail className="w-3 h-3 mr-1" />
            Outcomes
          </Button>
        )}
      </div>
    </div>
  );
}