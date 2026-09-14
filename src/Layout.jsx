import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Dumbbell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ClinicianBottomTabs from '@/components/mobile/ClinicianBottomTabs';
import PatientBottomTabs from '@/components/mobile/PatientBottomTabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isClinicAdmin, isPractitioner } from '@/lib/roles';
import { isTrialStatus } from '@/components/utils/subscriptionUtils';
import { createPageUrl } from '@/utils';

const clinicianNav = [
  { name: 'Dashboard', page: 'CoachDashboard', icon: LayoutDashboard },
  { name: 'Clinicians', page: 'ManageCoaches', icon: Users },
  { name: 'Exercise Library', page: 'ExerciseLibrary', icon: Dumbbell },
  { name: 'Templates', page: 'Templates', icon: FileText },
  { name: 'Outcome Measures', page: 'CreateOutcomeMeasure', icon: ClipboardCheck },
  { name: 'Analytics', page: 'ClinicianAnalytics', icon: BarChart3 },
  { name: 'Reports', page: 'Reports', icon: FileText },
  { name: 'Clinic Settings', page: 'ClinicSettings', icon: Building2 },
  { name: 'Subscription', page: 'Pricing', icon: CreditCard },
];

const patientPages = ['PatientPortal', 'PatientInsights'];

function ActivityGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-950" fill="none" aria-hidden="true">
      <path d="M3 13h4l2.2-6 4.1 11L16 11h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark({ clinic, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-[0_0_24px_rgba(216,255,95,0.22)]",
        clinic?.logo_url ? "bg-white p-1.5" : "bg-[#d8ff5f]"
      )}>
        {clinic?.logo_url ? (
          <img src={clinic.logo_url} alt="" className="h-full w-full object-contain" />
        ) : (
          <ActivityGlyph />
        )}
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-[-0.02em] text-white">
            {clinic?.name || 'Performance Track +'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Clinical rehab
          </p>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isPatient, setIsPatient] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!active) return;
        setUser(currentUser);

        if (isClinicAdmin(currentUser) && !currentUser.onboarding_completed && currentPageName !== 'ClinicOnboarding') {
          window.location.assign(createPageUrl('ClinicOnboarding'));
          return;
        }

        const onPatientPage = patientPages.includes(currentPageName);
        setIsPatient(!isPractitioner(currentUser) || onPatientPage);

        if (isPractitioner(currentUser) && currentPageName === 'Home') {
          window.location.assign(createPageUrl('CoachDashboard'));
          return;
        }

        if (currentUser.clinic_id) {
          const clinicData = await base44.entities.Clinic.filter({ id: currentUser.clinic_id });
          if (!active || clinicData.length === 0) return;
          setClinic(clinicData[0]);
          document.documentElement.style.setProperty('--brand-primary', clinicData[0].brand_color_primary || '#9333ea');
          document.documentElement.style.setProperty('--brand-secondary', clinicData[0].brand_color_secondary || '#06b6d4');
        }
      } catch {
        if (active) setIsPatient(false);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, [currentPageName]);

  const activeNavItem = useMemo(
    () => clinicianNav.find((item) => item.page === currentPageName),
    [currentPageName]
  );
  const userInitials = user?.full_name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PT';

  const showTrialWarning = Boolean(
    isTrialStatus(clinic?.subscription_status) && clinic?.trial_end_date
  );
  const trialDaysRemaining = showTrialWarning
    ? Math.ceil((new Date(clinic.trial_end_date) - new Date()) / 86400000)
    : 0;

  if (!user && currentPageName === 'Home') return <>{children}</>;

  if (user && isPatient === null) {
    return <div className="min-h-screen bg-[#171719]" />;
  }

  if (user && isPatient) {
    const showPatientNavigation = currentPageName === 'PatientInsights';

    return (
      <div className="performance-shell performance-patient-shell min-h-screen bg-[#171719] text-zinc-100">
        <main className={cn('pb-safe', showPatientNavigation && 'pb-24')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {showPatientNavigation && <PatientBottomTabs currentPageName={currentPageName} />}
      </div>
    );
  }

  return (
    <div className="performance-shell min-h-screen overflow-x-hidden bg-[#171719] text-zinc-100">
      {user && !isPatient && (
        <>
          <aside
            className={cn(
              'fixed inset-y-4 left-4 z-50 hidden flex-col overflow-hidden rounded-[30px] border border-white/10 bg-black/40 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 md:flex',
              sidebarCollapsed ? 'w-20' : 'w-[272px]'
            )}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-6">
              <Link to={createPageUrl('CoachDashboard')} aria-label="Performance Track dashboard">
                <BrandMark clinic={clinic} compact={sidebarCollapsed} />
              </Link>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className="mx-4 mb-4 rounded-2xl border border-white/[0.07] bg-[#242427] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8ff5f] text-sm font-black text-zinc-950">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{user.full_name}</p>
                    <p className="text-xs text-zinc-500">Clinician workspace</p>
                  </div>
                </div>
              </div>
            )}

            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="mx-auto mb-3 rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {showTrialWarning && trialDaysRemaining > 0 && trialDaysRemaining <= 7 && !sidebarCollapsed && (
              <div className="mx-4 mb-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="text-xs font-bold text-amber-200">Trial ending soon</p>
                <p className="mt-0.5 text-xs text-amber-100/70">{trialDaysRemaining} days remaining</p>
                <Link to={createPageUrl('ClinicSettings?tab=billing')} className="mt-2 inline-block text-xs font-semibold text-amber-200 hover:text-white">
                  Manage billing →
                </Link>
              </div>
            )}

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2" aria-label="Clinician navigation">
              {clinicianNav.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      'group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-100',
                      sidebarCollapsed && 'justify-center px-0'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#d8ff5f]" />}
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#d8ff5f]' : 'text-zinc-600 group-hover:text-zinc-300')} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/[0.07] p-4">
              <Button
                onClick={() => base44.auth.logout()}
                variant="ghost"
                className={cn('w-full rounded-xl text-zinc-500 hover:bg-red-400/10 hover:text-red-300', !sidebarCollapsed && 'justify-start')}
                title={sidebarCollapsed ? 'Logout' : undefined}
              >
                <LogOut className={cn('h-4 w-4', !sidebarCollapsed && 'mr-2')} />
                {!sidebarCollapsed && 'Logout'}
              </Button>
              {!sidebarCollapsed && (
                <Link to={createPageUrl('PrivacyPolicy')} className="mt-3 block text-center text-[11px] text-zinc-600 transition hover:text-zinc-400">
                  Privacy Policy & GDPR
                </Link>
              )}
            </div>
          </aside>

          <header
            className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#171719]/90 backdrop-blur-xl md:hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex h-16 items-center justify-between px-4">
              {currentPageName !== 'CoachDashboard' ? (
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" /> Back
                </button>
              ) : (
                <Link to={createPageUrl('CoachDashboard')}>
                  <BrandMark clinic={clinic} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-[#1d1d20] px-4 py-4 shadow-2xl">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {activeNavItem?.name || 'Menu'}
                </p>
                <nav className="space-y-1">
                  {clinicianNav.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium',
                        currentPageName === item.page ? 'bg-white/10 text-white' : 'text-zinc-400'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', currentPageName === item.page && 'text-[#d8ff5f]')} />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </header>
        </>
      )}

      {user && !isPatient && <ClinicianBottomTabs currentPageName={currentPageName} />}

      <main
        className={cn(
          'min-h-screen flex-1 transition-all duration-300',
          user && !isPatient && (sidebarCollapsed ? 'md:ml-[96px]' : 'md:ml-[304px]'),
          user && !isPatient && 'pt-16 md:pt-0'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn('min-h-screen', user && !isPatient && 'pb-24 md:pb-0')}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
