import React from 'react';
import { LayoutDashboard, UserPlus, FileText, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'CoachDashboard' },
  { label: 'Add Patient', icon: UserPlus,       page: 'CreatePatient'  },
  { label: 'Templates', icon: FileText,         page: 'Templates'      },
  { label: 'Profile',   icon: Settings,         page: 'ClinicSettings' },
];

export default function ClinicianBottomTabs({ currentPageName }) {
  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-50 flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#242427]/95 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const isActive = currentPageName === tab.page;

        return (
          <Link
            key={tab.label}
            to={createPageUrl(tab.page)}
            className={cn(
              'relative flex min-h-[58px] flex-1 select-none flex-col items-center justify-center gap-0.5 py-2 transition-colors',
              isActive ? 'text-[#d8ff5f]' : 'text-zinc-500'
            )}
          >
            {isActive && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#d8ff5f]" />}
            <tab.icon className={cn('w-5 h-5', isActive && 'scale-110 transition-transform')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
