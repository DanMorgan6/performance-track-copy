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

export default function AssessmentTrendChart({ assessments }) {
  // Group assessments by test name
  const groupedByTest = assessments.reduce((acc, assessment) => {
    const key = assessment.test_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(assessment);
    return acc;
  }, {});

  // Take the top 3 most frequently measured tests
  const topTests = Object.entries(groupedByTest)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  if (topTests.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No assessment data available for trends
      </div>
    );
  }

  // Prepare chart data
  const allDates = [...new Set(assessments.map(a => a.assessment_date))].sort();
  const chartData = allDates.map(date => {
    const dataPoint = { date: format(new Date(date), 'MMM d') };
    topTests.forEach(([testName, tests]) => {
      const test = tests.find(t => t.assessment_date === date);
      if (test) {
        dataPoint[testName] = parseFloat(test.value) || 0;
      }
    });
    return dataPoint;
  });

  const colors = ['#9333ea', '#06b6d4', '#f59e0b'];

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Tracking Progress</h4>
        <div className="flex flex-wrap gap-3">
          {topTests.map(([testName, tests], index) => (
            <div key={testName} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
              <span className="text-slate-600">{testName}</span>
              <span className="text-slate-400">({tests[0].unit})</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}
          />
          {topTests.map(([testName], index) => (
            <Line
              key={testName}
              type="monotone"
              dataKey={testName}
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