import React, { useMemo } from 'react';
import { X, MapPin } from 'lucide-react';
import injuryLibrary from './injury_diagnosis_library.json';

export default function InjurySummary({ injury, onRemove }) {
  const region = useMemo(() => {
    return injuryLibrary.regions.find(r => r.region_key === injury.region_key);
  }, [injury.region_key]);

  const diagnosis = useMemo(() => {
    return region?.diagnoses.find(d => d.issue_key === injury.primary_diagnosis_issue_key);
  }, [region, injury.primary_diagnosis_issue_key]);

  if (!region || !diagnosis) return null;

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <div className="font-semibold text-slate-800 text-sm">
            {region.label}
            {injury.side && injury.side !== 'bilateral' && (
              <span className="ml-2 text-xs text-slate-500 font-normal capitalize">
                ({injury.side})
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-700 ml-6 mb-1">{diagnosis.label}</p>
        
        {Object.keys(injury.modifiers).length > 0 && (
          <div className="ml-6 text-xs text-slate-600 space-y-0.5">
            {Object.entries(injury.modifiers).map(([key, value]) => {
              const modifier = diagnosis.modifiers?.find(m => m.key === key);
              if (!modifier || !value) return null;
              return (
                <div key={key}>
                  <span className="text-slate-500">{modifier.label}:</span>{' '}
                  <span className="text-slate-700 font-medium">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(injury.id)}
        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}