import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield, Eye, Database, UserCheck, Trash2, Mail, Lock, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const Section = ({ icon: Icon, title, children, color = "purple" }) => {
  const [open, setOpen] = useState(true);
  const colors = {
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="flex-1 text-lg font-semibold text-slate-800">{title}</h2>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">Privacy Policy & GDPR Information</h1>
              <p className="text-xs text-slate-400">Last updated: February 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Intro */}
        <div className="bg-purple-600 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-2">Your privacy matters to us</h2>
          <p className="text-purple-100 text-sm leading-relaxed">
            This policy explains how Beaches Performance + collects, uses, and protects your personal data in accordance 
            with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </div>

        <Section icon={UserCheck} title="Who We Are (Data Controller)" color="purple">
          <p>
            <strong>Beaches Performance +</strong> is the data controller responsible for your personal information. 
            We are committed to protecting your data and complying with all applicable data protection laws.
          </p>
          <p>
            If you have any questions about how we handle your data, please contact us at: 
            <strong> privacy@beachesperformance.com</strong>
          </p>
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100">
            If your clinic uses this platform independently, they act as a separate data controller for the data they collect about you as their patient. Please contact your clinic directly for their specific data processing practices.
          </p>
        </Section>

        <Section icon={Database} title="What Data We Collect" color="blue">
          <p><strong>For Clinicians & Clinic Administrators:</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Name, email address, and professional details</li>
            <li>Clinic name, address, and contact information</li>
            <li>Billing and payment information (processed securely via Stripe)</li>
            <li>Usage data and activity logs within the platform</li>
          </ul>
          <p className="mt-2"><strong>For Patients:</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Name, email address, date of birth, and contact details</li>
            <li>Health information including injury type, rehabilitation plans, and exercise logs</li>
            <li>Pain logs, assessment results, and outcome measures</li>
            <li>Daily notes, mood, energy levels, and self-reported symptoms</li>
            <li>Medical reports and documents uploaded by your clinician</li>
          </ul>
        </Section>

        <Section icon={Eye} title="How We Use Your Data" color="green">
          <p><strong>Lawful bases for processing (UK GDPR Article 6 & 9):</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Contract performance</strong> — to provide and operate the platform services</li>
            <li><strong>Legitimate interests</strong> — to improve the platform and ensure security</li>
            <li><strong>Legal obligation</strong> — to comply with applicable laws and regulations</li>
            <li><strong>Explicit consent</strong> — for health data processing (special category data under Article 9)</li>
          </ul>
          <p className="mt-2">We use your data to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Deliver personalised rehabilitation plans and track progress</li>
            <li>Enable communication between clinicians and patients</li>
            <li>Generate reports and insights to support clinical decision-making</li>
            <li>Process payments and manage subscriptions</li>
            <li>Maintain the security and integrity of the platform</li>
          </ul>
        </Section>

        <Section icon={Globe} title="Data Sharing & Third Parties" color="amber">
          <p>We do not sell your personal data. We may share data with:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Stripe</strong> — for secure payment processing (their privacy policy applies)</li>
            <li><strong>Base44</strong> — our hosting and infrastructure provider (data processed within the EU/UK)</li>
            <li><strong>Your clinic</strong> — clinicians can view data about their patients only</li>
          </ul>
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100 mt-2">
            All third-party processors are bound by data processing agreements ensuring your data is handled in compliance with UK GDPR.
          </p>
        </Section>

        <Section icon={Lock} title="Data Security" color="rose">
          <ul className="list-disc ml-5 space-y-1">
            <li>All data is encrypted in transit using TLS/SSL</li>
            <li>Data is stored on secure, access-controlled servers</li>
            <li>Access to patient data is restricted to the relevant clinic's staff only</li>
            <li>Regular security reviews and monitoring are conducted</li>
            <li>We use role-based access controls to limit data exposure</li>
          </ul>
          <p>In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority (ICO) within 72 hours and affected individuals without undue delay.</p>
        </Section>

        <Section icon={Shield} title="Your Rights Under UK GDPR" color="purple">
          <p>You have the following rights regarding your personal data:</p>
          <div className="space-y-2">
            {[
              { right: "Right of Access", desc: "Request a copy of all personal data we hold about you." },
              { right: "Right to Rectification", desc: "Request correction of inaccurate or incomplete data." },
              { right: "Right to Erasure", desc: "Request deletion of your data ('right to be forgotten'), subject to legal retention requirements." },
              { right: "Right to Restriction", desc: "Request that we restrict processing of your data in certain circumstances." },
              { right: "Right to Data Portability", desc: "Receive your data in a structured, commonly used format." },
              { right: "Right to Object", desc: "Object to processing based on legitimate interests or for direct marketing." },
              { right: "Right to Withdraw Consent", desc: "Withdraw consent at any time where processing is based on consent." },
            ].map(({ right, desc }) => (
              <div key={right} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 text-xs">{right}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2">To exercise any of these rights, contact us at <strong>privacy@beachesperformance.com</strong>. We will respond within <strong>30 days</strong>.</p>
        </Section>

        <Section icon={Trash2} title="Data Retention" color="slate">
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Patient health records</strong> — retained for a minimum of 8 years after the last appointment (in line with NHS/clinical guidelines), or until deletion is requested</li>
            <li><strong>Account data</strong> — retained for the duration of the account and up to 2 years after closure</li>
            <li><strong>Billing records</strong> — retained for 7 years for legal and accounting purposes</li>
            <li><strong>Usage/log data</strong> — retained for up to 12 months</li>
          </ul>
          <p>After the applicable retention period, data is securely deleted or anonymised.</p>
        </Section>

        <Section icon={Mail} title="Complaints & Contact" color="rose">
          <p>If you have concerns about how we handle your data, please contact us first:</p>
          <p className="font-medium">privacy@beachesperformance.com</p>
          <p className="mt-2">If you remain unsatisfied, you have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong>:</p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
            <p className="font-medium text-slate-700">Information Commissioner's Office</p>
            <p className="text-slate-500">Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">ico.org.uk</a></p>
            <p className="text-slate-500">Helpline: 0303 123 1113</p>
          </div>
        </Section>

        <div className="text-center text-xs text-slate-400 mt-8 pb-4">
          This policy was last reviewed in February 2026. We may update it periodically — any material changes will be communicated to users.
        </div>
      </div>
    </div>
  );
}