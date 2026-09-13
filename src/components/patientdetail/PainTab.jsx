import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PainTab({ painLogs, painChartData }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Pain Level Trends</h3>

      {painChartData.length > 0 ? (
        <div className="h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={painChartData}>
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="pain" stroke="#9333ea" strokeWidth={2} fill="url(#painGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">No pain logs recorded yet</div>
      )}

      <div className="space-y-3">
        {painLogs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
              log.pain_level <= 3 && "bg-emerald-100 text-emerald-700",
              log.pain_level > 3 && log.pain_level <= 6 && "bg-amber-100 text-amber-700",
              log.pain_level > 6 && "bg-rose-100 text-rose-700"
            )}>
              {log.pain_level}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{log.pain_location || 'General'} - {log.pain_type || 'Unspecified'}</p>
              <p className="text-xs text-slate-400">{format(new Date(log.date), 'MMM d, yyyy')} • {log.time_of_day || 'N/A'}</p>
            </div>
            {log.notes && <p className="text-xs text-slate-500 max-w-xs truncate">{log.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}