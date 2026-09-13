import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getYoutubeThumbnail(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

function getExerciseImage(ex) {
  // Prefer dedicated thumbnail image
  if (ex.thumbnail_url) return ex.thumbnail_url;
  // Fall back to YouTube thumbnail extracted from video_url
  return getYoutubeThumbnail(ex.video_url);
}

function collectExercisesFromDay(day) {
  const exercises = [];
  (day.blocks || []).forEach(block => {
    (block.exercises || []).forEach(ex => { if (ex.name) exercises.push(ex); });
  });
  (day.exercises || []).forEach(ex => { if (ex.name) exercises.push(ex); });
  return exercises;
}

function collectAllExercisesFromTemplate(template) {
  const seen = new Set();
  const result = [];
  (template.phases || []).forEach(phase => {
    (phase.weeks || []).forEach(week => {
      (week.daily_schedule || []).forEach(day => {
        collectExercisesFromDay(day).forEach(ex => {
          if (ex.name && !seen.has(ex.name)) {
            seen.add(ex.name);
            result.push(ex);
          }
        });
      });
    });
    // Also legacy exercises on phase
    (phase.exercises || []).forEach(ex => {
      if (ex.name && !seen.has(ex.name)) {
        seen.add(ex.name);
        result.push(ex);
      }
    });
  });
  return result;
}

function renderExerciseLibrarySection(exercises, libraryMap) {
  if (!exercises.length) return '';
  return `
    <div class="section-header">Exercise Library</div>
    <div class="ex-grid">
      ${exercises.map(ex => {
        // Merge with full library record to get thumbnail_url and description
        const libRecord = libraryMap[ex.name] || {};
        const merged = { ...libRecord, ...ex };
        const imgUrl = getExerciseImage(merged);
        const description = libRecord.description || ex.description || '';
        const params = [
          ex.sets ? `${ex.sets} sets` : null,
          ex.reps ? `${ex.reps} reps` : null,
          ex.weight ? `Load: ${ex.weight}` : null,
          ex.tempo ? `Tempo: ${ex.tempo}` : null,
          ex.rest ? `Rest: ${ex.rest}` : null,
          ex.hold ? `Hold: ${ex.hold}` : null,
        ].filter(Boolean).join(' · ');

        return `
          <div class="ex-card">
            <div class="ex-img-wrap">
              ${imgUrl
                ? `<img src="${imgUrl}" class="ex-img" alt="${ex.name}" />`
                : `<div class="ex-img-placeholder">${ex.name.substring(0, 2).toUpperCase()}</div>`}
            </div>
            <div class="ex-info">
              <div class="ex-name">${ex.name}</div>
              ${params ? `<div class="ex-params">${params}</div>` : ''}
              ${description ? `<div class="ex-desc">${description}</div>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderBlockLabel(block) {
  const type = (block.type || 'straight').toLowerCase();
  const parts = [];
  if (type === 'superset') parts.push('Superset');
  else if (type === 'circuit') parts.push('Circuit');
  if (block.rounds) parts.push(`${block.rounds} rounds`);
  if (block.rest_after) parts.push(`Rest: ${block.rest_after}`);
  return parts.join(' · ');
}

function renderWeekGrid(week, wi) {
  const days = DAYS.map(dayName => {
    const saved = (week.daily_schedule || []).find(d => d.day === dayName);
    return saved || { day: dayName, emphasis: 'rest', blocks: [], exercises: [] };
  });

  return `
    <div class="week-block">
      <h4 class="week-title">Week ${wi + 1}</h4>
      <div class="days-grid">
        ${days.map(day => {
          const isRest = (day.emphasis || day.type) === 'rest';
          const blocks = day.blocks || [];
          const legacyExercises = (day.exercises || []).filter(ex => ex.name);
          const hasContent = blocks.some(b => (b.exercises || []).length > 0) || legacyExercises.length > 0;

          let contentHTML = '';
          if (!isRest && hasContent) {
            if (blocks.some(b => (b.exercises || []).length > 0)) {
              // Block-based format — render each block once with its label
              blocks.forEach(block => {
                const exs = (block.exercises || []).filter(ex => ex.name);
                if (!exs.length) return;
                const label = renderBlockLabel(block);
                contentHTML += label ? `<div class="block-label">${label}</div>` : '';
                contentHTML += `<ul class="day-ex-list">`;
                exs.forEach(ex => {
                  const meta = [
                    ex.sets ? `${ex.sets}×${ex.reps || ''}` : null,
                    ex.weight ? ex.weight : null,
                    ex.tempo ? `T:${ex.tempo}` : null,
                    ex.rest ? `R:${ex.rest}` : null,
                    ex.hold ? `Hold:${ex.hold}` : null,
                  ].filter(Boolean).join(' ');
                  contentHTML += `<li>${ex.name}${meta ? ` <span class="ex-mini">${meta}</span>` : ''}</li>`;
                });
                contentHTML += `</ul>`;
              });
            } else {
              // Legacy exercises only (no blocks)
              contentHTML += `<ul class="day-ex-list">`;
              legacyExercises.forEach(ex => {
                contentHTML += `<li>${ex.name}${ex.sets ? ` <span class="ex-mini">${ex.sets}×${ex.reps || ''}</span>` : ''}</li>`;
              });
              contentHTML += `</ul>`;
            }
          }

          return `
            <div class="day-col ${isRest ? 'day-rest' : ''}">
              <div class="day-col-header">${day.day.substring(0, 3)}</div>
              ${day.session_title ? `<div class="day-session-title">${day.session_title}</div>` : ''}
              ${day.duration ? `<div class="day-duration">${day.duration}</div>` : ''}
              ${isRest
                ? `<div class="day-rest-label">Rest</div>`
                : hasContent
                  ? contentHTML
                  : `<div class="day-rest-label">—</div>`
              }
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function buildHTML(template, libraryExercises = []) {
  const phases = template.phases || [];
  const allExercises = collectAllExercisesFromTemplate(template);
  // Build a name→record map from the full library for image/description lookup
  const libraryMap = {};
  libraryExercises.forEach(ex => { if (ex.name) libraryMap[ex.name] = ex; });

  const phasesHTML = phases.map((phase, pi) => {
    const criteria = (phase.exit_criteria || []).filter(c => c.criterion);
    const weeksHTML = (phase.weeks || []).map((week, wi) => renderWeekGrid(week, wi)).join('');

    return `
      <div class="phase-block">
        <div class="phase-header">
          <span class="phase-title">Phase ${pi + 1}: ${phase.name || ''}</span>
          <span class="phase-meta">${phase.duration_weeks || 0} week${phase.duration_weeks !== 1 ? 's' : ''}</span>
        </div>
        ${phase.description ? `<p class="phase-desc">${phase.description}</p>` : ''}
        ${criteria.length > 0 ? `
          <div class="criteria-block">
            <strong>Exit Criteria:</strong>
            <ul>${criteria.map(c => `<li>${c.criterion}${c.target_value ? ` — ${c.target_value}` : ''}</li>`).join('')}</ul>
          </div>` : ''}
        ${weeksHTML}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${template.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; padding: 24px; max-width: 960px; margin: 0 auto; }
  h1 { font-size: 20px; font-weight: bold; color: #7c3aed; margin-bottom: 4px; }
  .top-meta { font-size: 10px; color: #64748b; margin-bottom: 6px; }
  .top-desc { font-size: 11px; color: #475569; margin-bottom: 20px; border-left: 3px solid #7c3aed; padding-left: 10px; line-height: 1.5; }

  /* Section header */
  .section-header { font-size: 13px; font-weight: bold; color: #334155; border-bottom: 2px solid #7c3aed; padding-bottom: 4px; margin: 20px 0 12px; }

  /* Exercise library grid */
  .ex-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
  .ex-card { display: flex; gap: 10px; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px; background: #fff; align-items: flex-start; page-break-inside: avoid; }
  .ex-img-wrap { flex-shrink: 0; width: 90px; height: 64px; border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0; }
  .ex-img { width: 90px; height: 64px; object-fit: cover; display: block; }
  .ex-img-placeholder { width: 90px; height: 64px; background: #ede9fe; display: flex; align-items: center; justify-content: center; color: #7c3aed; font-size: 13px; font-weight: bold; }
  .ex-info { flex: 1; min-width: 0; }
  .ex-name { font-size: 10px; font-weight: 600; color: #1e293b; margin-bottom: 3px; line-height: 1.3; }
  .ex-params { font-size: 8.5px; color: #7c3aed; margin-bottom: 2px; }
  .ex-desc { font-size: 8px; color: #64748b; line-height: 1.4; margin-top: 2px; }

  /* Phase */
  .phase-block { margin-bottom: 28px; page-break-inside: avoid; }
  .phase-header { background: #7c3aed; color: white; padding: 7px 14px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .phase-title { font-size: 12px; font-weight: bold; }
  .phase-meta { font-size: 10px; opacity: 0.85; }
  .phase-desc { font-size: 10px; color: #475569; margin-bottom: 8px; font-style: italic; line-height: 1.5; }
  .criteria-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 12px; margin-bottom: 12px; font-size: 9.5px; }
  .criteria-block ul { margin-left: 14px; margin-top: 3px; line-height: 1.6; }

  /* Week / 7-column grid */
  .week-block { margin-bottom: 14px; }
  .week-title { font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
  .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .day-col { border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 5px; font-size: 8.5px; background: #fff; min-height: 60px; }
  .day-col.day-rest { background: #f8fafc; }
  .day-col-header { font-weight: bold; font-size: 9px; color: #7c3aed; margin-bottom: 3px; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; }
  .day-session-title { font-size: 7.5px; color: #64748b; font-style: italic; margin-bottom: 3px; }
  .day-rest-label { font-size: 8px; color: #94a3b8; font-style: italic; margin-top: 4px; }
  .day-ex-list { list-style: none; padding: 0; margin: 0 0 4px 0; }
  .day-ex-list li { font-size: 8px; color: #334155; padding: 1px 0; border-bottom: 1px dotted #f1f5f9; line-height: 1.4; }
  .ex-mini { color: #7c3aed; font-size: 7.5px; }
  .block-label { font-size: 7.5px; font-weight: bold; color: #7c3aed; background: #ede9fe; border-radius: 3px; padding: 1px 4px; margin: 3px 0 2px; display: inline-block; }
  .day-duration { font-size: 7.5px; color: #64748b; margin-bottom: 2px; }

  @media print {
    body { padding: 12px; }
    .phase-block { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>${template.name}</h1>
  <div class="top-meta">
    ${template.condition_type ? `Condition: ${template.condition_type} &nbsp;|&nbsp; ` : ''}
    ${phases.length} phase${phases.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
    ${template.estimated_duration_weeks || 0} weeks total
    ${template.is_public ? ' &nbsp;|&nbsp; Public Template' : ''}
  </div>
  ${template.description ? `<div class="top-desc">${template.description}</div>` : ''}

  ${renderExerciseLibrarySection(allExercises, libraryMap)}

  <div class="section-header">Weekly Schedule</div>
  ${phasesHTML}
</body>
</html>`;
}

export default function TemplatePDFExport({ template, libraryExercises = [] }) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    const html = buildHTML(template, libraryExercises);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        setLoading(false);
      }, 1000);
    }, 800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="rounded-lg"
      title="Export as PDF"
    >
      <FileDown className="w-4 h-4" />
    </Button>
  );
}