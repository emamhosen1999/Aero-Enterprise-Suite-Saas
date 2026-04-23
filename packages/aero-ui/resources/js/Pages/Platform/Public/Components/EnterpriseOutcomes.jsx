import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const outcomeStats = [
    {
        value: '38%',
        title: 'faster cross-team cycle times',
        detail: 'Through integrated approvals, shared workflows, and automation-first operating patterns.',
    },
    {
        value: '45%',
        title: 'improvement in process visibility',
        detail: 'With unified metrics spanning workforce, finance, operations, and customer execution.',
    },
    {
        value: '62%',
        title: 'reduction in manual reporting effort',
        detail: 'By replacing spreadsheet-heavy routines with live dashboards and governed data pipelines.',
    },
    {
        value: '3x',
        title: 'faster rollout of new operational initiatives',
        detail: 'Enabled by composable modules, consistent controls, and repeatable onboarding frameworks.',
    },
];

export default function EnterpriseOutcomes() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-18 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 70% 55% at 80% 40%, rgba(0,229,255,0.06) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-screen-2xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-10 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        CUSTOMER OUTCOMES
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        Measurable impact where it matters most.
                    </motion.h2>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                >
                    {outcomeStats.map((item, index) => (
                        <motion.article
                            key={item.title}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.84)',
                            }}
                        >
                            <p className="mb-2 text-4xl font-extrabold" style={{ color: 'var(--cyan-aeos)', fontFamily: "'Syne', sans-serif" }}>
                                {item.value}
                            </p>
                            <h3
                                className="mb-2 text-lg font-semibold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed md:text-base" style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#64748B' }}>
                                {item.detail}
                            </p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
