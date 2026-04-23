import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, slideLeft, slideRight, staggerContainer } from '../utils/motionVariants.js';

export default function AboutMission() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                {/* Section label */}
                <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    custom={0}
                    className="label-mono mb-10 text-center"
                    style={{ color: 'var(--cyan-aeos)' }}
                >
                    MISSION &amp; VISION
                </motion.p>

                {/* Two-column layout */}
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
                    {/* Mission */}
                    <motion.div
                        variants={slideRight}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="space-y-6"
                    >
                        <div
                            className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                            style={{
                                background: isDark ? 'rgba(0,229,255,0.09)' : 'rgba(0,163,184,0.10)',
                                color: 'var(--cyan-aeos)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            Our Mission
                        </div>
                        <h2
                            className="text-3xl font-bold leading-tight md:text-4xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            Simplify the complexity that slows organizations down.
                        </h2>
                        <p
                            className="text-base leading-relaxed md:text-lg"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Too many businesses operate across a patchwork of disconnected tools — each team
                            solving the same coordination problem in isolation. Our mission is to eliminate that
                            friction by providing one coherent, modular platform that scales with the organization,
                            not against it.
                        </p>
                        <p
                            className="text-base leading-relaxed md:text-lg"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            We believe software should remove barriers, not create them — which is why every design
                            decision at aeos365 starts with the question: &ldquo;Does this make the user&rsquo;s
                            working day clearer?&rdquo;
                        </p>
                    </motion.div>

                    {/* Vision */}
                    <motion.div
                        variants={slideLeft}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="space-y-6"
                    >
                        <div
                            className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                            style={{
                                background: isDark ? 'rgba(99,102,241,0.10)' : 'rgba(79,70,229,0.09)',
                                color: 'var(--indigo-aeos)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            Our Vision
                        </div>
                        <h2
                            className="text-3xl font-bold leading-tight md:text-4xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            A world where every organization runs at its true potential.
                        </h2>
                        <p
                            className="text-base leading-relaxed md:text-lg"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            We envision a future where the distance between a great idea and flawless execution
                            is measured in hours, not months. Where a ten-person team can operate with the
                            same process clarity as a ten-thousand-person enterprise.
                        </p>
                        <p
                            className="text-base leading-relaxed md:text-lg"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            By 2030, we aim to power the operational backbone of 10,000 organizations
                            across six continents — helping them move faster, govern better, and grow with confidence.
                        </p>
                    </motion.div>
                </div>

                {/* Divider accent */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    {[
                        { label: 'Purpose-built', body: 'Every module is designed for real operational workflows, not adapted from generic frameworks.' },
                        { label: 'Human-centred', body: 'Decisions are made for the person doing the work, not the IT admin configuring the system.' },
                        { label: 'Transparent by default', body: 'No hidden limits, opaque pricing, or gotcha upgrade walls — ever.' },
                    ].map((item, i) => (
                        <motion.div
                            key={item.label}
                            variants={fadeUp}
                            custom={i}
                            className="rounded-2xl border p-6"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.80)',
                            }}
                        >
                            <p
                                className="mb-2 text-sm font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--cyan-aeos)', fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                {item.label}
                            </p>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: isDark ? 'rgba(232,237,245,0.63)' : '#64748B' }}
                            >
                                {item.body}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
