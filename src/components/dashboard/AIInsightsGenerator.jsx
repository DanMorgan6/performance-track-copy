import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIInsightsGenerator({ patients, exerciseLogs, painLogs, onInsightsGenerated }) {
  const [generating, setGenerating] = useState(false);

  const generateInsights = async () => {
    setGenerating(true);
    const insights = {};

    try {
      for (const patient of patients.slice(0, 10)) { // Limit to 10 patients
        const patientLogs = exerciseLogs.filter(l => l.patient_id === patient.id);
        const patientPain = painLogs.filter(l => l.patient_id === patient.id).slice(0, 7);

        if (patientLogs.length < 3) continue; // Need some data

        const avgPainLevel = patientPain.length > 0
          ? patientPain.reduce((sum, log) => sum + (log.pain_level || 0), 0) / patientPain.length
          : null;

        const recentLogs = patientLogs.slice(0, 14);
        const adherenceRate = recentLogs.length > 0 ? (recentLogs.filter(l => l.completed).length / recentLogs.length * 100) : 0;

        const prompt = `Analyze this patient's recent data and provide ONE brief actionable insight (max 15 words):

Patient: ${patient.full_name}
Condition: ${patient.injury_type || 'Unknown'}
Recent adherence: ${Math.round(adherenceRate)}%
Average pain (last 7 days): ${avgPainLevel?.toFixed(1) || 'N/A'}
Recent exercise sessions: ${recentLogs.length}

Provide a concise, actionable insight for the clinician.`;

        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                insight: { type: 'string' }
              }
            }
          });

          insights[patient.id] = response?.insight || response || '';
        } catch (error) {
          console.error(`Error generating insight for ${patient.full_name}:`, error);
        }
      }

      onInsightsGenerated(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateInsights}
      disabled={generating}
      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating Insights...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Insights
        </>
      )}
    </Button>
  );
}