import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInDays } from 'date-fns';

export default function RecoveryTimeAnalysis({ plans }) {
  const data = plans
    .filter(plan => plan.status === 'completed')
    .map(plan => ({
      name: plan.title.substring(0, 20),
      daysToComplete: differenceInDays(new Date(plan.target_end_date), new Date(plan.start_date)),
      phases: plan.total_phases || 1
    }))
    .slice(0, 30);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="phases"
          stroke="#999"
          style={{ fontSize: '12px' }}
          label={{ value: 'Number of Phases', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          dataKey="daysToComplete"
          stroke="#999"
          style={{ fontSize: '12px' }}
          label={{ value: 'Days to Complete', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '8px'
          }}
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value) => `${value} days`}
        />
        <Scatter name="Recovery Time" data={data} fill="#9333ea" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}