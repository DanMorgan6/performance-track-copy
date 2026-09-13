import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Copy, Check, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SmartClinicalNotes({ patient, exerciseLogs, painLogs, assessments, interventions, currentPhase, adherenceRate, avgPainLevel }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateNote = async () => {
    setLoading(true);
    try {
      const recentPain = painLogs.slice(0, 7).map(l => ({ date: l.date, level: l.pain_level, location: l.pain_location, type: l.pain_type }));
      const recentLogs = exerciseLogs.slice(0, 14).map(l => ({ date: l.date, exercise: l.exercise_name, completed: l.completed, difficulty: l.difficulty }));
      const recentAssessments = assessments.slice(0, 5).map(a => ({ test: a.test_name, value: a.value, unit: a.unit, date: a.assessment_date, side: a.side }));
      const recentInterventions = interventions.slice(0, 3).map(i => ({ type: i.intervention_type, date: i.intervention_date, location: i.location, status: i.status }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a physiotherapy clinical documentation assistant. Generate a concise, professional clinical progress note for this patient.

Patient: ${patient.full_name}
Injury/Condition: ${patient.injury_type || 'Not specified'}
Current Phase: ${currentPhase?.name || 'Not assigned'}
Adherence Rate (30d): ${Math.round(adherenceRate)}%
Average Pain (7d): ${avgPainLevel ? avgPainLevel.toFixed(1) : 'No data'}/10

Recent pain logs: ${JSON.stringify(recentPain)}
Recent exercise logs: ${JSON.stringify(recentLogs)}
Recent assessments: ${JSON.stringify(recentAssessments)}
Recent interventions: ${JSON.stringify(recentInterventions)}

Write a professional clinical note in standard SOAP-style format (Subjective, Objective, Assessment, Plan). Keep it concise (under 250 words). Use clinical language. Do not include any headings, just flowing text with the SOAP sections clearly labelled.`,
      });

      setNote(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (note) {
      navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold text-slate-800 text-sm">AI Clinical Note Generator</h3>
        </div>
        <div className="flex gap-2">
          {note && (
            <Button size="sm" variant="outline" onClick={handleCopy} className="rounded-lg text-xs h-7 px-2">
              {copied ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={generateNote}
            disabled={loading}
            className="rounded-lg text-xs h-7 px-2"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {loading ? 'Generating...' : note ? 'Regenerate' : 'Generate Note'}
          </Button>
        </div>
      </div>

      {!note && !loading && (
        <p className="text-xs text-slate-400 text-center py-4">Generate a professional SOAP-format clinical note based on the patient's recent data.</p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-xs text-slate-500">Generating clinical note...</span>
        </div>
      )}

      {note && !loading && (
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-mono border border-slate-200">
          {note}
        </div>
      )}
    </div>
  );
}