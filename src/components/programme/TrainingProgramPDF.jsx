import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BLOCK_LABEL_COLORS = {
  straight: '#6366f1',
  superset: '#7c3aed',
  circuit: '#d97706',
};

const BLOCK_BG_COLORS = {
  straight: '#f1f5f9',
  superset: '#f5f3ff',
  circuit: '#fffbeb',
};

function buildExerciseImageHtml(exercise, libraryMap) {
  const libEntry = libraryMap[exercise.name?.toLowerCase()];
  const imgUrl = libEntry?.thumbnail_url || exercise.thumbnail_url || '';
  const description = libEntry?.description || exercise.description || exercise.notes || '';

  const imgHtml = imgUrl
    ? `<img src="${imgUrl}" alt="${exercise.name}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0;" crossorigin="anonymous" onerror="this.style.display='none'" />`
    : `<div style="width:80px;height:60px;background:#e2e8f0;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;">No image</div>`;

  return imgHtml;
}

function buildBlockHtml(block, blockIndex, libraryMap) {
  const blockLabel = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[blockIndex] || String(blockIndex + 1);
  const bgColor = BLOCK_BG_COLORS[block.type] || '#f8fafc';
  const labelColor = BLOCK_LABEL_COLORS[block.type] || '#6366f1';

  const typeLabel = block.type === 'straight' ? `Block ${blockLabel}` : block.type === 'superset' ? `Superset ${blockLabel}` : `Circuit ${blockLabel}`;
  const metaChips = [
    block.rounds ? `${block.rounds} rounds` : null,
    block.rest_after ? `Rest: ${block.rest_after}` : null,
  ].filter(Boolean).map(t => `<span style="font-size:9px;background:#e2e8f0;color:#475569;padding:2px 7px;border-radius:99px;">${t}</span>`).join('');

  const exercisesHtml = (block.exercises || []).map((ex, i) => {
    const libEntry = libraryMap[ex.name?.toLowerCase()];
    const imgUrl = libEntry?.thumbnail_url || ex.thumbnail_url || '';
    const description = libEntry?.description || ex.description || ex.notes || '';

    const imgHtml = imgUrl
      ? `<img src="${imgUrl}" alt="${ex.name}" style="width:72px;height:54px;object-fit:cover;border-radius:6px;flex-shrink:0;" crossorigin="anonymous" />`
      : `<div style="width:72px;height:54px;background:#e2e8f0;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;text-align:center;padding:4px;">No image</div>`;

    const exLabel = block.type === 'straight' ? `${i + 1}` : block.type === 'superset' ? `${blockLabel}${i + 1}` : `${i + 1}`;

    const fields = [
      ex.sets ? `<span><b>Sets:</b> ${ex.sets}</span>` : null,
      ex.reps ? `<span><b>Reps:</b> ${ex.reps}</span>` : null,
      ex.weight ? `<span><b>Weight:</b> ${ex.weight}</span>` : null,
      ex.tempo ? `<span><b>Tempo:</b> ${ex.tempo}</span>` : null,
      ex.rest ? `<span><b>Rest:</b> ${ex.rest}</span>` : null,
      ex.hold ? `<span><b>Hold:</b> ${ex.hold}</span>` : null,
      ex.duration ? `<span><b>Duration:</b> ${ex.duration}</span>` : null,
    ].filter(Boolean).join('<span style="color:#cbd5e1;margin:0 4px;">|</span>');

    return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:8px;background:white;border-radius:8px;margin-bottom:6px;border:1px solid #e2e8f0;">
        ${imgHtml}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="font-size:9px;font-weight:700;background:${labelColor};color:white;width:18px;height:18px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${exLabel}</span>
            <span style="font-size:11px;font-weight:600;color:#1e293b;">${ex.name || 'Unnamed Exercise'}</span>
          </div>
          ${fields ? `<div style="font-size:9px;color:#475569;margin-bottom:4px;display:flex;flex-wrap:wrap;gap:4px;">${fields}</div>` : ''}
          ${description ? `<p style="font-size:9px;color:#64748b;margin:0;line-height:1.4;">${description.length > 160 ? description.substring(0, 160) + '…' : description}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const blockNote = block.note ? `<p style="font-size:9px;color:#64748b;font-style:italic;margin:0 0 8px 0;padding:6px 8px;background:white;border-radius:6px;border-left:3px solid ${labelColor};">${block.note}</p>` : '';

  return `
    <div style="margin-bottom:14px;background:${bgColor};border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
      <div style="padding:8px 12px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;">
        <span style="font-size:10px;font-weight:700;color:${labelColor};">${typeLabel}</span>
        ${metaChips}
      </div>
      <div style="padding:10px 10px 6px 10px;">
        ${blockNote}
        ${exercisesHtml}
      </div>
    </div>
  `;
}

function buildDayHtml(day, dayIndex, libraryMap) {
  if (!day || day.emphasis === 'rest') return '';
  const hasBlocks = (day.blocks || []).some(b => b.exercises?.length > 0);
  if (!hasBlocks) return '';

  const emphasisColors = {
    strength: '#7c3aed', rehab: '#2563eb', conditioning: '#d97706', recovery: '#059669', rest: '#94a3b8',
  };
  const emphasisColor = emphasisColors[day.emphasis] || '#6366f1';

  const metaRow = [
    day.duration ? `⏱ ${day.duration}` : null,
    day.load_target ? `🎯 ${day.load_target}` : null,
    day.emphasis ? `${day.emphasis.charAt(0).toUpperCase() + day.emphasis.slice(1)}` : null,
  ].filter(Boolean).map(t => `<span style="font-size:9px;background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:99px;">${t}</span>`).join('');

  const blocksHtml = (day.blocks || []).map((block, i) => buildBlockHtml(block, i, libraryMap)).join('');

  const noteHtml = day.session_note
    ? `<div style="margin-bottom:12px;padding:8px 10px;background:#f8fafc;border-radius:8px;border-left:3px solid ${emphasisColor};font-size:9px;color:#475569;font-style:italic;">${day.session_note}</div>`
    : '';

  return `
    <div style="margin-bottom:24px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid ${emphasisColor};">
        <div style="background:${emphasisColor};color:white;font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;">${DAY_NAMES[dayIndex]}</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;">${day.session_title || 'Training Session'}</div>
        <div style="margin-left:auto;display:flex;gap:4px;">${metaRow}</div>
      </div>
      ${noteHtml}
      ${blocksHtml}
    </div>
  `;
}

export default function TrainingProgramPDFButton({ days, phase, weekNumber, patient, libraryExercises = [] }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      // Build a lookup map from exercise name (lowercase) -> library entry
      const libraryMap = {};
      libraryExercises.forEach(ex => {
        if (ex.name) libraryMap[ex.name.toLowerCase()] = ex;
      });

      const activeDays = (days || []).filter(d => d.emphasis !== 'rest' && (d.blocks || []).some(b => b.exercises?.length > 0));

      const phaseLabel = phase?.name || 'Training Phase';
      const weekLabel = weekNumber != null ? `Week ${weekNumber + 1}` : '';
      const patientName = patient?.full_name || '';

      const daysHtml = (days || []).map((day, i) => buildDayHtml(day, i, libraryMap)).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #1e293b; padding: 32px; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #7c3aed;">
            <div>
              <h1 style="font-size:22px;font-weight:800;color:#1e293b;margin-bottom:4px;">Training Programme</h1>
              ${patientName ? `<p style="font-size:13px;color:#64748b;font-weight:500;">Athlete: ${patientName}</p>` : ''}
              <p style="font-size:12px;color:#7c3aed;font-weight:600;margin-top:2px;">${phaseLabel}${weekLabel ? ` · ${weekLabel}` : ''}</p>
            </div>
            <div style="text-align:right;">
              <p style="font-size:10px;color:#94a3b8;">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="font-size:10px;color:#94a3b8;margin-top:2px;">${activeDays.length} training day${activeDays.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <!-- Phase description -->
          ${phase?.description ? `<div style="margin-bottom:20px;padding:10px 14px;background:#f5f3ff;border-radius:8px;border-left:4px solid #7c3aed;font-size:10px;color:#4c1d95;line-height:1.5;">${phase.description}</div>` : ''}

          <!-- Days -->
          ${daysHtml || '<p style="text-align:center;color:#94a3b8;padding:40px;">No training sessions this week.</p>'}

          <!-- Footer -->
          <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
            <p style="font-size:9px;color:#94a3b8;">Performance Track +</p>
            <p style="font-size:9px;color:#94a3b8;">Confidential – for personal use only</p>
          </div>
        </body>
        </html>
      `;

      // Use a hidden iframe to trigger print/save as PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for images to load then print
      await new Promise(resolve => setTimeout(resolve, 1200));
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => document.body.removeChild(iframe), 2000);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleExport}
      disabled={generating}
      size="sm"
      variant="outline"
      className="rounded-lg text-slate-600 hover:text-purple-700 hover:border-purple-300 gap-1.5"
    >
      {generating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      <span className="text-xs">{generating ? 'Preparing…' : 'Export PDF'}</span>
    </Button>
  );
}