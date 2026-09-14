import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function LoadPerformanceInsights({ patient, exerciseLogs }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Filter logs with weight data
      const logsWithWeight = exerciseLogs.filter(log => 
        log.weight && log.weight > 0 && log.sets_completed && log.reps_completed
      );

      if (logsWithWeight.length === 0) {
        setInsights({ error: 'No load data available for analysis' });
        setLoading(false);
        return;
      }

      // Calculate weekly loads
      const weeklyLoads = {};
      logsWithWeight.forEach(log => {
        const date = new Date(log.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        const load = (log.sets_completed || 0) * (parseInt(log.reps_completed) || 0) * (log.weight || 0);
        
        if (!weeklyLoads[weekKey]) {
          weeklyLoads[weekKey] = { load: 0, sessions: 0 };
        }
        weeklyLoads[weekKey].load += load;
        weeklyLoads[weekKey].sessions += 1;
      });

      const weeklyData = Object.entries(weeklyLoads)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-8)
        .map(([week, data]) => ({
          week,
          totalLoad: Math.round(data.load),
          sessions: data.sessions,
          avgLoad: Math.round(data.load / data.sessions)
        }));

      // Prepare context for AI
      const prompt = `You are a sports performance analyst. Analyze the following training load data for ${patient.full_name} (${patient.injury_type || 'rehabilitation patient'}).

Weekly Load Data (last 8 weeks):
${weeklyData.map(w => `Week ${format(new Date(w.week), 'MMM d')}: Total Load ${w.totalLoad}, ${w.sessions} sessions, Avg ${w.avgLoad} per session`).join('\n')}

Provide insights in the following categories:
1. Overall Trend: Is load progressing appropriately?
2. Load Consistency: Are there concerning spikes or drops?
3. Recommendations: What adjustments should be made?
4. Risk Assessment: Any overtraining or undertraining concerns?

Be concise, practical, and clinical in your analysis.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            trend: { type: 'string' },
            consistency: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            risk_level: { type: 'string', enum: ['low', 'moderate', 'high'] },
            summary: { type: 'string' }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights({ error: 'Failed to generate insights' });
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 text-center">
        <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
        <h4 className="font-semibold text-slate-800 mb-2">AI Load Performance Insights</h4>
        <p className="text-sm text-slate-600 mb-4">
          Get AI-powered analysis of training load trends and personalized recommendations
        </p>
        <Button
          onClick={generateInsights}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
    );
  }

  if (insights.error) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">{insights.error}</p>
      </div>
    );
  }

  const riskColors = {
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
    high: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle }
  };

  const risk = riskColors[insights.risk_level] || riskColors.moderate;
  const RiskIcon = risk.icon;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-slate-800">AI Load Insights</h4>
        </div>
        <Button
          onClick={generateInsights}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="text-purple-600"
        >
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-purple-50 rounded-xl p-4 mb-4">
        <p className="text-sm text-slate-700">{insights.summary}</p>
      </div>

      <div className="space-y-4">
        {/* Trend Analysis */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h5 className="text-sm font-semibold text-slate-700">Trend Analysis</h5>
          </div>
          <p className="text-sm text-slate-600 pl-6">{insights.trend}</p>
        </div>

        {/* Consistency */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-slate-700">Load Consistency</h5>
          </div>
          <p className="text-sm text-slate-600 pl-6">{insights.consistency}</p>
        </div>

        {/* Risk Assessment */}
        <div className={`rounded-xl p-3 border ${risk.bg} ${risk.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <RiskIcon className={`w-4 h-4 ${risk.text}`} />
            <h5 className={`text-sm font-semibold ${risk.text}`}>
              Risk Level: {insights.risk_level.charAt(0).toUpperCase() + insights.risk_level.slice(1)}
            </h5>
          </div>
        </div>

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-2">Recommendations</h5>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}