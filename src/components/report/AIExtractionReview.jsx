import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AIExtractionReview({ 
  open, 
  onOpenChange, 
  report, 
  patientId, 
  clinicId,
  injuryLibrary,
  onSuccess
}) {
  const queryClient = useQueryClient();
  const [extractionData, setExtractionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editedData, setEditedData] = useState(null);

  const extractMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      setError('');
      
      try {
        // Download and process report with AI
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a medical diagnosis extraction assistant. Analyze this medical report and extract any diagnoses, injuries, or conditions mentioned. 

For each diagnosis found, map it to the following structure:
- region: body region (e.g., "knee", "shoulder", "lower_back")
- issue: specific diagnosis (e.g., "acl_injury", "rotator_cuff_tear")
- side: which side ("left", "right", "bilateral", "midline")
- severity: if applicable ("irritation", "sprain", "partial_tear", "full_thickness_tear", "rupture")
- confidence: your confidence 0-100

Return a JSON array of extractions. Be conservative - only extract diagnoses that are explicitly stated or strongly implied.`,
          file_urls: [report.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              diagnoses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    region: { type: "string" },
                    issue: { type: "string" },
                    side: { type: "string" },
                    severity: { type: "string" },
                    confidence: { type: "number" }
                  }
                }
              }
            }
          }
        });

        // Map to library keys
        const mapped = mapToLibrary(response.diagnoses || [], injuryLibrary);
        setExtractionData(mapped);
        setEditedData(JSON.parse(JSON.stringify(mapped)));
      } catch (err) {
        setError(err.message || 'Extraction failed');
      } finally {
        setLoading(false);
      }
    }
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      
      // Create extraction record
      const extraction = await base44.entities.DiagnosisExtraction.create({
        clinic_id: clinicId,
        patient_id: patientId,
        report_id: report.id,
        extraction_data: editedData,
        status: 'approved',
        approved_by: currentUser.email,
        approved_date: new Date().toISOString().split('T')[0],
        created_by: currentUser.email
      });

      // Log audit
      await base44.entities.AuditLog.create({
        clinic_id: clinicId,
        patient_id: patientId,
        report_id: report.id,
        action: 'extraction_approved',
        details: { extraction_count: editedData.length },
        created_by: currentUser.email
      });

      return extraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-extractions'] });
      onOpenChange(false);
      onSuccess?.();
      setExtractionData(null);
      setEditedData(null);
    },
    onError: (err) => {
      setError(err.message || 'Approval failed');
    }
  });

  const handleEdit = (index, field, value) => {
    const updated = [...editedData];
    updated[index] = { ...updated[index], [field]: value, clinician_edited: true };
    setEditedData(updated);
  };

  const handleRemove = (index) => {
    setEditedData(editedData.filter((_, i) => i !== index));
  };

  if (!open) return null;

  if (!extractionData && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Extract Diagnosis from Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              AI will analyze the report and extract structured diagnosis information mapped to our diagnosis library.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Report:</strong> {report.type.replace('_', ' ')} from {report.date}
              </p>
            </div>
            <Button
              onClick={() => extractMutation.mutate()}
              disabled={extractMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Start Extraction'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review & Approve Extracted Diagnoses</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="ml-3 text-slate-600">Processing report...</p>
            </div>
          )}

          {editedData && editedData.length > 0 ? (
            <div className="space-y-4">
              {editedData.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.region_label || item.region_key}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.issue_label || item.issue_key}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {item.ai_confidence}% confidence
                      </span>
                      {item.clinician_edited && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                          Edited
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Side</label>
                      <select
                        value={item.side || ''}
                        onChange={(e) => handleEdit(idx, 'side', e.target.value)}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">Select side</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="bilateral">Bilateral</option>
                        <option value="midline">Midline</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Severity</label>
                      <select
                        value={item.severity || ''}
                        onChange={(e) => handleEdit(idx, 'severity', e.target.value)}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">Select severity</option>
                        <option value="irritation">Irritation</option>
                        <option value="sprain">Sprain</option>
                        <option value="partial_tear">Partial Tear</option>
                        <option value="full_thickness_tear">Full Thickness Tear</option>
                        <option value="rupture">Rupture</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(idx)}
                    className="text-rose-600 hover:text-rose-700 text-xs rounded-lg"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-8 text-slate-400">
                No diagnoses extracted from report
              </div>
            )
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={approveMutation.isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            {editedData && editedData.length > 0 && (
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Save
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function mapToLibrary(diagnoses, library) {
  return diagnoses.map(diag => {
    // Find matching region
    const regionKey = Object.keys(library).find(key =>
      library[key].label.toLowerCase().includes(diag.region?.toLowerCase() || '')
    );

    const region = regionKey ? library[regionKey] : null;
    let issueKey = null;
    let issueLabel = null;

    // Find matching issue/diagnosis
    if (region) {
      Object.entries(region.groups || {}).forEach(([groupKey, group]) => {
        const foundIssue = Object.entries(group.issues || {}).find(([key, issue]) =>
          issue.label.toLowerCase().includes(diag.issue?.toLowerCase() || '')
        );
        if (foundIssue) {
          issueKey = foundIssue[0];
          issueLabel = foundIssue[1].label;
        }
      });
    }

    return {
      region_key: regionKey,
      region_label: region?.label,
      issue_key: issueKey,
      issue_label: issueLabel,
      side: diag.side || 'bilateral',
      severity: diag.severity,
      ai_confidence: diag.confidence,
      clinician_edited: false
    };
  });
}