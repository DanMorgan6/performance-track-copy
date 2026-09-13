import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function AnalyticsExport({ patients, exerciseLogs, painLogs, patientOutcomeMeasures, outcomeMeasures }) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    setExporting(true);
    const rows = [['Patient', 'Status', 'Injury', 'Total Logs', 'Completed Logs', 'Adherence %', 'Avg Pain', 'Pending Outcomes']];

    patients.forEach(p => {
      const logs = exerciseLogs.filter(l => l.patient_id === p.id);
      const completed = logs.filter(l => l.completed).length;
      const adherence = logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0;
      const pains = painLogs.filter(l => l.patient_id === p.id);
      const avgPain = pains.length > 0
        ? (pains.reduce((s, l) => s + l.pain_level, 0) / pains.length).toFixed(1)
        : '';
      const pendingOutcomes = patientOutcomeMeasures.filter(o => o.patient_id === p.id && o.status === 'pending').length;

      rows.push([
        p.full_name,
        p.status,
        p.injury_type || '',
        logs.length,
        completed,
        adherence,
        avgPain,
        pendingOutcomes,
      ]);
    });

    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const exportOutcomesCSV = () => {
    const rows = [['Patient', 'Outcome Measure', 'Completed Date', 'Score', 'Max Score', '%']];
    const completed = patientOutcomeMeasures.filter(o => o.status === 'completed');
    completed.forEach(o => {
      const patient = patients.find(p => p.id === o.patient_id);
      const measure = outcomeMeasures.find(m => m.id === o.outcome_measure_id);
      rows.push([
        patient?.full_name || '',
        measure?.name || '',
        o.completed_date || '',
        o.total_score ?? '',
        measure?.total_score_max ?? '',
        measure?.total_score_max ? Math.round((o.total_score / measure.total_score_max) * 100) : '',
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outcomes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} disabled={exporting} className="rounded-xl text-slate-600 gap-2">
        <Download className="w-4 h-4" />
        Patient Report (CSV)
      </Button>
      <Button variant="outline" size="sm" onClick={exportOutcomesCSV} className="rounded-xl text-slate-600 gap-2">
        <FileText className="w-4 h-4" />
        Outcomes (CSV)
      </Button>
    </div>
  );
}