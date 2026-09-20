import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Layers3, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { isPractitioner } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProgressionBlockEditor from '@/components/programme/ProgressionBlockEditor';

const emptyLevel = (levelNumber = 1) => ({
  level_number: levelNumber,
  name: `Level ${levelNumber}`,
  description: '',
  exit_criteria: [],
  exercises: [],
});

const emptyForm = () => ({
  name: '',
  description: '',
  body_part: 'lower_body',
  category: 'strength',
  levels: [emptyLevel(1)],
  is_active: true,
});

export default function ProgressionBlocks() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      if (!isPractitioner(currentUser)) {
        window.location.href = createPageUrl('PatientPortal');
        return;
      }
      setUser(currentUser);
    });
  }, []);

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library', user?.clinic_id],
    queryFn: () => base44.entities.ExerciseLibrary.filter({ clinic_id: user.clinic_id }, 'name'),
    enabled: !!user?.clinic_id,
  });

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['progression-blocks', user?.clinic_id],
    queryFn: () => base44.entities.ProgressionBlock.filter({ clinic_id: user.clinic_id }, 'name'),
    enabled: !!user?.clinic_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        clinic_id: user.clinic_id,
        created_by_clinician: user.email,
        levels: form.levels.map((level, index) => ({
          ...level,
          level_number: index + 1,
          name: level.name || `Level ${index + 1}`,
        })),
      };
      return editingId
        ? base44.entities.ProgressionBlock.update(editingId, payload)
        : base44.entities.ProgressionBlock.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-blocks'] });
      setForm(emptyForm());
      setEditingId(null);
      setShowEditor(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.ProgressionBlock.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progression-blocks'] }),
  });

  const filteredBlocks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return blocks;
    return blocks.filter(block =>
      block.name?.toLowerCase().includes(term) ||
      block.description?.toLowerCase().includes(term) ||
      block.body_part?.toLowerCase().includes(term)
    );
  }, [blocks, search]);

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowEditor(true);
  };

  const startEdit = block => {
    setEditingId(block.id);
    setForm({
      name: block.name || '',
      description: block.description || '',
      body_part: block.body_part || 'lower_body',
      category: block.category || 'strength',
      levels: block.levels?.length ? JSON.parse(JSON.stringify(block.levels)) : [emptyLevel(1)],
      is_active: block.is_active !== false,
    });
    setShowEditor(true);
  };

  const duplicate = block => {
    setEditingId(null);
    setForm({
      name: `${block.name} (Copy)`,
      description: block.description || '',
      body_part: block.body_part || 'lower_body',
      category: block.category || 'strength',
      levels: JSON.parse(JSON.stringify(block.levels || [emptyLevel(1)])),
      is_active: true,
    });
    setShowEditor(true);
  };

  return (
    <div className="performance-shell min-h-screen bg-[#171719] px-4 py-6 text-zinc-100 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('ExerciseLibrary')} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff5f]">Reusable programming</p>
              <h1 className="text-2xl font-bold">Progression Blocks</h1>
              <p className="mt-1 text-sm text-zinc-400">Group exercises into criteria-led levels, then insert them into any phase or week.</p>
            </div>
          </div>
          <Button onClick={startNew} className="rounded-xl bg-[#d8ff5f] text-zinc-950 hover:bg-[#c8ef50]">
            <Plus className="mr-2 h-4 w-4" /> New progression block
          </Button>
        </div>

        {!showEditor ? (
          <>
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search progression blocks..." className="border-white/10 bg-black/20 pl-9 text-white" />
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-zinc-500">Loading progression blocks…</div>
            ) : filteredBlocks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
                <Layers3 className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
                <h2 className="font-semibold text-white">No progression blocks yet</h2>
                <p className="mt-2 text-sm text-zinc-500">Create a reusable sequence such as Calf Preparation with Level 1, Level 2 and Level 3.</p>
                <Button onClick={startNew} variant="outline" className="mt-5 rounded-xl border-white/15 bg-white/5 text-white">
                  Create your first block
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredBlocks.map(block => (
                  <article key={block.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/10">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#d8ff5f]/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-[#d8ff5f]">{block.body_part?.replace('_', ' ')}</span>
                          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-300">{block.category}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white">{block.name}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{block.description || 'No description added.'}</p>
                      </div>
                      <Layers3 className="h-5 w-5 shrink-0 text-zinc-500" />
                    </div>
                    <div className="space-y-2">
                      {(block.levels || []).map((level, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-zinc-200">{level.name || `Level ${index + 1}`}</p>
                            <p className="text-[10px] text-zinc-500">{level.exercises?.length || 0} exercises · {level.exit_criteria?.length || 0} criteria</p>
                          </div>
                          <span className="text-xs font-bold text-[#d8ff5f]">L{index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button onClick={() => startEdit(block)} size="sm" className="flex-1 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200">Edit</Button>
                      <Button onClick={() => duplicate(block)} size="icon" variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white"><Copy className="h-4 w-4" /></Button>
                      <Button onClick={() => { if (window.confirm(`Delete “${block.name}”? Existing patient plans will not be affected.`)) deleteMutation.mutate(block.id); }} size="icon" variant="outline" className="rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <ProgressionBlockEditor
            form={form}
            setForm={setForm}
            exercises={exercises}
            editingId={editingId}
            onSave={() => saveMutation.mutate()}
            onCancel={() => setShowEditor(false)}
            savePending={saveMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}