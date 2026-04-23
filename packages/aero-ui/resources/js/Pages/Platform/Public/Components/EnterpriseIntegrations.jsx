import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const categories = [
    {
        title: 'Identity & access',
        examples: 'SSO, enterprise directory sync, role federation',
    },
    {
        title: 'Finance stack',
        examples: 'Accounting platforms, treasury tools, payment rails',
    },
    {
        title: 'Data & analytics',
        examples: 'BI tools, data warehouses, event pipelines',
    },
    {
        title: 'Operations ecosystem',
        examples: 'WMS, procurement networks, service management tools',
    },
];

export default function EnterpriseIntegrations() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto grid max-w-screen-2xl gap-8 lg:grid-cols-[1fr,1fr] lg:items-center">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="space-y-5"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono" style={{ color: 'var(--cyan-aeos)' }}>
                        INTEGRATION ECOSYSTEM
                    </motion.p>
                    <motion.h2 variants={fadeUp} custom={1} className="display-section" style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}>
                        Fit seamlessly into your enterprise landscape.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.6)' : '#64748B' }}
                    >
                        aeos365 is designed for coexistence and gradual transformation. Integrate with existing
                        systems while modernizing your core operational backbone.
                    </motion.p>
                    <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                        <Link href="/features" className="btn-primary px-5 py-2.5 text-sm">
                            Explore Platform Modules
                        </Link>
                        <Link
                            href="/docs"
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.84)' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.14)'}`,
                            }}
                        >
                            Read Integration Docs
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                    {categories.map((category, index) => (
                        <motion.article
                            key={category.title}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-5"
                            style={{
                                borderColor: isDark ? 'rgba(0,229,255,0.16)' : 'rgba(0,163,184,0.17)',
                                background: isDark ? 'rgba(0,229,255,0.06)' : 'rgba(240,249,255,0.8)',
                            }}
                        >
                            <h3
                                className="mb-2 text-base font-semibold"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {category.title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(232,237,245,0.58)' : '#64748B' }}>
                                {category.examples}
                            </p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
