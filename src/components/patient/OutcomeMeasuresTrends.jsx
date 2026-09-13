import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function OutcomeMeasuresTrends({ patientOutcomeMeasures, outcomeMeasures }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m');
  const [selectedMeasureId, setSelectedMeasureId] = useState(null);

  if (patientOutcomeMeasures.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">No outcome measures completed yet</p>
      </div>
    );
  }

  const completedMeasures = patientOutcomeMeasures.filter(m => m.status === 'completed');
  const timeframeMap = {
    '4w': subMonths(new Date(), 1),
    '3m': subMonths(new Date(), 3),
    '6m': subMonths(new Date(), 6),
    'all': new Date(0)
  };

  const getChartData = (measureId) => {
    const measures = completedMeasures
      .filter(m => m.outcome_measure_id === measureId)
      .sort((a, b) => new Date(a.completed_date) - new Date(b.completed_date));

    const cutoffDate = timeframeMap[selectedTimeframe];
    return measures
      .filter(m => new Date(m.completed_date) >= cutoffDate)
      .map(m => ({
        date: format(new Date(m.completed_date), 'MMM d'),
        fullDate: m.completed_date,
        score: m.total_score,
        max: m.max_score || 100
      }));
  };

  const uniqueMeasures = [...new Map(completedMeasures.map(m => [m.outcome_measure_id, m])).values()];
  const displayMeasure = selectedMeasureId
    ? uniqueMeasures.find(m => m.outcome_measure_id === selectedMeasureId)
    : uniqueMeasures[0];

  const measureInfo = outcomeMeasures.find(m => m.id === displayMeasure?.outcome_measure_id);
  const chartData = getChartData(displayMeasure?.outcome_measure_id);
  const percentChange = chartData.length > 1
    ? ((chartData[chartData.length - 1].score - chartData[0].score) / chartData[0].score * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {uniqueMeasures.slice(0, 3).map((measure) => {
          const info = outcomeMeasures.find(m => m.id === measure.outcome_measure_id);
          return (
            <div
              key={measure.id}
              onClick={() => setSelectedMeasureId(measure.outcome_measure_id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMeasureId === measure.outcome_measure_id
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <p className="text-xs font-medium text-slate-600 uppercase mb-2">{info?.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-600">{measure.total_score}</span>
                <span className="text-sm text-slate-500">/ {info?.total_score_max || 100}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Completed {format(new Date(measure.completed_date), 'MMM d, yyyy')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      {displayMeasure && chartData.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{measureInfo?.name} Trend</h3>
              <p className="text-sm text-slate-500 mt-1">{measureInfo?.condition}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600 mb-2">
                <span className="text-2xl font-bold text-purple-600">{displayMeasure.total_score}</span>
                <span className="text-slate-500"> / {measureInfo?.total_score_max || 100}</span>
              </div>
              {percentChange !== 0 && (
                <p className={`text-xs font-medium ${percentChange > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {percentChange > 0 ? '↑' : '→'} {Math.abs(percentChange)}% change
                </p>
              )}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 mb-6">
            {Object.entries({ '4w': '4 weeks', '3m': '3 months', '6m': '6 months', 'all': 'All-time' }).map(([key, label]) => (
              <Button
                key={key}
                onClick={() => setSelectedTimeframe(key)}
                variant={selectedTimeframe === key ? 'default' : 'outline'}
                size="sm"
                className="rounded-lg text-xs"
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, measureInfo?.total_score_max || 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#9333ea"
                    strokeWidth={3}
                    dot={{ fill: '#9333ea', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400">
              Only one result in this timeframe
            </div>
          )}
        </div>
      )}

      {/* Completion Timeline */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Questionnaire Timeline</h3>
        <div className="space-y-2">
          {patientOutcomeMeasures
            .sort((a, b) => new Date(b.sent_date || b.completed_date) - new Date(a.sent_date || a.completed_date))
            .slice(0, 10)
            .map((pom) => {
              const info = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
              return (
                <div key={pom.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      pom.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{info?.name}</p>
                    <p className="text-xs text-slate-500">
                      {pom.status === 'completed'
                        ? `Completed ${format(new Date(pom.completed_date), 'MMM d, yyyy')}`
                        : `Sent ${format(new Date(pom.sent_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  {pom.status === 'completed' && (
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{pom.total_score}/{info?.total_score_max || 100}</p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}