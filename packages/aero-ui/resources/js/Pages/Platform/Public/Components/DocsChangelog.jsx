import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const releases = [
    {
        version: 'v2.4',
        label: 'Latest',
        date: 'April 18, 2026',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
        labelBg: 'rgba(0,229,255,0.15)',
        labelBgLight: 'rgba(0,163,184,0.12)',
        changes: [
            'HRM: Bulk attendance correction tool with manager approval workflow',
            'Finance: Multi-entity consolidated P&L with drill-down by cost centre',
            'Platform API: GraphQL subscriptions for real-time event streaming',
            'Integrations: Native Google Calendar sync for leave and time-off',
            'Security: Passwordless magic-link login for tenant users (beta)',
            'Performance: Paginated tenant queries reduced by ~40% on large datasets',
        ],
    },
    {
        version: 'v2.3',
        label: 'March 2026',
        date: 'March 5, 2026',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.10)',
        accentBgLight: 'rgba(79,70,229,0.09)',
        labelBg: 'rgba(99,102,241,0.14)',
        labelBgLight: 'rgba(79,70,229,0.10)',
        changes: [
            'CRM: Kanban pipeline view with drag-and-drop deal stages',
            'HRM: AI-assisted leave pattern anomaly detection for managers',
            'Billing: Usage-based billing calculator in subscription dashboard',
            'Platform: Role cloning — duplicate any role with one click',
            'DMS: Bulk document upload with auto-tagging by module context',
        ],
    },
    {
        version: 'v2.2',
        label: 'January 2026',
        date: 'January 14, 2026',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.10)',
        accentBgLight: 'rgba(217,119,6,0.09)',
        labelBg: 'rgba(255,179,71,0.14)',
        labelBgLight: 'rgba(217,119,6,0.10)',
        changes: [
            'Finance: Bank reconciliation wizard with statement import support',
            'HRM: Configurable probation period tracking with automated alerts',
            'Platform API: Webhook retry policies with exponential back-off',
            'Theme engine: 12 new built-in colour palettes for tenant branding',
            'Compliance: GDPR data export and right-to-erasure request queue',
        ],
    },
];

export default function DocsChangelog() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Accent background */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 55% 45% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 55% 45% at 50% 100%, rgba(224,231,255,0.55) 0%, transparent 65%)',
                }}
            />
            <div className="divider-cyan mb-14 opacity-40" />

            <div className="relative mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                >
                    <div>
                        <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                            CHANGELOG
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="display-section"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                        >
                            What&rsquo;s new in aeos365.
                        </motion.h2>
                    </div>
                    <motion.a
                        variants={fadeUp}
                        custom={2}
                        href="#"
                        className="label-mono shrink-0 text-xs transition-opacity hover:opacity-70"
                        style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                    >
                        Full changelog →
                    </motion.a>
                </motion.div>

                {/* Release entries */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="space-y-6"
                >
                    {releases.map((release, index) => (
                        <motion.div
                            key={release.version}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6 md:p-8"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.88)',
                            }}
                        >
                            {/* Release header */}
                            <div className="mb-5 flex flex-wrap items-center gap-3">
                                <span
                                    className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold"
                                    style={{
                                        background: isDark ? release.accentBg : release.accentBgLight,
                                        color: release.accent,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {release.version}
                                </span>
                                <span
                                    className="label-mono rounded-full px-2.5 py-1 text-xs"
                                    style={{
                                        background: isDark ? release.labelBg : release.labelBgLight,
                                        color: release.accent,
                                    }}
                                >
                                    {release.label}
                                </span>
                                <span
                                    className="text-xs"
                                    style={{
                                        color: isDark ? 'rgba(232,237,245,0.35)' : '#94A3B8',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {release.date}
                                </span>
                            </div>

                            {/* Change list */}
                            <ul className="space-y-2.5">
                                {release.changes.map((change, ci) => (
                                    <li key={ci} className="flex items-start gap-3">
                                        <span
                                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                            style={{ background: release.accent }}
                                        />
                                        <span
                                            className="text-sm leading-relaxed"
                                            style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                                        >
                                            {change}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
