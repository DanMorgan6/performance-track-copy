import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function ProgressSummaryCard({ painLogs = [], patientOutcomeMeasures = [], assessments = [], dailyNotes = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prepare data for the LLM
        const latestPainLog = painLogs[0];
        const latestOutcome = patientOutcomeMeasures.find(o => o.status === 'completed');
        const latestAssessment = assessments[0];
        const recentNotes = dailyNotes.slice(0, 5);

        const prompt = `You are a rehabilitation health coach. Analyze the following patient recovery data and provide a brief, encouraging personalized progress summary (2-3 sentences maximum). Focus on positive trends and actionable insights.

Pain Logs (last 7): ${painLogs.slice(0, 7).map(p => `${p.date}: ${p.pain_level}/10`).join(', ')}
${latestOutcome ? `Latest Outcome Score: ${latestOutcome.total_score}` : 'No completed outcome measures'}
${latestAssessment ? `Latest Assessment: ${latestAssessment.test_name} - ${latestAssessment.value} ${latestAssessment.unit}` : 'No assessments'}
${recentNotes.length > 0 ? `Recent Notes: ${recentNotes.map(n => n.notes).filter(Boolean).join('; ')}` : 'No notes'}

Provide an encouraging, professional summary focused on recovery progress.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });

        setSummary(result);
      } catch (err) {
        setError('Unable to generate summary');
        console.error('LLM Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (painLogs.length > 0 || patientOutcomeMeasures.length > 0 || assessments.length > 0 || dailyNotes.length > 0) {
      generateSummary();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#d8ff5f]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#d8ff5f] animate-pulse" />
          </div>
          <h3 className="text-base font-semibold text-white">Progress Insights</h3>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-full w-2/3 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - not critical
  }

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-[#242427] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#d8ff5f]/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#d8ff5f]" />
        </div>
        <h3 className="text-base font-semibold text-white">Your Progress</h3>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">{summary}</p>
      <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-[#d8ff5f]" />
        AI-generated insight based on your recovery data
      </p>
    </div>
  );
}