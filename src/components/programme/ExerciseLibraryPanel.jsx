import React, { useState } from 'react';
import { Search, Star, Clock, BookOpen, Layers } from 'lucide-react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const TABS = [
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'favourites', label: 'Favourites', icon: Star },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'templates', label: 'Templates', icon: Layers },
];

const BODY_PART_FILTERS = [
  { value: null, label: 'All' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'knee', label: 'Knee' },
  { value: 'hip', label: 'Hip' },
  { value: 'lower_body', label: 'Lower Body' },
  { value: 'upper_body', label: 'Upper Body' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'back', label: 'Back' },
  { value: 'neck', label: 'Neck' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full Body' },
];

const CATEGORY_FILTERS = [
  { value: null, label: 'All' },
  { value: 'strength', label: 'Strength' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'balance', label: 'Balance' },
  { value: 'stability', label: 'Stability' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'cardiovascular', label: 'Cardio' },
  { value: 'coordination', label: 'Coordination' },
  { value: 'plyometric', label: 'Plyometric' },
  { value: 'functional', label: 'Functional' },
];

export default function ExerciseLibraryPanel({ exercises = [], onAddExercise, selectedDayIndex }) {
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const filtered = exercises.filter(ex => {
    const matchesSearch =
      ex.name?.toLowerCase().includes(search.toLowerCase()) ||
      ex.category?.toLowerCase().includes(search.toLowerCase()) ||
      ex.body_part?.toLowerCase().includes(search.toLowerCase());
    const matchesBodyPart = !bodyPartFilter || ex.body_part === bodyPartFilter;
    const matchesCategory = !categoryFilter || ex.category === categoryFilter;
    return matchesSearch && matchesBodyPart && matchesCategory;
  });

  const canAdd = selectedDayIndex !== null && selectedDayIndex !== undefined;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Exercise Library</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="pl-8 h-8 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Filters */}
      {tab === 'library' && (
        <div className="px-3 pb-2 pt-2 border-b border-slate-100 space-y-1.5">
          <div className="flex gap-1 flex-wrap">
            {BODY_PART_FILTERS.map(f => (
              <button
                type="button"
                key={String(f.value)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setBodyPartFilter(bodyPartFilter === f.value ? null : f.value)}
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap",
                  bodyPartFilter === f.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-purple-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <button
                type="button"
                key={String(f.value)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCategoryFilter(categoryFilter === f.value ? null : f.value)}
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap",
                  categoryFilter === f.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {TABS.map(t => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold transition-colors",
              tab === t.id ? "text-purple-600 border-b-2 border-purple-500" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'library' && (
          <Droppable droppableId="exercise-library" isDropDisabled={true}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="p-2 space-y-1">
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    {search ? 'No exercises match your search' : 'No exercises in library'}
                  </div>
                )}
                {filtered.map((ex, index) => (
                  <Draggable key={ex.id} draggableId={`library-${ex.id}`} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={cn(
                          "group flex items-start gap-2 p-2.5 rounded-xl border transition-all cursor-grab",
                          dragSnapshot.isDragging
                            ? "bg-purple-50 border-purple-300 shadow-lg rotate-1"
                            : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 line-clamp-1">{ex.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {ex.category && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{ex.category}</span>
                            )}
                            {ex.body_part && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{ex.body_part?.replace('_', ' ')}</span>
                            )}
                          </div>
                          {ex.default_sets && (
                            <p className="text-[9px] text-slate-400 mt-0.5">{ex.default_sets} × {ex.default_reps}</p>
                          )}
                        </div>
                        {canAdd && !dragSnapshot.isDragging && (
                          <button
                            type="button"
                            onClick={() => onAddExercise(ex)}
                            className="opacity-0 group-hover:opacity-100 text-[9px] px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all whitespace-nowrap"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {tab === 'favourites' && (
          <div className="text-center py-8 text-xs text-slate-400">
            <Star className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Favourites coming soon
          </div>
        )}

        {tab === 'recent' && (
          <div className="text-center py-8 text-xs text-slate-400">
            <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
            No recent exercises yet
          </div>
        )}

        {tab === 'templates' && (
          <div className="text-center py-8 text-xs text-slate-400">
            <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
            No saved templates yet
          </div>
        )}
      </div>

      {!canAdd && (
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">Select a day above to drag or add exercises</p>
        </div>
      )}
    </div>
  );
}