import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const categories = [
    {
        badge: '01',
        title: 'Getting Started',
        description: 'Install, configure, and launch your first tenant in under 15 minutes with our step-by-step onboarding guide.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.11)',
        accentBgLight: 'rgba(0,163,184,0.11)',
        articles: 24,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        ),
    },
    {
        badge: '02',
        title: 'HRM Module',
        description: 'Employee lifecycle, leave policies, payroll configuration, attendance tracking, and HR analytics.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.11)',
        accentBgLight: 'rgba(79,70,229,0.10)',
        articles: 86,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        badge: '03',
        title: 'CRM Module',
        description: 'Pipeline management, deal tracking, contact management, activity logging, and sales automation.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.11)',
        accentBgLight: 'rgba(217,119,6,0.10)',
        articles: 62,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        badge: '04',
        title: 'Finance Module',
        description: 'Chart of accounts, AP/AR, budgeting, multi-currency support, tax rules, and financial reporting.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.11)',
        accentBgLight: 'rgba(0,163,184,0.11)',
        articles: 74,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        badge: '05',
        title: 'Platform API',
        description: 'REST and GraphQL references, authentication flows, rate limits, webhooks, and SDK documentation.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.11)',
        accentBgLight: 'rgba(79,70,229,0.10)',
        articles: 48,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
    },
    {
        badge: '06',
        title: 'Integrations',
        description: 'Connect aeos365 with Slack, Google Workspace, Zapier, QuickBooks, Salesforce, and 80+ services.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.11)',
        accentBgLight: 'rgba(217,119,6,0.10)',
        articles: 55,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
    },
    {
        badge: '07',
        title: 'Security & Compliance',
        description: 'Role-based access control, audit logs, GDPR data handling, SSO/SAML setup, and data residency.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.11)',
        accentBgLight: 'rgba(0,163,184,0.11)',
        articles: 38,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
    {
        badge: '08',
        title: 'Billing & Plans',
        description: 'Subscription management, plan upgrades, usage-based billing, invoice downloads, and payment methods.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.11)',
        accentBgLight: 'rgba(79,70,229,0.10)',
        articles: 29,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        ),
    },
];

export default function DocsCategories() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Subtle accent */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 55% 40% at 75% 55%, rgba(99,102,241,0.05) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 55% 40% at 75% 55%, rgba(224,231,255,0.50) 0%, transparent 65%)',
                }}
            />

            <div className="relative mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-12 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        BROWSE BY CATEGORY
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        Find docs for every module.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        From core HR to enterprise API — every feature has its own dedicated documentation
                        track with examples, code snippets, and migration guides.
                    </motion.p>
                </motion.div>

                {/* Category grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {categories.map((cat, index) => (
                        <motion.a
                            key={cat.title}
                            href="#"
                            variants={fadeUp}
                            custom={index}
                            className="group relative rounded-2xl border p-6 transition-all duration-200"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                                textDecoration: 'none',
                            }}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        >
                            {/* Icon badge */}
                            <div
                                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                                style={{
                                    background: isDark ? cat.accentBg : cat.accentBgLight,
                                    color: cat.accent,
                                }}
                            >
                                {cat.icon}
                            </div>

                            {/* Title */}
                            <h3
                                className="mb-2 text-base font-semibold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {cat.title}
                            </h3>

                            {/* Description */}
                            <p
                                className="mb-4 text-sm leading-relaxed"
                                style={{ color: isDark ? 'rgba(232,237,245,0.52)' : '#64748B' }}
                            >
                                {cat.description}
                            </p>

                            {/* Footer row */}
                            <div className="flex items-center justify-between">
                                <span
                                    className="label-mono text-xs"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.30)' : '#94A3B8' }}
                                >
                                    {cat.articles} articles
                                </span>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-transform duration-200 group-hover:translate-x-1"
                                    style={{ color: cat.accent }}
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </div>
                        </motion.a>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
