import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ClipboardList, 
  Users, 
  Activity, 
  ArrowRight,
  Stethoscope,
  UserCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isPatient, setIsPatient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        // New user without role - send to type selection
        if (!currentUser.role) {
          window.location.href = createPageUrl('UserTypeSelection');
          return;
        }
        
        // Redirect based on role
        if (currentUser.role === 'admin') {
          // Clinic staff - redirect to clinic dashboard
          if (!currentUser.onboarding_completed) {
            window.location.href = createPageUrl('ClinicOnboarding');
          } else {
            window.location.href = createPageUrl('CoachDashboard');
          }
          return;
        } else {
          // Patient - redirect to patient portal
          window.location.href = createPageUrl('PatientPortal');
          return;
        }
      } catch (e) {
        // Not logged in - show home page
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-purple-700 text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Rehabilitation Management System
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Personalized Recovery,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">
                Better Outcomes
              </span>
            </h1>
            
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              A comprehensive platform for clinicians to create bespoke rehabilitation plans 
              with integrated pain monitoring and phase-based recovery tracking.
            </p>

            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isPatient ? (
                  <Link to={createPageUrl('PatientPortal')}>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-purple-600/30">
                      <UserCircle className="w-5 h-5 mr-2" />
                      Go to My Portal
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl('CoachDashboard')}>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-purple-600/30">
                      <Stethoscope className="w-5 h-5 mr-2" />
                      Clinician Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-purple-600/30"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-6">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Bespoke Plans</h3>
            <p className="text-slate-500">
              Create customized rehabilitation plans with multiple phases, exercises, and specific exit criteria for each stage.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-6">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Pain Monitoring</h3>
            <p className="text-slate-500">
              Comprehensive pain tracking with detailed logs including location, type, intensity, and context for better insights.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Dual Portals</h3>
            <p className="text-slate-500">
              Separate interfaces for clinicians and patients, each tailored for their specific needs and workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400 text-sm space-y-2">
          <p>Beaches Performance + • Designed for better patient outcomes</p>
          <p>
            <Link to={createPageUrl('PrivacyPolicy')} className="text-purple-500 hover:text-purple-700 underline underline-offset-2">
              Privacy Policy & GDPR
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
