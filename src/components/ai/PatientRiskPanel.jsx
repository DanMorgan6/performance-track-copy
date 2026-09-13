import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingDown, TrendingUp, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PatientRiskPanel({ patient, exerciseLogs, painLogs, assessments, patientOutcomeMeasures, adherenceRate, avgPainLevel }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const recentPain = painLogs.slice(0, 14).map(l => ({ date: l.date, level: l.pain_level, type: l.pain_type }));
      const recentLogs = exerciseLogs.slice(0, 30).map(l => ({ date: l.date, exercise: l.exercise_name, completed: l.completed, difficulty: l.difficulty, pain_during: l.pain_during }));
      const pendingOutcomes = patientOutcomeMeasures.filter(o => o.status === 'pending').length;
      const completedOutcomes = patientOutcomeMeasures.filter(o => o.status === 'completed');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical physiotherapy AI assistant. Analyse this patient's data and return a concise risk assessment and recommendations.

Patient: ${patient.full_name}, Injury: ${patient.injury_type || 'Not specified'}
Adherence Rate (30d): ${Math.round(adherenceRate)}%
Average Pain (7d): ${avgPainLevel ? avgPainLevel.toFixed(1) : 'No data'}/10
Pending questionnaires: ${pendingOutcomes}
Recent pain logs (last 14 days): ${JSON.stringify(recentPain)}
Recent exercise logs (last 30 days): ${JSON.stringify(recentLogs)}
Completed outcome scores: ${JSON.stringify(completedOutcomes.map(o => ({ score: o.total_score, date: o.completed_date })))}

Return a JSON object with:
- risk_level: "low", "moderate", or "high"
- risk_summary: one sentence summary of the patient's current risk status
- alerts: array of up to 3 specific concerns (strings), empty array if none
- positive_indicators: array of up to 2 positive signs (strings), empty array if none
- recommendation: one actionable recommendation for the clinician`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_level: { type: "string" },
            risk_summary: { type: "string" },
            alerts: { type: "array", items: { type: "string" } },
            positive_indicators: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" }
          }
        }
      });
      setInsights(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck, iconColor: 'text-emerald-600' },
    moderate: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-600' },
    high: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: AlertTriangle, iconColor: 'text-rose-600' },
  };

  const style = insights ? riskColors[insights.risk_level] || riskColors.low : null;

  return (
    <div className={cn("bg-white rounded-2xl border p-5 shadow-sm", insights ? `${style.bg} ${style.border}` : "border-slate-100")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold text-slate-800 text-sm">AI Risk Assessment</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateInsights}
          disabled={loading}
          className="rounded-lg text-xs h-7 px-2"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          {loading ? 'Analysing...' : insights ? 'Refresh' : 'Analyse'}
        </Button>
      </div>

      {!insights && !loading && (
        <p className="text-xs text-slate-400 text-center py-4">Click "Analyse" to generate an AI-powered risk assessment for this patient.</p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-xs text-slate-500">Analysing patient data...</span>
        </div>
      )}

      {insights && !loading && (() => {
        const RiskIcon = style.icon;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RiskIcon className={cn("w-4 h-4", style.iconColor)} />
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", style.badge)}>
                {insights.risk_level} risk
              </span>
            </div>

            <p className="text-xs text-slate-700">{insights.risk_summary}</p>

            {insights.alerts?.length > 0 && (
              <div className="space-y-1">
                {insights.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-rose-700 bg-rose-50 rounded-lg px-2 py-1.5">
                    <TrendingDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {alert}
                  </div>
                ))}
              </div>
            )}

            {insights.positive_indicators?.length > 0 && (
              <div className="space-y-1">
                {insights.positive_indicators.map((pos, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5">
                    <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {pos}
                  </div>
                ))}
              </div>
            )}

            {insights.recommendation && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-2">
                <p className="text-xs font-medium text-purple-800 mb-0.5">Recommendation</p>
                <p className="text-xs text-purple-700">{insights.recommendation}</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}