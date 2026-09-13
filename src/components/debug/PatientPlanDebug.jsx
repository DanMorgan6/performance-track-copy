import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function PatientPlanDebug({ patient, plans }) {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const user = await base44.auth.me();
        
        // Try to find patient by email
        const patientsByEmail = await base44.entities.Patient.filter({ email: user.email });
        
        // Try to find all plans for this patient
        const allPlans = await base44.entities.RehabPlan.list();
        const plansByPatientId = patient?.id ? allPlans.filter(p => p.patient_id === patient.id) : [];
        
        setDebugInfo({
          currentUser: {
            id: user.id,
            email: user.email,
            clinic_id: user.clinic_id,
            role: user.role
          },
          patient: patient ? {
            id: patient.id,
            email: patient.email,
            clinic_id: patient.clinic_id,
            full_name: patient.full_name
          } : null,
          patientsByEmail: patientsByEmail.map(p => ({
            id: p.id,
            email: p.email,
            clinic_id: p.clinic_id,
            full_name: p.full_name
          })),
          plans: {
            fromQuery: plans.map(p => ({
              id: p.id,
              title: p.title,
              patient_id: p.patient_id,
              clinic_id: p.clinic_id,
              status: p.status,
              created_by_clinician: p.created_by_clinician
            })),
            allForPatient: plansByPatientId.map(p => ({
              id: p.id,
              title: p.title,
              patient_id: p.patient_id,
              clinic_id: p.clinic_id,
              status: p.status,
              created_by_clinician: p.created_by_clinician
            }))
          },
          queryCheck: {
            userHasClinicId: !!user.clinic_id,
            patientExists: !!patient,
            patientHasClinicId: !!patient?.clinic_id,
            clinicIdsMatch: user.clinic_id === patient?.clinic_id,
            queryWouldRun: !!patient?.id && !!user.clinic_id
          }
        });
      } catch (error) {
        console.error('Debug info error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, [patient, plans]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading debug info...</div>;
  }

  if (!debugInfo) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-6 font-mono text-xs space-y-4 overflow-auto max-h-[600px]">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Patient Plan Debug Panel</h3>
      </div>

      {/* Current User */}
      <div>
        <div className="text-amber-400 font-bold mb-2">Current User (Portal Login):</div>
        <pre className="bg-slate-800 p-3 rounded overflow-x-auto">
          {JSON.stringify(debugInfo.currentUser, null, 2)}
        </pre>
      </div>

      {/* Patient Record */}
      <div>
        <div className="text-amber-400 font-bold mb-2">Patient Record (Linked to User):</div>
        {debugInfo.patient ? (
          <>
            <pre className="bg-slate-800 p-3 rounded overflow-x-auto mb-2">
              {JSON.stringify(debugInfo.patient, null, 2)}
            </pre>
            {debugInfo.patient.email !== debugInfo.currentUser.email && (
              <div className="flex items-start gap-2 bg-rose-900/50 p-3 rounded">
                <XCircle className="w-4 h-4 text-rose-400 mt-0.5" />
                <div className="text-rose-200 text-xs">
                  <strong>WARNING:</strong> Patient email ({debugInfo.patient.email}) doesn't match user email ({debugInfo.currentUser.email})
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 bg-rose-900/50 p-3 rounded">
            <XCircle className="w-4 h-4 text-rose-400 mt-0.5" />
            <div className="text-rose-200 text-xs">
              <strong>ERROR:</strong> No patient record found! This is the main issue.
            </div>
          </div>
        )}
      </div>

      {/* Patients by Email */}
      <div>
        <div className="text-amber-400 font-bold mb-2">All Patients with Email "{debugInfo.currentUser.email}":</div>
        {debugInfo.patientsByEmail.length > 0 ? (
          <>
            <pre className="bg-slate-800 p-3 rounded overflow-x-auto mb-2">
              {JSON.stringify(debugInfo.patientsByEmail, null, 2)}
            </pre>
            {debugInfo.patientsByEmail.length > 1 && (
              <div className="flex items-start gap-2 bg-amber-900/50 p-3 rounded">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="text-amber-200 text-xs">
                  <strong>WARNING:</strong> Multiple patient records found with same email! This may cause issues.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800 p-3 rounded text-slate-400">No patients found with this email</div>
        )}
      </div>

      {/* Plans */}
      <div>
        <div className="text-amber-400 font-bold mb-2">Plans from Query (What Portal Sees):</div>
        {debugInfo.plans.fromQuery.length > 0 ? (
          <pre className="bg-slate-800 p-3 rounded overflow-x-auto">
            {JSON.stringify(debugInfo.plans.fromQuery, null, 2)}
          </pre>
        ) : (
          <div className="flex items-start gap-2 bg-rose-900/50 p-3 rounded">
            <XCircle className="w-4 h-4 text-rose-400 mt-0.5" />
            <div className="text-rose-200 text-xs">
              <strong>No plans returned from query!</strong> This is why the portal shows "no active plan"
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="text-amber-400 font-bold mb-2">All Plans for Patient (Direct Query):</div>
        {debugInfo.plans.allForPatient.length > 0 ? (
          <pre className="bg-slate-800 p-3 rounded overflow-x-auto">
            {JSON.stringify(debugInfo.plans.allForPatient, null, 2)}
          </pre>
        ) : (
          <div className="bg-slate-800 p-3 rounded text-slate-400">No plans found for this patient</div>
        )}
      </div>

      {/* Query Validation */}
      <div>
        <div className="text-amber-400 font-bold mb-2">Query Validation Checks:</div>
        <div className="bg-slate-800 p-3 rounded space-y-2">
          <div className="flex items-center gap-2">
            {debugInfo.queryCheck.userHasClinicId ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>User has clinic_id: {debugInfo.queryCheck.userHasClinicId ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.queryCheck.patientExists ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Patient record exists: {debugInfo.queryCheck.patientExists ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.queryCheck.patientHasClinicId ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Patient has clinic_id: {debugInfo.queryCheck.patientHasClinicId ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.queryCheck.clinicIdsMatch ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Clinic IDs match: {debugInfo.queryCheck.clinicIdsMatch ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.queryCheck.queryWouldRun ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Query enabled: {debugInfo.queryCheck.queryWouldRun ? 'YES' : 'NO'}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="pt-4 border-t border-slate-700">
        <div className="text-emerald-400 font-bold mb-2">💡 Diagnosis:</div>
        <div className="bg-slate-800 p-4 rounded space-y-2 text-sm">
          {!debugInfo.patient ? (
            <div className="text-rose-300">
              <strong>Primary Issue:</strong> No Patient record found for user email "{debugInfo.currentUser.email}". 
              The patient was likely created by the clinician with a different email, or the invite wasn't accepted properly.
            </div>
          ) : !debugInfo.queryCheck.patientHasClinicId ? (
            <div className="text-rose-300">
              <strong>Primary Issue:</strong> Patient record exists but has no clinic_id. 
              The patient needs to be linked to a clinic.
            </div>
          ) : !debugInfo.queryCheck.clinicIdsMatch ? (
            <div className="text-rose-300">
              <strong>Primary Issue:</strong> Patient clinic_id ({debugInfo.patient.clinic_id}) doesn't match user clinic_id ({debugInfo.currentUser.clinic_id}). 
              The plan may be associated with a different clinic.
            </div>
          ) : debugInfo.plans.allForPatient.length > 0 && debugInfo.plans.fromQuery.length === 0 ? (
            <div className="text-rose-300">
              <strong>Primary Issue:</strong> Plans exist for the patient but the query filters them out. 
              Check if plan clinic_id matches user clinic_id.
            </div>
          ) : debugInfo.plans.allForPatient.length === 0 ? (
            <div className="text-amber-300">
              <strong>Secondary Issue:</strong> No plans exist for this patient at all. 
              Clinician needs to create a plan for patient_id: {debugInfo.patient.id}
            </div>
          ) : (
            <div className="text-emerald-300">
              <strong>No obvious issues detected.</strong> Plans should be visible. Check plan status (active vs draft).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}