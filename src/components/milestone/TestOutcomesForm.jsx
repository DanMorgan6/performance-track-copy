import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TestOutcomesForm({ milestone, onSave, onCancel, onPublishToggle }) {
  const [milestoneData, setMilestoneData] = useState(milestone);

  const updateTestOutcome = (index, field, value) => {
    const newTests = [...milestoneData.tests];
    newTests[index][field] = value;
    setMilestoneData({ ...milestoneData, tests: newTests });
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="font-semibold text-purple-900">{milestone.title}</h3>
        <p className="text-sm text-purple-700 mt-1">{milestone.date}</p>
        {milestone.notes && (
          <p className="text-sm text-purple-600 mt-2">{milestone.notes}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Test Results</Label>
        
        {milestoneData.tests.map((test, index) => (
          <div key={index} className="bg-white border-2 border-slate-200 rounded-xl p-4">
            <div className="mb-3">
              <h4 className="font-semibold text-slate-800">{test.test_name}</h4>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  {test.category}
                </span>
                {test.expected_benchmark && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    Target: {test.expected_benchmark}
                  </span>
                )}
              </div>
              {test.notes && (
                <p className="text-sm text-slate-500 mt-2">{test.notes}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Result Value</Label>
                  <Input
                    value={test.outcome_value}
                    onChange={(e) => updateTestOutcome(index, 'outcome_value', e.target.value)}
                    placeholder="e.g., 85"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={test.outcome_unit}
                    onChange={(e) => updateTestOutcome(index, 'outcome_unit', e.target.value)}
                    placeholder="e.g., %LSI, kg, degrees"
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <div className="flex gap-2">
                  {['pending', 'pass', 'partial', 'fail'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateTestOutcome(index, 'outcome_status', status)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2",
                        test.outcome_status === status
                          ? status === 'pass' ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : status === 'fail' ? "bg-rose-50 border-rose-500 text-rose-700"
                          : status === 'partial' ? "bg-amber-50 border-amber-500 text-amber-700"
                          : "bg-slate-50 border-slate-500 text-slate-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {status === 'pass' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                      {status === 'fail' && <XCircle className="w-4 h-4 inline mr-1" />}
                      {status === 'partial' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Outcome Notes</Label>
                <Textarea
                  value={test.outcome_notes}
                  onChange={(e) => updateTestOutcome(index, 'outcome_notes', e.target.value)}
                  placeholder="Observations, comparison to benchmark..."
                  className="rounded-lg"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-blue-900">Publish to Patient</Label>
            <p className="text-xs text-blue-700 mt-1">
              Make results visible in patient portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMilestoneData({ ...milestoneData, outcomes_published: !milestoneData.outcomes_published })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              milestoneData.outcomes_published ? "bg-blue-600" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                milestoneData.outcomes_published ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onSave(milestoneData)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
        >
          Save Results
        </Button>
      </div>
    </div>
  );
}