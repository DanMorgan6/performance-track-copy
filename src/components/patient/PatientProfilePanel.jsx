import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, CheckCircle, Clock, Calendar, X } from 'lucide-react';

export default function PatientProfilePanel({ patient, activePlan, user, clinic, clinician, exerciseLogs = [], patientOutcomeMeasures = [], onClose }) {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const adherenceDays = last7Days.filter(day => exerciseLogs.some(l => l.date === day)).length;

  const pendingPROMs = patientOutcomeMeasures.filter(o => o.status === 'pending').length;
  const completedPROMs = patientOutcomeMeasures.filter(o => o.status === 'completed').length;

  const initials = patient?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 md:hidden"
          aria-label="Close profile menu"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Clinic Logo / Name */}
      <div className="mb-6 pb-5 border-b border-slate-100 flex items-center justify-center min-h-[64px]">
        {clinic?.logo_url ? (
          <img
            src={clinic.logo_url}
            alt={clinic.name}
            className="max-h-14 max-w-[180px] w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <p className="text-base font-bold text-slate-800 leading-tight">{clinic?.name || 'Your Clinic'}</p>
            <p className="text-xs text-slate-400 mt-0.5">Patient Portal</p>
          </div>
        )}
      </div>

      {/* Patient Avatar + Name */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="text-slate-800 font-bold text-lg leading-tight">{patient?.full_name}</h2>
        {patient?.injury_type && (
          <p className="text-slate-500 text-sm mt-1">{patient.injury_type}</p>
        )}
      </div>

      {/* Active Plan */}
      {activePlan && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Active Plan</p>
          <p className="text-slate-800 font-semibold text-sm">{activePlan.title}</p>
          {activePlan.current_phase && (
            <p className="text-slate-500 text-xs mt-1">Phase {activePlan.current_phase}</p>
          )}
        </div>
      )}

      {/* 7-day Adherence */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">7-Day Activity</p>
        <div className="flex gap-1.5 justify-between">
          {last7Days.reverse().map((day, i) => {
            const done = exerciseLogs.some(l => l.date === day);
            return (
              <div
                key={i}
                className={`flex-1 h-8 rounded-lg ${done ? 'bg-purple-500' : 'bg-slate-200'}`}
                title={day}
              />
            );
          })}
        </div>
        <p className="text-slate-500 text-xs mt-2">{adherenceDays}/7 days active</p>
      </div>

      {/* PROMs */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Questionnaires</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-800 text-sm font-semibold">{completedPROMs}</span>
            <span className="text-slate-400 text-xs">done</span>
          </div>
          {pendingPROMs > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-slate-800 text-sm font-semibold">{pendingPROMs}</span>
              <span className="text-slate-400 text-xs">pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment */}
      {(clinician?.booking_url || clinic?.booking_url) && (
        <a
          href={clinician?.booking_url || clinic?.booking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-medium transition-all mb-3"
        >
          <Calendar className="w-4 h-4" />
          Book Appointment
        </a>
      )}

      {/* Insights Link */}
      <Link
        to={createPageUrl('PatientInsights')}
        className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition-all hover:bg-purple-100"
      >
        <TrendingUp className="w-4 h-4" />
        View Progress Insights
      </Link>

      {/* Privacy link */}
      <div className="mt-4 text-center">
        <Link to={createPageUrl('PrivacyPolicy')} className="text-xs text-slate-400 hover:text-slate-500 underline underline-offset-2">
          Privacy Policy & GDPR
        </Link>
      </div>
    </div>
  );
}