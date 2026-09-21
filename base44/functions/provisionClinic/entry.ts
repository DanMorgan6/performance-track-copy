import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLINIC_ADMIN_ROLE = 'clinic_admin';
const DEFAULT_MONTHLY_PRICE_PENCE = 3000;
const TRIAL_DAYS = 14;

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value: unknown, maxLength = 250) {
  return String(value || '').trim().slice(0, maxLength);
}

function isHexColour(value: unknown) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ''));
}

function optionalUrl(value: unknown) {
  const candidate = cleanText(value, 1000);
  if (!candidate) return '';
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Booking links must use http or https');
  }
  return url.toString();
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id || !user?.email) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = await req.json();
    const clinicInput = payload?.clinic || {};
    const profileInput = payload?.profile || {};
    const email = normalizeEmail(user.email);
    const clinicName = cleanText(clinicInput.name, 160);
    const contactEmail = normalizeEmail(clinicInput.contact_email || email);
    const jobTitle = cleanText(profileInput.job_title, 120);

    if (!clinicName || !contactEmail || !jobTitle) {
      return Response.json(
        { error: 'Clinic name, contact email and job title are required' },
        { status: 400 },
      );
    }

    if (user.clinic_id) {
      const assignedClinics = await base44.asServiceRole.entities.Clinic.filter({ id: user.clinic_id });
      const assignedClinic = assignedClinics[0];
      if (assignedClinic && normalizeEmail(assignedClinic.owner_email) === email) {
        return Response.json({ clinic: assignedClinic, already_provisioned: true });
      }
      return Response.json(
        { error: 'This account already belongs to a clinic. Use a different account to create another clinic.' },
        { status: 409 },
      );
    }

    // Recover safely from a previous request that created the clinic but was interrupted
    // before updating the user. Owner email is unique for the self-service path.
    const ownedClinics = await base44.asServiceRole.entities.Clinic.filter({ owner_email: email });
    let clinic = ownedClinics[0];

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);

    const clinicData = {
      name: clinicName,
      contact_email: contactEmail,
      phone: cleanText(clinicInput.phone, 80),
      address: cleanText(clinicInput.address, 500),
      booking_url: optionalUrl(clinicInput.booking_url),
      logo_url: cleanText(clinicInput.logo_url, 1000),
      brand_color_primary: isHexColour(clinicInput.brand_color_primary)
        ? clinicInput.brand_color_primary
        : '#9333ea',
      brand_color_secondary: isHexColour(clinicInput.brand_color_secondary)
        ? clinicInput.brand_color_secondary
        : '#06b6d4',
      owner_email: email,
    };

    if (!clinic) {
      clinic = await base44.asServiceRole.entities.Clinic.create({
        ...clinicData,
        subscription_status: 'trial',
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        clinician_seat_count: 1,
        monthly_price_pence: DEFAULT_MONTHLY_PRICE_PENCE,
      });

      clinic = await base44.asServiceRole.entities.Clinic.update(clinic.id, {
        clinic_id: clinic.id,
      });
    } else {
      clinic = await base44.asServiceRole.entities.Clinic.update(clinic.id, {
        ...clinicData,
        clinic_id: clinic.id,
      });
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      clinic_id: clinic.id,
      role: CLINIC_ADMIN_ROLE,
      job_title: jobTitle,
      specialties: Array.isArray(profileInput.specialties)
        ? profileInput.specialties.map((item: unknown) => cleanText(item, 100)).filter(Boolean).slice(0, 30)
        : [],
      booking_enabled: Boolean(profileInput.booking_enabled),
      booking_url: optionalUrl(profileInput.booking_url),
      onboarding_completed: true,
    });

    return Response.json({ clinic, already_provisioned: false });
  } catch (error) {
    console.error('Clinic provisioning failed:', error);
    const message = error instanceof Error ? error.message : 'Unable to create clinic';
    return Response.json({ error: message }, { status: 500 });
  }
});
