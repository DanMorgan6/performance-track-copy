import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Search } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TestingMilestoneDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  selectedDate,
  existingMilestone = null
}) {
  const [milestoneData, setMilestoneData] = useState(existingMilestone || {
    title: 'Testing Checkpoint',
    tests: [],
    notes: ''
  });
  const [showTestPicker, setShowTestPicker] = useState(false);
  const [testSearch, setTestSearch] = useState('');

  const { data: testLibrary = [] } = useQuery({
    queryKey: ['test-library'],
    queryFn: () => base44.entities.TestLibrary.list()
  });

  const addTestFromLibrary = (test) => {
    setMilestoneData({
      ...milestoneData,
      tests: [...milestoneData.tests, {
        test_name: test.name,
        category: test.category,
        expected_benchmark: test.benchmark_reference || '',
        notes: '',
        outcome_value: '',
        outcome_unit: test.unit || '',
        outcome_notes: '',
        outcome_status: 'pending'
      }]
    });
    setShowTestPicker(false);
    setTestSearch('');
  };

  const addCustomTest = () => {
    setMilestoneData({
      ...milestoneData,
      tests: [...milestoneData.tests, {
        test_name: '',
        category: 'other',
        expected_benchmark: '',
        notes: '',
        outcome_value: '',
        outcome_unit: '',
        outcome_notes: '',
        outcome_status: 'pending'
      }]
    });
  };

  const updateTest = (index, field, value) => {
    const newTests = [...milestoneData.tests];
    newTests[index][field] = value;
    setMilestoneData({ ...milestoneData, tests: newTests });
  };

  const removeTest = (index) => {
    setMilestoneData({
      ...milestoneData,
      tests: milestoneData.tests.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingMilestone ? 'Edit Testing Milestone' : 'Add Testing Milestone'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {selectedDate && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm font-medium text-purple-800">
                Date: {selectedDate}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={milestoneData.title}
              onChange={(e) => setMilestoneData({ ...milestoneData, title: e.target.value })}
              placeholder="e.g., Week 4 Assessment"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={milestoneData.notes}
              onChange={(e) => setMilestoneData({ ...milestoneData, notes: e.target.value })}
              placeholder="Purpose of this testing session..."
              className="rounded-xl"
              rows={2}
            />
          </div>

          {/* Tests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Planned Tests</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTestPicker(true)}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  From Library
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomTest}
                  className="rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Custom Test
                </Button>
              </div>
            </div>

            {milestoneData.tests.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No tests added yet
              </div>
            ) : (
              <div className="space-y-3">
                {milestoneData.tests.map((test, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Input
                        value={test.test_name}
                        onChange={(e) => updateTest(index, 'test_name', e.target.value)}
                        placeholder="Test name"
                        className="flex-1 mr-2 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTest(index)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <select
                          value={test.category}
                          onChange={(e) => updateTest(index, 'category', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="strength">Strength</option>
                          <option value="endurance">Endurance</option>
                          <option value="balance">Balance</option>
                          <option value="rom">ROM</option>
                          <option value="hop_test">Hop Test</option>
                          <option value="functional">Functional</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Expected Benchmark</Label>
                        <Input
                          value={test.expected_benchmark}
                          onChange={(e) => updateTest(index, 'expected_benchmark', e.target.value)}
                          placeholder="e.g., >90% LSI"
                          className="rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <Label className="text-xs">Test Notes</Label>
                      <Textarea
                        value={test.notes}
                        onChange={(e) => updateTest(index, 'notes', e.target.value)}
                        placeholder="Protocol, instructions..."
                        className="rounded-lg text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onSave(milestoneData)}
              disabled={!milestoneData.title || milestoneData.tests.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Save Milestone
            </Button>
          </div>
        </div>

        {/* Test Library Picker */}
        <Dialog open={showTestPicker} onOpenChange={setShowTestPicker}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Test from Library</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tests..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testLibrary
                  .filter(test => test.name?.toLowerCase().includes(testSearch.toLowerCase()))
                  .map((test) => (
                    <button
                      key={test.id}
                      onClick={() => addTestFromLibrary(test)}
                      className="w-full p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{test.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">{test.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                              {test.category}
                            </span>
                            {test.unit && (
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                {test.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}