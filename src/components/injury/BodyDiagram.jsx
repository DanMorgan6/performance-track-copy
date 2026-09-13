import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import injuryLibrary from './injury_diagnosis_library.json';

export default function BodyDiagram({ view, selectedRegion, onRegionSelect }) {
  const regionMetrics = useMemo(() => {
    const metrics = {};
    injuryLibrary.regions.forEach(region => {
      metrics[region.region_key] = region.svg_coords[view] || region.svg_coords.front;
    });
    return metrics;
  }, [view]);

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 100 300"
        className="w-full max-w-sm bg-slate-50 rounded-xl border-2 border-slate-200 p-4"
      >
        {/* Head */}
        <circle cx="50" cy="12" r="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.5" />
        
        {/* Neck */}
        <RegionCircle
          regionKey="neck"
          label="Neck"
          x={50}
          y={15}
          r={6}
          selectedRegion={selectedRegion}
          onSelect={onRegionSelect}
        />

        {/* Shoulders & Upper Body */}
        <g>
          {/* Left Shoulder */}
          <RegionCircle
            regionKey="shoulder"
            label="L Shoulder"
            x={30}
            y={40}
            r={6}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Shoulder */}
          <RegionCircle
            regionKey="shoulder"
            label="R Shoulder"
            x={70}
            y={40}
            r={6}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
        </g>

        {/* Arms */}
        <g>
          {/* Left Elbow */}
          <RegionCircle
            regionKey="elbow"
            label="L Elbow"
            x={25}
            y={75}
            r={5}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Elbow */}
          <RegionCircle
            regionKey="elbow"
            label="R Elbow"
            x={75}
            y={75}
            r={5}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />

          {/* Left Wrist */}
          <RegionCircle
            regionKey="wrist"
            label="L Wrist"
            x={25}
            y={100}
            r={4}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Wrist */}
          <RegionCircle
            regionKey="wrist"
            label="R Wrist"
            x={75}
            y={100}
            r={4}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
        </g>

        {/* Torso */}
        <line x1="50" y1="40" x2="50" y2="130" stroke="#d1d5db" strokeWidth="1" strokeDasharray="2" />

        {/* Lower Back */}
        <RegionCircle
          regionKey="lower_back"
          label="Lower Back"
          x={50}
          y={150}
          r={8}
          selectedRegion={selectedRegion}
          onSelect={onRegionSelect}
        />

        {/* Hips & Legs */}
        <g>
          {/* Left Hip */}
          <RegionCircle
            regionKey="hip"
            label="L Hip"
            x={40}
            y={180}
            r={6}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Hip */}
          <RegionCircle
            regionKey="hip"
            label="R Hip"
            x={60}
            y={180}
            r={6}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />

          {/* Left Knee */}
          <RegionCircle
            regionKey="knee"
            label="L Knee"
            x={40}
            y={220}
            r={7}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Knee */}
          <RegionCircle
            regionKey="knee"
            label="R Knee"
            x={60}
            y={220}
            r={7}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />

          {/* Left Ankle */}
          <RegionCircle
            regionKey="ankle"
            label="L Ankle"
            x={40}
            y={270}
            r={5}
            side="left"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
          {/* Right Ankle */}
          <RegionCircle
            regionKey="ankle"
            label="R Ankle"
            x={60}
            y={270}
            r={5}
            side="right"
            selectedRegion={selectedRegion}
            onSelect={onRegionSelect}
          />
        </g>

        {/* Body Outline */}
        <g fill="none" stroke="#e5e7eb" strokeWidth="1">
          {/* Torso */}
          <path d="M 40 40 L 35 130 L 50 140 L 65 130 L 60 40 Z" />
          {/* Left Leg */}
          <line x1="35" y1="130" x2="40" y2="260" />
          {/* Right Leg */}
          <line x1="65" y1="130" x2="60" y2="260" />
          {/* Left Arm */}
          <path d="M 40 40 Q 25 55 25 100" />
          {/* Right Arm */}
          <path d="M 60 40 Q 75 55 75 100" />
        </g>
      </svg>
    </div>
  );
}

function RegionCircle({
  regionKey,
  label,
  x,
  y,
  r,
  side,
  selectedRegion,
  onSelect
}) {
  const isSelected = selectedRegion?.region_key === regionKey && 
    (!side || selectedRegion?.side === side);

  const handleClick = () => {
    onSelect(regionKey, side);
  };

  return (
    <g onClick={handleClick} className="cursor-pointer">
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={isSelected ? '#a855f7' : '#f3f4f6'}
        stroke={isSelected ? '#9333ea' : '#d1d5db'}
        strokeWidth={isSelected ? '1.5' : '1'}
        className="transition-all hover:fill-purple-200"
      />
      <title>{label}</title>
    </g>
  );
}