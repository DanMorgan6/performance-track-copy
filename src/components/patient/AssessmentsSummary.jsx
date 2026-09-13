import React, { useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AssessmentsSummary({ assessments }) {
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">No assessments recorded yet</p>
      </div>
    );
  }

  const assessmentTypes = ['all', ...new Set(assessments.map(a => a.assessment_type))];
  const filtered = filterType === 'all' ? assessments : assessments.filter(a => a.assessment_type === filterType);

  const getLatestByType = () => {
    const byType = {};
    assessments.forEach(a => {
      if (!byType[a.assessment_type]) byType[a.assessment_type] = a;
    });
    return Object.values(byType);
  };

  const latest = getLatestByType();

  return (
    <div className="space-y-6">
      {/* Latest Snapshot */}
      {latest.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Latest Assessment Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latest.slice(0, 6).map((assessment) => (
              <div key={assessment.id} className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-xs font-medium text-slate-600 capitalize mb-2">
                  {assessment.assessment_type.replace('_', ' ')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-600">{assessment.value}</span>
                  <span className="text-sm text-slate-500">{assessment.unit}</span>
                </div>
                {assessment.baseline && (
                  <div className="mt-2 pt-2 border-t border-purple-100">
                    <p className="text-xs text-slate-600">
                      Baseline: <span className="font-medium">{assessment.baseline} {assessment.unit}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {assessment.test_name}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">
                  {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Assessment History</h3>
          <div className="flex gap-2">
            {assessmentTypes.map(type => (
              <Button
                key={type}
                onClick={() => setFilterType(type)}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                className="rounded-lg capitalize text-xs"
              >
                {type === 'all' ? 'All' : type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.slice(0, 10).map((assessment) => (
            <div
              key={assessment.id}
              className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{assessment.test_name}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="font-bold text-purple-600">{assessment.value} {assessment.unit}</span>
                    {assessment.baseline && (
                      <span className="text-slate-500">vs baseline {assessment.baseline}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-right">
                  {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                </p>
              </div>

              {expandedId === assessment.id && assessment.notes && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600">{assessment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length > 10 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-slate-600 hover:text-slate-900"
          >
            View all {filtered.length} assessments
          </Button>
        )}
      </div>
    </div>
  );
}