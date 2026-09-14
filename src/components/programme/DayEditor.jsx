import React from 'react';
import { X, ClipboardList, Plus, Layers, Zap, Copy, ClipboardPaste } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import SessionBlock from './SessionBlock';
import { EMPHASIS_OPTIONS } from './DayCard';
import TrainingProgramPDFButton from './TrainingProgramPDF';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DayEditor({ day, dayIndex, phase, onUpdate, onClose, allDays, weekNumber, patient, libraryExercises, onCopyDay, onPasteDay, hasCopiedDay }) {
  if (dayIndex === null || dayIndex === undefined || !day) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
        <Layers className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">Select a day to edit</p>
        <p className="text-xs mt-1">Click any day card above to open its session editor</p>
      </div>
    );
  }

  const updateField = (field, value) => {
    onUpdate({ ...day, [field]: value });
  };

  const updateBlocks = (blocks) => {
    onUpdate({ ...day, blocks });
  };

  const addBlock = (type) => {
    const blocks = [...(day.blocks || [])];
    blocks.push({
      type,
      exercises: [{ name: '', sets: '3', reps: '10', tempo: '', rest: '60s' }],
      rest_after: '',
      rounds: type === 'circuit' ? '3' : undefined,
      note: '',
    });
    updateBlocks(blocks);
  };

  const updateBlock = (idx, updated) => {
    const blocks = [...(day.blocks || [])];
    blocks[idx] = updated;
    updateBlocks(blocks);
  };

  const removeBlock = (idx) => {
    updateBlocks((day.blocks || []).filter((_, i) => i !== idx));
  };

  const duplicateBlock = (idx) => {
    const blocks = [...(day.blocks || [])];
    const copy = JSON.parse(JSON.stringify(blocks[idx]));
    blocks.splice(idx + 1, 0, copy);
    updateBlocks(blocks);
  };

  const convertBlock = (idx, newType) => {
    const blocks = [...(day.blocks || [])];
    blocks[idx] = { ...blocks[idx], type: newType };
    updateBlocks(blocks);
  };

  const ungroupBlock = (idx) => {
    const blocks = [...(day.blocks || [])];
    const block = blocks[idx];
    const newBlocks = (block.exercises || []).map(ex => ({
      type: 'straight',
      exercises: [ex],
      rest_after: '',
      note: '',
    }));
    blocks.splice(idx, 1, ...newBlocks);
    updateBlocks(blocks);
  };

  const isRest = (day.emphasis || 'rest') === 'rest';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{DAY_NAMES[dayIndex]}</h3>
          <p className="text-[10px] text-slate-400">{phase?.name || 'No active phase'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCopyDay}
            title="Copy this day's session"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">Copy</span>
          </button>
          {hasCopiedDay && (
            <button
              type="button"
              onClick={onPasteDay}
              title="Paste copied session here"
              className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-500 hover:text-purple-700 flex items-center gap-1"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">Paste</span>
            </button>
          )}
          <TrainingProgramPDFButton
            days={allDays}
            phase={phase}
            weekNumber={weekNumber}
            patient={patient}
            libraryExercises={libraryExercises || []}
          />
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg ml-1">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Session Meta */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Session Title</label>
              <Input
                value={day.session_title || ''}
                onChange={(e) => updateField('session_title', e.target.value)}
                placeholder="e.g. Lower Body Strength"
                className="h-8 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Duration</label>
              <Input
                value={day.duration || ''}
                onChange={(e) => updateField('duration', e.target.value)}
                placeholder="e.g. 60 min"
                className="h-8 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Load Target</label>
              <Input
                value={day.load_target || ''}
                onChange={(e) => updateField('load_target', e.target.value)}
                placeholder="e.g. RPE 7–8"
                className="h-8 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Emphasis */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Day Emphasis</label>
            <div className="flex flex-wrap gap-1.5">
              {EMPHASIS_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => updateField('emphasis', opt.value)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-semibold transition-all",
                    (day.emphasis || 'rest') === opt.value
                      ? opt.color + " shadow-sm"
                      : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Note */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Clinical Notes</label>
            <textarea
              value={day.session_note || ''}
              onChange={(e) => updateField('session_note', e.target.value)}
              placeholder="Add session notes, cues, or guidance for this session..."
              rows={2}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            />
          </div>

          {/* Phase reference */}
          {phase && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl">
              <ClipboardList className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-purple-700 flex-1">Phase: <strong>{phase.name}</strong></span>
            </div>
          )}
        </div>

        {/* Session Builder */}
        {!isRest && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Session Blocks</h4>
              <span className="text-[10px] text-slate-400">{(day.blocks || []).length} block{(day.blocks || []).length !== 1 ? 's' : ''}</span>
            </div>

            {/* Blocks */}
            {(day.blocks || []).map((block, idx) => (
              <SessionBlock
                key={idx}
                block={block}
                blockIndex={idx}
                totalBlocks={(day.blocks || []).length}
                onUpdate={(updated) => updateBlock(idx, updated)}
                onRemove={() => removeBlock(idx)}
                onDuplicate={() => duplicateBlock(idx)}
                onConvert={(type) => convertBlock(idx, type)}
                onUngroup={() => ungroupBlock(idx)}
                onMoveUp={() => {
                  const blocks = [...(day.blocks || [])];
                  if (idx === 0) return;
                  [blocks[idx], blocks[idx - 1]] = [blocks[idx - 1], blocks[idx]];
                  updateBlocks(blocks);
                }}
                onMoveDown={() => {
                  const blocks = [...(day.blocks || [])];
                  if (idx === blocks.length - 1) return;
                  [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
                  updateBlocks(blocks);
                }}
              />
            ))}

            {/* Drop Zone */}
            <Droppable droppableId="day-editor-drop">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[48px] rounded-xl border-2 border-dashed transition-all flex items-center justify-center",
                    snapshot.isDraggingOver
                      ? "border-purple-400 bg-purple-50 text-purple-600"
                      : "border-slate-200 bg-slate-50/50 text-slate-400"
                  )}
                >
                  <p className="text-[10px] font-medium">
                    {snapshot.isDraggingOver ? "Drop to add exercise" : "Drag an exercise here"}
                  </p>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add Block Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => addBlock('straight')}
                className="flex flex-col items-center gap-1 py-3 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-600">S</span>
                </div>
                <span className="text-[10px] font-medium text-slate-600">Straight Set</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock('superset')}
                className="flex flex-col items-center gap-1 py-3 px-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
              >
                <div className="w-6 h-6 bg-violet-200 rounded flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-violet-700" />
                </div>
                <span className="text-[10px] font-medium text-violet-700">Superset</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock('circuit')}
                className="flex flex-col items-center gap-1 py-3 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
              >
                <div className="w-6 h-6 bg-amber-200 rounded flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <span className="text-[10px] font-medium text-amber-700">Circuit</span>
              </button>
            </div>
          </div>
        )}

        {isRest && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Recovery Guidance</label>
            <textarea
              value={day.session_note || ''}
              onChange={(e) => updateField('session_note', e.target.value)}
              placeholder="Add recovery guidance e.g. light walk, foam rolling, sleep hygiene..."
              rows={3}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}