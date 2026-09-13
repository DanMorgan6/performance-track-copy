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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, AlertCircle } from 'lucide-react';

export default function ReportUploadDialog({ open, onOpenChange, patientId, clinicId, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'imaging_report',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please select a file');
      if (!formData.type || !formData.date) throw new Error('Please fill all required fields');

      // Upload file
      const uploadedFile = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadedFile.file_url;

      // Create report record
      const currentUser = await base44.auth.me();
      const report = await base44.entities.Report.create({
        clinic_id: clinicId,
        patient_id: patientId,
        file_url: fileUrl,
        type: formData.type,
        date: formData.date,
        notes: formData.notes,
        visible_to_patient: false,
        created_by: currentUser.email
      });

      // Log audit event
      await base44.entities.AuditLog.create({
        clinic_id: clinicId,
        patient_id: patientId,
        report_id: report.id,
        action: 'report_uploaded',
        details: {
          report_type: formData.type,
          report_date: formData.date
        },
        created_by: currentUser.email
      });

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] });
      setFile(null);
      setFormData({ type: 'imaging_report', date: new Date().toISOString().split('T')[0], notes: '' });
      setError('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message || 'Upload failed');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Patient Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>PDF File *</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="report-file"
              />
              <label htmlFor="report-file" className="cursor-pointer">
                <FileUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : 'Click to select PDF'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Max 10MB</p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Report Type *</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="medical_history">Medical History</option>
              <option value="imaging">Imaging Scan</option>
              <option value="lab_results">Lab Results</option>
              <option value="imaging_report">Imaging Report</option>
              <option value="surgery_report">Surgery Report</option>
              <option value="consultation">Consultation Notes</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Report Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any clinical notes..."
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending || !file}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}