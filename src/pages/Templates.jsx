import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Plus, 
  Edit, 
  Trash2,
  Copy,
  ClipboardList,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isPractitioner } from '@/lib/roles';
import TemplatePDFExport from "@/components/templates/TemplatePDFExport";

export default function Templates() {
  const queryClient = useQueryClient();
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Security: Only admins can access templates
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.RehabTemplate.list('-created_date')
  });

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RehabTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template) => {
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        is_public: false
      };
      delete newTemplate.id;
      delete newTemplate.created_date;
      delete newTemplate.updated_date;
      delete newTemplate.created_by;
      return base44.entities.RehabTemplate.create(newTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const clearLibraryMutation = useMutation({
    mutationFn: async () => {
      const allTemplates = await base44.entities.RehabTemplate.list();
      for (const template of allTemplates) {
        await base44.entities.RehabTemplate.delete(template.id);
      }
      return allTemplates.length;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowClearDialog(false);
      alert(`Cleared ${deleted} templates`);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Rehabilitation Templates</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Reusable templates for common conditions</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowClearDialog(true)}
              disabled={clearLibraryMutation.isPending}
              variant="outline"
              size="sm"
              className="rounded-xl text-rose-600 hover:text-rose-700 text-xs sm:text-sm"
            >
              Clear
            </Button>
            <Link to={createPageUrl('CreateTemplate')}>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/20 text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </Link>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm">
            <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Templates Yet</h3>
            <p className="text-slate-500 mb-6">Create your first rehabilitation template</p>
            <Link to={createPageUrl('CreateTemplate')}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{template.name}</h3>
                    {template.condition_type && (
                      <Badge variant="outline" className="text-xs">
                        {template.condition_type}
                      </Badge>
                    )}
                  </div>
                  {template.is_public && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Public</Badge>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {template.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {template.total_phases || template.phases?.length || 0} phases
                  </div>
                  {template.estimated_duration_weeks && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {template.estimated_duration_weeks} weeks
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link to={createPageUrl(`CreateTemplate?id=${template.id}`)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full rounded-lg">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <TemplatePDFExport template={template} libraryExercises={libraryExercises} />
                  <Button
                   variant="outline"
                   size="sm"
                   onClick={() => duplicateMutation.mutate(template)}
                   disabled={duplicateMutation.isPending}
                   className="rounded-lg"
                  >
                   <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    className="rounded-lg text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear Templates Confirmation Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Template Library?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all templates from the library. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearLibraryMutation.mutate()}
                disabled={clearLibraryMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {clearLibraryMutation.isPending ? 'Clearing...' : 'Clear All'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}