import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MotivationalBanner({ patient, exerciseLogs, painLogs, dailyNotes, adherenceRate, avgPainLevel }) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      // Check if we already generated a message today
      const cacheKey = `motivational_${patient.id}_${new Date().toISOString().split('T')[0]}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setMessage(JSON.parse(cached));
        return;
      }
      generateMessage(cacheKey);
    }
  }, [patient?.id]);

  const generateMessage = async (cacheKey) => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const recentLogs = exerciseLogs.slice(0, 7);
      const completedToday = recentLogs.filter(l => l.date === todayStr && l.completed).length;
      const recentNote = dailyNotes[0];
      const streak = calculateStreak(exerciseLogs);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a warm, encouraging physiotherapy assistant. Generate a short, personalised motivational message for a patient.

Patient first name: ${patient.full_name?.split(' ')[0]}
Injury/Condition: ${patient.injury_type || 'rehabilitation'}
Adherence Rate (30d): ${Math.round(adherenceRate || 0)}%
Average Pain (7d): ${avgPainLevel ? avgPainLevel.toFixed(1) : 'unknown'}/10
Exercises completed today: ${completedToday}
Current streak (consecutive exercise days): ${streak} days
Latest mood: ${recentNote?.mood || 'unknown'}
Latest energy level: ${recentNote?.energy_level || 'unknown'}/10

Return a JSON object with:
- message: a warm, empathetic, 1-2 sentence personalised motivational message. Reference their specific situation. Do not be generic.
- tone: "encouraging", "celebratory", or "empathetic" based on their current state
- emoji: a single relevant emoji`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            tone: { type: "string" },
            emoji: { type: "string" }
          }
        }
      });

      if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(result));
      setMessage(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (logs) => {
    if (!logs.length) return 0;
    const dates = [...new Set(logs.filter(l => l.completed).map(l => l.date))].sort().reverse();
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    for (const dateStr of dates) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((current - d) / (1000 * 60 * 60 * 24));
      if (diff <= 1) { streak++; current = d; }
      else break;
    }
    return streak;
  };

  const toneStyles = {
    celebratory: 'from-purple-500 to-pink-500',
    encouraging: 'from-blue-500 to-purple-500',
    empathetic: 'from-teal-500 to-blue-500',
  };

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 p-4 flex items-center gap-3">
        <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full flex-shrink-0" />
        <p className="text-xs text-purple-600">Preparing your personalised message...</p>
      </div>
    );
  }

  if (!message) return null;

  const gradientClass = toneStyles[message.tone] || toneStyles.encouraging;

  return (
    <div className={cn("rounded-2xl bg-gradient-to-r p-px shadow-sm", gradientClass)}>
      <div className="bg-white rounded-2xl px-4 py-3 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{message.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-medium text-purple-600">Your daily message</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{message.message}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-300 hover:text-slate-500 flex-shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}