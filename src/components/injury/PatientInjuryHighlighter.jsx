import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PatientInjuryHighlighter({ patient }) {
  const [injuries, setInjuries] = useState([]);

  useEffect(() => {
    const loadInjuries = async () => {
      if (!patient?.id) return;
      const patientInjuries = await base44.entities.Injury.filter({ 
        patient_id: patient.id 
      });
      setInjuries(patientInjuries);
    };
    
    loadInjuries();
  }, [patient?.id]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Recorded Injuries</h3>
      
      {injuries.length > 0 ? (
        <div className="space-y-3">
          {injuries.map((injury) => (
            <div key={injury.id} className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <div className="font-medium text-rose-900 mb-1">
                {injury.region_label}
              </div>
              <div className="text-sm text-rose-700 mb-2">
                {injury.issue_label}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-rose-100 rounded text-rose-700">
                  {injury.side || 'bilateral'}
                </span>
                {injury.severity && (
                  <span className="px-2 py-1 bg-rose-100 rounded text-rose-700">
                    {injury.severity}
                  </span>
                )}
                <span className={`px-2 py-1 rounded ${
                  injury.confirmed_status === 'confirmed' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {injury.confirmed_status}
                </span>
              </div>
              {injury.notes && (
                <p className="text-xs text-rose-600 mt-2">{injury.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No injuries recorded</p>
      )}
    </div>
  );
}