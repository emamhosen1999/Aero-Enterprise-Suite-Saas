import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const milestones = [
    {
        year: '2019',
        quarter: 'Q3',
        title: 'Company founded',
        body: 'aeos365 is established with a charter to rebuild enterprise operations software from first principles — modular, multi-tenant, and genuinely usable.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.12)',
        accentBgLight: 'rgba(0,163,184,0.12)',
    },
    {
        year: '2020',
        quarter: 'Q1',
        title: 'Core HR & Payroll live',
        body: 'The HRM module exits private beta with 12 design-partner customers. Employee lifecycle, leave management, and payroll automation ship as a unified suite.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.12)',
        accentBgLight: 'rgba(79,70,229,0.10)',
    },
    {
        year: '2020',
        quarter: 'Q4',
        title: 'Finance & CRM modules',
        body: 'Accounts payable/receivable, budgeting, and a full CRM pipeline ship in a single release, giving early adopters a true cross-functional platform.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.12)',
        accentBgLight: 'rgba(217,119,6,0.10)',
    },
    {
        year: '2021',
        quarter: 'Q2',
        title: 'Multi-tenant SaaS launch',
        body: 'Full subdomain-based tenant isolation, subscription billing, and the platform admin console launch — making aeos365 a true SaaS product available to the public.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.12)',
        accentBgLight: 'rgba(0,163,184,0.12)',
    },
    {
        year: '2022',
        quarter: 'Q1',
        title: '1,000-tenant milestone',
        body: 'The platform crosses 1,000 active tenants across 40+ countries. Advanced analytics, audit trails, and SSO support launch to meet growing compliance demands.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.12)',
        accentBgLight: 'rgba(79,70,229,0.10)',
    },
    {
        year: '2023',
        quarter: 'Q3',
        title: 'Enterprise tier introduced',
        body: 'A dedicated enterprise plan launches with 99.99% SLA options, multi-entity governance, data residency controls, and a dedicated customer success team.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.12)',
        accentBgLight: 'rgba(217,119,6,0.10)',
    },
    {
        year: '2024',
        quarter: 'Q2',
        title: 'AI-assisted operations',
        body: 'aeos365 Assist launches — embedded AI summaries, smart scheduling, anomaly detection in finance, and predictive leave forecasting across the HRM suite.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.12)',
        accentBgLight: 'rgba(0,163,184,0.12)',
    },
    {
        year: '2025',
        quarter: 'Q1',
        title: '40+ module platform',
        body: 'The platform grows to 40+ modules — from IoT operations and supply chain to education management and real estate — serving industries we never initially planned for.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.12)',
        accentBgLight: 'rgba(79,70,229,0.10)',
    },
];

export default function AboutTimeline() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-14 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--amber-aeos)' }}>
                        OUR JOURNEY
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        From a bold idea to a global platform.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        Six years of focused building, honest customer relationships, and a relentless commitment
                        to shipping software that actually works.
                    </motion.p>
                </motion.div>

                {/* Timeline — vertical on mobile, two-column staggered on desktop */}
                <div className="relative">
                    {/* Center line (desktop) */}
                    <div
                        className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 lg:block"
                        style={{
                            background: isDark
                                ? 'linear-gradient(to bottom, rgba(0,229,255,0.0), rgba(0,229,255,0.28), rgba(99,102,241,0.22), rgba(0,229,255,0.0))'
                                : 'linear-gradient(to bottom, rgba(0,163,184,0.0), rgba(0,163,184,0.22), rgba(79,70,229,0.18), rgba(0,163,184,0.0))',
                        }}
                    />

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="space-y-6 lg:space-y-0"
                    >
                        {milestones.map((item, index) => {
                            const isLeft = index % 2 === 0;
                            return (
                                <motion.div
                                    key={`${item.year}-${item.quarter}`}
                                    variants={fadeUp}
                                    custom={index}
                                    className={`flex gap-4 lg:gap-0 ${
                                        isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                                    } lg:items-start`}
                                >
                                    {/* Card half */}
                                    <div className={`flex-1 lg:py-4 ${isLeft ? 'lg:pr-10' : 'lg:pl-10'}`}>
                                        <article
                                            className="rounded-2xl border p-6"
                                            style={{
                                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                                            }}
                                        >
                                            {/* Year badge */}
                                            <div className="mb-4 flex items-center gap-3">
                                                <span
                                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                                    style={{
                                                        background: isDark ? item.accentBg : item.accentBgLight,
                                                        color: item.accent,
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                    }}
                                                >
                                                    {item.year}
                                                </span>
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{
                                                        color: isDark ? 'rgba(232,237,245,0.42)' : '#94A3B8',
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                    }}
                                                >
                                                    {item.quarter}
                                                </span>
                                            </div>
                                            <h3
                                                className="mb-2 text-lg font-semibold"
                                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                                            >
                                                {item.title}
                                            </h3>
                                            <p
                                                className="text-sm leading-relaxed md:text-base"
                                                style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                                            >
                                                {item.body}
                                            </p>
                                        </article>
                                    </div>

                                    {/* Center dot (desktop) */}
                                    <div className="hidden shrink-0 lg:flex lg:flex-col lg:items-center">
                                        <div
                                            className="mt-7 h-4 w-4 rounded-full border-2"
                                            style={{
                                                borderColor: item.accent,
                                                background: isDark ? '#03040A' : '#F8FAFC',
                                                boxShadow: `0 0 8px ${item.accent}55`,
                                            }}
                                        />
                                    </div>

                                    {/* Empty half to push to correct side */}
                                    <div className="hidden flex-1 lg:block" />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
