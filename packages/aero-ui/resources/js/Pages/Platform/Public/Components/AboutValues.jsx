import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const values = [
    {
        badge: '01',
        title: 'Integrity in everything',
        body: 'We say what we mean and ship what we promise. No vaporware, no bait-and-switch features, no hidden costs buried in the fine print.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
    },
    {
        badge: '02',
        title: 'Radical transparency',
        body: 'Our roadmap is public. Our pricing is plain English. Our uptime data is live. Customers deserve to make informed decisions.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.10)',
        accentBgLight: 'rgba(79,70,229,0.09)',
    },
    {
        badge: '03',
        title: 'User-first design',
        body: 'Every interface decision is measured against a simple test: does this make the person doing the actual work faster and less stressed?',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.10)',
        accentBgLight: 'rgba(217,119,6,0.09)',
    },
    {
        badge: '04',
        title: 'Continuous innovation',
        body: 'We ship meaningful improvements every sprint, informed by direct customer collaboration and emerging technology research.',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
    },
    {
        badge: '05',
        title: 'Customer obsession',
        body: 'Retention, not acquisition, is our north star. We win when customers grow their businesses using our platform — not when they sign a contract.',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.10)',
        accentBgLight: 'rgba(79,70,229,0.09)',
    },
    {
        badge: '06',
        title: 'Collective ownership',
        body: 'Every team member owns outcomes, not just tasks. Collaboration across engineering, design, and customer success is how great products ship.',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.10)',
        accentBgLight: 'rgba(217,119,6,0.09)',
    },
];

export default function AboutValues() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Subtle background accent */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 60% 40% at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 60% 40% at 20% 50%, rgba(224,231,255,0.55) 0%, transparent 65%)',
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
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--indigo-aeos)' }}>
                        CORE VALUES
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        What we stand for, every single day.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        Values aren&rsquo;t posters on a wall. They&rsquo;re the criteria we use when making hard trade-offs —
                        in product decisions, hiring, and customer commitments.
                    </motion.p>
                </motion.div>

                {/* Value cards */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                    {values.map((item, index) => (
                        <motion.article
                            key={item.badge}
                            variants={fadeUp}
                            custom={index}
                            className="group rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                            }}
                        >
                            {/* Badge */}
                            <div
                                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
                                style={{
                                    background: isDark ? item.accentBg : item.accentBgLight,
                                    color: item.accent,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {item.badge}
                            </div>

                            <h3
                                className="mb-3 text-lg font-semibold"
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
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
