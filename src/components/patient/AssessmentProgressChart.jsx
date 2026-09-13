import React from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AssessmentProgressChart({ assessments }) {
  // Group assessments by test name
  const groupedByTest = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.test_name]) {
      acc[assessment.test_name] = [];
    }
    acc[assessment.test_name].push(assessment);
    return acc;
  }, {});

  // Get the most frequently tracked test
  const testNames = Object.keys(groupedByTest);
  const mostTrackedTest = testNames.reduce((max, testName) => 
    groupedByTest[testName].length > (groupedByTest[max]?.length || 0) ? testName : max
  , testNames[0]);

  if (!mostTrackedTest) {
    return (
      <div className="text-center py-10 text-slate-400">
        No assessment data to display
      </div>
    );
  }

  const chartData = groupedByTest[mostTrackedTest]
    .slice(0, 10)
    .reverse()
    .map(assessment => ({
      date: format(new Date(assessment.assessment_date), 'MMM d'),
      value: parseFloat(assessment.value) || 0,
      baseline: parseFloat(assessment.baseline) || 0
    }));

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-600 mb-3">
        Progress: {mostTrackedTest}
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              stroke="#94a3b8"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="#94a3b8"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#9333ea" 
              strokeWidth={2}
              name="Current"
              dot={{ fill: '#9333ea' }}
            />
            {chartData.some(d => d.baseline > 0) && (
              <Line 
                type="monotone" 
                dataKey="baseline" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Baseline"
                dot={{ fill: '#94a3b8' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}