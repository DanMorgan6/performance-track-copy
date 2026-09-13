import React from 'react';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ExitCriteriaCard({ criteria, onToggle, editable = false }) {
  if (!criteria || criteria.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
        <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No exit criteria defined</p>
      </div>
    );
  }

  const metCount = criteria.filter(c => c.is_met).length;
  const progress = (metCount / criteria.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-700">Exit Criteria</h4>
        <span className="text-xs text-slate-500">{metCount}/{criteria.length} complete</span>
      </div>
      
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {criteria.map((item, index) => (
          <div 
            key={index}
            onClick={() => editable && onToggle?.(index)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all",
              item.is_met 
                ? "bg-emerald-50 border-emerald-100" 
                : "bg-white border-slate-100",
              editable && "cursor-pointer hover:shadow-sm"
            )}
          >
            {item.is_met ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm",
                item.is_met ? "text-emerald-700" : "text-slate-600"
              )}>
                {item.criterion}
              </p>
              {item.target_value && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: {item.target_value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}