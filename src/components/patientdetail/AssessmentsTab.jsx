import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AssessmentForm from '@/components/assessment/AssessmentForm';
import AssessmentDataExtractor from '@/components/assessment/AssessmentDataExtractor';
import AssessmentTrendChart from '@/components/analytics/AssessmentTrendChart';

export default function AssessmentsTab({
  assessments,
  showAssessmentForm,
  setShowAssessmentForm,
  editingAssessment,
  setEditingAssessment,
  onSubmit,
  onDelete,
  patientId,
  onDataExtracted,
}) {
  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Assessment Trends</h3>
        <AssessmentTrendChart assessments={assessments} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Objective Assessments</h3>
          <Button
            onClick={() => { setEditingAssessment(null); setShowAssessmentForm(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Assessment
          </Button>
        </div>

        <AssessmentDataExtractor patientId={patientId} onDataExtracted={onDataExtracted} />

        {showAssessmentForm && (
          <div className="mb-6">
            <AssessmentForm
              assessment={editingAssessment}
              onSubmit={onSubmit}
              onCancel={() => { setShowAssessmentForm(false); setEditingAssessment(null); }}
            />
          </div>
        )}

        {assessments.length > 0 ? (
          <div className="space-y-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{assessment.test_name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="px-2 py-0.5 bg-white rounded text-xs">
                          {assessment.assessment_type?.replace('_', ' ')}
                        </span>
                        {assessment.body_part && <span>• {assessment.body_part}</span>}
                        {assessment.side !== 'n/a' && <span>• {assessment.side}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingAssessment(assessment); setShowAssessmentForm(true); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(assessment.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-600">{assessment.value}</span>
                      <span className="text-slate-500">{assessment.unit}</span>
                    </div>
                    {assessment.baseline && (
                      <div className="text-slate-400">
                        Baseline: {assessment.baseline} {assessment.unit}
                      </div>
                    )}
                  </div>
                  {assessment.notes && (
                    <p className="text-sm text-slate-600 mt-2">{assessment.notes}</p>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                    {assessment.clinician_name && ` • ${assessment.clinician_name}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">No assessments recorded yet</div>
        )}
      </div>
    </>
  );
}