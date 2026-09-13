import React from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function OutcomeMeasureTrendChart({ patientOutcomeMeasures, outcomeMeasures }) {
  const completedMeasures = patientOutcomeMeasures.filter(m => m.status === 'completed');

  if (completedMeasures.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No completed outcome measures for trend analysis
      </div>
    );
  }

  // Group by outcome measure
  const groupedByMeasure = completedMeasures.reduce((acc, pom) => {
    const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
    const key = measure?.name || 'Unknown';
    if (!acc[key]) acc[key] = { measure, scores: [] };
    acc[key].scores.push({
      date: pom.completed_date,
      score: pom.total_score,
      maxScore: measure?.total_score_max || 100
    });
    return acc;
  }, {});

  // Take the top 2 most frequently measured
  const topMeasures = Object.entries(groupedByMeasure)
    .sort((a, b) => b[1].scores.length - a[1].scores.length)
    .slice(0, 2);

  if (topMeasures.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No outcome measure trends available
      </div>
    );
  }

  // Prepare chart data
  const allDates = [...new Set(completedMeasures.map(m => m.completed_date))].sort();
  const chartData = allDates.map(date => {
    const dataPoint = { date: format(new Date(date), 'MMM d') };
    topMeasures.forEach(([measureName, data]) => {
      const score = data.scores.find(s => s.date === date);
      if (score) {
        // Convert to percentage for easier comparison
        dataPoint[measureName] = Math.round((score.score / score.maxScore) * 100);
      }
    });
    return dataPoint;
  });

  const colors = ['#9333ea', '#06b6d4'];

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Score Trends (%)</h4>
        <div className="flex flex-wrap gap-3">
          {topMeasures.map(([measureName], index) => (
            <div key={measureName} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
              <span className="text-slate-600">{measureName}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
            formatter={(value) => `${value}%`}
          />
          {topMeasures.map(([measureName], index) => (
            <Line
              key={measureName}
              type="monotone"
              dataKey={measureName}
              stroke={colors[index]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}