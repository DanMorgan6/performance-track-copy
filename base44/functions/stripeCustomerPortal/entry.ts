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

    const clinics = await base44.entities.Clinic.filter({ id: clinic_id });
    if (!clinics.length) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 });
    }
    const clinic = clinics[0];

    if (!clinic.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found. Please set up your subscription first.' }, { status: 400 });
    }

    const returnUrl = `${req.headers.get('origin') || 'https://app.base44.com'}/ClinicSettings?tab=billing`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: clinic.stripe_customer_id,
      return_url: returnUrl
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});