import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays, startOfDay } from 'date-fns';

// dailyData: { [dateStr]: { expected, completed } } built by the shared adherence helpers.
// Adherence per week = completed / prescribed (same truth as everywhere else).
export default function AdherenceMetricsChart({ dailyData = {}, dateRange }) {
  const getChartData = () => {
    const today = new Date();
    const weeks = dateRange === '3m' ? 12 : dateRange === '6m' ? 26 : 52;
    const chartData = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(addDays(today, -i * 7));
      const weekEnd = addDays(weekStart, 6);

      let expected = 0;
      let completed = 0;
      const cursor = startOfDay(weekStart);
      const end = startOfDay(weekEnd);
      while (cursor <= end) {
        const dateStr = format(cursor, 'yyyy-MM-dd');
        const data = dailyData[dateStr];
        if (data) {
          expected += data.expected;
          completed += data.completed;
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      const adherenceRate = expected > 0 ? Math.round((completed / expected) * 100) : 0;
      chartData.push({
        week: format(weekStart, 'MMM d'),
        adherence: adherenceRate,
        completed,
        total: expected
      });
    }

    return chartData;
  };

  const data = getChartData();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="week"
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '12px' }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '8px'
          }}
          formatter={(value) => `${value}%`}
        />
        <Line
          type="monotone"
          dataKey="adherence"
          stroke="#9333ea"
          strokeWidth={2}
          dot={{ fill: '#9333ea', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}