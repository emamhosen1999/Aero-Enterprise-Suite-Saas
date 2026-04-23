import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const capabilities = [
    {
        title: 'Global operating model',
        body: 'Standardize regional operations while preserving local compliance needs across countries, entities, and shared services.',
        badge: 'GL',
    },
    {
        title: 'Board-ready reporting',
        body: 'Surface real-time financial, workforce, and operational insights with executive dashboards and drill-down analytics.',
        badge: 'BI',
    },
    {
        title: 'Cross-functional workflows',
        body: 'Connect HR, finance, procurement, projects, and customer operations through integrated approvals and automation.',
        badge: 'WF',
    },
    {
        title: 'Modular transformation',
        body: 'Adopt high-impact modules first, then scale incrementally without disrupting your existing technology estate.',
        badge: 'MX',
    },
    {
        title: 'Tenant-secure isolation',
        body: 'Protect sensitive enterprise data with strict boundary controls, role scopes, and auditable access trails.',
        badge: 'TS',
    },
    {
        title: 'Enterprise-grade extensibility',
        body: 'Use APIs, webhooks, and integration patterns to orchestrate your ERP backbone across legacy and modern stacks.',
        badge: 'API',
    },
];

export default function EnterpriseCapabilities() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 pb-10 pt-6 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-10 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        CAPABILITIES
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        Built for high-complexity enterprise environments.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-3xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.6)' : '#64748B' }}
                    >
                        From governance to execution, each capability is designed to reduce process friction,
                        improve visibility, and accelerate decision-making across the organization.
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                    {capabilities.map((item, index) => (
                        <motion.article
                            key={item.title}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                            }}
                        >
                            <div
                                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold"
                                style={{
                                    background: isDark ? 'rgba(0,229,255,0.11)' : 'rgba(0,163,184,0.12)',
                                    color: 'var(--cyan-aeos)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {item.badge}
                            </div>
                            <h3
                                className="mb-3 text-xl font-semibold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {item.title}
                            </h3>
                            <p
                                className="text-sm leading-relaxed md:text-base"
                                style={{ color: isDark ? 'rgba(232,237,245,0.56)' : '#64748B' }}
                            >
                                {item.body}
                            </p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
