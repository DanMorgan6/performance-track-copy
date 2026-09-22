import React, { useEffect } from 'react';
import { Building2, LayoutDashboard, UserPlus, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TAB_STORAGE_KEY = 'clinician_bottom_tab_last_routes';

const tabs = [
  { label: 'Dashboard',  icon: LayoutDashboard, page: 'CoachDashboard',  subPages: ['PatientDetail', 'CreatePlan', 'EditPlan', 'ClinicalProfile', 'WeeklyProgrammeBuilder'] },
  { label: 'Add Patient', icon: UserPlus,        page: 'CreatePatient' },
  { label: 'Templates',  icon: FileText,        page: 'Templates',       subPages: ['CreateTemplate'] },
  { label: 'Clinic',     icon: Building2,       page: 'ClinicSettings',  subPages: ['ManageCoaches', 'Pricing'] },
];

function getSavedRoutes() {
  try {
    return JSON.parse(sessionStorage.getItem(TAB_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveRoute(label, page) {
  try {
    const saved = getSavedRoutes();
    saved[label] = page;
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

export default function ClinicianBottomTabs({ currentPageName }) {
  // Persist current page under the active tab whenever it changes
  useEffect(() => {
    const activeTab = tabs.find(
      (t) => t.page === currentPageName || (t.subPages || []).includes(currentPageName)
    );
    if (activeTab) {
      saveRoute(activeTab.label, currentPageName);
    }
  }, [currentPageName]);

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-50 flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#242427]/95 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const isActive =
          currentPageName === tab.page || (tab.subPages || []).includes(currentPageName);

        const handleClick = (e) => {
          const currentPath = window.location.pathname;
          const targetPath = createPageUrl(tab.page);

          if (currentPath === targetPath) {
            // Re-selecting the active tab root — no-op reset (already there)
            e.preventDefault();
          }
          // Otherwise the Link navigates normally to the tab root,
          // clearing any sub-stack (e.g. PatientDetail → CoachDashboard).
        };

        return (
          <Link
            key={tab.label}
            to={createPageUrl(tab.page)}
            onClick={handleClick}
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