import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CohortComparison({ patient, adherenceRate, avgPainLevel }) {
  const { data: cohortData = null } = useQuery({
    queryKey: ['cohort-comparison', patient.injury_type],
    queryFn: async () => {
      if (!patient.injury_type) return null;

      // Get all patients with same injury type (anonymized)
      const cohortPatients = await base44.entities.Patient.filter({ 
        injury_type: patient.injury_type 
      });

      if (cohortPatients.length < 3) return null; // Need at least 3 for meaningful comparison

      // Get exercise logs for cohort
      const allExerciseLogs = await base44.entities.ExerciseLog.list('-created_date', 1000);
      
      // Calculate cohort averages
      let totalAdherence = 0;
      let patientsWithData = 0;

      for (const cohortPatient of cohortPatients) {
        if (cohortPatient.id === patient.id) continue; // Exclude current patient

        const patientLogs = allExerciseLogs.filter(log => log.patient_id === cohortPatient.id);
        const last30Days = patientLogs.filter(log => {
          const daysDiff = (Date.now() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        });

        if (last30Days.length > 0) {
          const completed = last30Days.filter(l => l.completed).length;
          const patientAdherence = (completed / last30Days.length) * 100;
          totalAdherence += patientAdherence;
          patientsWithData++;
        }
      }

      // Get pain logs for cohort
      const allPainLogs = await base44.entities.PainLog.list('-date', 1000);
      let totalPain = 0;
      let patientsWithPain = 0;

      for (const cohortPatient of cohortPatients) {
        if (cohortPatient.id === patient.id) continue;

        const patientPainLogs = allPainLogs.filter(log => 
          log.patient_id === cohortPatient.id
        ).slice(0, 7);

        if (patientPainLogs.length > 0) {
          const avgPatientPain = patientPainLogs.reduce((sum, log) => sum + log.pain_level, 0) / patientPainLogs.length;
          totalPain += avgPatientPain;
          patientsWithPain++;
        }
      }

      return {
        cohortSize: cohortPatients.length - 1, // Exclude current patient
        avgAdherence: patientsWithData > 0 ? Math.round(totalAdherence / patientsWithData) : null,
        avgPain: patientsWithPain > 0 ? (totalPain / patientsWithPain).toFixed(1) : null
      };
    },
    enabled: !!patient.injury_type
  });

  if (!cohortData || cohortData.cohortSize < 2) {
    return (
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h4 className="font-semibold text-slate-700">Cohort Comparison</h4>
        </div>
        <p className="text-sm text-slate-500">
          Not enough data for cohort comparison
        </p>
      </div>
    );
  }

  const adherenceDiff = adherenceRate - cohortData.avgAdherence;
  const painDiff = avgPainLevel && cohortData.avgPain ? (avgPainLevel - parseFloat(cohortData.avgPain)) : null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-slate-800">Cohort Comparison</h4>
        <span className="ml-auto text-xs text-slate-500">
          vs {cohortData.cohortSize} patients with {patient.injury_type}
        </span>
      </div>

      <div className="space-y-4">
        {/* Adherence Comparison */}
        {cohortData.avgAdherence !== null && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Exercise Adherence</span>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                adherenceDiff > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  adherenceDiff < 0 && "rotate-180"
                )} />
                {Math.abs(adherenceDiff).toFixed(0)}% {adherenceDiff > 0 ? 'above' : 'below'} average
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">Your adherence</div>
                <div className="text-lg font-bold text-purple-600">{Math.round(adherenceRate)}%</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-xs text-slate-500">Cohort average</div>
                <div className="text-lg font-bold text-slate-600">{cohortData.avgAdherence}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Pain Comparison */}
        {cohortData.avgPain !== null && painDiff !== null && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Average Pain Level</span>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                painDiff < 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  painDiff > 0 && "rotate-180"
                )} />
                {Math.abs(painDiff).toFixed(1)} {painDiff < 0 ? 'below' : 'above'} average
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">Your pain</div>
                <div className="text-lg font-bold text-purple-600">{avgPainLevel.toFixed(1)}/10</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-xs text-slate-500">Cohort average</div>
                <div className="text-lg font-bold text-slate-600">{cohortData.avgPain}/10</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        * Comparison based on anonymized data from similar patients
      </p>
    </div>
  );
}