import React from 'react';
import { cn } from "@/lib/utils";

const painColors = [
  'bg-emerald-400',
  'bg-emerald-300',
  'bg-lime-300',
  'bg-lime-400',
  'bg-yellow-300',
  'bg-yellow-400',
  'bg-orange-300',
  'bg-orange-400',
  'bg-red-400',
  'bg-red-500',
  'bg-red-600'
];

const painLabels = [
  'No Pain',
  'Minimal',
  'Mild',
  'Uncomfortable',
  'Moderate',
  'Distracting',
  'Distressing',
  'Unmanageable',
  'Intense',
  'Severe',
  'Worst Possible'
];

export default function PainSlider({ value, onChange, disabled = false }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">Pain Level</span>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          painColors[value],
          value <= 3 ? "text-slate-700" : "text-white"
        )}>
          {value} - {painLabels[value]}
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, 
              #10b981 0%, 
              #84cc16 30%, 
              #facc15 50%, 
              #f97316 70%, 
              #ef4444 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}