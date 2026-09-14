import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Minus, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function AutoProgressReport({ 
  patient, 
  exerciseLogs, 
  painLogs, 
  assessments, 
  outcomeMeasures,
  currentPhase,
  days = 30 
}) {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Calculate key metrics
      const recentExercises = exerciseLogs.slice(0, days);
      const recentPain = painLogs.slice(0, days);
      const recentAssessments = assessments.slice(0, 5);
      const completedOutcomes = outcomeMeasures.filter(o => o.status === 'completed');

      // Calculate adherence
      const totalExpectedSessions = currentPhase?.exercises?.length * days || 0;
      const completedSessions = recentExercises.filter(e => e.completed).length;
      const adherenceRate = totalExpectedSessions > 0 
        ? Math.round((completedSessions / totalExpectedSessions) * 100) 
        : 0;

      // Pain trend
      const avgRecentPain = recentPain.length > 0
        ? (recentPain.reduce((sum, p) => sum + p.pain_level, 0) / recentPain.length).toFixed(1)
        : 0;

      const prompt = `You are a physical therapist analyzing patient progress data. Generate a concise clinical progress report.

Patient: ${patient.full_name}
Condition: ${patient.injury_type || 'Rehabilitation'}
Current Phase: ${currentPhase?.name || 'N/A'}
Analysis Period: Last ${days} days

KEY METRICS:
- Exercise Adherence: ${adherenceRate}% (${completedSessions}/${totalExpectedSessions} sessions)
- Average Pain Level: ${avgRecentPain}/10 (${recentPain.length} logs)
- Assessments Recorded: ${recentAssessments.length}
- Completed Outcome Measures: ${completedOutcomes.length}

RECENT DATA:
Pain Logs (last 7): ${recentPain.slice(0, 7).map(p => `${p.date}: ${p.pain_level}/10 (${p.pain_location})`).join(', ')}

Exercise Completion: ${recentExercises.slice(0, 10).map(e => `${e.exercise_name}: ${e.difficulty}`).join(', ')}

Recent Assessments: ${recentAssessments.map(a => `${a.test_name}: ${a.value}${a.unit}`).join(', ')}

Generate a structured clinical report with:
1. Overall Progress Summary (2-3 sentences)
2. Key Findings (3-5 bullet points covering adherence, pain trends, functional improvements)
3. Concerns/Red Flags (if any - pain increases, poor adherence, etc.)
4. Recommendations (2-3 specific actionable items)

Be clinical, concise, and actionable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_summary: { type: "string" },
            key_findings: {
              type: "array",
              items: { type: "string" }
            },
            concerns: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            progress_status: { 
              type: "string",
              enum: ["excellent", "good", "fair", "concerning"]
            }
          }
        }
      });

      setReport({
        ...result,
        generated_date: new Date().toISOString(),
        metrics: {
          adherence: adherenceRate,
          avgPain: avgRecentPain,
          assessmentCount: recentAssessments.length,
          outcomeCount: completedOutcomes.length
        }
      });
    } catch (error) {
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (report?.progress_status) {
      case 'excellent':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'good':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'fair':
        return <Minus className="w-5 h-5 text-amber-600" />;
      case 'concerning':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (report?.progress_status) {
      case 'excellent':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'fair':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'concerning':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">
            Generate an AI-powered progress report analyzing the last {days} days of patient data
          </p>
          <Button
            onClick={generateReport}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className={cn("p-4 rounded-xl border-2 flex items-center gap-3", getStatusColor())}>
            {getStatusIcon()}
            <div>
              <div className="font-semibold capitalize">{report.progress_status} Progress</div>
              <div className="text-xs opacity-75">
                Generated {format(new Date(report.generated_date), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            <Button
              onClick={generateReport}
              disabled={generating}
              variant="ghost"
              size="sm"
              className="ml-auto"
            >
              Regenerate
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{report.metrics.adherence}%</div>
              <div className="text-xs text-slate-500 mt-1">Adherence</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{report.metrics.avgPain}</div>
              <div className="text-xs text-slate-500 mt-1">Avg Pain</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{report.metrics.assessmentCount}</div>
              <div className="text-xs text-slate-500 mt-1">Assessments</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{report.metrics.outcomeCount}</div>
              <div className="text-xs text-slate-500 mt-1">Outcomes</div>
            </div>
          </div>

          {/* Overall Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Overall Summary</h4>
            <p className="text-slate-600 leading-relaxed">{report.overall_summary}</p>
          </div>

          {/* Key Findings */}
          {report.key_findings?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800 mb-3">Key Findings</h4>
              <ul className="space-y-2">
                {report.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {report.concerns?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Concerns & Red Flags
              </h4>
              <ul className="space-y-2">
                {report.concerns.map((concern, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-800">
                    <span>•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-semibold text-blue-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-800">
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}