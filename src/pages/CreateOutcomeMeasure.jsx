import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  ClipboardList,
  UploadCloud,
  Sparkles,
  Search,
  Pencil,
  Copy,
  UserPlus
} from 'lucide-react';
import { isPractitioner } from '@/lib/roles';
import AssignOutcomeMeasureDialog from "@/components/outcome/AssignOutcomeMeasureDialog";

export default function CreateOutcomeMeasure() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [saving, setSaving] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [assigningMeasure, setAssigningMeasure] = useState(null);
  const [activeTab, setActiveTab] = useState(editId ? 'create' : 'library');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [extractingData, setExtractingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [measureData, setMeasureData] = useState({
    name: '',
    condition: '',
    description: '',
    total_score_max: 100,
    interpretation_guide: '',
    questions: [
      {
        question: '',
        options: [
          { label: '', score: 0 },
          { label: '', score: 1 },
          { label: '', score: 2 }
        ]
      }
    ]
  });

  // Security: Only admins can create outcome measures
  React.useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await base44.auth.me();
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
      }
    };
    checkAccess();
  }, []);

  // Load all outcome measures for the list
  const { data: allMeasures = [] } = useQuery({
    queryKey: ['all-outcome-measures'],
    queryFn: () => base44.entities.OutcomeMeasure.list('-created_date')
  });

  const handleEdit = (measure) => {
    setMeasureData(measure);
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this outcome measure? This cannot be undone.')) return;
    setDeletingId(id);
    await base44.entities.OutcomeMeasure.delete(id);
    queryClient.invalidateQueries({ queryKey: ['all-outcome-measures'] });
    setDeletingId(null);
  };

  const handleDuplicate = async (measure) => {
    const { id, created_date, updated_date, ...rest } = measure;
    await base44.entities.OutcomeMeasure.create({ ...rest, name: `${rest.name} (Copy)` });
    queryClient.invalidateQueries({ queryKey: ['all-outcome-measures'] });
  };

  const filteredMeasures = allMeasures.filter(m =>
    m.name?.toLowerCase().includes(listSearch.toLowerCase()) ||
    m.condition?.toLowerCase().includes(listSearch.toLowerCase())
  );

  // Load existing measure if editing
  const { data: existingMeasure } = useQuery({
    queryKey: ['outcome-measure', editId],
    queryFn: async () => {
      const measures = await base44.entities.OutcomeMeasure.filter({ id: editId });
      return measures[0];
    },
    enabled: !!editId
  });

  React.useEffect(() => {
    if (existingMeasure) {
      setMeasureData(existingMeasure);
    }
  }, [existingMeasure]);

  const addQuestion = () => {
    setMeasureData({
      ...measureData,
      questions: [
        ...measureData.questions,
        {
          question: '',
          options: [
            { label: '', score: 0 },
            { label: '', score: 1 },
            { label: '', score: 2 }
          ]
        }
      ]
    });
  };

  const removeQuestion = (qIndex) => {
    setMeasureData({
      ...measureData,
      questions: measureData.questions.filter((_, i) => i !== qIndex)
    });
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...measureData.questions];
    newQuestions[qIndex][field] = value;
    setMeasureData({ ...measureData, questions: newQuestions });
  };

  const addOption = (qIndex) => {
    const newQuestions = [...measureData.questions];
    newQuestions[qIndex].options.push({ label: '', score: 0 });
    setMeasureData({ ...measureData, questions: newQuestions });
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...measureData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setMeasureData({ ...measureData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const newQuestions = [...measureData.questions];
    newQuestions[qIndex].options[oIndex][field] = field === 'score' ? parseFloat(value) : value;
    setMeasureData({ ...measureData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = await base44.auth.me();
      // Calculate total max score from all questions
      const calculatedMax = measureData.questions.reduce((sum, q) => {
        const maxOptionScore = Math.max(...q.options.map(o => o.score || 0));
        return sum + maxOptionScore;
      }, 0);

      const dataToSave = {
        ...measureData,
        clinic_id: user.clinic_id,
        total_score_max: calculatedMax
      };

      const currentId = editId || measureData.id;
      if (currentId) {
        await base44.entities.OutcomeMeasure.update(currentId, dataToSave);
      } else {
        await base44.entities.OutcomeMeasure.create(dataToSave);
      }

      queryClient.invalidateQueries({ queryKey: ['all-outcome-measures'] });
      // Reset form and go back to library
      setMeasureData({ name: '', condition: '', description: '', total_score_max: 100, interpretation_guide: '', questions: [{ question: '', options: [{ label: '', score: 0 }, { label: '', score: 1 }, { label: '', score: 2 }] }] });
      setActiveTab('library');
    } catch (error) {
      alert('Failed to save outcome measure. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 pb-28 md:pb-16 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <Link 
          to={createPageUrl('CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 mb-6 w-full grid grid-cols-2 shadow-sm">
            <TabsTrigger value="library" className="rounded-lg">
              <ClipboardList className="w-4 h-4 mr-2" />
              Saved Library
            </TabsTrigger>
            <TabsTrigger value="create" className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              {(editId || measureData.id) ? 'Edit Measure' : 'Create New'}
            </TabsTrigger>
          </TabsList>

          {/* LIBRARY TAB */}
          <TabsContent value="library">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-purple-500" />
                    Saved Outcome Measures
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">{allMeasures.length} measure{allMeasures.length !== 1 ? 's' : ''} in library</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="Search by name or condition..."
                      className="pl-9 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>

              {filteredMeasures.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{listSearch ? 'No measures match your search.' : 'No outcome measures created yet.'}</p>
                  <Button type="button" onClick={() => setActiveTab('create')} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                    Create your first measure
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                        <th className="pb-3 pr-4 font-medium">Name</th>
                        <th className="pb-3 pr-4 font-medium">Condition / Region</th>
                        <th className="pb-3 pr-4 font-medium">Questions</th>
                        <th className="pb-3 pr-4 font-medium">Max Score</th>
                        <th className="pb-3 pr-4 font-medium">Created</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredMeasures.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-800">{m.name}</p>
                            {m.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{m.description}</p>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {m.condition ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{m.condition}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{m.questions?.length || 0}</td>
                          <td className="py-3 pr-4 text-slate-600">{m.total_score_max ?? '—'}</td>
                          <td className="py-3 pr-4 text-slate-400 text-xs">
                            {m.created_date ? format(new Date(m.created_date), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button type="button" size="sm" variant="ghost" onClick={() => setAssigningMeasure(m)} className="text-slate-500 hover:text-emerald-600 rounded-lg h-8 px-2" title="Assign to Patient">
                                <UserPlus className="w-4 h-4" />
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(m)} className="text-slate-500 hover:text-purple-600 rounded-lg h-8 px-2" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => handleDuplicate(m)} className="text-slate-500 hover:text-blue-600 rounded-lg h-8 px-2" title="Duplicate">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="text-slate-500 hover:text-rose-600 rounded-lg h-8 px-2" title="Delete">
                                {deletingId === m.id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* CREATE TAB */}
          <TabsContent value="create">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              {(editId || measureData.id) ? 'Edit' : 'Create'} Outcome Measure
            </h1>
            <p className="text-slate-500 mt-1">Build custom questionnaires for patient assessment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-700">Basic Information</h2>
              
              {/* AI Document Extraction */}
              <div className="ai-extraction-light-panel space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI-Powered Document Extraction
                </p>
                <p className="text-sm text-blue-700">Upload a PDF or Word document containing an outcome measure, and AI will extract questions and scoring automatically.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="block flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!fileToUpload) {
                        alert('Please select a file first.');
                        return;
                      }
                      setExtractingData(true);
                      try {
                        const uploadResult = await base44.integrations.Core.UploadFile({ file: fileToUpload });
                        const fileUrl = uploadResult.file_url;
                        const extractionSchema = {
                          type: "object",
                          properties: {
                            name: { type: "string", description: "Name of the outcome measure" },
                            condition: { type: "string", description: "Condition this measure is for" },
                            description: { type: "string", description: "Overall description" },
                            interpretation_guide: { type: "string", description: "How to interpret scores" },
                            questions: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  question: { type: "string" },
                                  options: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        label: { type: "string" },
                                        score: { type: "number" }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        };
                        const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
                          file_url: fileUrl,
                          json_schema: extractionSchema
                        });
                        if (extractedData.status === 'success' && extractedData.output) {
                          const output = extractedData.output;
                          setMeasureData({
                            ...measureData,
                            name: output.name || measureData.name,
                            condition: output.condition || measureData.condition,
                            description: output.description || measureData.description,
                            interpretation_guide: output.interpretation_guide || measureData.interpretation_guide,
                            questions: output.questions?.length > 0 ? output.questions : measureData.questions
                          });
                          alert('✓ Outcome measure extracted successfully!');
                          setFileToUpload(null);
                        } else {
                          alert('Failed to extract data. Please ensure the document is a clear outcome measure format.');
                        }
                      } catch (error) {
                        console.error('Extraction error:', error);
                        alert('Error during extraction. Please try again.');
                      } finally {
                        setExtractingData(false);
                      }
                    }}
                    disabled={!fileToUpload || extractingData}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl whitespace-nowrap"
                  >
                    {extractingData ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Extract from Document
                      </>
                    )}
                  </Button>
                </div>

                {/* Or Search Online */}
                <div className="border-t border-blue-200 pt-4">
                  <p className="text-sm text-blue-700 mb-3">Or search online for questionnaires:</p>
                  <div className="flex items-center gap-3">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.querySelector('[data-search-button]')?.click();
                        }
                      }}
                      placeholder="e.g., 'LEFS questionnaire', 'Knee outcome measure'"
                      className="rounded-xl"
                      style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: 'rgba(30,58,95,0.25)' }}
                    />
                    <Button
                      type="button"
                      data-search-button
                      onClick={async () => {
                        if (!searchQuery.trim()) {
                          alert('Please enter a search query.');
                          return;
                        }
                        setExtractingData(true);
                        try {
                          const llmResponse = await base44.integrations.Core.InvokeLLM({
                            prompt: `Search for and provide details on the "${searchQuery}" outcome measure/questionnaire. Extract and return ONLY valid JSON with these exact fields: name (string), condition (string), description (string), interpretation_guide (string), questions (array with each item containing: question (string), options (array with each item containing: label (string) and score (number))). Ensure all score values are numbers, not strings.`,
                            add_context_from_internet: true,
                            response_json_schema: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                condition: { type: "string" },
                                description: { type: "string" },
                                interpretation_guide: { type: "string" },
                                questions: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      question: { type: "string" },
                                      options: {
                                        type: "array",
                                        items: {
                                          type: "object",
                                          properties: {
                                            label: { type: "string" },
                                            score: { type: "number" }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          });
                          if (llmResponse && llmResponse.name && llmResponse.questions?.length > 0) {
                            setMeasureData({
                              ...measureData,
                              name: llmResponse.name,
                              condition: llmResponse.condition || '',
                              description: llmResponse.description || '',
                              interpretation_guide: llmResponse.interpretation_guide || '',
                              questions: llmResponse.questions
                            });
                            alert('✓ Questionnaire found and extracted successfully!');
                            setSearchQuery('');
                          } else {
                            alert('Could not find questionnaire details. Try a different search term.');
                          }
                        } catch (error) {
                          console.error('Search error:', error);
                          alert('Error during search. Please try again.');
                        } finally {
                          setExtractingData(false);
                        }
                      }}
                      disabled={!searchQuery.trim() || extractingData}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl whitespace-nowrap"
                    >
                      {extractingData ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Search & Extract
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Measure Name *</Label>
                  <Input
                    required
                    value={measureData.name}
                    onChange={(e) => setMeasureData({...measureData, name: e.target.value})}
                    placeholder="e.g., Lower Extremity Functional Scale"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condition/Body Part</Label>
                  <Input
                    value={measureData.condition}
                    onChange={(e) => setMeasureData({...measureData, condition: e.target.value})}
                    placeholder="e.g., Knee, Lower Back"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Score (Auto-calculated)</Label>
                  <Input
                    type="number"
                    value={measureData.questions.reduce((sum, q) => {
                      const maxScore = Math.max(...q.options.map(o => o.score || 0));
                      return sum + maxScore;
                    }, 0)}
                    disabled
                    className="rounded-xl bg-slate-50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={measureData.description}
                    onChange={(e) => setMeasureData({...measureData, description: e.target.value})}
                    placeholder="Brief description of this outcome measure..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Interpretation Guide</Label>
                  <Textarea
                    value={measureData.interpretation_guide}
                    onChange={(e) => setMeasureData({...measureData, interpretation_guide: e.target.value})}
                    placeholder="How to interpret the scores (e.g., 0-30: Poor, 31-60: Fair, 61-100: Good)"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-700">Questions</h2>
                <Button 
                  type="button" 
                  onClick={addQuestion}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {measureData.questions.map((question, qIndex) => (
                <div key={qIndex} className="p-6 bg-slate-50 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Question {qIndex + 1}</Label>
                      <Textarea
                        required
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        className="rounded-xl bg-white"
                      />
                    </div>
                    {measureData.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Answer Options</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                        <div className="flex-1">
                          <Input
                            required
                            value={option.label}
                            onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)}
                            placeholder="Option text (e.g., No difficulty)"
                            className="rounded-lg"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            required
                            value={option.score}
                            onChange={(e) => updateOption(qIndex, oIndex, 'score', e.target.value)}
                            placeholder="Score"
                            className="rounded-lg"
                          />
                        </div>
                        {question.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setActiveTab('library')}>
                Cancel
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
                {(editId || measureData.id) ? 'Update' : 'Create'} Measure
              </Button>
            </div>
          </form>
          </div>
          </TabsContent>
        </Tabs>
      </div>

      <AssignOutcomeMeasureDialog
        open={!!assigningMeasure}
        onOpenChange={(val) => { if (!val) setAssigningMeasure(null); }}
        measure={assigningMeasure}
      />
    </div>
  );
}