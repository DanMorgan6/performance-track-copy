import React from 'react';
import { format, subDays } from 'date-fns';


import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ProgressDashboard({ painLogs, assessments, exerciseLogs, outcomeMeasures }) {
  // Pain trend analysis
  const recentPain = painLogs.slice(0, 7);
  const olderPain = painLogs.slice(7, 14);
  const avgRecentPain = recentPain.reduce((sum, log) => sum + log.pain_level, 0) / (recentPain.length || 1);
  const avgOlderPain = olderPain.reduce((sum, log) => sum + log.pain_level, 0) / (olderPain.length || 1);
  const painTrend = avgRecentPain - avgOlderPain;

  // Exercise adherence
  const last7Days = Array.from({length: 7}, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });
  const completedDays = last7Days.filter(date => 
    exerciseLogs.some(log => log.date === date && log.completed)
  ).length;
  const adherenceRate = (completedDays / 7) * 100;

  // Assessment improvement
  const groupedAssessments = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.test_name]) acc[assessment.test_name] = [];
    acc[assessment.test_name].push(assessment);
    return acc;
  }, {});

  const assessmentTrends = Object.entries(groupedAssessments).map(([testName, tests]) => {
    const sorted = tests.sort((a, b) => new Date(a.assessment_date) - new Date(b.assessment_date));
    const latest = parseFloat(sorted[sorted.length - 1]?.value) || 0;
    const baseline = parseFloat(sorted[0]?.baseline || sorted[0]?.value) || 0;
    const improvement = baseline > 0 ? ((latest - baseline) / baseline * 100) : 0;
    return { testName, improvement, latest, baseline };
  });

  // Outcome measure completion
  const completedOutcomes = outcomeMeasures.filter(o => o.status === 'completed');
  const completionRate = outcomeMeasures.length > 0 
    ? (completedOutcomes.length / outcomeMeasures.length * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Pain Trend</span>
            {painTrend < -0.5 ? (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            ) : painTrend > 0.5 ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {avgRecentPain.toFixed(1)}/10
          </div>
          <p className={cn(
            "text-xs mt-1",
            painTrend < -0.5 && "text-emerald-600",
            painTrend > 0.5 && "text-rose-600",
            Math.abs(painTrend) <= 0.5 && "text-slate-400"
          )}>
            {painTrend < 0 ? '↓' : painTrend > 0 ? '↑' : '→'} {Math.abs(painTrend).toFixed(1)} from last week
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Exercise Adherence</span>
            {adherenceRate >= 80 && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className="text-2xl font-bold text-slate-800">{adherenceRate.toFixed(0)}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {completedDays}/7 days this week
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Questionnaires</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{completionRate.toFixed(0)}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {completedOutcomes.length}/{outcomeMeasures.length} completed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Assessments</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{assessments.length}</div>
          <p className="text-xs text-slate-400 mt-1">Total recorded</p>
        </div>
      </div>

      {/* Assessment Improvements */}
      {assessmentTrends.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-4">Assessment Progress</h4>
          <div className="space-y-3">
            {assessmentTrends.map((trend, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{trend.testName}</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      trend.improvement > 0 ? "text-emerald-600" : "text-slate-500"
                    )}>
                      {trend.improvement > 0 ? '+' : ''}{trend.improvement.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all"
                      style={{ width: `${Math.min(Math.abs(trend.improvement), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                    <span>Baseline: {trend.baseline}</span>
                    <span>Current: {trend.latest}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}