import React from 'react';
import { Button } from '@/components/ui/button';
import { Dumbbell, ClipboardList, MessageSquare, Syringe, X } from 'lucide-react';

export default function CalendarFilterToggle({ filters, onChange }) {
  const toggleFilter = (filterKey) => {
    onChange({
      ...filters,
      [filterKey]: !filters[filterKey]
    });
  };

  const allActive = filters.plan && filters.interventions && filters.prompts && filters.checkins;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase">Show:</span>
      
      {!allActive && (
        <Button
          onClick={() => onChange({ plan: true, interventions: true, prompts: true, checkins: true })}
          variant="outline"
          size="sm"
          className="rounded-lg text-xs h-8"
        >
          <X className="w-3 h-3 mr-1" />
          All
        </Button>
      )}

      <Button
        onClick={() => toggleFilter('plan')}
        variant={filters.plan ? "default" : "outline"}
        size="sm"
        className={`rounded-lg text-xs h-8 ${filters.plan ? 'bg-purple-600 hover:bg-purple-700 text-white border-0' : ''}`}
      >
        <Dumbbell className="w-3 h-3 mr-1" />
        Plan
      </Button>

      <Button
        onClick={() => toggleFilter('interventions')}
        variant={filters.interventions ? "default" : "outline"}
        size="sm"
        className={`rounded-lg text-xs h-8 ${filters.interventions ? 'bg-rose-600 hover:bg-rose-700 text-white border-0' : ''}`}
      >
        <Syringe className="w-3 h-3 mr-1" />
        Interventions
      </Button>

      <Button
        onClick={() => toggleFilter('prompts')}
        variant={filters.prompts ? "default" : "outline"}
        size="sm"
        className={`rounded-lg text-xs h-8 ${filters.prompts ? 'bg-amber-600 hover:bg-amber-700 text-white border-0' : ''}`}
      >
        <ClipboardList className="w-3 h-3 mr-1" />
        PROMs
      </Button>

      <Button
        onClick={() => toggleFilter('checkins')}
        variant={filters.checkins ? "default" : "outline"}
        size="sm"
        className={`rounded-lg text-xs h-8 ${filters.checkins ? 'bg-blue-600 hover:bg-blue-700 text-white border-0' : ''}`}
      >
        <MessageSquare className="w-3 h-3 mr-1" />
        Check-ins
      </Button>
    </div>
  );
}