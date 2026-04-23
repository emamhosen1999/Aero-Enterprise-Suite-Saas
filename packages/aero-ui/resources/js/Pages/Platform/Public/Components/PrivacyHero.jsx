import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function PrivacyHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-12 md:pt-36 md:pb-16 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 72% 52% at 50% -4%, rgba(0,229,255,0.12) 0%, transparent 66%)',
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
                    LEGAL
                </motion.p>

                <motion.h1
                    variants={fadeUp}
                    custom={1}
                    className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                    style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                >
                    Privacy Policy
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="mt-6 max-w-3xl text-base leading-relaxed md:text-lg"
                    style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                >
                    This policy explains what information aeos365 collects, why we collect it, and how you can control your data.
                    We designed this document to be practical and readable for teams of any size.
                </motion.p>

                <motion.div
                    variants={fadeUp}
                    custom={3}
                    className="mt-8 inline-flex items-center rounded-xl border px-4 py-2 text-xs sm:text-sm"
                    style={{
                        background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.88)',
                        borderColor: isDark ? 'rgba(0,229,255,0.18)' : 'rgba(100,116,139,0.18)',
                        color: isDark ? 'rgba(232,237,245,0.6)' : '#64748B',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Last updated: April 23, 2026
                </motion.div>
            </motion.div>
        </section>
    );
}
