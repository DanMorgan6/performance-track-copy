import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { isPractitioner } from '@/lib/roles';
import MobileSelect from "@/components/ui/MobileSelect";
import ProgrammeScheduleEditor from "@/components/programme/ProgrammeScheduleEditor.jsx";

export default function CreateTemplate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('id');

  const [saving, setSaving] = useState(false);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [aiInputs, setAiInputs] = useState({
    condition: '',
    injury_severity: 'moderate',
    activity_level: 'moderate'
  });

  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    condition_type: '',
    is_public: false
  });

  const createDefaultWeek = () => [
    { day: 'Monday', type: 'training', exercises: [] },
    { day: 'Tuesday', type: 'training', exercises: [] },
    { day: 'Wednesday', type: 'rest', exercises: [] },
    { day: 'Thursday', type: 'training', exercises: [] },
    { day: 'Friday', type: 'training', exercises: [] },
    { day: 'Saturday', type: 'conditioning', exercises: [] },
    { day: 'Sunday', type: 'rest', exercises: [] }
  ];

  const [phases, setPhases] = useState([
    {
      phase_number: 1,
      name: 'Phase 1: Initial Recovery',
      description: '',
      duration_weeks: 2,
      exit_criteria: [{ criterion: '', target_value: '', is_met: false }],
      exercises: [],
      weeks: [
        { week_number: 1, daily_schedule: createDefaultWeek() },
        { week_number: 2, daily_schedule: createDefaultWeek() }
      ]
    }
  ]);


  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date')
  });

  const { data: existingTemplate } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => base44.entities.RehabTemplate.filter({ id: templateId }).then(res => res[0]),
    enabled: !!templateId
  });

  // Track which templateId we've already loaded so we don't re-init on re-renders
  const loadedTemplateIdRef = useRef(null);

  useEffect(() => {
    if (!existingTemplate) return;
    // Only initialize once per templateId
    if (loadedTemplateIdRef.current === existingTemplate.id) return;
    loadedTemplateIdRef.current = existingTemplate.id;

    setTemplateData({
      name: existingTemplate.name || '',
      description: existingTemplate.description || '',
      condition_type: existingTemplate.condition_type || '',
      is_public: existingTemplate.is_public || false
    });

    if (existingTemplate.phases && existingTemplate.phases.length > 0) {
      const migratedPhases = existingTemplate.phases.map((p, i) => {
        // Deep-clone to avoid mutating cached query data
        const phase = JSON.parse(JSON.stringify(p));

        // If already has weeks with daily_schedule, use as-is (blocks format preserved)
        if (phase.weeks && phase.weeks.length > 0) {
          return { ...phase, phase_number: i + 1 };
        }

        // Legacy format — migrate exercises into week 1 training days
        const exercises = phase.exercises || [];
        const duration = parseInt(phase.duration_weeks) || 2;
        const weeks = Array.from({ length: duration }, (_, weekIdx) => {
          const dailySchedule = createDefaultWeek();
          if (weekIdx === 0 && exercises.length > 0) {
            const trainingDays = [0, 1, 3, 4];
            const exercisesPerDay = Math.ceil(exercises.length / trainingDays.length);
            trainingDays.forEach((dayIdx, idx) => {
              dailySchedule[dayIdx].exercises = exercises.slice(idx * exercisesPerDay, idx * exercisesPerDay + exercisesPerDay);
            });
          }
          return { week_number: weekIdx + 1, daily_schedule: dailySchedule };
        });
        return { ...phase, phase_number: i + 1, exercises, weeks };
      });
      setPhases(migratedPhases);
    }
  }, [existingTemplate]);

  const addPhase = () => {
    const duration = 2;
    const weeks = Array.from({ length: duration }, (_, i) => ({
      week_number: i + 1,
      daily_schedule: createDefaultWeek()
    }));
    setPhases(prev => {
      const newPhase = {
        phase_number: prev.length + 1,
        name: `Phase ${prev.length + 1}`,
        description: '',
        duration_weeks: duration,
        exit_criteria: [{ criterion: '', target_value: '', is_met: false }],
        exercises: [],
        weeks
      };
      setSelectedPhaseIndex(prev.length);
      setSelectedWeekIndex(0);
      return [...prev, newPhase];
    });
  };

  const removePhase = (index) => {
    setPhases(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, phase_number: i + 1 }));
    });
  };

  const updatePhase = (index, field, value) => {
    setPhases(prev => {
      const newPhases = prev.map((p, i) => i !== index ? p : { ...p, [field]: value });
      if (field === 'duration_weeks') {
        const phase = newPhases[index];
        const intValue = parseInt(value) || 1;
        const currentCount = phase.weeks?.length || 1;
        const newWeeks = [...(phase.weeks || [])];
        if (intValue > currentCount) {
          for (let i = currentCount; i < intValue; i++) {
            newWeeks.push({ week_number: i + 1, daily_schedule: createDefaultWeek() });
          }
        } else if (intValue < currentCount) {
          newWeeks.splice(intValue);
        }
        newPhases[index] = { ...phase, duration_weeks: intValue, weeks: newWeeks };
        setSelectedWeekIndex(0);
      }
      return newPhases;
    });
  };

  const addExitCriterion = (phaseIndex) => {
    setPhases(prev => {
      const newPhases = [...prev];
      newPhases[phaseIndex] = {
        ...newPhases[phaseIndex],
        exit_criteria: [...(newPhases[phaseIndex].exit_criteria || []), { criterion: '', target_value: '', is_met: false }]
      };
      return newPhases;
    });
  };

  const updateExitCriterion = (phaseIndex, criteriaIndex, field, value) => {
    setPhases(prev => {
      const newPhases = [...prev];
      const criteria = [...(newPhases[phaseIndex].exit_criteria || [])];
      criteria[criteriaIndex] = { ...criteria[criteriaIndex], [field]: value };
      newPhases[phaseIndex] = { ...newPhases[phaseIndex], exit_criteria: criteria };
      return newPhases;
    });
  };

  const removeExitCriterion = (phaseIndex, criteriaIndex) => {
    setPhases(prev => {
      const newPhases = [...prev];
      newPhases[phaseIndex] = {
        ...newPhases[phaseIndex],
        exit_criteria: (newPhases[phaseIndex].exit_criteria || []).filter((_, i) => i !== criteriaIndex)
      };
      return newPhases;
    });
  };



  const generateAiTemplate = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert physical therapist creating a detailed rehabilitation template.
