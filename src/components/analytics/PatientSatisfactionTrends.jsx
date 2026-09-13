import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

export default function PatientSatisfactionTrends({ dailyNotes }) {
  const getMoodValue = (mood) => {
    const values = { great: 5, good: 4, okay: 3, struggling: 2, difficult: 1 };
    return values[mood] || 0;
  };

  const getChartData = () => {
    const today = new Date();
    const chartData = [];

    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(addDays(today, -i * 7));
      const weekEnd = addDays(weekStart, 6);

      const weekNotes = dailyNotes.filter(note => {
        const noteDate = new Date(note.date);
        return noteDate >= weekStart && noteDate <= weekEnd;
      });

      const avgSatisfaction = weekNotes.length > 0
        ? (weekNotes.reduce((sum, note) => sum + getMoodValue(note.mood), 0) / weekNotes.length).toFixed(1)
        : 0;

      chartData.push({
        week: format(weekStart, 'MMM d'),
        satisfaction: parseFloat(avgSatisfaction),
        entries: weekNotes.length
      });
    }

    return chartData;
  };

  const data = getChartData();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="week"
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '12px' }}
          domain={[0, 5]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '8px'
          }}
          formatter={(value) => value > 0 ? `${value.toFixed(1)}/5` : 'No data'}
        />
        <Area
          type="monotone"
          dataKey="satisfaction"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}