import React from 'react';
import { Users, Activity, TrendingUp, Target } from 'lucide-react';

export default function ClinicianPerformanceReport({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Performance Summary</h2>
        <p className="text-slate-500">{data.clinician_name}</p>
        <p className="text-sm text-slate-400 mt-1">{data.period}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Patients */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-slate-700">Total Patients</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600">{data.patient_metrics.total_patients}</div>
        </div>

        {/* Active Patients */}
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-medium text-slate-700">Active Patients</h3>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{data.patient_metrics.active_patients}</div>
        </div>

        {/* Active Plans */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-slate-700">Active Plans</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600">{data.patient_metrics.active_plans}</div>
        </div>

        {/* Avg Engagement */}
        <div className="bg-teal-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-medium text-slate-700">Engagement</h3>
          </div>
          <div className="text-3xl font-bold text-teal-600">{data.patient_metrics.avg_engagement}%</div>
        </div>
      </div>

      {/* Engagement Details */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Exercise Engagement</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Total Exercise Logs</span>
            <span className="font-semibold text-slate-800">{data.engagement_metrics.total_exercise_logs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Completed Exercises</span>
            <span className="font-semibold text-slate-800">{data.engagement_metrics.completed_exercises}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Completion Rate</span>
            <span className="font-semibold text-emerald-600">{data.engagement_metrics.completion_rate}%</span>
          </div>
        </div>
      </div>

      {/* Top Patients */}
      {data.top_patients.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Active Patients</h3>
          <div className="space-y-2">
            {data.top_patients.map((patient, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{patient.name}</p>
                  <p className="text-xs text-slate-500">{patient.injury}</p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full capitalize">
                  {patient.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}