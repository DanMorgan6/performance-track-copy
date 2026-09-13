import React from 'react';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'CoachDashboard' },
  { label: 'Patients',  icon: Users,           page: 'CoachDashboard' },
  { label: 'Templates', icon: FileText,         page: 'Templates'      },
  { label: 'Profile',   icon: Settings,         page: 'ClinicSettings' },
];

export default function ClinicianBottomTabs({ currentPageName }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const isActive = currentPageName === tab.page;

        return (
          <Link
            key={tab.label}
            to={createPageUrl(tab.page)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 select-none transition-colors min-h-[56px]',
              isActive ? 'text-purple-600' : 'text-slate-400'
            )}
          >
            <tab.icon className={cn('w-5 h-5', isActive && 'scale-110 transition-transform')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}