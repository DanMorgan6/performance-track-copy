import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InjuryTypeDistribution({ injuries }) {
  const data = Object.entries(injuries)
    .map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      count: count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#999"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#999" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '8px'
          }}
        />
        <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}