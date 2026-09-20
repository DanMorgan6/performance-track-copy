import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

const sections = [
  {
    icon: Building2,
    title: 'Who is responsible for your data?',
    content: (
      <>
        <p>
          The clinic providing your care is normally the <strong>data controller</strong> for your
          patient and rehabilitation records. It decides why and how that information is used and
          should give you its own privacy notice.
        </p>
        <p>
          Performance Track+ normally acts as the clinic&apos;s <strong>data processor</strong> for
          those records, handling them on the clinic&apos;s documented instructions to provide the
          platform. Performance Track+ is a controller for limited information it uses for its own
          purposes, such as clinic account administration, service security and billing records.
        </p>
        <p>
          Patients should contact their clinic first about clinical records. Clinic account holders
          can contact <a href="mailto:privacy@beachesperformance.com">privacy@beachesperformance.com</a>.
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: 'Information processed',
    content: (
      <>
        <p><strong>Clinic and practitioner information</strong> may include names, work email addresses,
          professional details, clinic details, user roles, subscription information and security or
          activity records.</p>
        <p><strong>Patient information</strong> may include contact details, injury and health
          information, rehabilitation plans, exercises, pain and symptom logs, outcome measures,
          messages, progress reports and uploaded documents.</p>
        <p><strong>Optional connected-health information</strong> may include activity, running,
          heart-rate, HRV, sleep and recovery summaries when a patient or clinic explicitly enables
          an approved provider connection. Provider access and refresh tokens must not be stored in
          patient records. Connections can be revoked, and wearable data is used only to inform
          practitioner review; it does not automatically progress a rehabilitation phase.</p>
        <p>
          Health information is special category data under UK data protection law and requires
          additional protection.
        </p>
      </>
    ),
  },
  {
    icon: FileText,
    title: 'Why information is used',
    content: (
      <>
        <ul>
          <li>To create, deliver and monitor rehabilitation programmes.</li>
          <li>To support communication between a patient and their authorised care team.</li>
          <li>To generate progress information and practitioner-reviewed reports.</li>
          <li>To administer clinic accounts, subscriptions, support and service security.</li>
          <li>To meet applicable legal, regulatory and accounting obligations.</li>
        </ul>
        <p>
          Each clinic is responsible for identifying and documenting an appropriate UK GDPR Article
          6 lawful basis and, for health information, an Article 9 condition. The correct basis
          depends on the clinic and its circumstances; consent is not assumed to be the basis in
          every case.
        </p>
      </>
    ),
  },
  {
    icon: BrainCircuit,
    title: 'AI-assisted features',
    content: (
      <>
        <p>
          AI features can help practitioners draft programmes and content. They are decision-support
          tools, not a replacement for clinical judgement. A practitioner must review, amend where
          needed and approve any AI-assisted output before relying on it for patient care.
        </p>
        <p>
          Clinics should avoid entering information that is not necessary for the task and should
          review the applicable data-processing terms and subprocessor information before enabling
          AI-assisted workflows.
        </p>
      </>
    ),
  },
  {
    icon: UserRoundCheck,
    title: 'Access and sharing',
    content: (
      <>
        <p>
          Access is role based. Practitioners can access records only within their own clinic, and a
          patient account is linked only to that patient&apos;s record. One clinic cannot use the
          application to access another clinic&apos;s data.
        </p>
        <p>
          Information may be processed by service providers needed to operate Performance Track+,
          including Base44 for application infrastructure and Stripe for subscription billing.
          Stripe receives payment information directly; Performance Track+ does not store full card
          details. Other configured services, such as email, file-storage or AI providers, must be
          recorded in the clinic agreement or current subprocessor schedule.
        </p>
        <p>Personal information is not sold.</p>
      </>
    ),
  },
  {
    icon: LockKeyhole,
    title: 'Security and incidents',
    content: (
      <>
        <ul>
          <li>Tenant-level access rules separate clinic records.</li>
          <li>Role-based permissions limit practitioner and patient access.</li>
          <li>Patient invitations are validated before an account is linked to a record.</li>
          <li>Information is encrypted in transit using HTTPS/TLS.</li>
          <li>Restricted operations run through authenticated server-side functions.</li>
        </ul>
        <p>
          If a personal data incident affects clinic-controlled data, the platform operator will
          support the clinic and notify it without undue delay where required. The clinic remains
          responsible for deciding whether it must notify the ICO or affected people.
        </p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: 'Your data protection rights',
    content: (
      <>
        <p>
          Depending on the circumstances, you may have rights to access, correct or erase your
          information; restrict or object to processing; receive portable data; and withdraw consent
          where consent is the lawful basis. Some rights are subject to legal exceptions and
          professional record-keeping obligations.
        </p>
        <p>
          For patient or clinical information, contact the clinic providing your care. For
          Performance Track+ account, security or billing information, email{' '}
          <a href="mailto:privacy@beachesperformance.com">privacy@beachesperformance.com</a>.
          Requests will be handled within the timescales required by applicable law.
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: 'Retention and deletion',
    content: (
      <>
        <p>
          The clinic sets retention periods for clinical records according to its professional,
          contractual and legal obligations. Performance Track+ retains clinic-controlled data for
          the duration agreed with the clinic, then returns or deletes it in accordance with the
          service agreement, subject to secure backup cycles and legal requirements.
        </p>
        <p>
          Account, security and billing records are kept only as long as reasonably necessary for
          service administration, fraud prevention, disputes and applicable legal or accounting
          obligations.
        </p>
      </>
    ),
  },
];

function PolicySection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)] backdrop-blur sm:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/25 bg-lime-300/10 text-lime-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          <div className="policy-copy mt-4 space-y-4 text-sm leading-7 text-slate-300">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#070b10] text-white">
      <style>{`
        .policy-copy strong { color: rgb(248 250 252); font-weight: 600; }
        .policy-copy a { color: rgb(190 242 100); text-decoration: underline; text-underline-offset: 3px; }
        .policy-copy ul { list-style: none; display: grid; gap: .55rem; padding: 0; }
        .policy-copy li { position: relative; padding-left: 1.55rem; }
        .policy-copy li::before { content: "✓"; position: absolute; left: 0; color: rgb(190 242 100); font-weight: 700; }
      `}</style>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-8">
          <Link
            to={createPageUrl('Home')}
            aria-label="Back to home"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Performance Track+</p>
            <p className="text-xs text-slate-500">Privacy and data protection</p>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_75%_0%,rgba(190,242,100,0.14),transparent_48%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
              <ShieldCheck className="h-4 w-4" />
              Privacy by design
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.045em] text-white sm:text-6xl">
              Clear control of sensitive rehabilitation data.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              This page explains how information is handled when a clinic uses Performance Track+.
              It complements the clinic&apos;s own privacy notice and is not a substitute for it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Last updated 20 September 2026</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">UK GDPR focused</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Clinic-separated access</span>
            </div>
          </div>

          <div className="mt-12 grid gap-5">
            {sections.map(({ icon, title, content }) => (
              <PolicySection key={title} icon={icon} title={title}>
                {content}
              </PolicySection>
            ))}
          </div>

          <section className="mt-5 rounded-3xl border border-lime-300/20 bg-lime-300/[0.07] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-lime-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Clinic go-live checklist</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Before using Performance Track+ with patients, each clinic should maintain its own
                  privacy notice and retention schedule, document its Article 6 and Article 9 bases,
                  complete any required data protection impact assessment, and review its data
                  processing agreement and subprocessor list.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-6 w-6 shrink-0 text-lime-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Questions or complaints</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Contact your clinic about patient records, or email{' '}
                  <a className="text-lime-300 underline underline-offset-4" href="mailto:privacy@beachesperformance.com">
                    privacy@beachesperformance.com
                  </a>{' '}
                  about the platform. You may also complain to the{' '}
                  <a
                    className="text-lime-300 underline underline-offset-4"
                    href="https://ico.org.uk/make-a-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Information Commissioner&apos;s Office
                  </a>.
                </p>
              </div>
            </div>
          </section>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-slate-500">
            This information describes the current platform design. Clinics should obtain
            independent legal advice for their specific regulatory and professional obligations.
          </p>
        </div>
      </main>
    </div>
  );
}