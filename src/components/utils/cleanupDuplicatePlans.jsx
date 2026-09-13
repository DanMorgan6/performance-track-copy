import { base44 } from '@/api/base44Client';

/**
 * Deletes duplicate plans for a patient, keeping only the most recent one
 */
export async function cleanupDuplicatePlans(patientId) {
  try {
    // Fetch all plans for this patient
    const plans = await base44.entities.RehabPlan.filter({ patient_id: patientId }, '-created_date');
    
    if (plans.length <= 1) {
      console.log('No duplicates to clean up');
      return { success: true, deleted: 0, message: 'No duplicates found' };
    }

    // Keep the newest one (first in descending order)
    const planToKeep = plans[0];
    const plansToDelete = plans.slice(1);

    console.log(`Deleting ${plansToDelete.length} duplicate plans, keeping plan ${planToKeep.id}`);

    // Delete all but the newest
    for (const plan of plansToDelete) {
      await base44.entities.RehabPlan.delete(plan.id);
      console.log(`Deleted plan ${plan.id}`);
    }

    return { 
      success: true, 
      deleted: plansToDelete.length,
      keptId: planToKeep.id,
      message: `Cleaned up ${plansToDelete.length} duplicate plans` 
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { success: false, error: error.message };
  }
}