import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function DocsApiHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-12 md:pt-36 md:pb-16 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 72% 52% at 50% -4%, rgba(0,229,255,0.13) 0%, transparent 66%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 bg-grid"
                style={{ opacity: isDark ? 0.2 : 0.06 }}
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="relative z-10 mx-auto max-w-screen-2xl"
            >
                <motion.p
                    variants={fadeUp}
                    custom={0}
                    className="label-mono mb-4"
                    style={{ color: 'var(--cyan-aeos)' }}
                >
                    DEVELOPER DOCS
                </motion.p>

                <motion.h1
                    variants={fadeUp}
                    custom={1}
                    className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                    style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                >
                    REST API Reference
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="mt-6 max-w-3xl text-base leading-relaxed md:text-lg"
                    style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                >
                    Integrate your systems with the aeos365 platform using our comprehensive REST API.
                    Supports JSON, OAuth 2.0, and webhook events.
                </motion.p>

                <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center gap-3">
                    <div
                        className="inline-flex items-center rounded-xl border px-4 py-2 text-xs sm:text-sm"
                        style={{
                            background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.88)',
                            borderColor: isDark ? 'rgba(0,229,255,0.22)' : 'rgba(0,163,184,0.2)',
                            color: isDark ? 'rgba(232,237,245,0.6)' : '#64748B',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        Last updated: April 23, 2026
                    </div>

                    <div
                        className="inline-flex items-center rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold"
                        style={{
                            background: isDark ? 'rgba(0,229,255,0.1)' : 'rgba(0,163,184,0.08)',
                            borderColor: isDark ? 'rgba(0,229,255,0.3)' : 'rgba(0,163,184,0.25)',
                            color: isDark ? 'var(--cyan-aeos)' : '#0369a1',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        v2.0 — Stable
                    </div>
                </motion.div>

                {/* Decorative code snippet */}
                <motion.div variants={fadeUp} custom={4} className="mt-6 inline-block">
                    <pre
                        style={{
                            background: '#0D1117',
                            color: '#E6EDF3',
                            border: '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '10px',
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.8rem',
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            lineHeight: '1.6',
                        }}
                    >
                        <span style={{ color: '#8B949E' }}>{'// Authenticate all requests'}</span>
                        {'\n'}
                        <span style={{ color: '#79C0FF' }}>Authorization</span>
                        <span style={{ color: '#E6EDF3' }}>: </span>
                        <span style={{ color: '#A5D6FF' }}>Bearer </span>
                        <span style={{ color: '#FF7B72' }}>{'{'}</span>
                        <span style={{ color: '#E6EDF3' }}>token</span>
                        <span style={{ color: '#FF7B72' }}>{'}'}</span>
                    </pre>
                </motion.div>
            </motion.div>
        </section>
    );
}
