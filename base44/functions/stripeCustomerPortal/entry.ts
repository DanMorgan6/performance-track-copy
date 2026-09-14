import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@22.4.0';

const CLINIC_ADMIN_ROLES = new Set(['admin', 'clinic_admin']);

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
    if (!clinic.stripe_customer_id) {
      return Response.json(
        { error: 'No Stripe customer found. Set up the subscription first.' },
        { status: 400 },
      );
    }

    const stripe = createStripeClient();
    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: clinic.stripe_customer_id,
      return_url: `${origin}/ClinicSettings?tab=billing`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to open billing portal' },
      { status: 500 },
    );
  }
});
