import React from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function SessionLoadChart({ exerciseLogs }) {
  // Filter logs with weight data from last 8 weeks
  const logsWithWeight = exerciseLogs.filter(log => 
    log.weight && log.weight > 0 && log.sets_completed && log.reps_completed
  );

  if (logsWithWeight.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No session load data available. Weight tracking needed for load calculations.
      </div>
    );
  }

  // Calculate load for each log and group by week
  const weeklyData = {};
  logsWithWeight.forEach(log => {
    const date = new Date(log.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week
    const weekKey = format(weekStart, 'MMM d');
    
    const load = (log.sets_completed || 0) * (parseInt(log.reps_completed) || 0) * (log.weight || 0);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { week: weekKey, totalLoad: 0, sessions: 0, date: weekStart };
    }
    weeklyData[weekKey].totalLoad += load;
    weeklyData[weekKey].sessions += 1;
  });

  // Convert to array and sort by date
  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.date - b.date)
    .slice(-8)
    .map(({ week, totalLoad, sessions }) => ({
      week,
      totalLoad: Math.round(totalLoad),
      sessions,
      avgLoad: Math.round(totalLoad / sessions)
    }));

  // Calculate trend
  const trend = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].totalLoad - chartData[0].totalLoad) / chartData[0].totalLoad * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700">Weekly Training Load</h4>
          <p className="text-xs text-slate-500">Sets × Reps × Weight</p>
        </div>
        {chartData.length >= 2 && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend).toFixed(0)}% {trend > 0 ? 'increase' : 'decrease'}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
            formatter={(value, name) => {
              if (name === 'totalLoad') return [value, 'Total Load'];
              if (name === 'avgLoad') return [value, 'Avg per Session'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="totalLoad" fill="#9333ea" radius={[8, 8, 0, 0]} name="Total Load" />
          <Bar dataKey="avgLoad" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Avg Load" />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-600 mb-1">Last Week</p>
          <p className="text-lg font-bold text-purple-600">
            {chartData.length > 0 ? chartData[chartData.length - 1].totalLoad : 0}
          </p>
        </div>
        <div className="bg-teal-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-600 mb-1">Sessions</p>
          <p className="text-lg font-bold text-teal-600">
            {chartData.length > 0 ? chartData[chartData.length - 1].sessions : 0}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-600 mb-1">Avg/Session</p>
          <p className="text-lg font-bold text-slate-700">
            {chartData.length > 0 ? chartData[chartData.length - 1].avgLoad : 0}
          </p>
        </div>
      </div>
    </div>
  );
}