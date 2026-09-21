import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@22.4.0';

const PRACTITIONER_ROLES = new Set(['admin', 'clinic_admin', 'clinician']);
const MAX_SELF_SERVICE_PRACTITIONERS = 10;

function getRole(user: Record<string, unknown>) {
  return String(user?._app_role || user?.role || '');
}

function tierForCount(count: number) {
  if (count > MAX_SELF_SERVICE_PRACTITIONERS) {
    return { priceId: null, monthlyPricePence: null, tier: 'managed' };
  }
  return count <= 5
    ? {
        priceId: Deno.env.get('STRIPE_CLINIC_PRICE_ID'),
        monthlyPricePence: 3000,
        tier: 'clinic',
      }
    : {
        priceId: Deno.env.get('STRIPE_CLINIC_PLUS_PRICE_ID'),
        monthlyPricePence: 4500,
        tier: 'clinic_plus',
      };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.clinic_id || !PRACTITIONER_ROLES.has(getRole(user))) {
      return Response.json({ error: 'Clinic practitioner access required' }, { status: 403 });
    }

    const clinicId = user.clinic_id;
    const clinics = await base44.asServiceRole.entities.Clinic.filter({ id: clinicId });
    const clinic = clinics[0];
    if (!clinic) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicUsers = await base44.asServiceRole.entities.User.filter({ clinic_id: clinicId });
    const practitionerCount = Math.max(
      1,
      clinicUsers.filter((member: Record<string, unknown>) => PRACTITIONER_ROLES.has(getRole(member))).length,
    );
    const tier = tierForCount(practitionerCount);

    if (tier.tier === 'managed') {
      await base44.asServiceRole.entities.Clinic.update(clinicId, {
        clinician_seat_count: practitionerCount,
      });
      return Response.json({
        success: true,
        changed: false,
        requires_managed_plan: true,
        practitioner_count: practitionerCount,
      });
    }

    let stripeChanged = false;
    if (clinic.stripe_subscription_id) {
      if (!tier.priceId) {
        return Response.json(
          { error: 'The Stripe price for this clinic tier is not configured.' },
          { status: 503 },
        );
      }

      const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!secretKey) {
        return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
      }

      const stripe = new Stripe(secretKey);
      const subscription = await stripe.subscriptions.retrieve(clinic.stripe_subscription_id);
      const subscriptionItem = subscription.items.data[0];
      if (!subscriptionItem) {
        return Response.json({ error: 'Subscription has no billable item' }, { status: 409 });
      }

      if (subscriptionItem.price.id !== tier.priceId) {
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: subscriptionItem.id, price: tier.priceId, quantity: 1 }],
          proration_behavior: 'create_prorations',
          metadata: {
            clinic_id: clinicId,
            seat_count: String(practitionerCount),
            tier: tier.tier,
          },
        });
        stripeChanged = true;
      } else if (subscription.metadata?.seat_count !== String(practitionerCount)) {
        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            clinic_id: clinicId,
            seat_count: String(practitionerCount),
            tier: tier.tier,
          },
        });
      }
    }

    await base44.asServiceRole.entities.Clinic.update(clinicId, {
      clinician_seat_count: practitionerCount,
      monthly_price_pence: tier.monthlyPricePence,
    });

    return Response.json({
      success: true,
      changed: stripeChanged,
      requires_managed_plan: false,
      practitioner_count: practitionerCount,
      tier: tier.tier,
      monthly_price_pence: tier.monthlyPricePence,
    });
  } catch (error) {
    console.error('Clinic subscription reconciliation failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to reconcile clinic subscription' },
      { status: 500 },
    );
  }
});
