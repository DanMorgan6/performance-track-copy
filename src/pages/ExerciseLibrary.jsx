import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Play,
  Dumbbell,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ExerciseThumbnail from "@/components/exercise/ExerciseThumbnail";
import ExerciseVideoPreview from "@/components/exercise/ExerciseVideoPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SpeedometerLoader from "@/components/ui/SpeedometerLoader";
import VideoThumbnailCapture from "@/components/exercise/VideoThumbnailCapture";

export default function ExerciseLibrary() {
  // Security: Only admins can access exercise library
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bodyPartFilter, setBodyPartFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'strength',
    body_part: 'full_body',
    difficulty_level: 'beginner',
    default_sets: 3,
    default_reps: '10',
    video_url: '',
    thumbnail_url: '',
    hold: '',
    duration: '',
    weight: '',
    equipment_needed: [],
    tags: []
  });


  const [generatingDetails, setGeneratingDetails] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardEditData, setCardEditData] = useState({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [viewingExercise, setViewingExercise] = useState(null);
  const [videoModalExercise, setVideoModalExercise] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const generateExerciseDetails = async () => {
    if (!formData.name) {
      alert('Please enter an exercise name first');
      return;
    }

    setGeneratingDetails(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a physical therapist creating detailed information for this exercise: "${formData.name}"

Generate:
- description: Detailed step-by-step instructions (3-4 sentences)
- category: Choose from: strength, flexibility, balance, cardiovascular, mobility, stability, coordination, plyometric, functional
- body_part: Choose from: upper_body, lower_body, core, full_body, shoulder, knee, hip, ankle, back, neck
- difficulty_level: Choose from: beginner, intermediate, advanced
- equipment_needed: Array of equipment names (if any)
- recommended_sets: Typical number of sets (2-4)
- recommended_reps: Typical reps or duration (e.g., "10-12" or "30 seconds")`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            category: { type: "string", enum: ["strength", "flexibility", "balance", "cardiovascular", "mobility", "stability", "coordination", "plyometric", "functional"] },
            body_part: { type: "string", enum: ["upper_body", "lower_body", "core", "full_body", "shoulder", "knee", "hip", "ankle", "back", "neck"] },
            difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            equipment_needed: { type: "array", items: { type: "string" } },
            recommended_sets: { type: "number" },
            recommended_reps: { type: "string" }
          }
        }
      });

      setFormData({
        ...formData,
        description: result.description,
        category: result.category,
        body_part: result.body_part,
        difficulty_level: result.difficulty_level,
        equipment_needed: result.equipment_needed || [],
        default_sets: result.recommended_sets,
        default_reps: result.recommended_reps
      });
    } catch (error) {
      alert('Failed to generate details. Please try again.');
    } finally {
      setGeneratingDetails(false);
    }
  };

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExerciseLibrary.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExerciseLibrary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
    }
  });

  const importFromTemplatesMutation = useMutation({
    mutationFn: async () => {
      // Fetch all existing exercises once
      const existingExercises = await base44.entities.ExerciseLibrary.list();
      const existingNames = new Set(existingExercises.map(e => e.name?.toLowerCase()));
      
      // Fetch all templates
      const templates = await base44.entities.RehabTemplate.list();
      
      // Collect unique exercises to import
      const exercisesToImport = [];
      const seenNames = new Set();
      
      for (const template of templates) {
        if (template.phases) {
          for (const phase of template.phases) {
            if (phase.exercises) {
              for (const exercise of phase.exercises) {
                if (exercise.name) {
                  const nameLower = exercise.name.toLowerCase();
                  if (!existingNames.has(nameLower) && !seenNames.has(nameLower)) {
                    seenNames.add(nameLower);
                    exercisesToImport.push({
                      name: exercise.name,
                      description: exercise.description || '',
                      category: 'functional',
                      body_part: 'full_body',
                      difficulty_level: 'intermediate',
                      default_sets: exercise.sets || 3,
                      default_reps: exercise.reps || '10',
                      default_frequency: exercise.frequency || 'Daily',
                      video_url: exercise.video_url || ''
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      // Bulk create if there are exercises to import
      if (exercisesToImport.length > 0) {
        await base44.entities.ExerciseLibrary.bulkCreate(exercisesToImport);
      }
      
      return exercisesToImport.length;
    },
    onSuccess: (imported) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      alert(`Imported ${imported} new exercises from templates`);
    }
  });

  const categorizeMutation = useMutation({
    mutationFn: async () => {
      const allExercises = await base44.entities.ExerciseLibrary.list();
      
      // Process in batches to avoid rate limits
      const batchSize = 10;
      let categorized = 0;
      
      for (let i = 0; i < allExercises.length; i += batchSize) {
        const batch = allExercises.slice(i, i + batchSize);
        
        const exerciseList = batch.map(ex => ({
          id: ex.id,
          name: ex.name,
          description: ex.description || ''
        }));
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze these exercises and categorize each by the most appropriate body part. Return a JSON object mapping exercise IDs to body parts.

Available body parts: upper_body, lower_body, core, full_body, shoulder, knee, hip, ankle, back, neck

Exercises:
${JSON.stringify(exerciseList, null, 2)}

Return format: {"exercise_id": "body_part", ...}`,
          response_json_schema: {
            type: "object",
            additionalProperties: { 
              type: "string",
              enum: ["upper_body", "lower_body", "core", "full_body", "shoulder", "knee", "hip", "ankle", "back", "neck"]
            }
          }
        });
        
        // Update exercises with AI-determined body parts
        for (const [exerciseId, bodyPart] of Object.entries(result)) {
          const exercise = batch.find(ex => ex.id === exerciseId);
          if (exercise) {
            await base44.entities.ExerciseLibrary.update(exerciseId, {
              body_part: bodyPart
            });
            categorized++;
          }
        }
      }
      
      return categorized;
    },
    onSuccess: (categorized) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      alert(`Categorized ${categorized} exercises using AI`);
    },
    onError: (error) => {
      alert(`Failed to categorize: ${error.message}`);
    }
  });

  const clearLibraryMutation = useMutation({
    mutationFn: async () => {
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        const allExercises = await base44.entities.ExerciseLibrary.list();
        if (allExercises.length === 0) {
          hasMore = false;
        } else {
          for (const exercise of allExercises) {
            try {
              await base44.entities.ExerciseLibrary.delete(exercise.id);
              deleted++;
            } catch (e) {
              // Skip if already deleted
            }
          }
        }
      }
      return deleted;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      setShowClearDialog(false);
      alert(`Cleared ${deleted} exercises from the library`);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'strength',
      body_part: 'full_body',
      difficulty_level: 'beginner',
      default_sets: 3,
      default_reps: '10',
      video_url: '',
      thumbnail_url: '',
      hold: '',
      duration: '',
      weight: '',
      equipment_needed: [],
      tags: []
      });
      setEditingExercise(null);
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name || '',
      description: exercise.description || '',
      category: exercise.category || 'strength',
      body_part: exercise.body_part || 'full_body',
      difficulty_level: exercise.difficulty_level || 'beginner',
      default_sets: exercise.default_sets || 3,
      default_reps: exercise.default_reps || '10',
      video_url: exercise.video_url || '',
      thumbnail_url: exercise.thumbnail_url || '',
      hold: exercise.hold || '',
      duration: exercise.duration || '',
      weight: exercise.weight || '',
      equipment_needed: exercise.equipment_needed || [],
      tags: exercise.tags || []
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.hold) delete data.hold;
    if (!data.duration) delete data.duration;
    if (!data.weight) delete data.weight;
    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const exportExercises = () => {
    const headers = ['Name', 'Description', 'Category', 'Body Part', 'Difficulty', 'Default Sets', 'Default Reps', 'Hold', 'Duration', 'Weight', 'Video URL', 'Equipment Needed', 'Tags'];
    const escapeCsv = (val) => {
      const str = val == null ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = exercises.map(ex => [
      escapeCsv(ex.name),
      escapeCsv(ex.description),
      escapeCsv(ex.category),
      escapeCsv(ex.body_part),
      escapeCsv(ex.difficulty_level),
      escapeCsv(ex.default_sets),
      escapeCsv(ex.default_reps),
      escapeCsv(ex.hold),
      escapeCsv(ex.duration),
      escapeCsv(ex.weight),
      escapeCsv(ex.video_url),
      escapeCsv((ex.equipment_needed || []).join('; ')),
      escapeCsv((ex.tags || []).join('; '))
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exercise-library-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ex.category === categoryFilter;
    const matchesBodyPart = bodyPartFilter === 'all' || ex.body_part === bodyPartFilter;
    return matchesSearch && matchesCategory && matchesBodyPart;
  });

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Exercise Library</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Manage your exercise database</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <Button 
              onClick={() => importFromTemplatesMutation.mutate()}
              disabled={importFromTemplatesMutation.isPending}
              variant="outline"
              className="rounded-xl text-xs sm:text-sm whitespace-nowrap"
            >
              {importFromTemplatesMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
            <Button 
              onClick={() => categorizeMutation.mutate()}
              disabled={categorizeMutation.isPending}
              variant="outline"
              className="rounded-xl text-xs sm:text-sm whitespace-nowrap"
            >
              {categorizeMutation.isPending ? 'Categorizing...' : 'AI Categorize'}
            </Button>
            <Button
              onClick={exportExercises}
              disabled={exercises.length === 0}
              variant="outline"
              className="rounded-xl text-xs sm:text-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button
              onClick={() => setShowClearDialog(true)}
              disabled={clearLibraryMutation.isPending}
              variant="outline"
              className="rounded-xl text-rose-600 hover:text-rose-700 text-xs sm:text-sm whitespace-nowrap"
            >
              Clear
            </Button>
            <Button 
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-600/20 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm w-full"
            >
              <option value="all">All Categories</option>
              <option value="strength">Strength</option>
              <option value="flexibility">Flexibility</option>
              <option value="balance">Balance</option>
              <option value="cardiovascular">Cardiovascular</option>
              <option value="mobility">Mobility</option>
              <option value="stability">Stability</option>
              <option value="coordination">Coordination</option>
              <option value="plyometric">Plyometric</option>
              <option value="functional">Functional</option>
            </select>
            <select
              value={bodyPartFilter}
              onChange={(e) => setBodyPartFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm w-full"
            >
              <option value="all">All Body Parts</option>
              <option value="upper_body">Upper Body</option>
              <option value="lower_body">Lower Body</option>
              <option value="core">Core</option>
              <option value="full_body">Full Body</option>
              <option value="shoulder">Shoulder</option>
              <option value="knee">Knee</option>
              <option value="hip">Hip</option>
              <option value="ankle">Ankle</option>
              <option value="back">Back</option>
              <option value="neck">Neck</option>
            </select>
          </div>
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 mr-2">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:bg-slate-100')}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:bg-slate-100')}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center">
            <Dumbbell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">No exercises found</p>
          </div>
        ) : viewMode === 'grid' ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredExercises.map((exercise) => (
               <div 
                 key={exercise.id}
                 className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow shadow-sm cursor-pointer"
                 onClick={() => setViewingExercise(exercise)}
               >
                 <ExerciseThumbnail exercise={exercise} />
                
                <div className="p-4 lg:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2 lg:mb-3">
                    <h3 className="font-semibold text-slate-800 text-sm lg:text-base line-clamp-2 flex-1">{exercise.name}</h3>
                    <Badge className={cn("text-xs whitespace-nowrap", difficultyColors[exercise.difficulty_level])}>
                      {exercise.difficulty_level}
                    </Badge>
                  </div>

                  <p className="text-xs lg:text-sm text-slate-500 mb-3 lg:mb-4 line-clamp-2">
                    {exercise.description}
                  </p>

                  <div className="flex flex-wrap gap-1 lg:gap-2 mb-3 lg:mb-4">
                    <Badge variant="outline" className="text-xs">
                      {exercise.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exercise.body_part?.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4" onClick={(e) => editingCardId === exercise.id && e.stopPropagation()}>
                    {editingCardId === exercise.id ? (
                      <div className="grid grid-cols-2 gap-1 lg:gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500 font-medium">Sets</label>
                          <input
                            type="number"
                            min="1"
                            value={cardEditData.sets ?? exercise.default_sets}
                            onChange={(e) => setCardEditData({...cardEditData, sets: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500 font-medium">Reps</label>
                          <input
                            type="text"
                            value={cardEditData.reps ?? exercise.default_reps}
                            onChange={(e) => setCardEditData({...cardEditData, reps: e.target.value})}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => { updateMutation.mutate({ id: exercise.id, data: { default_sets: cardEditData.sets ?? exercise.default_sets, default_reps: cardEditData.reps ?? exercise.default_reps } }); setEditingCardId(null); setCardEditData({}); }} className="flex-1 rounded-lg text-xs">Save</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingCardId(null); setCardEditData({}); }} className="flex-1 rounded-lg text-xs">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs lg:text-sm text-slate-400 space-y-0.5">
                            <div>{exercise.default_sets} sets × {exercise.default_reps}</div>
                            {exercise.weight && <div className="text-blue-600">⚖️ {exercise.weight}</div>}
                            {exercise.hold && <div className="text-purple-600">⏱️ Hold: {exercise.hold}</div>}
                            {exercise.tempo && <div className="text-green-600">🔄 {exercise.tempo}</div>}
                            {exercise.duration && <div className="text-orange-600">⏳ {exercise.duration}</div>}
                          </div>
                    )}
                    </div>

                    <div className="flex gap-1 lg:gap-2 flex-wrap lg:flex-nowrap" onClick={(e) => e.stopPropagation()}>
                    {exercise.video_url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setVideoModalExercise(exercise); }}
                        className="flex-1 min-w-0 flex items-center justify-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs lg:text-sm font-medium hover:bg-purple-100 transition-colors whitespace-nowrap"
                      >
                        <Play className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline">Watch</span>
                      </button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { setEditingCardId(exercise.id); setCardEditData({}); }} className="rounded-lg p-2" title="Edit"><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { if (confirm('Delete this exercise?')) { deleteMutation.mutate(exercise.id); } }} className="rounded-lg text-rose-500 hover:text-rose-700 p-2" title="Delete"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredExercises.map((exercise, idx) => (
              <div
                key={exercise.id}
                className={cn("flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors", idx !== 0 && "border-t border-slate-100")}
                onClick={() => setViewingExercise(exercise)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  {exercise.thumbnail_url ? (
                    <img src={exercise.thumbnail_url} alt={exercise.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm">{exercise.name}</h3>
                    <Badge className={cn("text-xs", difficultyColors[exercise.difficulty_level])}>{exercise.difficulty_level}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">{exercise.category}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{exercise.body_part?.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{exercise.default_sets} sets × {exercise.default_reps}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {exercise.video_url && (
                    <button onClick={(e) => { e.stopPropagation(); setVideoModalExercise(exercise); }} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg" title="Watch video">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(exercise)} className="p-2"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete this exercise?')) { deleteMutation.mutate(exercise.id); } }} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Exercise Dialog */}
        <Dialog open={!!viewingExercise} onOpenChange={(open) => !open && setViewingExercise(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            {viewingExercise && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{viewingExercise.name}</DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={cn("text-xs", difficultyColors[viewingExercise.difficulty_level])}>
                      {viewingExercise.difficulty_level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{viewingExercise.category}</Badge>
                    <Badge variant="outline" className="text-xs">{viewingExercise.body_part?.replace('_', ' ')}</Badge>
                  </div>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  {viewingExercise.video_url && (
                    <ExerciseVideoPreview
                      videoUrl={viewingExercise.video_url}
                      exerciseName={viewingExercise.name}
                      className="h-48 rounded-xl overflow-hidden"
                    />
                  )}
                  {!viewingExercise.video_url && viewingExercise.thumbnail_url && (
                    <img src={viewingExercise.thumbnail_url} alt={viewingExercise.name} className="w-full h-48 object-cover rounded-xl" />
                  )}

                  {viewingExercise.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-1">Instructions</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{viewingExercise.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Sets</p>
                      <p className="text-lg font-bold text-slate-800">{viewingExercise.default_sets}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Reps</p>
                      <p className="text-lg font-bold text-slate-800">{viewingExercise.default_reps}</p>
                    </div>
                    {viewingExercise.hold && (
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">Hold</p>
                        <p className="text-lg font-bold text-slate-800">{viewingExercise.hold}</p>
                      </div>
                    )}
                    {viewingExercise.tempo && (
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">Tempo</p>
                        <p className="text-lg font-bold text-slate-800">{viewingExercise.tempo}</p>
                      </div>
                    )}
                    {viewingExercise.duration && (
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">Duration</p>
                        <p className="text-lg font-bold text-slate-800">{viewingExercise.duration}</p>
                      </div>
                    )}
                  </div>

                  {viewingExercise.equipment_needed?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Equipment Needed</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingExercise.equipment_needed.map((eq, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => { setViewingExercise(null); handleEdit(viewingExercise); }}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    {viewingExercise.video_url && (
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                        onClick={() => setVideoModalExercise(viewingExercise)}
                      >
                        <Play className="w-4 h-4 mr-2" /> Watch Video
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* In-App Video Modal */}
        <Dialog open={!!videoModalExercise} onOpenChange={(open) => !open && setVideoModalExercise(null)}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{videoModalExercise?.name}</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-3">
              {videoModalExercise && (
                <ExerciseVideoPreview
                  videoUrl={videoModalExercise.video_url}
                  exerciseName={videoModalExercise.name}
                  thumbnailUrl={videoModalExercise.thumbnail_url}
                  inline
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Clear Library Confirmation Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Exercise Library?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all exercises and their details from the library. This action cannot be undone.
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

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>{editingExercise ? 'Edit Exercise' : 'Add Exercise'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Exercise Name *</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Bodyweight Squat"
                    className="rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    onClick={generateExerciseDetails}
                    disabled={generatingDetails || !formData.name}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl whitespace-nowrap"
                  >
                    {generatingDetails ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Enter a name, then click AI Generate to auto-fill details</p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed instructions..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs lg:text-sm"
                  >
                    <option value="strength">Strength</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="balance">Balance</option>
                    <option value="cardiovascular">Cardiovascular</option>
                    <option value="mobility">Mobility</option>
                    <option value="stability">Stability</option>
                    <option value="coordination">Coordination</option>
                    <option value="plyometric">Plyometric</option>
                    <option value="functional">Functional</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Body Part</Label>
                  <select
                    value={formData.body_part}
                    onChange={(e) => setFormData({...formData, body_part: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs lg:text-sm"
                  >
                    <option value="full_body">Full Body</option>
                    <option value="upper_body">Upper Body</option>
                    <option value="lower_body">Lower Body</option>
                    <option value="core">Core</option>
                    <option value="shoulder">Shoulder</option>
                    <option value="knee">Knee</option>
                    <option value="hip">Hip</option>
                    <option value="ankle">Ankle</option>
                    <option value="back">Back</option>
                    <option value="neck">Neck</option>
                  </select>
                </div>

                <div className="space-y-2">
                   <Label className="text-xs lg:text-sm">Difficulty</Label>
                   <select
                     value={formData.difficulty_level}
                     onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs lg:text-sm"
                   >
                     <option value="beginner">Beginner</option>
                     <option value="intermediate">Intermediate</option>
                     <option value="advanced">Advanced</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs lg:text-sm">Default Sets</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.default_sets}
                    onChange={(e) => setFormData({...formData, default_sets: parseInt(e.target.value)})}
                    className="rounded-xl text-xs lg:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Default Reps</Label>
                  <Input
                    value={formData.default_reps}
                    onChange={(e) => setFormData({...formData, default_reps: e.target.value})}
                    placeholder="e.g., 10 or 30 seconds"
                    className="rounded-xl text-xs lg:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Hold</Label>
                  <Input
                    value={formData.hold}
                    onChange={(e) => setFormData({...formData, hold: e.target.value})}
                    placeholder="e.g., 30 seconds"
                    className="rounded-xl text-xs lg:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g., 2 minutes"
                    className="rounded-xl text-xs lg:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs lg:text-sm">Default Weight</Label>
                  <Input
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="e.g., 20kg or bodyweight"
                    className="rounded-xl text-xs lg:text-sm"
                  />
                </div>
              </div>

              {formData.video_url && (
                <VideoThumbnailCapture
                  videoUrl={formData.video_url}
                  onCapture={(url) => setFormData(prev => prev.thumbnail_url ? prev : {...prev, thumbnail_url: url})}
                />
              )}

              <div className="space-y-2">
                <Label>Video URL or Upload</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="YouTube, Vimeo, or direct video URL"
                  className="rounded-xl"
                />
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Or upload a video file:</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const maxSizeMB = 20;
                        if (file.size > maxSizeMB * 1024 * 1024) {
                         alert(`Video is too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Max size is ${maxSizeMB}MB. Please trim the video or paste a YouTube/Vimeo URL instead.`);
                         e.target.value = '';
                         return;
                        }
                        setUploadingVideo(true);
                        try {
                         const result = await base44.integrations.Core.UploadFile({ file });
                         setFormData(prev => ({...prev, video_url: result.file_url}));
                        } catch (error) {
                         alert(`Upload failed: ${error?.message || 'File may be too large. Try a YouTube or Vimeo URL instead.'}`);
                         e.target.value = '';
                        } finally {
                         setUploadingVideo(false);
                        }
                      }}
                      className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-600 file:cursor-pointer hover:file:bg-purple-100"
                    />
                    {uploadingVideo && <SpeedometerLoader label="Uploading video..." />}
                  </div>
                  <p className="text-xs text-amber-600">💡 Tip: For fastest uploads, paste a YouTube or Vimeo URL above instead of uploading a file. Max file size: 20MB.</p>
                </div>
                {formData.video_url && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-emerald-600">✓ Video linked</p>
                    <ExerciseVideoPreview 
                      videoUrl={formData.video_url} 
                      exerciseName={formData.name}
                      className="h-32"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Thumbnail URL or Upload</Label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                  placeholder="Image URL"
                  className="rounded-xl"
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Or upload an image:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadingImage(true);
                        try {
                          const result = await base44.integrations.Core.UploadFile({ file });
                          setFormData(prev => ({...prev, thumbnail_url: result.file_url}));
                        } catch (error) {
                          alert('Failed to upload image');
                        } finally {
                          setUploadingImage(false);
                        }
                      }
                    }}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-600 file:cursor-pointer hover:file:bg-purple-100"
                  />
                  {uploadingImage && <SpeedometerLoader label="Uploading image..." />}
                </div>
                {formData.thumbnail_url && (
                  <div className="mt-2">
                    <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-32 h-20 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {editingExercise ? 'Update' : 'Create'} Exercise
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}