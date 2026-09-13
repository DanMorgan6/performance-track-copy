import React, { useEffect } from 'react';
import { LayoutDashboard, Calendar, TrendingUp, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TAB_STORAGE_KEY = 'patient_bottom_tab_last_routes';

const tabs = [
  { label: 'Home',      icon: LayoutDashboard, page: 'PatientPortal',  portalTab: 'dashboard' },
  { label: 'Calendar',  icon: Calendar,         page: 'PatientPortal',  portalTab: 'month'     },
  { label: 'Insights',  icon: TrendingUp,       page: 'PatientInsights' },
  { label: 'Settings',  icon: Settings,         page: 'PrivacyPolicy'  },
];

function getSavedRoutes() {
  try {
    return JSON.parse(sessionStorage.getItem(TAB_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveRoute(label, tab) {
  try {
    const saved = getSavedRoutes();
    saved[label] = tab;
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

export default function PatientBottomTabs({ currentPageName, onTabChange, activeTab }) {
  // Persist current tab whenever activeTab or page changes
  useEffect(() => {
    if (currentPageName === 'PatientPortal' && activeTab) {
      if (activeTab === 'month') {
        saveRoute('Calendar', 'month');
      } else {
        saveRoute('Home', activeTab);
      }
    }
  }, [activeTab, currentPageName]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const isCalendar = tab.portalTab === 'month';
        const isActive = isCalendar
          ? currentPageName === 'PatientPortal' && activeTab === 'month'
          : tab.portalTab
          ? currentPageName === 'PatientPortal' && activeTab !== 'month'
          : currentPageName === tab.page;

        const handleClick = (e) => {
          const currentPath = window.location.pathname;
          const targetPath = createPageUrl(tab.page);

          if (currentPath === targetPath) {
            e.preventDefault();
            // Restore last visited sub-tab or fall back to default
            const saved = getSavedRoutes();
            if (isCalendar) {
              onTabChange?.('month');
            } else if (tab.portalTab) {
              onTabChange?.(saved['Home'] || 'dashboard');
            }
          } else if (tab.portalTab) {
            // Navigating to PatientPortal from another page — restore saved tab
            const saved = getSavedRoutes();
            const restore = isCalendar ? 'month' : (saved['Home'] || 'dashboard');
            // Pass via sessionStorage so PatientPortal can pick it up on mount
            try { sessionStorage.setItem('portal_restore_tab', restore); } catch {}
          }
        };

        return (
          <Link
            key={tab.label}
            to={createPageUrl(tab.page)}
            onClick={handleClick}
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