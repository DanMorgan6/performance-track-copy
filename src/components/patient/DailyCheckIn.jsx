import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Battery, Moon, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DailyCheckIn({ existingNote, onSubmit, onCancel }) {
  const [noteData, setNoteData] = useState(existingNote || {
    mood: 'good',
    energy_level: 5,
    sleep_quality: 'good',
    notes: '',
    adherence_self_rating: 7
  });

  const moods = [
    { value: 'great', label: 'Great', icon: '😄', color: 'text-emerald-600' },
    { value: 'good', label: 'Good', icon: '🙂', color: 'text-green-600' },
    { value: 'okay', label: 'Okay', icon: '😐', color: 'text-slate-600' },
    { value: 'struggling', label: 'Struggling', icon: '😟', color: 'text-amber-600' },
    { value: 'difficult', label: 'Difficult', icon: '😢', color: 'text-rose-600' }
  ];

  const sleepQuality = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="md:hidden flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[44px] select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div>
        <Label className="mb-3 block">How are you feeling this week?</Label>
        <div className="grid grid-cols-5 gap-1">
          {moods.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setNoteData({...noteData, mood: mood.value})}
              className={cn(
                "py-2 px-1 rounded-xl border-2 transition-all text-center flex flex-col items-center select-none min-h-[44px]",
                noteData.mood === mood.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="text-xl mb-1 leading-none">{mood.icon}</div>
              <div className="text-[10px] font-medium text-slate-600 leading-tight w-full text-center">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 flex items-center gap-2">
          <Battery className="w-4 h-4" />
          Energy Level: {noteData.energy_level}/10
        </Label>
        <input
          type="range"
          min="1"
          max="10"
          value={noteData.energy_level}
          onChange={(e) => setNoteData({...noteData, energy_level: parseInt(e.target.value)})}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div>
        <Label className="mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4" />
          Sleep Quality
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {sleepQuality.map((quality) => (
            <button
              key={quality.value}
              type="button"
              onClick={() => setNoteData({...noteData, sleep_quality: quality.value})}
              className={cn(
                "px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all text-center flex items-center justify-center select-none min-h-[44px]",
                noteData.sleep_quality === quality.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {quality.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">
          How well did you stick to your plan? {noteData.adherence_self_rating}/10
        </Label>
        <input
          type="range"
          min="1"
          max="10"
          value={noteData.adherence_self_rating}
          onChange={(e) => setNoteData({...noteData, adherence_self_rating: parseInt(e.target.value)})}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Poor</span>
          <span>Perfect</span>
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Notes & Observations</Label>
        <Textarea
          value={noteData.notes}
          onChange={(e) => setNoteData({...noteData, notes: e.target.value})}
          placeholder="How did this week go? Any challenges or wins?"
          className="rounded-xl min-h-[80px]"
        />
      </div>

      <div>
        <Label className="mb-1 block font-semibold text-slate-800">🏆 Major Win This Week</Label>
        <p className="text-xs text-slate-500 mb-2">Report your major win this week — no matter how small!</p>
        <Textarea
          value={noteData.major_win || ''}
          onChange={(e) => setNoteData({...noteData, major_win: e.target.value})}
          placeholder="e.g. Completed all sessions, hit a new personal best, felt less pain on stairs..."
          className="rounded-xl min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl select-none min-h-[44px]">
            Cancel
          </Button>
        )}
        <Button 
          type="button"
          onClick={() => onSubmit(noteData)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl select-none min-h-[44px]"
        >
          Save Check-In
        </Button>
      </div>
    </div>
  );
}