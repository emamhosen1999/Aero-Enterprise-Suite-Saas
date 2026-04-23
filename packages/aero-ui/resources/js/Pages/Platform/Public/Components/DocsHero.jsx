import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const docStats = [
    { value: '500+', label: 'Articles' },
    { value: '40+', label: 'Modules covered' },
    { value: 'REST + GraphQL', label: 'API docs' },
    { value: 'Live examples', label: 'Code samples' },
];

export default function DocsHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();
    const [query, setQuery] = useState('');

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24 lg:px-10 xl:px-16">
            {/* Radial glows */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,229,255,0.12) 0%, transparent 66%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 45% 38% at 15% 80%, rgba(99,102,241,0.08) 0%, transparent 62%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 40% 30% at 88% 60%, rgba(255,179,71,0.06) 0%, transparent 60%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 bg-grid"
                style={{ opacity: isDark ? 0.22 : 0.06 }}
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="relative z-10 mx-auto max-w-screen-2xl"
            >
                {/* Label */}
                <motion.p variants={fadeUp} custom={0} className="label-mono mb-5" style={{ color: 'var(--cyan-aeos)' }}>
                    AEOS365 DOCUMENTATION
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
                    Everything you need to&nbsp;
                    <span className="text-gradient-cyan">build with aeos365.</span>
                </motion.h1>

                {/* Sub-copy */}
                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    Guides, API references, quick-start tutorials, and integration recipes — organized by module
                    so you can go from onboarding to production in hours, not days.
                </motion.p>

                {/* Search bar — static UI */}
                <motion.div variants={fadeUp} custom={3} className="mt-8 max-w-2xl">
                    <div
                        className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                        style={{
                            background: isDark ? 'var(--pub-input-bg)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(0,229,255,0.22)' : 'rgba(100,116,139,0.22)',
                            boxShadow: isDark
                                ? '0 0 0 1px rgba(0,229,255,0.08), 0 8px 32px rgba(0,0,0,0.3)'
                                : '0 4px 24px rgba(15,23,42,0.08)',
                        }}
                    >
                        {/* Search icon */}
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: isDark ? 'rgba(232,237,245,0.40)' : '#94A3B8', flexShrink: 0 }}
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documentation, guides, and API references…"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
                            style={{
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                fontFamily: "'DM Sans', sans-serif",
                                caretColor: 'var(--cyan-aeos)',
                            }}
                        />
                        <span
                            className="label-mono hidden rounded-lg px-2 py-1 text-xs sm:inline-block"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                                color: isDark ? 'rgba(232,237,245,0.35)' : '#94A3B8',
                            }}
                        >
                            ⌘ K
                        </span>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-wrap gap-3">
                    <Link href="/signup" className="btn-primary px-6 py-3 text-sm md:text-base">
                        Get started free
                    </Link>
                    <Link
                        href="/pricing"
                        className="rounded-xl px-6 py-3 text-sm font-semibold transition-colors md:text-base"
                        style={{
                            color: isDark ? 'rgba(232,237,245,0.84)' : '#334155',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.15)'}`,
                        }}
                    >
                        View pricing
                    </Link>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                    }}
                >
                    {docStats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            variants={fadeUp}
                            custom={i + 4}
                            className="flex flex-col gap-1 px-5 py-5 sm:px-6"
                            style={{
                                background: isDark ? 'rgba(3,4,10,0.70)' : 'rgba(248,250,252,0.92)',
                            }}
                        >
                            <span
                                className="text-2xl font-extrabold md:text-3xl"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {stat.value}
                            </span>
                            <span
                                className="text-xs"
                                style={{
                                    color: isDark ? 'rgba(232,237,245,0.45)' : '#64748B',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    letterSpacing: '0.06em',
                                }}
                            >
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
