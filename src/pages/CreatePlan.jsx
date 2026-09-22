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
  FileText,
  Clock,
  Layers,
  Sparkles,
  Download,
  Mail
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
// Badge used in template picker dialog
import { Link } from 'react-router-dom';
import { isPractitioner } from '@/lib/roles';
import { generatePlanPDF, uploadAndEmailPDF } from "@/components/reports/PlanPDFGenerator";
import ProgramTypeSelector from "@/components/plan/ProgramTypeSelector";
import BasicProgramBuilder from "@/components/plan/BasicProgramBuilder";
import MonitoringSettingsCard from "@/components/plan/MonitoringSettingsCard";
import MobileSelect from "@/components/ui/MobileSelect";
import { applyPlanMode } from "@/lib/planModes";
import ProgrammeScheduleEditor from "@/components/programme/ProgrammeScheduleEditor.jsx";

export default function CreatePlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patient_id');

  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const submissionInProgressRef = React.useRef(false);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadedTemplateId, setLoadedTemplateId] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [aiInputs, setAiInputs] = useState({
    condition: '',
    injury_severity: 'moderate',
    age: '',
    activity_level: 'moderate',
    rehab_goal: '',
    precautions: '',
    sessions_per_week: 3
  });

  // Security: Only clinic staff can create plans
  React.useEffect(() => {
    const checkAccess = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (!isPractitioner(user)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);
  
  const [programType, setProgramType] = useState(null);
  const [creationMode, setCreationMode] = useState(null);
  const [planData, setPlanData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: '',
    status: 'active',
    program_type: 'phased',
    plan_mode: 'phased',
    monitoring_level: 'standard',
    morning_check_in_enabled: false,
    basic_config: {
      frequency_per_week: 3,
      weekend_rest_days: true,
      days_of_week_pattern: ['Monday', 'Wednesday', 'Friday'],
      exercise_bundle: []
    }
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
      exercises: [{ name: '', description: '', sets: 3, reps: '10', frequency: 'Daily', video_url: '' }],
      status: 'pending',
      use_daily_schedule: false,
      weeks: [
        { week_number: 1, daily_schedule: createDefaultWeek() },
        { week_number: 2, daily_schedule: createDefaultWeek() }
      ]
    }
  ]);
  const phasesRef = useRef(phases);
  useEffect(() => { phasesRef.current = phases; }, [phases]);
  const planDataRef = useRef(planData);
  useEffect(() => { planDataRef.current = planData; }, [planData]);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId, currentUser?.clinic_id],
    queryFn: () => base44.entities.Patient.filter({ id: patientId, clinic_id: currentUser.clinic_id }).then(res => res[0]),
    enabled: !!patientId && !!currentUser?.clinic_id
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', currentUser?.clinic_id],
    queryFn: () => base44.entities.RehabTemplate.filter({ clinic_id: currentUser.clinic_id }, '-created_date'),
    enabled: !!currentUser?.clinic_id
  });

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library', currentUser?.clinic_id],
    queryFn: () => base44.entities.ExerciseLibrary.filter({ clinic_id: currentUser.clinic_id }, '-created_date'),
    enabled: !!currentUser?.clinic_id
  });

  const { data: progressionBlocks = [] } = useQuery({
    queryKey: ['progression-blocks', currentUser?.clinic_id],
    queryFn: () => base44.entities.ProgressionBlock.filter({ clinic_id: currentUser.clinic_id, is_active: true }, 'name'),
    enabled: !!currentUser?.clinic_id
  });

  const loadTemplate = (template) => {
    setPlanData({
      ...planData,
      title: template.name,
      description: template.description
    });
    setLoadedTemplateId(template.id);
    
    if (template.phases && template.phases.length > 0) {
      setPhases(template.phases.map((p, i) => {
        const exercises = p.exercises || [];
        const duration = p.duration_weeks || 2;
        
        // Create weeks structure
        const weeks = Array.from({ length: duration }, (_, weekIdx) => {
          const dailySchedule = [
            { day: 'Monday', type: 'training', exercises: [] },
            { day: 'Tuesday', type: 'training', exercises: [] },
            { day: 'Wednesday', type: 'rest', exercises: [] },
            { day: 'Thursday', type: 'training', exercises: [] },
            { day: 'Friday', type: 'training', exercises: [] },
            { day: 'Saturday', type: 'conditioning', exercises: [] },
            { day: 'Sunday', type: 'rest', exercises: [] }
          ];
          
          // Repeat the prescribed programme across every generated week.
          const trainingDays = [0, 1, 3, 4];
          const exercisesPerDay = Math.ceil(exercises.length / trainingDays.length);
          
          trainingDays.forEach((dayIdx, idx) => {
            const start = idx * exercisesPerDay;
            const end = start + exercisesPerDay;
            dailySchedule[dayIdx].exercises = exercises
              .slice(start, end)
              .map((exercise) => ({ ...exercise }));
          });
          
          return {
            week_number: weekIdx + 1,
            daily_schedule: dailySchedule
          };
        });
        
        return {
          ...p,
          phase_number: i + 1,
          duration_weeks: duration,
          exit_criteria: p.exit_criteria || [{ criterion: '', target_value: '', is_met: false }],
          exercises: exercises,
          status: i === 0 ? 'active' : 'pending',
          weeks: weeks
        };
      }));
      setSelectedPhaseIndex(0);
      setSelectedWeekIndex(0);
    }
    
    setShowTemplatePicker(false);
  };

  const saveTemplate = async () => {
    if (!loadedTemplateId) {
      alert('No template loaded to save.');
      return;
    }

    setSavingTemplate(true);
    try {
      const updatedTemplate = {
        name: planData.title,
        description: planData.description,
        phases: phases.map(p => ({
          phase_number: p.phase_number,
          name: p.name,
          description: p.description,
          duration_weeks: p.duration_weeks,
          exit_criteria: p.exit_criteria,
          exercises: p.exercises
        }))
      };

      await base44.entities.RehabTemplate.update(loadedTemplateId, updatedTemplate);
      alert('Template saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    } catch (error) {
      alert('Failed to save template. Please try again.');
      console.error(error);
    } finally {
      setSavingTemplate(false);
    }
  };

  const generateAiPlan = async () => {
    setGenerating(true);
    
    try {
      // Get existing templates for context - find similar conditions
      const relevantTemplates = templates.filter(t => 
        t.condition_type?.toLowerCase().includes(aiInputs.condition.toLowerCase()) ||
        aiInputs.condition.toLowerCase().includes(t.condition_type?.toLowerCase())
      ).slice(0, 3);
      
      // If no relevant templates, use any templates as examples
      const templatesToUse = relevantTemplates.length > 0 ? relevantTemplates : templates.slice(0, 2);
      
      const templatesContext = templatesToUse.map(t => ({
        name: t.name,
        condition: t.condition_type,
        phases: t.phases?.map(p => ({
          name: p.name,
          description: p.description,
          duration_weeks: p.duration_weeks,
          exit_criteria: p.exit_criteria,
          exercises: p.exercises?.map(e => ({
            name: e.name,
            description: e.description,
            sets: e.sets,
            reps: e.reps,
            frequency: e.frequency
          }))
        }))
      }));

      const planMode = planData.plan_mode || programType || 'phased';
      const libraryContext = libraryExercises.slice(0, 80).map((exercise) => ({
        name: exercise.name,
        category: exercise.category,
        body_part: exercise.body_part,
        description: exercise.description,
        default_sets: exercise.default_sets,
        default_reps: exercise.default_reps
      }));

      const prompt = `You are a clinical rehabilitation drafting assistant. Produce a clinician-reviewable ${planMode} plan; do not diagnose, invent examination findings, or override stated precautions.

Patient context:
- Condition/injury: ${aiInputs.condition}
- Severity: ${aiInputs.injury_severity}
- Goal: ${aiInputs.rehab_goal || 'Restore function safely'}
- Precautions or restrictions: ${aiInputs.precautions || 'None supplied — do not invent any'}
- Age: ${aiInputs.age || (patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'Adult')}
- Activity level: ${aiInputs.activity_level}
- Sessions per week: ${aiInputs.sessions_per_week}
- Patient: ${patient?.full_name || 'Patient'}

Plan rules:
1. This is a ${planMode} plan. ${planMode === 'basic' ? 'Return a concise exercise list with no phases or exit criteria.' : 'Return 3-5 progressive, criteria-led phases.'}
2. Time is a planning guide only. Never use elapsed time alone to progress a phase.
3. Exit criteria must be objective, observable and assessable. Progression remains clinician-controlled.
4. Prefer exact exercise names from the clinic library below. Use a clear standard name only when no appropriate library exercise exists.
5. Keep patient burden proportionate. For Performance plans, use performance tracking only for measurable loaded strength exercises; use standard or basic tracking for mobility, balance, control and symptom-led work.
6. Specify realistic sets, repetitions, rest and weekly scheduling. Do not prescribe through pain or contradict the supplied precautions.
7. The output is a draft for practitioner review, not autonomous clinical advice.

Clinic exercise library:
${JSON.stringify(libraryContext, null, 2)}

Relevant clinic templates:
${JSON.stringify(templatesContext, null, 2)}

For each exercise set tracking_mode to basic, standard or performance. Basic plans should normally use basic. Phased plans should normally use standard. Performance plans may mix all three according to clinical value.`;

      const result = /** @type {any} */ (await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
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
      }));

      // Load the generated plan
      setPlanData({
        ...planData,
        title: result.title,
        description: result.description
      });

      setPhases(result.phases.map((p, i) => {
        const exercises = p.exercises || [];
        const duration = p.duration_weeks || 2;
        
        // Create weeks structure
        const weeks = Array.from({ length: duration }, (_, weekIdx) => {
          const dailySchedule = [
            { day: 'Monday', type: 'training', exercises: [] },
            { day: 'Tuesday', type: 'training', exercises: [] },
            { day: 'Wednesday', type: 'rest', exercises: [] },
            { day: 'Thursday', type: 'training', exercises: [] },
            { day: 'Friday', type: 'training', exercises: [] },
            { day: 'Saturday', type: 'conditioning', exercises: [] },
            { day: 'Sunday', type: 'rest', exercises: [] }
          ];
          
          // Repeat the prescribed programme across every generated week.
          const trainingDays = [0, 1, 3, 4];
          const exercisesPerDay = Math.ceil(exercises.length / trainingDays.length);
          
          trainingDays.forEach((dayIdx, idx) => {
            const start = idx * exercisesPerDay;
            const end = start + exercisesPerDay;
            dailySchedule[dayIdx].exercises = exercises
              .slice(start, end)
              .map((exercise) => ({ ...exercise }));
          });
          
          return {
            week_number: weekIdx + 1,
            daily_schedule: dailySchedule
          };
        });
        
        return {
          ...p,
          phase_number: i + 1,
          duration_weeks: duration,
          exit_criteria: p.exit_criteria.map(c => ({ ...c, is_met: false })),
          status: i === 0 ? 'active' : 'pending',
          video_url: '',
          weeks: weeks
        };
      }));

      setShowAiGenerator(false);
      setSelectedPhaseIndex(0);
    } catch (error) {
      alert('Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const addPhase = () => {
    const duration = 2;
    const weeks = Array.from({ length: duration }, (_, i) => ({
      week_number: i + 1,
      daily_schedule: createDefaultWeek()
    }));
    
    setPhases([...phases, {
      phase_number: phases.length + 1,
      name: `Phase ${phases.length + 1}`,
      description: '',
      duration_weeks: duration,
      exit_criteria: [{ criterion: '', target_value: '', is_met: false }],
      exercises: [{ name: '', description: '', sets: 3, reps: '10', frequency: 'Daily', video_url: '' }],
      status: 'pending',
      use_daily_schedule: false,
      weeks: weeks
    }]);
    setSelectedPhaseIndex(phases.length);
    setSelectedWeekIndex(0);
  };

  const removePhase = (index) => {
    if (phases.length > 1) {
      const newPhases = phases.filter((_, i) => i !== index);
      setPhases(newPhases.map((p, i) => ({ ...p, phase_number: i + 1 })));
    }
  };

  const updatePhase = (index, field, value) => {
    const newPhases = [...phases];
    const existingPhase = newPhases[index];
    const updatedPhase = {
      ...existingPhase,
      weeks: [...(existingPhase.weeks || [])],
      [field]: value
    };

    // Keep the week data in sync whenever duration changes.
    if (field === 'duration_weeks') {
      const duration = Math.max(1, Number(value) || 1);
      const currentWeekCount = updatedPhase.weeks.length;
      if (duration > currentWeekCount) {
        for (let i = currentWeekCount; i < duration; i++) {
          updatedPhase.weeks.push({
            week_number: i + 1,
            daily_schedule: createDefaultWeek()
          });
        }
      } else if (duration < currentWeekCount) {
        updatedPhase.weeks = updatedPhase.weeks.slice(0, duration);
      }
      updatedPhase.duration_weeks = duration;
      setSelectedWeekIndex(0);
    }

    newPhases[index] = updatedPhase;
    setPhases(newPhases);
  };

  const addExitCriterion = (phaseIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria.push({ criterion: '', target_value: '', is_met: false });
    setPhases(newPhases);
  };

  const updateExitCriterion = (phaseIndex, criteriaIndex, field, value) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria[criteriaIndex][field] = value;
    setPhases(newPhases);
  };

  const removeExitCriterion = (phaseIndex, criteriaIndex) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].exit_criteria = newPhases[phaseIndex].exit_criteria.filter((_, i) => i !== criteriaIndex);
    setPhases(newPhases);
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const pdf = await generatePlanPDF(planData, phases, patient);
      pdf.save(`${planData.title || 'Rehabilitation-Plan'}.pdf`);
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
      console.error(error);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleEmailPDF = async () => {
    if (!patient?.email) {
      alert('Patient email is not available.');
      return;
    }
    
    setExportingPDF(true);
    try {
      const pdf = await generatePlanPDF(planData, phases, patient);
      await uploadAndEmailPDF(pdf, planData, patient.email, patient.full_name);
      alert('PDF has been sent to the patient\'s email!');
    } catch (error) {
      alert('Failed to email PDF. Please try again.');
      console.error(error);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.clinic_id) {
      alert('Your clinic account is still loading. Please wait a moment and try again.');
      return;
    }

    // Prevent duplicate submissions
    if (submissionInProgressRef.current) return;
    
    submissionInProgressRef.current = true;
    setSaving(true);

    try {
      // Use refs to get latest state (avoids stale closure)
      const currentPhases = phasesRef.current;
      const currentPlanData = planDataRef.current;
      // Collect all exercises
       const allExercises = [];
       for (const phase of currentPhases) {
         // Collect from weeks structure
         if (phase.weeks) {
           phase.weeks.forEach(week => {
             week.daily_schedule?.forEach(day => {
               if (day.exercises) allExercises.push(...day.exercises);
             });
           });
         }
         // Also collect from regular exercises list
         allExercises.push(...(phase.exercises || []));
       }

      // Get unique exercise names
      const uniqueExerciseNames = [...new Set(allExercises.filter(ex => ex.name).map(ex => ex.name))];

      // Fetch all existing exercises in one call
      const existingExercises = uniqueExerciseNames.length > 0 
        ? await base44.entities.ExerciseLibrary.filter({ clinic_id: currentUser.clinic_id })
        : [];
      
      const existingNames = new Set(existingExercises.map(ex => ex.name));

      // Create only new exercises
      const newExercises = allExercises.filter(ex => ex.name && !existingNames.has(ex.name));
      
      // Deduplicate by name
      const seenNames = new Set();
      const uniqueNewExercises = newExercises.filter(ex => {
        if (seenNames.has(ex.name)) return false;
        seenNames.add(ex.name);
        return true;
      });

      if (uniqueNewExercises.length > 0) {
        await base44.entities.ExerciseLibrary.bulkCreate(
          uniqueNewExercises.map(exercise => ({
            clinic_id: currentUser?.clinic_id,
            name: exercise.name,
            description: exercise.description || '',
            category: 'functional',
            body_part: 'full_body',
            difficulty_level: 'intermediate',
            default_sets: exercise.sets || 3,
            default_reps: exercise.reps || '10',
            default_frequency: exercise.frequency || 'Daily',
            video_url: exercise.video_url || ''
          }))
        );
      }

      // Validate patient_id is set
      const finalPatientId = patientId || patient?.id;
      
      if (!finalPatientId) {
        alert('Error: No patient selected. Please go back and try again.');
        submissionInProgressRef.current = false;
        setSaving(false);
        return;
      }

      // Archive any existing active plans for this patient
      const existingPlans = await base44.entities.RehabPlan.filter({ 
        patient_id: finalPatientId,
        clinic_id: currentUser?.clinic_id,
        status: 'active' 
      });
      
      for (const existingPlan of existingPlans) {
        await base44.entities.RehabPlan.update(existingPlan.id, {
          status: 'archived',
          publication_state: 'archived',
          archived_at: new Date().toISOString()
        });
      }

      // Create the plan with explicit patient_id and clinic_id - MUST be 'active'
      const planPayload = {
        title: currentPlanData.title,
        description: currentPlanData.description,
        start_date: currentPlanData.start_date,
        target_end_date: currentPlanData.target_end_date,
        status: 'active',
        patient_id: finalPatientId,
        clinic_id: currentUser?.clinic_id,
        program_type: currentPlanData.program_type,
        plan_mode: currentPlanData.plan_mode,
        monitoring_level: currentPlanData.monitoring_level,
        morning_check_in_enabled: currentPlanData.morning_check_in_enabled,
        current_phase: currentPlanData.program_type === 'basic' ? null : 1,
        total_phases: currentPlanData.program_type === 'basic' ? null : currentPhases.length,
        basic_config: currentPlanData.program_type === 'basic' ? currentPlanData.basic_config : null,
        created_by_clinician: currentUser?.email,
        creation_mode: creationMode || currentPlanData.plan_mode || currentPlanData.program_type,
        publication_state: 'published',
        version: 1,
        published_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      };
      const plan = await base44.entities.RehabPlan.create(planPayload);

      // Create all phases with bulkCreate (only for phased programs)
      if (currentPlanData.program_type === 'phased') {
        const phasesToCreate = currentPhases.map(phase => ({
          ...phase,
          clinic_id: plan.clinic_id,
          patient_id: finalPatientId,
          plan_id: plan.id,
          status: phase.phase_number === 1 ? 'active' : 'pending'
        }));
        await base44.entities.RehabPhase.bulkCreate(phasesToCreate);
      }

      // Send email notification to patient (only if they're registered in the app)
      if (patient?.email) {
        try {
          const portalUrl = `${window.location.origin}${createPageUrl('PatientPortal')}`;
          await base44.integrations.Core.SendEmail({
            to: patient.email,
            subject: 'Your Rehabilitation Plan is Ready - Performance Track+',
            body: `Hi ${patient.full_name},

Your personalized rehabilitation plan "${currentPlanData.title}" has been created and is now ready for you.

To access your plan and start your recovery journey:
1. Visit: ${portalUrl}
2. Sign in with your email: ${patient.email}
3. View your exercises, track your progress, and log your pain levels

Your clinician has created ${currentPlanData.program_type === 'basic' ? 'a focused exercise plan' : `a ${currentPhases.length}-phase, criteria-led rehabilitation programme`} designed specifically for your recovery, with clear exercise instructions and progress tracking.

If you have any questions, please contact your clinician.

Best regards,
Performance Track+`
          });
        } catch (error) {
          // Patient not registered yet - email won't be sent
          console.log('Email not sent - patient not registered in app');
        }
      }

      // Invalidate plan cache to force refresh on next page
      queryClient.invalidateQueries({ queryKey: ['patient-plans'] });
      navigate(createPageUrl(`PatientDetail?id=${finalPatientId}`));
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to create plan. Please try again.');
    } finally {
      submissionInProgressRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="performance-shell min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">
        <Link 
          to={createPageUrl(patientId ? `PatientDetail?id=${patientId}` : 'CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:p-8 mb-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Create Rehabilitation Plan</h1>
            {patient && (
              <p className="text-slate-500 mt-1">For {patient.full_name}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) e.preventDefault(); }} className="space-y-8">
             {/* Program Type Selection */}
             {!programType && (
               <ProgramTypeSelector 
                 onSelect={(type) => {
                   setCreationMode(type);
                   setProgramType(type);
                   setPlanData((current) => applyPlanMode(current, type));
                 }}
               />
             )}

             {programType && (
             <>
             {/* Plan Details */}
              <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                 <h2 className="text-lg font-semibold text-slate-700 flex-1">Plan Details</h2>
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
                   {loadedTemplateId && (
                     <Button 
                       type="button" 
                       onClick={saveTemplate}
                       disabled={savingTemplate}
                       size="sm"
                       className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                     >
                       {savingTemplate ? (
                         <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                       ) : (
                         <Save className="w-4 h-4 mr-1" />
                       )}
                       Save Template
                     </Button>
                   )}
                   <Button 
                     type="button" 
                     onClick={() => setShowTemplatePicker(true)}
                     variant="outline"
                     size="sm"
                     className="rounded-xl text-xs"
                   >
                     <FileText className="w-4 h-4 mr-1" />
                     Load Template
                   </Button>
                 </div>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Plan Title *</Label>
                  <Input
                    required
                    value={planData.title}
                    onChange={(e) => setPlanData({...planData, title: e.target.value})}
                    placeholder="e.g., ACL Reconstruction Recovery Protocol"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={planData.description}
                    onChange={(e) => setPlanData({...planData, description: e.target.value})}
                    placeholder="Overview of the rehabilitation plan..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={planData.start_date}
                    onChange={(e) => setPlanData({...planData, start_date: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target End Date</Label>
                  <Input
                    type="date"
                    value={planData.target_end_date}
                    onChange={(e) => setPlanData({...planData, target_end_date: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <MonitoringSettingsCard
              planData={planData}
              onChange={setPlanData}
            />

            {/* Basic Program Builder */}
            {programType === 'basic' && (
             <BasicProgramBuilder
               planData={planData}
               setPlanData={setPlanData}
               libraryExercises={libraryExercises}
             />
            )}

            {/* Phase Selector (Phased Only) */}
            {programType !== 'basic' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700">Weekly Schedule</h2>

              <ProgrammeScheduleEditor
                phases={phases}
                setPhases={setPhases}
                libraryExercises={libraryExercises}
                progressionBlocks={progressionBlocks}
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
            )}

                                       <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl(patientId ? `PatientDetail?id=${patientId}` : 'CoachDashboard')}>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="button"
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportingPDF || !planData.title}
                className="rounded-xl"
              >
                {exportingPDF ? (
                  <div className="animate-spin w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleEmailPDF}
                disabled={exportingPDF || !planData.title || !patient?.email}
                className="rounded-xl"
                title={!patient?.email ? "Patient email not available" : ""}
              >
                {exportingPDF ? (
                  <div className="animate-spin w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Email PDF
              </Button>
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
                Create Plan
              </Button>
              </div>
              </>
              )}
              </form>
              </div>

        {/* AI Generator Dialog */}
        <Dialog open={showAiGenerator} onOpenChange={setShowAiGenerator}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Plan Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-500">
                The AI will create a personalized rehabilitation plan based on patient profile and condition.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Condition/Injury *</Label>
                  <Input
                    required
                    value={aiInputs.condition}
                    onChange={(e) => setAiInputs({...aiInputs, condition: e.target.value})}
                    placeholder="e.g., ACL Tear, Rotator Cuff, Lower Back Pain"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                   <Label>Injury Severity</Label>
                   <MobileSelect
                     label="Injury Severity"
                     value={aiInputs.injury_severity}
                     onChange={(e) => setAiInputs({...aiInputs, injury_severity: e.target.value})}
                     options={[
                       { value: 'mild', label: 'Mild' },
                       { value: 'moderate', label: 'Moderate' },
                       { value: 'severe', label: 'Severe' },
                     ]}
                   />
                 </div>

                <div className="space-y-2">
                  <Label>Patient Age</Label>
                  <Input
                    type="number"
                    value={aiInputs.age}
                    onChange={(e) => setAiInputs({...aiInputs, age: e.target.value})}
                    placeholder={patient?.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}` : 'Age'}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                   <Label>Activity Level</Label>
                   <MobileSelect
                     label="Activity Level"
                     value={aiInputs.activity_level}
                     onChange={(e) => setAiInputs({...aiInputs, activity_level: e.target.value})}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAiGenerator(false)}
                  disabled={generating}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={generateAiPlan}
                  disabled={generating || !aiInputs.condition}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        {/* Template Picker Dialog */}
         <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {templates.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No templates available</p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-800">{template.name}</h4>
                      {template.condition_type && (
                        <Badge variant="outline" className="text-xs">
                          {template.condition_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {template.total_phases || template.phases?.length || 0} phases
                      </div>
                      {template.estimated_duration_weeks && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.estimated_duration_weeks} weeks
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
