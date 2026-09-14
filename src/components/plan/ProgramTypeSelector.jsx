import React from 'react';
import { Layers, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ProgramTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Select Program Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Program */}
        <button
          onClick={() => onSelect('basic')}
          className={cn(
            "p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg",
            "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
          )}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Basic Program</h3>
              <p className="text-xs text-slate-500">Simple recurring exercises</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mb-3">
            A straightforward exercise bundle repeated across a timeframe with consistent frequency.
          </p>
          
          <ul className="text-xs text-slate-500 space-y-1">
            <li>✓ Fixed duration (start & end date)</li>
            <li>✓ Weekly frequency (daily, 2x, 3x, 4x/week)</li>
            <li>✓ Optional weekend rest toggle</li>
            <li>✓ One exercise bundle for entire duration</li>
          </ul>
        </button>

        {/* Phased Program */}
        <button
          onClick={() => onSelect('phased')}
          className={cn(
            "p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg",
            "border-slate-200 hover:border-purple-400 hover:bg-purple-50"
          )}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Phased Program</h3>
              <p className="text-xs text-slate-500">Multi-phase progression</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mb-3">
            Progressive rehabilitation with multiple phases, exit criteria, and phase-specific exercises.
          </p>
          
          <ul className="text-xs text-slate-500 space-y-1">
            <li>✓ Multiple phases with progression</li>
            <li>✓ Exit criteria for phase advancement</li>
            <li>✓ Unique exercises per phase</li>
            <li>✓ Detailed day-by-day scheduling</li>
          </ul>
        </button>
      </div>
    </div>
  );
}