import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PainSlider from "@/components/ui/PainSlider";
import { Activity } from 'lucide-react';

export default function ProgressLogForm({ currentPhase, onSubmit, onCancel }) {
  const [logData, setLogData] = useState({
    exercise_name: '',
    sets_completed: '',
    reps_completed: '',
    weight: '',
    pain_during: 3,
    pain_after: 3,
    difficulty: 'appropriate',
    notes: ''
  });

  const calculateLoad = () => {
    const sets = parseFloat(logData.sets_completed) || 0;
    const reps = parseInt(logData.reps_completed) || 0;
    const weight = parseFloat(logData.weight) || 0;
    return sets * reps * weight;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(logData);
    setLogData({
      exercise_name: '',
      sets_completed: '',
      reps_completed: '',
      weight: '',
      pain_during: 3,
      pain_after: 3,
      difficulty: 'appropriate',
      notes: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exercise Name *</Label>
          {currentPhase?.exercises?.length > 0 ? (
            <select
              value={logData.exercise_name}
              onChange={(e) => setLogData({ ...logData, exercise_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              required
            >
              <option value="">Select exercise</option>
              {currentPhase.exercises.map((ex, idx) => (
                <option key={idx} value={ex.name}>{ex.name}</option>
              ))}
            </select>
          ) : (
            <Input
              value={logData.exercise_name}
              onChange={(e) => setLogData({ ...logData, exercise_name: e.target.value })}
              placeholder="Exercise name"
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <select
            value={logData.difficulty}
            onChange={(e) => setLogData({ ...logData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
          >
            <option value="too_easy">Too Easy</option>
            <option value="appropriate">Appropriate</option>
            <option value="challenging">Challenging</option>
            <option value="too_hard">Too Hard</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Sets Completed</Label>
          <Input
            type="number"
            value={logData.sets_completed}
            onChange={(e) => setLogData({ ...logData, sets_completed: e.target.value })}
            placeholder="3"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Reps Completed</Label>
          <Input
            value={logData.reps_completed}
            onChange={(e) => setLogData({ ...logData, reps_completed: e.target.value })}
            placeholder="10 or 30 sec"
          />
        </div>

        <div className="space-y-2">
          <Label>Weight (kg/lbs)</Label>
          <Input
            type="number"
            value={logData.weight}
            onChange={(e) => setLogData({ ...logData, weight: e.target.value })}
            placeholder="0"
            step="0.5"
            min="0"
          />
        </div>

        {logData.sets_completed && logData.reps_completed && logData.weight && (
          <div className="col-span-2 bg-purple-50 rounded-xl p-3 border border-purple-100">
            <p className="text-sm font-medium text-purple-700">
              Session Load: {calculateLoad().toFixed(1)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {logData.sets_completed} sets × {logData.reps_completed} reps × {logData.weight} kg/lbs
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Pain During Exercise</Label>
          <PainSlider 
            value={logData.pain_during} 
            onChange={(val) => setLogData({ ...logData, pain_during: val })}
          />
        </div>

        <div className="space-y-2">
          <Label>Pain After Exercise</Label>
          <PainSlider 
            value={logData.pain_after} 
            onChange={(val) => setLogData({ ...logData, pain_after: val })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={logData.notes}
          onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
          placeholder="Any observations, challenges, or achievements..."
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
          <Activity className="w-4 h-4 mr-2" />
          Log Progress
        </Button>
      </div>
    </form>
  );
}