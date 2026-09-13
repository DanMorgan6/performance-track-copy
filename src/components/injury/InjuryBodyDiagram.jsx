import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export default function InjuryBodyDiagram({ injuries = [], view = 'front', onRegionSelect }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Check if a region has an injury
  const getRegionInjury = (regionKey, side) => {
    return injuries.find(inj => inj.region === regionKey && (!side || inj.side === side));
  };

  const handleRegionClick = (regionKey, side) => {
    if (onRegionSelect) {
      onRegionSelect(regionKey, side);
    }
  };

  // Body part definitions with SVG paths
  const bodyParts = {
    front: [
      {
        key: 'head',
        label: 'Head',
        path: 'M50,8 a8,8 0 0,1 16,0 a8,8 0 0,1 -16,0',
        x: 58,
        y: 8,
      },
      {
        key: 'neck',
        label: 'Neck',
        path: 'M50,24 L54,32 L46,32 Z',
        x: 50,
        y: 28,
      },
      {
        key: 'shoulder',
        side: 'left',
        label: 'Left Shoulder',
        path: 'M35,35 Q30,45 28,55',
        x: 32,
        y: 45,
      },
      {
        key: 'shoulder',
        side: 'right',
        label: 'Right Shoulder',
        path: 'M65,35 Q70,45 72,55',
        x: 68,
        y: 45,
      },
      {
        key: 'chest',
        label: 'Chest',
        path: 'M42,38 L42,75 L58,75 L58,38 Z',
        x: 50,
        y: 55,
      },
      {
        key: 'elbow',
        side: 'left',
        label: 'Left Elbow',
        path: 'M28,55 Q25,70 24,85',
        x: 26,
        y: 70,
      },
      {
        key: 'elbow',
        side: 'right',
        label: 'Right Elbow',
        path: 'M72,55 Q75,70 76,85',
        x: 74,
        y: 70,
      },
      {
        key: 'wrist',
        side: 'left',
        label: 'Left Wrist',
        path: 'M24,85 L22,100',
        x: 23,
        y: 92,
      },
      {
        key: 'wrist',
        side: 'right',
        label: 'Right Wrist',
        path: 'M76,85 L78,100',
        x: 77,
        y: 92,
      },
      {
        key: 'lower_back',
        label: 'Lower Back',
        path: 'M45,75 L45,130 L55,130 L55,75 Z',
        x: 50,
        y: 100,
      },
      {
        key: 'hip',
        side: 'left',
        label: 'Left Hip',
        path: 'M38,130 Q35,145 38,160',
        x: 37,
        y: 145,
      },
      {
        key: 'hip',
        side: 'right',
        label: 'Right Hip',
        path: 'M62,130 Q65,145 62,160',
        x: 63,
        y: 145,
      },
      {
        key: 'knee',
        side: 'left',
        label: 'Left Knee',
        path: 'M38,160 L36,200',
        x: 37,
        y: 180,
      },
      {
        key: 'knee',
        side: 'right',
        label: 'Right Knee',
        path: 'M62,160 L64,200',
        x: 63,
        y: 180,
      },
      {
        key: 'ankle',
        side: 'left',
        label: 'Left Ankle',
        path: 'M36,200 L35,230',
        x: 35,
        y: 215,
      },
      {
        key: 'ankle',
        side: 'right',
        label: 'Right Ankle',
        path: 'M64,200 L65,230',
        x: 65,
        y: 215,
      },
    ],
    back: [
      {
        key: 'head',
        label: 'Head',
        path: 'M50,8 a8,8 0 0,1 16,0 a8,8 0 0,1 -16,0',
        x: 58,
        y: 8,
      },
      {
        key: 'neck',
        label: 'Neck (Back)',
        path: 'M50,24 L54,32 L46,32 Z',
        x: 50,
        y: 28,
      },
      {
        key: 'shoulder',
        side: 'left',
        label: 'Left Shoulder',
        path: 'M35,35 Q30,45 28,55',
        x: 32,
        y: 45,
      },
      {
        key: 'shoulder',
        side: 'right',
        label: 'Right Shoulder',
        path: 'M65,35 Q70,45 72,55',
        x: 68,
        y: 45,
      },
      {
        key: 'upper_back',
        label: 'Upper Back',
        path: 'M42,38 L42,65 L58,65 L58,38 Z',
        x: 50,
        y: 50,
      },
      {
        key: 'lower_back',
        label: 'Lower Back',
        path: 'M45,75 L45,130 L55,130 L55,75 Z',
        x: 50,
        y: 100,
      },
      {
        key: 'hip',
        side: 'left',
        label: 'Left Hip',
        path: 'M38,130 Q35,145 38,160',
        x: 37,
        y: 145,
      },
      {
        key: 'hip',
        side: 'right',
        label: 'Right Hip',
        path: 'M62,130 Q65,145 62,160',
        x: 63,
        y: 145,
      },
      {
        key: 'knee',
        side: 'left',
        label: 'Left Knee',
        path: 'M38,160 L36,200',
        x: 37,
        y: 180,
      },
      {
        key: 'knee',
        side: 'right',
        label: 'Right Knee',
        path: 'M62,160 L64,200',
        x: 63,
        y: 180,
      },
      {
        key: 'ankle',
        side: 'left',
        label: 'Left Ankle',
        path: 'M36,200 L35,230',
        x: 35,
        y: 215,
      },
      {
        key: 'ankle',
        side: 'right',
        label: 'Right Ankle',
        path: 'M64,200 L65,230',
        x: 65,
        y: 215,
      },
    ],
  };

  const currentBodyParts = bodyParts[view] || bodyParts.front;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 100 240"
        className="w-full max-w-xs bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-slate-200 p-6 drop-shadow-sm"
      >
        {/* Body outline */}
        <g fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <circle cx="50" cy="15" r="8" />
          
          {/* Torso */}
          <path d="M 42 23 L 40 80 L 50 85 L 60 80 L 58 23 Z" />
          
          {/* Arms */}
          <path d="M 42 30 Q 25 40 20 95" strokeWidth="2" />
          <path d="M 58 30 Q 75 40 80 95" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M 42 80 L 40 230" strokeWidth="2" />
          <path d="M 58 80 L 60 230" strokeWidth="2" />
        </g>

        {/* Interactive regions with red highlighting for injuries */}
        {currentBodyParts.map((part, idx) => {
          const injury = getRegionInjury(part.key, part.side);
          const isHovered = hoveredRegion?.key === part.key && hoveredRegion?.side === part.side;
          const hasInjury = !!injury;

          return (
            <g
              key={idx}
              onClick={() => handleRegionClick(part.key, part.side)}
              onMouseEnter={() => setHoveredRegion({ key: part.key, side: part.side })}
              onMouseLeave={() => setHoveredRegion(null)}
              className="cursor-pointer transition-all"
            >
              {/* Main clickable circle */}
              <circle
                cx={part.x}
                cy={part.y}
                r={hasInjury ? 6 : 4}
                fill={hasInjury ? '#dc2626' : isHovered ? '#a78bfa' : '#f3f4f6'}
                stroke={hasInjury ? '#991b1b' : isHovered ? '#7c3aed' : '#cbd5e1'}
                strokeWidth={hasInjury ? 2 : isHovered ? 1.5 : 1}
                className="transition-all"
              />

              {/* Outer ring for injured areas */}
              {hasInjury && (
                <circle
                  cx={part.x}
                  cy={part.y}
                  r={8.5}
                  fill="none"
                  stroke="#fca5a5"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              )}

              {/* Tooltip label */}
              <title>
                {part.label}
                {injury ? ` - ${injury.diagnosis}` : ''}
              </title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="text-xs text-slate-500 text-center">
        <p>Click areas to add/edit injury</p>
        {injuries.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 border border-red-900"></div>
            <span>{injuries.length} area(s) marked</span>
          </div>
        )}
      </div>
    </div>
  );
}