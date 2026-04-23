import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function ContactCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-20 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <div
                    className="relative overflow-hidden rounded-3xl border px-6 py-14 text-center md:px-10 md:py-18"
                    style={{
                        borderColor: isDark ? 'rgba(99,102,241,0.20)' : 'rgba(99,102,241,0.18)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(99,102,241,0.09), rgba(0,229,255,0.06), rgba(3,4,10,0.70))'
                            : 'linear-gradient(145deg, rgba(224,231,255,0.92), rgba(224,242,254,0.80), rgba(248,250,252,0.98))',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        className="pointer-events-none absolute inset-0 bg-grid"
                        style={{ opacity: isDark ? 0.18 : 0.06 }}
                    />

                    {/* Radial glow — indigo top */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 55% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 65%)',
                        }}
                    />
                    {/* Radial glow — cyan bottom */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 40% 35% at 50% 100%, rgba(0,229,255,0.08) 0%, transparent 60%)',
                        }}
                    />

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6"
                    >
                        <motion.p
                            variants={fadeUp}
                            custom={0}
                            className="label-mono"
                            style={{ color: 'var(--indigo-aeos)' }}
                        >
                            NOT READY YET?
                        </motion.p>

                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="text-3xl font-extrabold leading-tight md:text-4xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            Explore the product first.
                        </motion.h2>

                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="max-w-lg text-base leading-relaxed"
                            style={{ color: isDark ? 'rgba(232,237,245,0.65)' : '#334155', fontFamily: "'DM Sans', sans-serif" }}
                        >
                            See every feature in detail, compare plans, or read the docs — before you ever talk to anyone.
                            No pressure, no sales calls until you&rsquo;re ready.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            custom={3}
                            className="flex flex-wrap justify-center gap-3"
                        >
                            <Link
                                href="/features"
                                className="btn-primary px-8 py-3 text-sm md:text-base"
                            >
                                Explore features
                            </Link>
                            <Link
                                href="/pricing"
                                className="rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-80 md:text-base"
                                style={{
                                    color: isDark ? '#E8EDF5' : '#0F172A',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.20)'}`,
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                See pricing
                            </Link>
                        </motion.div>

                        <motion.p
                            variants={fadeUp}
                            custom={4}
                            className="text-xs"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.30)' : '#94A3B8',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            No credit card &nbsp;·&nbsp; 14-day free trial &nbsp;·&nbsp; Cancel anytime
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
