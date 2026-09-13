import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';

export default function ExerciseDetailsEditor({ exercise, onSave, onCancel }) {
  const [details, setDetails] = useState({
    sets: exercise.sets || 3,
    reps: exercise.reps || '10',
    weight: exercise.weight || '',
    hold: exercise.hold || '',
    tempo: exercise.tempo || '',
    duration: exercise.duration || '',
    session_block: exercise.session_block || 'main'
  });

  const handleSave = () => {
    onSave(details);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <h4 className="font-medium text-slate-700">Exercise Details</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Sets</Label>
          <Input
            type="number"
            min="1"
            value={details.sets}
            onChange={(e) => setDetails({...details, sets: parseInt(e.target.value) || 1})}
            className="text-sm rounded-lg"
            placeholder="3"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Reps</Label>
          <Input
            type="text"
            value={details.reps}
            onChange={(e) => setDetails({...details, reps: e.target.value})}
            className="text-sm rounded-lg"
            placeholder="10"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Weight (kg/lbs)</Label>
          <Input
            type="text"
            value={details.weight}
            onChange={(e) => setDetails({...details, weight: e.target.value})}
            className="text-sm rounded-lg"
            placeholder="e.g., 20kg"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Hold (seconds)</Label>
          <Input
            type="text"
            value={details.hold}
            onChange={(e) => setDetails({...details, hold: e.target.value})}
            className="text-sm rounded-lg"
            placeholder="e.g., 30s"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tempo</Label>
          <Input
            type="text"
            value={details.tempo}
            onChange={(e) => setDetails({...details, tempo: e.target.value})}
            className="text-sm rounded-lg"
            placeholder="e.g., 2-0-2-0"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Duration (Cardio)</Label>
          <Input
            type="text"
            value={details.duration}
            onChange={(e) => setDetails({...details, duration: e.target.value})}
            className="text-sm rounded-lg"
            placeholder="e.g., 30 min"
          />
        </div>
      </div>

      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Session Block</Label>
        <select
          value={details.session_block}
          onChange={(e) => setDetails({...details, session_block: e.target.value})}
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="activation">🔥 Activation / Prep</option>
          <option value="main">💪 Main Strength / Power</option>
          <option value="movement">🎯 Movement Competency</option>
          <option value="accessories">➕ Accessories</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          onClick={handleSave}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex-1"
        >
          Save Details
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          size="sm"
          variant="outline"
          className="flex-1 rounded-lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}