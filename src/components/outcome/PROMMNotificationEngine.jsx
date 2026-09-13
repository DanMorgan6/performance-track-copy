import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PROMMNotificationEngine({ patientOutcomeMeasures, outcomeMeasures }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const checkPROMs = async () => {
      const today = new Date();
      const newNotifications = [];

      for (const pom of patientOutcomeMeasures) {
        if (pom.status !== 'pending') continue;

        const measure = outcomeMeasures.find(m => m.id === pom.outcome_measure_id);
        if (!measure) continue;

        // If due_date is set, check if overdue
        if (pom.due_date) {
          const dueDate = parseISO(pom.due_date);
          const daysUntilDue = differenceInDays(dueDate, today);

          if (daysUntilDue < 0) {
            newNotifications.push({
              id: pom.id,
              type: 'overdue',
              measure: measure,
              daysOverdue: Math.abs(daysUntilDue)
            });
          } else if (daysUntilDue <= 2) {
            newNotifications.push({
              id: pom.id,
              type: 'due_soon',
              measure: measure,
              daysUntilDue
            });
          }
        } else {
          // No due_date - check if sent more than 7 days ago
          const sentDate = parseISO(pom.sent_date);
          const daysSinceSent = differenceInDays(today, sentDate);

          if (daysSinceSent > 7) {
            newNotifications.push({
              id: pom.id,
              type: 'long_pending',
              measure: measure,
              daysPending: daysSinceSent
            });
          }
        }
      }

      setNotifications(newNotifications);
    };

    checkPROMs();
  }, [patientOutcomeMeasures, outcomeMeasures]);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
            notif.type === 'overdue'
              ? 'bg-rose-50 border-rose-500'
              : notif.type === 'due_soon'
              ? 'bg-amber-50 border-amber-500'
              : 'bg-blue-50 border-blue-500'
          }`}
        >
          {notif.type === 'overdue' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className={`font-semibold ${
              notif.type === 'overdue' ? 'text-rose-900' : 'text-amber-900'
            }`}>
              {notif.type === 'overdue' && `${notif.measure.name} is ${notif.daysOverdue} days overdue`}
              {notif.type === 'due_soon' && `${notif.measure.name} due in ${notif.daysUntilDue} days`}
              {notif.type === 'long_pending' && `${notif.measure.name} pending for ${notif.daysPending} days`}
            </h4>
            <p className={`text-sm mt-1 ${
              notif.type === 'overdue' ? 'text-rose-700' : 'text-amber-700'
            }`}>
              {notif.type === 'overdue' && 'Please complete this assessment as soon as possible.'}
              {notif.type === 'due_soon' && 'Please plan to complete this soon.'}
              {notif.type === 'long_pending' && 'This questionnaire has been pending for a while.'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}