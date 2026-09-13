import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clinic_id } = await req.json();

    // Load clinic
    const clinics = await base44.entities.Clinic.filter({ id: clinic_id });
    if (!clinics.length) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 });
    }
    const clinic = clinics[0];

    // Count clinician seats
    const allUsers = await base44.asServiceRole.entities.User.list();
    const clinicianCount = allUsers.filter(u => u.role === 'admin' && u.clinic_id === clinic_id).length;
    const seatCount = Math.max(1, clinicianCount);

    // Create or retrieve Stripe customer
    let customerId = clinic.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: clinic.name,
        metadata: { clinic_id: clinic.id, base44_app_id: Deno.env.get('BASE44_APP_ID') }
      });
      customerId = customer.id;
      await base44.asServiceRole.entities.Clinic.update(clinic.id, { stripe_customer_id: customerId });
    }

    // Build line items: base fee + per-seat fees
    const basePriceId = Deno.env.get('STRIPE_BASE_PRICE_ID');
    const seatPriceId = Deno.env.get('STRIPE_SEAT_PRICE_ID');
    const additionalSeats = Math.max(0, seatCount - 1);

    const lineItems = [
      {
        price: basePriceId,
        quantity: 1
      }
    ];

    // Add per-seat line item only if there are additional seats
    if (additionalSeats > 0) {
      lineItems.push({
        price: seatPriceId,
        quantity: additionalSeats
      });
    }

    // Create Checkout Session with separate line items
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 14,
        metadata: { clinic_id: clinic.id, seat_count: String(seatCount) }
      },
      success_url: `${req.headers.get('origin') || 'https://app.base44.com'}/CoachDashboard?subscription_success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.com'}/Pricing`,
      metadata: {
        clinic_id: clinic.id,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});