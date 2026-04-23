import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const steps = [
    {
        number: '01',
        title: 'Create your account',
        description: 'Sign up at aeos365.com — no credit card required. Your workspace and tenant subdomain are provisioned instantly.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
        code: `# Verify your tenant is live
curl https://{your-tenant}.aeos365.com/api/health
# → {"status":"ok","tenant":"acme","version":"2.4.1"}`,
    },
    {
        number: '02',
        title: 'Configure your tenant',
        description: 'Set your company name, timezone, currency, and fiscal year. Then activate the modules your organization needs from the Module Manager.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.10)',
        accentBgLight: 'rgba(79,70,229,0.09)',
        code: `# Activate modules via API (or use the UI)
POST /api/modules/activate
{
  "modules": ["hrm", "crm", "finance"],
  "plan": "growth"
}`,
    },
    {
        number: '03',
        title: 'Invite your team',
        description: 'Add team members by email and assign roles. Use built-in RBAC to control exactly what each person can see and do — down to individual actions.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.10)',
        accentBgLight: 'rgba(217,119,6,0.09)',
        code: `# Invite users with role assignment
POST /api/users/invite
{
  "email": "sarah@acme.com",
  "role": "hrm_manager",
  "department_id": 4
}`,
    },
    {
        number: '04',
        title: 'Go live',
        description: 'Import existing data with our migration wizards, connect your integrations, and run your first payroll or deal pipeline. You\'re in production.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
        code: `# Check import job status
GET /api/imports/{job_id}/status
# → {"progress":100,"imported":842,"errors":0}`,
    },
];

export default function DocsQuickStart() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Background */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 65% 50% at 10% 40%, rgba(0,229,255,0.05) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 65% 50% at 10% 40%, rgba(224,242,254,0.55) 0%, transparent 65%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, transparent 0%, rgba(3,4,10,0.6) 100%)'
                        : 'transparent',
                }}
            />

            <div className="relative mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-14 max-w-2xl"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        QUICK START
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        From sign-up to&nbsp;production in&nbsp;4 steps.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mt-4 text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        Follow this guide to get your organization running on aeos365 in under an hour.
                        Each step includes an API command for developers who prefer code-first setup.
                    </motion.p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6 md:p-8"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.88)',
                            }}
                        >
                            {/* Step number + title */}
                            <div className="mb-4 flex items-start gap-4">
                                <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                                    style={{
                                        background: isDark ? step.accentBg : step.accentBgLight,
                                        color: step.accent,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {step.number}
                                </div>
                                <div>
                                    <h3
                                        className="text-lg font-semibold leading-snug"
                                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        className="mt-1 text-sm leading-relaxed"
                                        style={{ color: isDark ? 'rgba(232,237,245,0.56)' : '#64748B' }}
                                    >
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Code block */}
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.04)',
                                    border: `1px solid ${isDark ? 'rgba(0,229,255,0.10)' : 'rgba(15,23,42,0.08)'}`,
                                }}
                            >
                                <pre
                                    className="overflow-x-auto text-xs leading-relaxed"
                                    style={{
                                        color: isDark ? 'rgba(0,229,255,0.80)' : '#0F4C81',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {step.code}
                                </pre>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Connector bar */}
                <motion.div
                    variants={fadeUp}
                    custom={5}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                    <span
                        className="text-sm"
                        style={{ color: isDark ? 'rgba(232,237,245,0.45)' : '#64748B' }}
                    >
                        Need a deeper guide?
                    </span>
                    <a
                        href="#"
                        className="label-mono text-xs transition-opacity hover:opacity-75"
                        style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                    >
                        Read the full onboarding guide →
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
