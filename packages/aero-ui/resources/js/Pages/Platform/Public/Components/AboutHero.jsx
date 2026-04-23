import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const statBlocks = [
    { value: '2019', label: 'Founded' },
    { value: '40+', label: 'Modules' },
    { value: '120+', label: 'Countries served' },
    { value: '98%', label: 'Customer retention' },
];

export default function AboutHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24 lg:px-10 xl:px-16">
            {/* Radial glows */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 65% 50% at 50% -8%, rgba(0,229,255,0.10) 0%, transparent 68%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 45% 38% at 80% 75%, rgba(99,102,241,0.08) 0%, transparent 65%)',
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
                {/* Label */}
                <motion.p variants={fadeUp} custom={0} className="label-mono mb-5" style={{ color: 'var(--cyan-aeos)' }}>
                    ABOUT AEOS365
                </motion.p>

                {/* Headline */}
                <motion.h1
                    variants={fadeUp}
                    custom={1}
                    className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                    style={{
                        color: isDark ? '#E8EDF5' : '#0F172A',
                        fontFamily: "'Syne', sans-serif",
                    }}
                >
                    We build the operating&nbsp;layer modern businesses deserve.
                </motion.h1>

                {/* Sub-copy */}
                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.70)' : '#475569',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    aeos365 was founded with a single conviction: that every organization — from a fast-growing
                    startup to a global enterprise — deserves software that&nbsp;unifies people, processes, and
                    data without the complexity tax. Five years on, we&rsquo;re still building toward that promise.
                </motion.p>

                {/* CTAs */}
                <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
                    <Link href="/signup" className="btn-primary px-6 py-3 text-sm md:text-base">
                        Start for free
                    </Link>
                    <Link
                        href="/pricing"
                        className="rounded-xl px-6 py-3 text-sm font-semibold transition-colors md:text-base"
                        style={{
                            color: isDark ? 'rgba(232,237,245,0.84)' : '#334155',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.15)'}`,
                        }}
                    >
                        View plans
                    </Link>
                </motion.div>

                {/* Stat row */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                    }}
                >
                    {statBlocks.map((s, i) => (
                        <motion.div
                            key={s.label}
                            variants={fadeUp}
                            custom={i + 4}
                            className="flex flex-col gap-1 px-6 py-5"
                            style={{
                                background: isDark ? 'rgba(3,4,10,0.65)' : 'rgba(255,255,255,0.80)',
                            }}
                        >
                            <span
                                className="text-3xl font-extrabold md:text-4xl"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {s.value}
                            </span>
                            <span
                                className="text-xs font-medium uppercase tracking-wider"
                                style={{
                                    color: isDark ? 'rgba(232,237,245,0.45)' : '#64748B',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {s.label}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
