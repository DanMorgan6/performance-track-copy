import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit, Plus, Mail, Bell, StopCircle, UserX, Trash2, MoreVertical, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function PatientHeader({
  patient,
  activePlan,
  plans,
  onEdit,
  onDelete,
  onSendPortalAccess,
  onSendReminder,
  onUpdatePatient,
  onUpdatePlan,
  onSaveTemplate,
  onCleanUpPlans,
  queryClient,
}) {
  return (
    <>
      {/* Sticky top nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 h-14 flex items-center justify-between">
        <Link
          to={createPageUrl('CoachDashboard')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-xs font-semibold",
          patient.status === 'active' && "bg-emerald-100 text-emerald-700",
          patient.status === 'paused' && "bg-amber-100 text-amber-700",
          patient.status === 'completed' && "bg-blue-100 text-blue-700",
          patient.status === 'discharged' && "bg-slate-100 text-slate-600"
        )}>
          {patient.status}
        </span>
      </div>

      {/* Patient card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {patient.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
              <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">
                {patient.email}{patient.injury_type ? ` • ${patient.injury_type}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button onClick={onEdit} variant="outline" className="rounded-xl" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Link to={createPageUrl(`CreatePlan?patient_id=${patient.id}`)}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onSendPortalAccess}>
                  <Mail className="w-4 h-4 mr-2" />Send Portal Access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSendReminder('exercises')}>
                  <Bell className="w-4 h-4 mr-2" />Exercise Reminder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendReminder('pain')}>
                  <Bell className="w-4 h-4 mr-2" />Pain Log Reminder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendReminder('outcomes')}>
                  <Bell className="w-4 h-4 mr-2" />Outcome Reminder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdatePatient({ status: 'paused' })}>Pause Patient</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePatient({ status: 'completed' })}>Mark Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePatient({ status: 'discharged' })}>Discharge</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdatePatient({ status: 'active' })}>Reactivate</DropdownMenuItem>
                {activePlan && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onUpdatePlan({ id: activePlan.id, data: { status: 'completed' } })}>
                      <StopCircle className="w-4 h-4 mr-2" />Complete Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdatePlan({ id: activePlan.id, data: { status: 'paused' } })}>
                      Pause Plan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSaveTemplate}>
                      <FileText className="w-4 h-4 mr-2" />Save as Template
                    </DropdownMenuItem>
                  </>
                )}
                {plans.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onCleanUpPlans} className="text-amber-600">
                      <Trash2 className="w-4 h-4 mr-2" />Clean Up Plans
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                  <UserX className="w-4 h-4 mr-2" />Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}