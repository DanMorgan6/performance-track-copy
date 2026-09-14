import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CheckInScheduleConfig({ clinicId, patientId = null, clinicianEmail = null }) {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState({
    days_of_week: ['Monday', 'Wednesday', 'Friday'],
    time_of_day: '09:00',
    enabled: true
  });
  const [saving, setSaving] = useState(false);

  const scheduleType = patientId ? 'patient' : clinicianEmail ? 'clinician' : 'clinic';

  const { data: existingSchedule } = useQuery({
    queryKey: ['check-in-schedule', scheduleType, patientId, clinicianEmail],
    queryFn: async () => {
      const filters = { clinic_id: clinicId, schedule_type: scheduleType };
      if (patientId) filters.patient_id = patientId;
      if (clinicianEmail) filters.clinician_email = clinicianEmail;
      
      const result = await base44.entities.CheckInSchedule.filter(filters);
      if (result.length > 0) {
        setSchedule(result[0]);
        return result[0];
      }
      return null;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckInSchedule.create({
      ...data,
      clinic_id: clinicId,
      schedule_type: scheduleType,
      ...(patientId && { patient_id: patientId }),
      ...(clinicianEmail && { clinician_email: clinicianEmail })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-in-schedule'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckInSchedule.update(schedule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-in-schedule'] });
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (schedule.id) {
        await updateMutation.mutateAsync(schedule);
      } else {
        await createMutation.mutateAsync(schedule);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    const updated = schedule.days_of_week.includes(day)
      ? schedule.days_of_week.filter(d => d !== day)
      : [...schedule.days_of_week, day];
    setSchedule({ ...schedule, days_of_week: updated });
  };

  return (
    <div className="space-y-6 bg-white rounded-2xl p-6 border border-slate-100">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {scheduleType === 'clinic' && 'Clinic Check-in Schedule'}
          {scheduleType === 'clinician' && 'Clinician Check-in Preference'}
          {scheduleType === 'patient' && 'Patient Check-in Schedule Override'}
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          {scheduleType === 'clinic' && 'Default check-in schedule for all patients'}
          {scheduleType === 'clinician' && 'Override clinic default for your patients'}
          {scheduleType === 'patient' && 'Custom schedule for this specific patient'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-3 block">Days of Week</Label>
          <div className="grid grid-cols-2 gap-3">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-2">
                <Checkbox
                  checked={schedule.days_of_week.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                  id={`day-${day}`}
                />
                <label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                  {day}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="time">Preferred Time</Label>
          <Input
            id="time"
            type="time"
            value={schedule.time_of_day}
            onChange={(e) => setSchedule({ ...schedule, time_of_day: e.target.value })}
            className="rounded-xl mt-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={schedule.enabled}
            onCheckedChange={(enabled) => setSchedule({ ...schedule, enabled })}
            id="enabled"
          />
          <label htmlFor="enabled" className="text-sm cursor-pointer">
            Enable check-in reminders
          </label>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || schedule.days_of_week.length === 0}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Schedule
      </Button>
    </div>
  );
}