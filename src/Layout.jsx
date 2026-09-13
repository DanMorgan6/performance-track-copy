import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, 
  Users, 
  Activity, 
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  UserCircle,
  ChevronLeft,
  ChevronRight,

  LayoutDashboard,
  Dumbbell,
  FileText,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  Building2,
  Settings,
  CalendarDays
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ClinicianBottomTabs from "@/components/mobile/ClinicianBottomTabs";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isPatient, setIsPatient] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Only admins/clinicians need onboarding
                if (currentUser.role === 'admin' && !currentUser.onboarding_completed && currentPageName !== 'ClinicOnboarding') {
                  window.location.href = createPageUrl('ClinicOnboarding');
                  return;
                }

                // Regular users are patients, only admins are clinicians
                // Also treat admins as patients when on patient-facing pages
                const patientPages = ['PatientPortal', 'PatientInsights'];
                const onPatientPage = patientPages.includes(currentPageName);
                setIsPatient(currentUser.role !== 'admin' || onPatientPage);

                // Redirect clinicians from Home to CoachDashboard
                if (currentUser.role === 'admin' && currentPageName === 'Home') {
                  window.location.href = createPageUrl('CoachDashboard');
                  return;
                }

        // Don't redirect patients—they handle onboarding in PatientPortal component

        // Load clinic branding
        if (currentUser.clinic_id) {
          const clinicData = await base44.entities.Clinic.filter({ id: currentUser.clinic_id });
          if (clinicData.length > 0) {
            setClinic(clinicData[0]);
            
            // Apply brand colors dynamically
            document.documentElement.style.setProperty('--brand-primary', clinicData[0].brand_color_primary || '#9333ea');
            document.documentElement.style.setProperty('--brand-secondary', clinicData[0].brand_color_secondary || '#06b6d4');
          }
        }
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, [currentPageName]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const clinicianNav = [
    { name: 'Dashboard', page: 'CoachDashboard', icon: LayoutDashboard },
    { name: 'Clinicians', page: 'ManageCoaches', icon: Users },
    { name: 'Exercise Library', page: 'ExerciseLibrary', icon: Dumbbell },
    { name: 'Templates', page: 'Templates', icon: FileText },
    { name: 'Outcome Measures', page: 'CreateOutcomeMeasure', icon: ClipboardCheck },
    { name: 'Analytics', page: 'ClinicianAnalytics', icon: BarChart3 },
    { name: 'Reports', page: 'Reports', icon: FileText },
    { name: 'Clinic Settings', page: 'ClinicSettings', icon: Building2 },
    { name: 'Subscription Management', page: 'Pricing', icon: CreditCard },
  ];

  // Check for trial/subscription warnings
  const showTrialWarning = clinic && clinic.subscription_status === 'trialing' && clinic.trial_end_date;
  const trialDaysRemaining = showTrialWarning 
    ? Math.ceil((new Date(clinic.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const navItems = clinicianNav;

  // Don't show nav on home page for non-logged in users
  if (!user && currentPageName === 'Home') {
    return <>{children}</>;
  }

  // Show loading state while determining user role
  if (user && isPatient === null) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // Don't show sidebar for patients
  if (user && isPatient === true) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Sidebar */}
      {user && !isPatient && (
        <>
          {/* Desktop Sidebar */}
          <aside className={cn(
            "hidden md:flex flex-col bg-white border-r border-slate-100 fixed h-screen transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-64"
          )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {/* Logo */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              {!sidebarCollapsed && (
                <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                  {clinic?.logo_url ? (
                    <img src={clinic.logo_url} alt={clinic.name} className="h-10 w-auto object-contain" />
                  ) : (
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6946eba1f08e607df3f62d4a/7490e353e_ChatGPTImageJan26202610_22_18PM.png" 
                      alt="Performance Track +" 
                      className="h-10 w-auto object-contain" 
                    />
                  )}
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 ml-auto"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Trial Warning Banner */}
            {showTrialWarning && trialDaysRemaining <= 7 && trialDaysRemaining > 0 && !sidebarCollapsed && (
              <div className="mx-4 mt-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-medium text-amber-900 mb-1">Trial Ending Soon</p>
                <p className="text-xs text-amber-700">{trialDaysRemaining} days remaining</p>
                <a 
                  href={createPageUrl('ClinicSettings?tab=billing')}
                  className="text-xs text-amber-800 underline mt-1 inline-block"
                >
                  Manage billing →
                </a>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors select-none",
                    currentPageName === item.page
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:bg-slate-50",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && item.name}
                </Link>
              ))}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-slate-100">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{user.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {isPatient ? 'Patient' : 'Clinician'}
                    </p>
                  </div>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className={cn("w-full rounded-xl text-slate-600", sidebarCollapsed && "px-0")}
                title={sidebarCollapsed ? "Logout" : undefined}
              >
                <LogOut className={cn("w-4 h-4", !sidebarCollapsed && "mr-2")} />
                {!sidebarCollapsed && "Logout"}
              </Button>
              {!sidebarCollapsed && (
                <div className="mt-3 text-center">
                  <Link to={createPageUrl('PrivacyPolicy')} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                    Privacy Policy & GDPR
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-50"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex justify-between items-center px-4 h-16">
              {/* Show back button on non-dashboard pages */}
              {currentPageName !== 'CoachDashboard' ? (
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-slate-600 min-h-[44px]"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Back</span>
                </button>
              ) : (
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6946eba1f08e607df3f62d4a/7490e353e_ChatGPTImageJan26202610_22_18PM.png" 
                  alt="Performance Track +" 
                  className="h-8 w-auto object-contain" 
                />
                <span className="font-semibold text-slate-800 text-sm">Performance Track +</span>
              </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="border-t border-slate-100 bg-white pb-4">
                <nav className="px-4 pt-2 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors select-none",
                        currentPageName === item.page
                          ? "bg-purple-50 text-purple-700"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="px-4 pt-4 border-t border-slate-100 mt-4">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full rounded-xl text-slate-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </header>
        </>
      )}

      {/* Clinician Bottom Tabs (mobile only) */}
      <ClinicianBottomTabs currentPageName={currentPageName} />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        user && !isPatient && sidebarCollapsed && "md:ml-20",
        user && !isPatient && !sidebarCollapsed && "md:ml-64",
        user && !isPatient && "md:pt-0 pt-16"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className={cn(
              "h-full",
              user && !isPatient && "pb-24 md:pb-0"
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
