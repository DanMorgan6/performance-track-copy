import React from 'react';
import { Syringe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InterventionBadge({ interventions }) {
  if (!interventions || interventions.length === 0) return null;

  const plannedCount = interventions.filter(i => i.status === 'planned').length;
  const completedCount = interventions.filter(i => i.status === 'completed').length;

  return (
    <div className="flex items-center gap-0.5 bg-rose-500 text-white rounded-full px-1.5 py-0.5">
      <Syringe className="w-2.5 h-2.5 md:w-3 md:h-3" />
      <span className="text-[8px] md:text-[9px] font-medium">
        {plannedCount > 0 ? plannedCount : completedCount}
      </span>
      {plannedCount > 0 && <AlertCircle className="w-2 h-2 md:w-2.5 md:h-2.5" />}
    </div>
  );
}