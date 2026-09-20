import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ClinicalPhaseDecision({
  phase,
  plan,
  phases,
  patient,
  phaseTriggers = [],
  outcomeMeasures = [],
  onCompleted
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!phase || !plan || phase.status !== 'active') return null;

  const criteria = phase.exit_criteria || [];
  const allCriteriaMet = criteria.length > 0 && criteria.every((criterion) => criterion.is_met);
  const nextPhaseNumber = phase.phase_number + 1;
  const nextPhase = phases.find((item) => item.phase_number === nextPhaseNumber);
  const isFinalPhase = nextPhaseNumber > plan.total_phases;

  const sendTriggeredMeasures = async (triggerType, phaseNumber, notes) => {
    const triggers = phaseTriggers.filter(
      (trigger) =>
        trigger.phase_number === phaseNumber &&
        trigger.trigger_type === triggerType &&
        !trigger.triggered
    );

    for (const trigger of triggers) {
      const measure = outcomeMeasures.find((item) => item.id === trigger.outcome_measure_id);
      if (!measure) continue;

      await base44.entities.PatientOutcomeMeasure.create({
        clinic_id: patient.clinic_id,
        patient_id: patient.id,
        outcome_measure_id: trigger.outcome_measure_id,
        sent_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        frequency: 'one-time',
        notes
      });

      try {
        await base44.integrations.Core.SendEmail({
          to: patient.email,
          subject: `${measure.name} is ready to complete`,
          body: `Hi ${patient.full_name},\n\nYour practitioner has updated your rehabilitation pathway and assigned ${measure.name}.\n\nOpen your portal: ${window.location.origin}${createPageUrl('PatientPortal')}\n\nBest regards,\nYour Rehabilitation Team`
        });
      } catch (error) {
        console.warn('Outcome measure created but notification email was not sent.', error);
      }

      await base44.entities.PhaseOutcomeTrigger.update(trigger.id, {
        triggered: true,
        triggered_date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const confirmProgression = async () => {
    const trimmedReason = reason.trim();
    const isOverride = !allCriteriaMet;

    if (criteria.length === 0 && trimmedReason.length < 10) {
      setMessage('Add a clinical rationale because this phase has no exit criteria.');
      return;
    }

    if (isOverride && trimmedReason.length < 10) {
      setMessage('An override requires a clinical rationale of at least 10 characters.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const reviewer = await base44.auth.me();
      const timestamp = new Date().toISOString();

      await base44.entities.RehabPhase.update(phase.id, {
        status: 'completed',
        clinical_decision: isOverride ? 'override' : 'progress',
        clinical_decision_reason: trimmedReason || 'All recorded exit criteria met following practitioner review.',
        last_criteria_reviewed_at: timestamp,
        reviewed_by: reviewer.email
      });

      await sendTriggeredMeasures(
        'phase_complete',
        phase.phase_number,
        `Assigned following practitioner sign-off of ${phase.name}`
      );

      if (nextPhase) {
        await base44.entities.RehabPhase.update(nextPhase.id, {
          status: 'active',
          clinical_decision: 'pending'
        });

        await sendTriggeredMeasures(
          'phase_start',
          nextPhaseNumber,
          `Assigned at the start of ${nextPhase.name}`
        );
      }

      await base44.entities.RehabPlan.update(plan.id, {
        current_phase: isFinalPhase ? plan.current_phase : nextPhaseNumber,
        status: isFinalPhase ? 'completed' : 'active',
        clinical_review_required: false,
        publication_state: 'updated',
        version: (plan.version || 1) + 1,
        change_summary: isFinalPhase
          ? `${phase.name} signed off; rehabilitation plan completed.`
          : `${phase.name} signed off; progressed to ${nextPhase?.name || `phase ${nextPhaseNumber}`}.`,
        last_updated_at: timestamp
      });

      setMessage(isFinalPhase ? 'Plan completed and recorded.' : 'Phase progression recorded.');
      setReason('');
      await onCompleted?.();
    } catch (error) {
      console.error('Unable to record phase decision:', error);
      setMessage('The phase decision could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#242427] p-4">
      <div className="flex items-start gap-3">
        {allCriteriaMet ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d8ff5f]" />
        ) : (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        )}
        <div className="flex-1">
          <h4 className="font-bold text-white">
            {allCriteriaMet ? 'Ready for practitioner review' : 'Criteria remain outstanding'}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {allCriteriaMet
              ? 'Confirm the clinical decision before the next phase is unlocked.'
              : 'Progression is blocked unless you record an explicit clinical override and rationale.'}
          </p>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={allCriteriaMet
              ? 'Optional clinical decision note'
              : 'Required: explain why progression is clinically appropriate'}
            className="mt-4 min-h-20 border-white/10 bg-black/15 text-white"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500" role="status">{message}</p>
            <Button
              type="button"
              onClick={confirmProgression}
              disabled={saving}
              className={allCriteriaMet
                ? 'bg-[#d8ff5f] font-bold text-zinc-950 hover:bg-[#e4ff91]'
                : 'bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200'}
            >
              {saving
                ? 'Recording decision…'
                : isFinalPhase
                  ? 'Sign off final phase'
                  : allCriteriaMet
                    ? 'Sign off and progress'
                    : 'Override and progress'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
