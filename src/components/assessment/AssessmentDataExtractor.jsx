import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AssessmentDataExtractor({ onDataExtracted, patientId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract assessment data from document
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            assessments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test_name: { type: 'string' },
                  assessment_type: { type: 'string' },
                  body_part: { type: 'string' },
                  side: { type: 'string' },
                  value: { type: 'string' },
                  unit: { type: 'string' },
                  baseline: { type: 'string' },
                  notes: { type: 'string' },
                  assessment_date: { type: 'string', format: 'date' }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status === 'success' && extractionResult.output?.assessments) {
        onDataExtracted(extractionResult.output.assessments);
        setSuccess(`Successfully extracted ${extractionResult.output.assessments.length} assessment(s)`);
        e.target.value = '';
      } else {
        setError('Could not extract assessment data from document. Please check the file format.');
      }
    } catch (err) {
      setError('Error processing file. Please try again with a valid document (PDF, Word, or image).');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <Label className="block mb-3 font-medium">Extract Assessment Data from Document</Label>
      <p className="text-sm text-slate-600 mb-4">
        Upload a medical document (PDF, Word, or image) to automatically extract assessment data
      </p>

      <div className="relative">
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={isLoading}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
          id="assessment-file-input"
        />
        <label htmlFor="assessment-file-input">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full cursor-pointer rounded-xl",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
            asChild
          >
            <span>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Document
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}
    </div>
  );
}