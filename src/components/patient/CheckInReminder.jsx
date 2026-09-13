import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { MessageSquare, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CheckInReminder({ patient, clinicId, onCheckInClick }) {
  const [isDue, setIsDue] = useState(false);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    const checkIfDue = async () => {
      try {
        // Get patient schedule (with priority: patient > clinician > clinic)
        const schedules = await base44.entities.CheckInSchedule.filter({
          clinic_id: clinicId
        });

        // Priority order
        let activeSchedule = schedules.find(s => 
          s.schedule_type === 'patient' && s.patient_id === patient.id && s.enabled
        );
        
        if (!activeSchedule) {
          activeSchedule = schedules.find(s => 
            s.schedule_type === 'clinic' && s.enabled
          );
        }

        if (!activeSchedule) {
          setIsDue(false);
          return;
        }

        setSchedule(activeSchedule);

        // Check if today is a check-in day
        const today = new Date();
        const dayName = format(today, 'EEEE');
        const isDueToday = activeSchedule.days_of_week.includes(dayName);

        if (isDueToday) {
          // Check if check-in already completed today
          const todayStr = today.toISOString().split('T')[0];
          const todayNotes = await base44.entities.DailyNote.filter({
            patient_id: patient.id,
            date: todayStr
          });
          
          setIsDue(todayNotes.length === 0);
        } else {
          setIsDue(false);
        }
      } catch (error) {
        console.error('Error checking check-in due:', error);
      }
    };

    checkIfDue();
    
    // Check every hour
    const interval = setInterval(checkIfDue, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [patient.id, clinicId]);

  if (!isDue) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6 flex items-start justify-between">
      <div className="flex gap-3">
        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900">Time for Your Daily Check-In</h4>
          <p className="text-sm text-blue-700 mt-1">
            How are you feeling today? Share your mood, energy, and adherence.
          </p>
        </div>
      </div>
      <Button
        onClick={onCheckInClick}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-shrink-0"
      >
        <MessageSquare className="w-4 h-4 mr-1" />
        Check In
      </Button>
    </div>
  );
}