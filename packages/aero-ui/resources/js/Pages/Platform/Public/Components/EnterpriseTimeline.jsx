import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const phases = [
    {
        phase: '01',
        title: 'Alignment & discovery',
        timeline: 'Week 1-2',
        body: 'Define business outcomes, map process dependencies, and confirm governance requirements across stakeholders.',
    },
    {
        phase: '02',
        title: 'Pilot deployment',
        timeline: 'Week 3-6',
        body: 'Launch priority modules for a focused business unit, validate controls, and refine integration touchpoints.',
    },
    {
        phase: '03',
        title: 'Enterprise rollout',
        timeline: 'Week 7-12',
        body: 'Scale adoption across entities with migration support, role enablement, and operational playbooks.',
    },
    {
        phase: '04',
        title: 'Optimization cycle',
        timeline: 'Ongoing',
        body: 'Continuously improve automation, decision cadence, and KPI tracking as organizational needs evolve.',
    },
];

export default function EnterpriseTimeline() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-10 flex flex-col gap-4 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono" style={{ color: 'var(--indigo-aeos)' }}>
                        IMPLEMENTATION JOURNEY
                    </motion.p>
                    <motion.h2 variants={fadeUp} custom={1} className="display-section" style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}>
                        Structured onboarding for enterprise velocity.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto max-w-3xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.6)' : '#64748B' }}
                    >
                        Move from strategy to execution with a phased model designed to minimize risk,
                        accelerate stakeholder adoption, and maintain delivery momentum.
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    {phases.map((item, index) => (
                        <motion.article
                            key={item.phase}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6 md:p-7"
                            style={{
                                borderColor: isDark ? 'rgba(99,102,241,0.26)' : 'rgba(79,70,229,0.21)',
                                background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(238,242,255,0.74)',
                            }}
                        >
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                                        color: isDark ? 'rgba(232,237,245,0.86)' : '#334155',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    PHASE {item.phase}
                                </span>
                                <span
                                    className="text-xs font-medium"
                                    style={{
                                        color: isDark ? 'rgba(232,237,245,0.54)' : '#64748B',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {item.timeline}
                                </span>
                            </div>

                            <h3
                                className="mb-3 text-xl font-semibold"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed md:text-base" style={{ color: isDark ? 'rgba(232,237,245,0.63)' : '#64748B' }}>
                                {item.body}
                            </p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
