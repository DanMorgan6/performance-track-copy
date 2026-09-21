import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@22.4.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) throw new Error('Stripe is not configured');
const stripe = new Stripe(stripeSecretKey);

function normaliseSubscriptionStatus(status: string) {
  if (status === 'incomplete_expired') return 'incomplete';
  if (status === 'paused') return 'unpaid';
  return ['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete'].includes(status)
    ? status
    : 'incomplete';
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) {
    return Response.json({ error: 'Webhook signature configuration missing' }, { status: 400 });
  }
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const clinicId = session.metadata?.clinic_id;
        if (!clinicId) break;

        const clinics = await base44.asServiceRole.entities.Clinic.filter({ id: clinicId });
        if (!clinics.length) break;
        const clinic = clinics[0];

        // Retrieve the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
        const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
        const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null;

        // Calculate monthly price from subscription line items
        let monthlyPrice = 0;
        if (subscription.items.data.length > 0) {
          monthlyPrice = subscription.items.data.reduce((sum, item) => {
            return sum + (item.price.unit_amount || 0) * (item.quantity || 1);
          }, 0);
        }

        const status = normaliseSubscriptionStatus(subscription.status);

        await base44.asServiceRole.entities.Clinic.update(clinic.id, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          subscription_status: status,
          trial_end_date: trialEnd,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          monthly_price_pence: monthlyPrice,
          clinician_seat_count: parseInt(subscription.metadata?.seat_count || '1')
        });

        console.log(`Subscription created for clinic ${clinicId}, status: ${status}, monthly price: £${(monthlyPrice / 100).toFixed(2)}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const clinicId = subscription.metadata?.clinic_id;

        // Find clinic either by clinicId in metadata or by stripe_subscription_id
        let clinic;
        if (clinicId) {
          const clinics = await base44.asServiceRole.entities.Clinic.filter({ id: clinicId });
          clinic = clinics[0];
        } else {
          const allClinics = await base44.asServiceRole.entities.Clinic.filter({ stripe_subscription_id: subscription.id });
          clinic = allClinics[0];
        }

        if (!clinic) break;

        // Calculate monthly price from current subscription line items
        let monthlyPrice = 0;
        if (subscription.items.data.length > 0) {
          monthlyPrice = subscription.items.data.reduce((sum, item) => {
            return sum + (item.price.unit_amount || 0) * (item.quantity || 1);
          }, 0);
        }

        const status = normaliseSubscriptionStatus(subscription.status);

        await base44.asServiceRole.entities.Clinic.update(clinic.id, {
          subscription_status: status,
          current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
          monthly_price_pence: monthlyPrice,
          clinician_seat_count: parseInt(subscription.metadata?.seat_count || clinic.clinician_seat_count || '1')
        });

        console.log(`Subscription updated for clinic ${clinic.id}, status: ${status}, monthly price: £${(monthlyPrice / 100).toFixed(2)}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const allClinics = await base44.asServiceRole.entities.Clinic.filter({ stripe_subscription_id: subscription.id });
        if (!allClinics.length) break;

        await base44.asServiceRole.entities.Clinic.update(allClinics[0].id, {
          subscription_status: 'canceled'
        });
        console.log(`Subscription canceled for clinic ${allClinics[0].id}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const allClinics = await base44.asServiceRole.entities.Clinic.filter({ stripe_subscription_id: invoice.subscription });
        if (!allClinics.length) break;

        await base44.asServiceRole.entities.Clinic.update(allClinics[0].id, {
          subscription_status: 'active'
        });
        console.log(`Invoice paid, subscription active for clinic ${allClinics[0].id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const allClinics = await base44.asServiceRole.entities.Clinic.filter({ stripe_subscription_id: invoice.subscription });
        if (!allClinics.length) break;

        await base44.asServiceRole.entities.Clinic.update(allClinics[0].id, {
          subscription_status: 'past_due'
        });
        console.log(`Payment failed for clinic ${allClinics[0].id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return Response.json({ error: 'Handler error' }, { status: 500 });
  }

  return Response.json({ received: true });
});