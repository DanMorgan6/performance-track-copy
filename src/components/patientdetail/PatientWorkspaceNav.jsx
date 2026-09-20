import React from 'react';
import {
  Activity,
  ClipboardList,
  FileText,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKSPACE_GROUPS = [
  {
    id: 'summary',
    label: 'Summary',
    icon: Activity,
    tabs: [{ id: 'overview', label: 'Overview' }]
  },
  {
    id: 'programme',
    label: 'Programme',
    icon: ClipboardList,
    tabs: [
      { id: 'plan', label: 'Plan & phases' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'exercises', label: 'Exercise log' }
    ]
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    tabs: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'deepdive', label: 'Deep dive' },
      { id: 'load-recovery', label: 'Load & recovery' },
      { id: 'outcomes', label: 'PROMs' },
      { id: 'pain', label: 'Pain' }
    ]
  },
  {
    id: 'clinical-record',
    label: 'Clinical record',
    icon: FileText,
    tabs: [
      { id: 'assessments', label: 'Tests' },
      { id: 'interventions', label: 'Interventions' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'report', label: 'Progress report' },
      { id: 'reports', label: 'Documents' },
      { id: 'ai', label: 'AI notes' }
    ]
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    tabs: [{ id: 'messages', label: 'Messages' }]
  }
];

export default function PatientWorkspaceNav({ activeTab, onChange }) {
  const activeGroup = WORKSPACE_GROUPS.find((group) =>
    group.tabs.some((tab) => tab.id === activeTab)
  ) || WORKSPACE_GROUPS[0];

  const chooseGroup = (group) => {
    if (!group.tabs.some((tab) => tab.id === activeTab)) {
      onChange(group.tabs[0].id);
    }
  };

  return (
    <nav aria-label="Patient workspace" className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#242427] p-1.5">
        <div className="flex min-w-max gap-1">
          {WORKSPACE_GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = group.id === activeGroup.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => chooseGroup(group)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[#d8ff5f] text-zinc-950'
                    : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeGroup.tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 px-1">
          {activeGroup.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-[#d8ff5f]/40 bg-[#d8ff5f]/10 text-[#d8ff5f]'
                  : 'border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:text-zinc-200'
              )}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}