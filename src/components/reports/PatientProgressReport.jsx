import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PatientProgressReport({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{data.patient_name}</h2>
        <p className="text-slate-500">{data.injury_type}</p>
        <p className="text-sm text-slate-400 mt-1">{data.period}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Pain Metrics */}
        <div className="bg-rose-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-slate-800">Pain Level</h3>
          </div>
          <div className="text-3xl font-bold text-rose-600 mb-1">{data.pain_metrics.avg_pain}</div>
          <p className="text-xs text-slate-600">Average pain (0-10)</p>
          <p className="text-xs text-slate-500 mt-2">{data.pain_metrics.total_logs} logs recorded</p>
        </div>

        {/* Exercise Metrics */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-800">Exercise Adherence</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">{data.exercise_metrics.completion_rate}%</div>
          <p className="text-xs text-slate-600">Completion rate</p>
          <p className="text-xs text-slate-500 mt-2">
            {data.exercise_metrics.total_completed} / {data.exercise_metrics.total_logged} completed
          </p>
        </div>

        {/* Assessment Metrics */}
        <div className="bg-teal-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800">Assessments</h3>
          </div>
          <div className="text-3xl font-bold text-teal-600 mb-1">{data.assessment_metrics.total_assessments}</div>
          <p className="text-xs text-slate-600">Tests completed</p>
        </div>
      </div>

      {/* Active Plan */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-slate-800 mb-2">Current Plan</h3>
        <p className="text-slate-600">{data.active_plan}</p>
      </div>

      {/* Recent Assessments */}
      {data.assessment_metrics.assessments.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Recent Assessments</h3>
          <div className="space-y-2">
            {data.assessment_metrics.assessments.map((assessment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{assessment.test_name}</p>
                  <p className="text-xs text-slate-500">{format(new Date(assessment.date), 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{assessment.value} {assessment.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}