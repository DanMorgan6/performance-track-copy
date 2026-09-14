import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { cn } from "@/lib/utils";

export default function AdherenceChart({ exerciseLogs, currentPhase, days = 14 }) {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate daily adherence
  const adherenceData = dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = exerciseLogs.filter(log => log.date === dateStr);
    
    // Get expected exercises for this day
    const expectedCount = currentPhase?.exercises?.length || 0;
    const completedCount = dayLogs.filter(log => log.completed).length;
    const adherenceRate = expectedCount > 0 ? (completedCount / expectedCount) * 100 : 0;

    return {
      date: format(date, 'MMM d'),
      adherence: Math.round(adherenceRate),
      completed: completedCount,
      expected: expectedCount
    };
  });

  const averageAdherence = adherenceData.length > 0
    ? Math.round(adherenceData.reduce((sum, d) => sum + d.adherence, 0) / adherenceData.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-800">{averageAdherence}%</div>
          <div className="text-sm text-slate-500">Average Adherence</div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          averageAdherence >= 80 && "bg-emerald-100 text-emerald-700",
          averageAdherence >= 60 && averageAdherence < 80 && "bg-amber-100 text-amber-700",
          averageAdherence < 60 && "bg-rose-100 text-rose-700"
        )}>
          {averageAdherence >= 80 && "Excellent"}
          {averageAdherence >= 60 && averageAdherence < 80 && "Good"}
          {averageAdherence < 60 && "Needs Attention"}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={adherenceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            stroke="#cbd5e1"
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            stroke="#cbd5e1"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value, name) => {
              if (name === 'adherence') return [`${value}%`, 'Adherence'];
              return [value, name];
            }}
          />
          <Bar dataKey="adherence" fill="#9333ea" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}