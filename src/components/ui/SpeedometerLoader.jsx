import React, { useEffect, useState } from 'react';

export default function SpeedometerLoader({ label = "Uploading..." }) {
  const [needle, setNeedle] = useState(10);

  useEffect(() => {
    let angle = 10;
    let direction = 1;
    const interval = setInterval(() => {
      angle += direction * (Math.random() * 8 + 3);
      if (angle >= 155) direction = -1;
      if (angle <= 10) direction = 1;
      setNeedle(angle);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Speedometer arc: goes from -165deg to -15deg (180deg sweep)
  // SVG center: 50,55, radius 38
  const cx = 50, cy = 55, r = 38;

  const toRad = (deg) => (deg * Math.PI) / 180;

  // Arc from 200deg to 340deg (bottom-left to bottom-right, top half)
  const startAngle = 200;
  const endAngle = 340;

  const arcStart = {
    x: cx + r * Math.cos(toRad(startAngle)),
    y: cy + r * Math.sin(toRad(startAngle)),
  };
  const arcEnd = {
    x: cx + r * Math.cos(toRad(endAngle)),
    y: cy + r * Math.sin(toRad(endAngle)),
  };

  // Needle: needle state 0-165 maps to startAngle..endAngle
  const needleAngle = startAngle + (needle / 165) * (endAngle - startAngle);
  const needleLen = 28;
  const needleX = cx + needleLen * Math.cos(toRad(needleAngle));
  const needleY = cy + needleLen * Math.sin(toRad(needleAngle));

  // Tick marks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const a = startAngle + t * (endAngle - startAngle);
    const inner = r - 7;
    const outer = r;
    return {
      x1: cx + inner * Math.cos(toRad(a)),
      y1: cy + inner * Math.sin(toRad(a)),
      x2: cx + outer * Math.cos(toRad(a)),
      y2: cy + outer * Math.sin(toRad(a)),
    };
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="50" viewBox="0 0 100 70">
        {/* Background arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Colored arc (progress feel) */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="url(#speedGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.4"
        />
        <defs>
          <linearGradient id="speedGradient" gradientUnits="userSpaceOnUse"
            x1={arcStart.x} y1={arcStart.y} x2={arcEnd.x} y2={arcEnd.y}>
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke="#9333ea"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="#9333ea" />
        <circle cx={cx} cy={cy} r="2" fill="white" />
      </svg>
      <span className="text-xs text-purple-600 animate-pulse font-medium">{label}</span>
    </div>
  );
}