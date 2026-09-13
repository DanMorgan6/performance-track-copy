import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isSubscriptionActive } from '@/components/utils/subscriptionUtils';

/**
 * Hook to check subscription status for current clinic
 * Blocks access if subscription is invalid
 */
export function useSubscriptionStatus() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['clinic-subscription', user?.clinic_id],
    queryFn: async () => {
      if (!user?.clinic_id) return null;
      const clinics = await base44.entities.Clinic.filter({ id: user.clinic_id });
      return clinics[0] || null;
    },
    enabled: !!user?.clinic_id,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const hasActiveSubscription = isSubscriptionActive(clinic);

  return {
    clinic,
    isLoading,
    hasActiveSubscription,
    subscriptionStatus: clinic?.subscription_status || 'unknown'
  };
}