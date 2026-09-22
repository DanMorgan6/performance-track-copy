import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, AlertCircle, Clock3, Target } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getPhaseStatusMessage } from '@/components/plan/PhaseProgressionEngine';

export default function PhaseStatusCard({ phase, status, criteriaProgress }) {
  if (!phase) return null;

  const statusConfig = {
    active: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-700'
    },
    review_due: {
      icon: Clock3,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      border: 'border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-700'
    },
    review_ready: {
      icon: Target,
      color: 'text-lime-700',
      bg: 'bg-lime-500/10',
      border: 'border-lime-200',
      badgeClass: 'bg-lime-100 text-lime-800'
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
      border: 'border-green-200',
      badgeClass: 'bg-green-100 text-green-700'
    },
    locked: {
      icon: Lock,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-200',
      badgeClass: 'bg-slate-100 text-slate-600'
    }
  };

  const config = statusConfig[status] || statusConfig.active;
  const Icon = config.icon;

  return (
    <Card className={cn("border-2", config.border, config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800">
            {phase.name}
          </CardTitle>
          <Badge className={config.badgeClass}>
            <Icon className="w-3 h-3 mr-1" />
            {status === 'active'
              ? 'Active'
              : status === 'review_due'
                ? 'Review due'
                : status === 'review_ready'
                  ? 'Review ready'
                  : status === 'completed'
                    ? 'Completed'
                    : 'Locked'}
          </Badge>
        </div>
        {phase.description && (
          <p className="text-sm text-slate-600 mt-2">{phase.description}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Status Message */}
        {(status === 'review_due' || status === 'review_ready') && (
          <div className="flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-lg p-3 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">{getPhaseStatusMessage(phase, status)}</p>
              <p className="text-xs mt-1 text-amber-700">Only a practitioner can sign off progression to the next phase.</p>
            </div>
          </div>
        )}

        {/* Exit Criteria Progress */}
        {phase.exit_criteria && phase.exit_criteria.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Exit Criteria</span>
              <span className="text-xs font-semibold text-slate-600">
                {criteriaProgress?.completed || 0} / {criteriaProgress?.total || 0} completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  criteriaProgress?.percentage === 100 ? "bg-emerald-500" : "bg-purple-500"
                )}
                style={{ width: `${criteriaProgress?.percentage || 0}%` }}
              />
            </div>

            {/* Criteria List */}
            <div className="space-y-2">
              {phase.exit_criteria.map((criterion, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border",
                    criterion.is_met
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    criterion.is_met ? "bg-emerald-500" : "bg-slate-300"
                  )}>
                    {criterion.is_met && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      criterion.is_met ? "text-emerald-900" : "text-slate-700"
                    )}>
                      {criterion.criterion}
                    </p>
                    {criterion.target_value && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Target: {criterion.target_value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No criteria message */}
        {(!phase.exit_criteria || phase.exit_criteria.length === 0) && status !== 'locked' && (
          <p className="text-sm text-slate-500 italic">Exit criteria are required before this phase can be progressed.</p>
        )}
      </CardContent>
    </Card>
  );
}