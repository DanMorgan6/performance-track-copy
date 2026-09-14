import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@22.4.0';

const PRACTITIONER_ROLES = new Set(['admin', 'clinic_admin', 'clinician']);
const CLINIC_ADMIN_ROLES = new Set(['admin', 'clinic_admin']);
const MAX_SELF_SERVICE_PRACTITIONERS = 10;

function createStripeClient() {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secretKey) throw new Error('Stripe is not configured');
  return new Stripe(secretKey);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !CLINIC_ADMIN_ROLES.has(user.role)) {
      return Response.json({ error: 'Clinic administrator access required' }, { status: 403 });
    }

    const { clinic_id: clinicId } = await req.json();
    if (!clinicId || user.clinic_id !== clinicId) {
      return Response.json({ error: 'Invalid clinic' }, { status: 403 });
    }

    const clinics = await base44.entities.Clinic.filter({ id: clinicId });
    const clinic = clinics[0];
    if (!clinic) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicUsers = await base44.asServiceRole.entities.User.filter({ clinic_id: clinicId });
    const practitionerCount = clinicUsers.filter((member) => PRACTITIONER_ROLES.has(member.role)).length;
    const seatCount = Math.max(1, practitionerCount);

    if (seatCount > MAX_SELF_SERVICE_PRACTITIONERS) {
      return Response.json(
        { error: 'Clinics with more than 10 practitioners need a tailored plan.' },
        { status: 400 },
      );
    }

    const priceId = seatCount <= 5
      ? Deno.env.get('STRIPE_CLINIC_PRICE_ID')
      : Deno.env.get('STRIPE_CLINIC_PLUS_PRICE_ID');

    if (!priceId) {
      return Response.json(
        { error: 'Subscription pricing is not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const stripe = createStripeClient();
    let customerId = clinic.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: clinic.contact_email || user.email,
        name: clinic.name,
        metadata: {
          clinic_id: clinic.id,
          base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        },
      });
      customerId = customer.id;
      await base44.asServiceRole.entities.Clinic.update(clinic.id, {
        stripe_customer_id: customerId,
      });
    }

    const subscriptionData = {
      metadata: { clinic_id: clinic.id, seat_count: String(seatCount) },
    };

    const trialEndMs = clinic.trial_end_date ? Date.parse(clinic.trial_end_date) : NaN;
    const minimumStripeTrialEnd = Date.now() + 48 * 60 * 60 * 1000;
    if (Number.isFinite(trialEndMs) && trialEndMs > minimumStripeTrialEnd) {
      subscriptionData.trial_end = Math.floor(trialEndMs / 1000);
    }

    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      integration_identifier: 'performance_track_qzmvpkra',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: subscriptionData,
      success_url: `${origin}/CoachDashboard?subscription_success=true`,
      cancel_url: `${origin}/Pricing`,
      metadata: {
        clinic_id: clinic.id,
        seat_count: String(seatCount),
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to create subscription' },
      { status: 500 },
    );
  }
});
