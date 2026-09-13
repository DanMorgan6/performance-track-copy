import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Edit, Plus, MoreVertical, Mail, Bell, StopCircle, Trash2, UserX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function PatientHeader({
  patient, activePlan, plans,
  onEdit, onSendPortalAccess, onReminder, onStatusChange,
  onPlanAction, onCleanUp, onDelete,
  sendPortalPending, reminderPending, updatePatientPending, updatePlanPending,
}) {
  return (
    <>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 h-14 flex items-center justify-between shadow-sm">
        <Link
          to={createPageUrl('CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs">
            {patient.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-slate-800 hidden sm:block">{patient.full_name}</span>
        </div>
        <div className="w-24" />
      </div>

      {/* Patient card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {patient.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-slate-900">{patient.full_name}</h1>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  patient.status === 'active' && "bg-emerald-100 text-emerald-700",
                  patient.status === 'paused' && "bg-amber-100 text-amber-700",
                  patient.status === 'completed' && "bg-blue-100 text-blue-700",
                  patient.status === 'discharged' && "bg-slate-100 text-slate-600"
                )}>
                  {patient.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {patient.email}{patient.injury_type && ` • ${patient.injury_type}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            <Button onClick={onEdit} variant="outline" size="sm" className="rounded-xl text-xs">
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Link to={createPageUrl(`CreatePlan?patient_id=${patient.id}`)}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs" size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Plan
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onSendPortalAccess} disabled={sendPortalPending}>
                  <Mail className="w-4 h-4 mr-2" /> Send Portal Access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onReminder('exercises')} disabled={reminderPending}><Bell className="w-4 h-4 mr-2" /> Exercise Reminder</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReminder('pain')} disabled={reminderPending}><Bell className="w-4 h-4 mr-2" /> Pain Log Reminder</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReminder('outcomes')} disabled={reminderPending}><Bell className="w-4 h-4 mr-2" /> Outcome Reminder</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange('paused')}>Pause Patient</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('completed')}>Mark Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('discharged')}>Discharge</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('active')}>Reactivate</DropdownMenuItem>
                {activePlan && (<>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onPlanAction(activePlan.id, 'completed')}><StopCircle className="w-4 h-4 mr-2" /> Complete Plan</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPlanAction(activePlan.id, 'paused')}>Pause Plan</DropdownMenuItem>
                </>)}
                {plans?.length > 1 && (<>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onCleanUp} className="text-amber-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Clean Up Plans
                  </DropdownMenuItem>
                </>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                  <UserX className="w-4 h-4 mr-2" /> Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}