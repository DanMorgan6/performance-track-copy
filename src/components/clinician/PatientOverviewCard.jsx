import React from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Send, MessageSquare, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";

export default function PatientOverviewCard({ 
  plan, 
  currentPhase, 
  activePlanPhases,
  onSendProm,
  onAddNote,
  onViewExitCriteria 
}) {
  if (!plan || !currentPhase) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
        <p className="text-slate-500">No active plan. Create one to get started.</p>
      </div>
    );
  }

  const exitCriteriaMet = currentPhase.exit_criteria?.filter(c => c.is_met).length || 0;
  const exitCriteriaTotal = currentPhase.exit_criteria?.length || 0;
  const isVisibleToPatient = plan.status === 'active';

  const daysInPhase = currentPhase.duration_weeks * 7;
  const planStartDate = new Date(plan.start_date);
  const phaseStartDate = new Date(planStartDate.getTime() + (currentPhase.phase_number - 1) * daysInPhase * 24 * 60 * 60 * 1000);
  const currentWeekNumber = Math.floor((Date.now() - phaseStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-slate-900">{plan.title}</h2>
              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                {plan.status}
              </Badge>
              {isVisibleToPatient && (
                <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Visible
                </Badge>
              )}
            </div>
            {plan.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap lg:flex-nowrap">
            <Link to={createPageUrl(`EditPlan?id=${plan.id}`)}>
              <Button variant="outline" size="sm" className="rounded-xl">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl"
              onClick={onSendProm}
            >
              <Send className="w-4 h-4 mr-1" />
              PROM
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl"
              onClick={onAddNote}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Note
            </Button>
          </div>
        </div>

        {/* Phase & Week Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Phase</p>
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {currentPhase.phase_number}/{plan.total_phases}
            </p>
            <p className="text-sm text-slate-600">{currentPhase.name}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Current Week</p>
            <p className="text-3xl font-bold text-blue-600 mb-1">{currentWeekNumber}</p>
            <p className="text-sm text-slate-600">of {currentPhase.duration_weeks} weeks</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Exit Criteria</p>
            <p className="text-3xl font-bold text-slate-800 mb-3">
              {exitCriteriaMet}/{exitCriteriaTotal}
            </p>
            <Button 
              variant="ghost"
              size="sm"
              className="text-xs text-purple-600 hover:text-purple-700 p-0 h-auto"
              onClick={onViewExitCriteria}
            >
              View Details →
            </Button>
          </div>
        </div>

        {/* Plan Duration Info */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Plan started:</span> {format(new Date(plan.start_date), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Phase repeats if needed • Patient can view current plan
          </p>
        </div>
      </div>
    </div>
  );
}