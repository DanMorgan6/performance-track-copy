import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SaveTemplateDialog({
  open,
  onOpenChange,
  templateData,
  setTemplateData,
  activePlanPhases,
  onSave,
  saving,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save Plan as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">
            Save this rehabilitation plan as a reusable template for future patients with similar conditions.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                required
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                placeholder="e.g., ACL Recovery Protocol"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Condition/Injury Type *</Label>
              <Input
                required
                value={templateData.condition_type}
                onChange={(e) => setTemplateData({ ...templateData, condition_type: e.target.value })}
                placeholder="e.g., ACL Tear, Rotator Cuff"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                placeholder="Brief description of this template..."
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            <p className="font-medium mb-1">Template will include:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>{activePlanPhases.length} phases with exercises</li>
              <li>Exit criteria for each phase</li>
              <li>Exercise descriptions and parameters</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={saving || !templateData.name || !templateData.condition_type}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}