Condition/Injury: ${aiInputs.condition}
Injury Severity: ${aiInputs.injury_severity}
Activity Level: ${aiInputs.activity_level}

Create a comprehensive rehabilitation template with 3-5 phases. Each phase should have a name, description, duration in weeks, 3-5 exit criteria with target values, and 4-8 exercises with detailed parameters. Make it progressive and evidence-based.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase_number: { type: "number" },
                  name: { type: "string" },
                  description: { type: "string" },
                  duration_weeks: { type: "number" },
                  exit_criteria: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        criterion: { type: "string" },
                        target_value: { type: "string" }
                      }
                    }
                  },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        sets: { type: "number" },
                        reps: { type: "string" },
                        frequency: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setTemplateData(prev => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        condition_type: aiInputs.condition
      }));

      setPhases(result.phases.map((p, i) => {
        const exercises = p.exercises || [];
        const duration = p.duration_weeks || 2;
        const weeks = Array.from({ length: duration }, (_, weekIdx) => {
          const dailySchedule = createDefaultWeek();
          if (weekIdx === 0) {
            const trainingDays = [0, 1, 3, 4];
            const exercisesPerDay = Math.ceil(exercises.length / trainingDays.length);
            trainingDays.forEach((dayIdx, idx) => {
              dailySchedule[dayIdx].exercises = exercises.slice(idx * exercisesPerDay, idx * exercisesPerDay + exercisesPerDay);
            });
          }
          return { week_number: weekIdx + 1, daily_schedule: dailySchedule };
        });
        return {
          ...p,
          phase_number: i + 1,
          duration_weeks: duration,
          exit_criteria: (p.exit_criteria || []).map(c => ({ ...c, is_met: false })),
          exercises,
          weeks
        };
      }));

      setShowAiGenerator(false);
      setSelectedPhaseIndex(0);
      setSelectedWeekIndex(0);
    } catch (error) {
      alert('Failed to generate template. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleImportDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      if (!uploadResult?.file_url) throw new Error('Failed to upload file');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract a rehabilitation template from this document. Return name, description, condition_type, and phases (each with phase_number, name, description, duration_weeks, exit_criteria [{criterion, target_value}], and exercises [{name, description, sets, reps, frequency, video_url}]).`,
        file_urls: [uploadResult.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            condition_type: { type: "string" },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase_number: { type: "number" },
                  name: { type: "string" },
                  description: { type: "string" },
                  duration_weeks: { type: "number" },
                  exit_criteria: { type: "array", items: { type: "object", properties: { criterion: { type: "string" }, target_value: { type: "string" } } } },
                  exercises: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, sets: { type: "number" }, reps: { type: "string" }, frequency: { type: "string" }, video_url: { type: "string" } } } }
                }
              }
            }
          },
          required: ["name", "phases"]
        }
      });

      if (!result?.phases?.length) throw new Error('No valid template data found in document');

      setTemplateData({
        name: result.name || '',
        description: result.description || '',
        condition_type: result.condition_type || '',
        is_public: false
      });

      setPhases(result.phases.map((p, i) => {
        const exercises = p.exercises || [];
        const duration = p.duration_weeks || 2;
        const weeks = Array.from({ length: duration }, (_, weekIdx) => {
          const dailySchedule = createDefaultWeek();
          if (weekIdx === 0) {
            const trainingDays = [0, 1, 3, 4];
            const exercisesPerDay = Math.ceil(exercises.length / trainingDays.length);
            trainingDays.forEach((dayIdx, idx) => {
              dailySchedule[dayIdx].exercises = exercises.slice(idx * exercisesPerDay, idx * exercisesPerDay + exercisesPerDay);
            });
          }
          return { week_number: weekIdx + 1, daily_schedule: dailySchedule };
        });
        return {
          ...p,
          phase_number: i + 1,
          duration_weeks: duration,
          exit_criteria: (p.exit_criteria || []).map(c => ({ ...c, is_met: false })),
          exercises,
          weeks
        };
      }));

      setShowImportDialog(false);
      alert(`Successfully imported template with ${result.phases.length} phase(s)`);
    } catch (error) {
      alert(`Failed to import template: ${error.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Capture latest phases via functional setter to guarantee we read current state
    let currentPhases;
    await new Promise(resolve => {
      setPhases(prev => {
        currentPhases = prev;
        resolve();
        return prev; // no change, just reading
      });
    });
    try {
      const user = await base44.auth.me();
      // Collect all exercises to sync to library (handles both legacy exercises[] and new blocks[] format)
      const allExercises = [];
      for (const phase of currentPhases) {
        if (phase.weeks) {
          phase.weeks.forEach(week => {
            week.daily_schedule?.forEach(day => {
              // New block-based format
              (day.blocks || []).forEach(block => {
                (block.exercises || []).forEach(ex => { if (ex.name) allExercises.push(ex); });
              });
              // Legacy exercises array
              (day.exercises || []).forEach(ex => { if (ex.name) allExercises.push(ex); });
            });
          });
        }
        (phase.exercises || []).forEach(ex => { if (ex.name) allExercises.push(ex); });
      }

      const existingExercises = allExercises.length > 0 ? await base44.entities.ExerciseLibrary.list() : [];
      const existingNames = new Set(existingExercises.map(ex => ex.name));
      const seenNames = new Set();
      const uniqueNewExercises = allExercises.filter(ex => {
        if (!ex.name || existingNames.has(ex.name) || seenNames.has(ex.name)) return false;
        seenNames.add(ex.name);
        return true;
      });

      if (uniqueNewExercises.length > 0) {
        await base44.entities.ExerciseLibrary.bulkCreate(
          uniqueNewExercises.map(ex => ({
            clinic_id: user.clinic_id,
            name: ex.name,
            description: ex.description || '',
            category: 'functional',
            body_part: 'full_body',
            difficulty_level: 'intermediate',
            default_sets: ex.sets || 3,
            default_reps: ex.reps || '10',
            default_frequency: ex.frequency || 'Daily',
            video_url: ex.video_url || ''
          }))
        );
      }

      const totalWeeks = currentPhases.reduce((sum, p) => sum + (parseInt(p.duration_weeks) || 0), 0);
      // Deep-clone phases to ensure nested weeks/blocks are fully serialised
      const serialisedPhases = JSON.parse(JSON.stringify(currentPhases));
      const payload = {
        clinic_id: user.clinic_id,
        name: templateData.name,
        description: templateData.description,
        condition_type: templateData.condition_type,
        is_public: templateData.is_public,
        total_phases: serialisedPhases.length,
        estimated_duration_weeks: totalWeeks,
        phases: serialisedPhases
      };

      if (templateId) {
        await base44.entities.RehabTemplate.update(templateId, payload);
      } else {
        await base44.entities.RehabTemplate.create(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate(createPageUrl('Templates'));
    } catch (error) {
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">
        <Link
          to={createPageUrl('Templates')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:p-8 mb-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              {templateId ? 'Edit' : 'Create'} Rehabilitation Template
            </h1>
            <p className="text-slate-500 mt-1">Build a reusable template for common conditions</p>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-8">
            {/* Template Details */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-700 flex-1">Template Details</h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowAiGenerator(true)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-xs"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Generate
                  </Button>
                  {!templateId && (
                    <Button
                      type="button"
                      onClick={() => setShowImportDialog(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Import Doc
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Template Name *</Label>
                  <Input
                    required
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    placeholder="e.g., ACL Reconstruction Protocol"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={templateData.description}
                    onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    placeholder="Overview of this template..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condition Type</Label>
                  <Input
                    value={templateData.condition_type}
                    onChange={(e) => setTemplateData({ ...templateData, condition_type: e.target.value })}
                    placeholder="e.g., ACL Tear, Rotator Cuff"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={templateData.is_public}
                    onChange={(e) => setTemplateData({ ...templateData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_public" className="cursor-pointer">
                    Make this template public
                    <p className="text-xs text-slate-400 font-normal">Visible to all clinicians</p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Schedule Builder */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-700">Weekly Schedule</h2>
              <ProgrammeScheduleEditor
                phases={phases}
                setPhases={setPhases}
                libraryExercises={libraryExercises}
                selectedPhaseIndex={selectedPhaseIndex}
                setSelectedPhaseIndex={setSelectedPhaseIndex}
                selectedWeekIndex={selectedWeekIndex}
                setSelectedWeekIndex={setSelectedWeekIndex}
                onAddPhase={addPhase}
                onRemovePhase={removePhase}
                onUpdatePhase={updatePhase}
                onAddExitCriterion={addExitCriterion}
                onUpdateExitCriterion={updateExitCriterion}
                onRemoveExitCriterion={removeExitCriterion}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl('Templates')}>
                <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {templateId ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </div>

        {/* AI Generator Dialog */}
        <Dialog open={showAiGenerator} onOpenChange={setShowAiGenerator}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Template Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-500">The AI will create a complete rehabilitation template based on the condition.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Condition/Injury *</Label>
                  <Input
                    required
                    value={aiInputs.condition}
                    onChange={(e) => setAiInputs({ ...aiInputs, condition: e.target.value })}
                    placeholder="e.g., ACL Tear, Rotator Cuff, Lower Back Pain"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Injury Severity</Label>
                  <MobileSelect
                    label="Injury Severity"
                    value={aiInputs.injury_severity}
                    onChange={(e) => setAiInputs({ ...aiInputs, injury_severity: e.target.value })}
                    options={[
                      { value: 'mild', label: 'Mild' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'severe', label: 'Severe' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <MobileSelect
                    label="Activity Level"
                    value={aiInputs.activity_level}
                    onChange={(e) => setAiInputs({ ...aiInputs, activity_level: e.target.value })}
                    options={[
                      { value: 'sedentary', label: 'Sedentary' },
                      { value: 'light', label: 'Light Activity' },
                      { value: 'moderate', label: 'Moderate Activity' },
                      { value: 'active', label: 'Very Active' },
                      { value: 'athlete', label: 'Athlete' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAiGenerator(false)} disabled={generating} className="rounded-xl">Cancel</Button>
                <Button
                  type="button"
                  onClick={generateAiTemplate}
                  disabled={generating || !aiInputs.condition}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl"
                >
                  {generating ? (
                    <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate Template</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Template from Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600">Upload a PDF, image, or Word document. AI will extract the template data.</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <input type="file" onChange={handleImportDocument} disabled={importing} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" id="template-upload" />
                <label htmlFor="template-upload" className={cn("cursor-pointer flex flex-col items-center gap-2", importing && "opacity-50 pointer-events-none")}>
                  {importing ? (
                    <><div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" /><span className="text-sm text-slate-600">Extracting template data...</span></>
                  ) : (
                    <><Plus className="w-8 h-8 text-slate-400" /><span className="text-sm font-medium text-slate-700">Choose file to upload</span><span className="text-xs text-slate-400">PDF, PNG, JPG, or Word document</span></>
                  )}
                </label>
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}