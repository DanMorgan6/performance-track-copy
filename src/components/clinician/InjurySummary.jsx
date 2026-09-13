import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";

export default function InjurySummary({ patient }) {
  const [selectedSide, setSelectedSide] = useState('front');

  const injuryRegions = {
    front: [
      { id: 'neck', label: 'Neck', y: 80 },
      { id: 'shoulder', label: 'Shoulder', y: 130 },
      { id: 'elbow', label: 'Elbow', y: 200 },
      { id: 'wrist', label: 'Wrist', y: 260 },
      { id: 'chest', label: 'Chest', y: 180 },
      { id: 'abdomen', label: 'Abdomen', y: 250 },
      { id: 'hip', label: 'Hip', y: 320 },
      { id: 'knee', label: 'Knee', y: 400 },
      { id: 'ankle', label: 'Ankle', y: 480 },
    ],
    back: [
      { id: 'neck', label: 'Neck', y: 80 },
      { id: 'shoulder', label: 'Shoulder', y: 130 },
      { id: 'back', label: 'Upper Back', y: 180 },
      { id: 'lumbar', label: 'Lower Back', y: 270 },
      { id: 'glute', label: 'Glute', y: 340 },
      { id: 'hamstring', label: 'Hamstring', y: 390 },
      { id: 'calf', label: 'Calf', y: 460 },
      { id: 'ankle', label: 'Ankle', y: 480 },
    ]
  };

  const injuryType = patient?.injury_type?.toLowerCase() || '';
  const highlightedRegions = injuryType
    .split(/[,\s&]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Injury Summary</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSide('front')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedSide === 'front'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setSelectedSide('back')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedSide === 'back'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Diagram */}
        <div className="flex justify-center items-start">
          <svg
            width="120"
            height="500"
            viewBox="0 0 120 500"
            className="drop-shadow-sm"
          >
            {/* Head */}
            <circle cx="60" cy="40" r="25" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Neck */}
            <rect x="50" y="65" width="20" height="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Shoulders & Arms */}
            <line x1="20" y1="90" x2="100" y2="90" stroke="#94a3b8" strokeWidth="2" />
            <line x1="20" y1="90" x2="10" y2="180" stroke="#94a3b8" strokeWidth="2" />
            <line x1="100" y1="90" x2="110" y2="180" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Torso */}
            <rect x="40" y="95" width="40" height="80" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="8" />
            
            {/* Abdomen */}
            <rect x="40" y="175" width="40" height="60" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="8" />
            
            {/* Hips */}
            <line x1="30" y1="235" x2="90" y2="235" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Legs */}
            <line x1="40" y1="235" x2="35" y2="380" stroke="#94a3b8" strokeWidth="2" />
            <line x1="80" y1="235" x2="85" y2="380" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Feet */}
            <rect x="28" y="380" width="14" height="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="2" />
            <rect x="78" y="380" width="14" height="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" rx="2" />

            {/* Highlight injured regions */}
            {injuryRegions[selectedSide].map((region) => {
              const isHighlighted = highlightedRegions.some(r => region.label.toLowerCase().includes(r) || r.includes(region.label.toLowerCase()));
              if (!isHighlighted) return null;
              return (
                <circle
                  key={region.id}
                  cx="60"
                  cy={region.y}
                  r="8"
                  fill="#ef4444"
                  opacity="0.6"
                />
              );
            })}
          </svg>
        </div>

        {/* Injury Details */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-2">PRIMARY DIAGNOSIS</p>
            <p className="text-lg font-semibold text-slate-800 capitalize">
              {patient?.injury_type || 'Not specified'}
            </p>
            {patient?.injury_date && (
              <p className="text-sm text-slate-500 mt-2">
                Injury Date: {new Date(patient.injury_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">AFFECTED STRUCTURES</p>
            <div className="flex flex-wrap gap-2">
              {highlightedRegions.length > 0 ? (
                highlightedRegions.map((region) => (
                  <Badge key={region} variant="outline" className="bg-rose-50 border-rose-200">
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">Not specified</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">CURRENT PLAN</p>
            <p className="text-sm text-slate-700">
              Active rehabilitation plan with structured phases and exit criteria.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              <strong>Note:</strong> This is a visual reference for the injured area. Refer to the plan for detailed structures and rehabilitation phases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}