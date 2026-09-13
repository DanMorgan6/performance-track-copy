import React, { useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#9333ea', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export default function OutcomeTrendsChart({ patientOutcomeMeasures, outcomeMeasures }) {
  const completed = patientOutcomeMeasures.filter(m => m.status === 'completed' && m.completed_date);

  // Group by measure name
  const grouped = {};
  completed.forEach(pom => {
    const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
    if (!measure) return;
    if (!grouped[measure.name]) grouped[measure.name] = { max: measure.total_score_max, entries: [] };
    grouped[measure.name].entries.push({
      date: pom.completed_date,
      score: pom.total_score,
      pct: measure.total_score_max ? Math.round((pom.total_score / measure.total_score_max) * 100) : 0,
    });
  });

  const measureNames = Object.keys(grouped);
  const [selectedMeasures, setSelectedMeasures] = useState(measureNames.slice(0, 3));

  if (measureNames.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-sm">No completed outcome measures yet</div>;
  }

  // Build unified timeline
  const allDates = [...new Set(completed.map(m => m.completed_date))].sort();
  const chartData = allDates.map(date => {
    const point = { date: format(new Date(date), 'MMM d') };
    selectedMeasures.forEach(name => {
      const entry = grouped[name]?.entries.find(e => e.date === date);
      if (entry) point[name] = entry.pct;
    });
    return point;
  });

  const toggle = (name) => {
    setSelectedMeasures(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div>
      {/* Legend/toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        {measureNames.map((name, i) => (
          <button
            key={name}
            onClick={() => toggle(name)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              selectedMeasures.includes(name)
                ? 'border-transparent text-white'
                : 'border-slate-200 text-slate-500 bg-white'
            }`}
            style={selectedMeasures.includes(name) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
          >
            {name}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `${v}%`} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={v => `${v}%`} />
          {selectedMeasures.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}