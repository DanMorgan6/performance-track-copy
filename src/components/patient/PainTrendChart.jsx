import React from 'react';
import { format } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function PainTrendChart({ painLogs }) {
  // Get last 30 days of data
  const chartData = painLogs
    .slice(0, 30)
    .reverse()
    .map(log => ({
      date: format(new Date(log.date), 'MMM d'),
      pain: log.pain_level,
      location: log.pain_location || 'General'
    }));

  if (chartData.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        No pain data to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8"
          />
          <YAxis 
            domain={[0, 10]} 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8"
            label={{ value: 'Pain Level', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="pain" 
            stroke="#9333ea" 
            strokeWidth={2}
            fill="url(#painGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}