import React, { useState } from 'react';
import { GripVertical, Trash2, Copy, ChevronDown, ChevronUp, RefreshCw, Unlink, MoreVertical } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const BLOCK_STYLES = {
  straight: {
    wrapper: 'bg-slate-50 border-slate-200',
    header: 'bg-slate-100 border-slate-200',
    badge: 'bg-slate-200 text-slate-700',
    label: 'Straight Set',
  },
  superset: {
    wrapper: 'bg-violet-50 border-violet-200',
    header: 'bg-violet-100 border-violet-200',
    badge: 'bg-violet-200 text-violet-800',
    label: 'Superset',
  },
  circuit: {
    wrapper: 'bg-amber-50 border-amber-200',
    header: 'bg-amber-100 border-amber-200',
    badge: 'bg-amber-200 text-amber-800',
    label: 'Circuit',
  },
};

const BLOCK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function ExerciseRow({ exercise, index, blockType, blockLabel, onUpdate, onRemove, onDuplicate, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const label = blockType === 'straight'
    ? `${index + 1}`
    : blockType === 'superset'
    ? `${blockLabel}${index + 1}`
    : `${index + 1}`;

  return (
    <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-100 group">
      <div className="flex items-center gap-1 mt-1 flex-shrink-0">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab" />
        <span className={cn(
          "text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
          blockType === 'superset' ? 'bg-violet-200 text-violet-800' : blockType === 'circuit' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'
        )}>
          {label}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <Input
          value={exercise.name || ''}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Exercise name..."
          className="h-7 text-xs rounded-lg border-slate-200"
        />
        <div className="grid grid-cols-5 gap-1">
          {[['sets', 'Sets'], ['reps', 'Reps'], ['weight', 'Weight'], ['tempo', 'Tempo'], ['rest', 'Rest']].map(([field, label]) => (
            <div key={field} className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-medium">{label}</span>
              <Input
                value={exercise[field] || ''}
                onChange={(e) => onUpdate(field, e.target.value)}
                placeholder="—"
                className="h-6 text-[10px] px-1.5 rounded border-slate-200"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button type="button" onClick={onDuplicate} className="p-1 hover:bg-slate-100 rounded" title="Duplicate">
          <Copy className="w-3 h-3 text-slate-400" />
        </button>
        {canMoveUp && (
          <button type="button" onClick={onMoveUp} className="p-1 hover:bg-slate-100 rounded" title="Move up">
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>
        )}
        {canMoveDown && (
          <button type="button" onClick={onMoveDown} className="p-1 hover:bg-slate-100 rounded" title="Move down">
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        )}
        <button type="button" onClick={onRemove} className="p-1 hover:bg-rose-50 rounded" title="Remove">
          <Trash2 className="w-3 h-3 text-rose-400" />
        </button>
      </div>
    </div>
  );
}

export default function SessionBlock({ block, blockIndex, totalBlocks, onUpdate, onRemove, onDuplicate, onMoveUp, onMoveDown, onConvert, onUngroup }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const styles = BLOCK_STYLES[block.type] || BLOCK_STYLES.straight;
  const blockLabel = BLOCK_LETTERS[blockIndex] || String(blockIndex + 1);

  const addExercise = () => {
    onUpdate({ ...block, exercises: [...(block.exercises || []), { name: '', sets: '3', reps: '10', tempo: '', rest: '60s' }] });
  };

  const updateExercise = (exIdx, field, value) => {
    const exercises = [...(block.exercises || [])];
    exercises[exIdx] = { ...exercises[exIdx], [field]: value };
    onUpdate({ ...block, exercises });
  };

  const removeExercise = (exIdx) => {
    const exercises = (block.exercises || []).filter((_, i) => i !== exIdx);
    onUpdate({ ...block, exercises });
  };

  const duplicateExercise = (exIdx) => {
    const exercises = [...(block.exercises || [])];
    exercises.splice(exIdx + 1, 0, { ...exercises[exIdx] });
    onUpdate({ ...block, exercises });
  };

  const moveExercise = (exIdx, direction) => {
    const exercises = [...(block.exercises || [])];
    const target = exIdx + direction;
    if (target < 0 || target >= exercises.length) return;
    [exercises[exIdx], exercises[target]] = [exercises[target], exercises[exIdx]];
    onUpdate({ ...block, exercises });
  };

  const convertTypes = block.type === 'straight' ? ['superset', 'circuit'] : block.type === 'superset' ? ['straight', 'circuit'] : ['straight', 'superset'];

  return (
    <div className={cn("rounded-xl border-2 overflow-hidden", styles.wrapper)}>
      {/* Block Header */}
      <div className={cn("px-3 py-2 border-b flex items-center gap-2", styles.header)}>
        <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab flex-shrink-0" />
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", styles.badge)}>
          {block.type === 'straight' ? `${blockLabel}` : block.type === 'superset' ? `Superset ${blockLabel}` : `Circuit ${blockLabel}`}
        </span>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          {block.type === 'circuit' && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-amber-700 font-medium">Rounds:</span>
              <Input
                value={block.rounds || '3'}
                onChange={(e) => onUpdate({ ...block, rounds: e.target.value })}
                className="h-5 w-10 text-[10px] px-1 border-amber-300 bg-amber-50 rounded"
              />
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500 font-medium">Rest:</span>
            <Input
              value={block.rest_after || ''}
              onChange={(e) => onUpdate({ ...block, rest_after: e.target.value })}
              placeholder="e.g. 90s"
              className="h-5 w-14 text-[10px] px-1 border-slate-200 bg-white/70 rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-white/60 rounded">
            {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/60 rounded">
              <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-36 text-xs">
                {convertTypes.map(t => (
                  <button type="button" key={t} onClick={() => { onConvert(t); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    Convert to {t}
                  </button>
                ))}
                <button type="button" onClick={() => { onDuplicate(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2">
                  <Copy className="w-3 h-3 text-slate-400" />
                  Duplicate block
                </button>
                <button type="button" onClick={() => { onUngroup(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2">
                  <Unlink className="w-3 h-3 text-slate-400" />
                  Ungroup
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button type="button" onClick={() => { onRemove(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2">
                  <Trash2 className="w-3 h-3" />
                  Delete block
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Block note */}
          <Input
            value={block.note || ''}
            onChange={(e) => onUpdate({ ...block, note: e.target.value })}
            placeholder="Block instructions / coaching cues..."
            className="h-7 text-[10px] border-0 bg-white/50 rounded-lg"
          />

          {/* Exercises with drop zone */}
          <Droppable droppableId={`block-${blockIndex}`} isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-2 min-h-[8px] rounded-lg transition-colors",
                  snapshot.isDraggingOver && "bg-purple-50/60 ring-1 ring-purple-300 p-1"
                )}
              >
                {(block.exercises || []).map((ex, exIdx) => (
                  <ExerciseRow
                    key={exIdx}
                    exercise={ex}
                    index={exIdx}
                    blockType={block.type}
                    blockLabel={blockLabel}
                    onUpdate={(field, val) => updateExercise(exIdx, field, val)}
                    onRemove={() => removeExercise(exIdx)}
                    onDuplicate={() => duplicateExercise(exIdx)}
                    onMoveUp={() => moveExercise(exIdx, -1)}
                    onMoveDown={() => moveExercise(exIdx, 1)}
                    canMoveUp={exIdx > 0}
                    canMoveDown={exIdx < (block.exercises?.length || 0) - 1}
                  />
                ))}
                {provided.placeholder}
                {snapshot.isDraggingOver && (
                  <div className="text-[10px] text-purple-500 font-medium text-center py-1">
                    Drop to add to this block
                  </div>
                )}
              </div>
            )}
          </Droppable>

          <button
            type="button"
            onClick={addExercise}
            className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-[10px] text-slate-400 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium"
          >
            + Add Exercise to Block
          </button>
        </div>
      )}
    </div>
  );
}