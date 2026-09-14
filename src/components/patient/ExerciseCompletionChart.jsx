import React from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function ExerciseCompletionChart({ exerciseLogs, currentPhase }) {
  // Get last 14 days
  const days = 14;
  const today = startOfDay(new Date());
  
  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = exerciseLogs.filter(log => log.date === dateStr && log.completed);
    
    chartData.push({
      date: format(date, 'MMM d'),
      completed: dayLogs.length,
      total: currentPhase?.exercises?.length || 0
    });
  }

  if (chartData.every(d => d.completed === 0)) {
    return (
      <div className="text-center py-10 text-slate-400">
        No exercise data to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8"
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8"
            label={{ value: 'Exercises', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="completed" fill="#9333ea" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}