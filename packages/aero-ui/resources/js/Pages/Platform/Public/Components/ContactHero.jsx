import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function ContactHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section
            ref={ref}
            className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-20 lg:px-10 xl:px-16"
        >
            {/* Radial glows */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 55% at 50% -6%, rgba(0,229,255,0.11) 0%, transparent 68%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 40% 35% at 85% 72%, rgba(99,102,241,0.08) 0%, transparent 62%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 35% 30% at 10% 80%, rgba(255,179,71,0.06) 0%, transparent 58%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 bg-grid"
                style={{ opacity: isDark ? 0.20 : 0.06 }}
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="relative z-10 mx-auto max-w-screen-2xl"
            >
                {/* Label */}
                <motion.p
                    variants={fadeUp}
                    custom={0}
                    className="label-mono mb-5"
                    style={{ color: 'var(--cyan-aeos)' }}
                >
                    GET IN TOUCH
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
                    We&rsquo;d love to hear{' '}
                    <span className="text-gradient-cyan">from you.</span>
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
                    Whether you&rsquo;re evaluating aeos365, need technical assistance, or want to explore a
                    partnership — our team is ready to help. Choose the channel that fits your need best.
                </motion.p>

                {/* Pill CTAs */}
                <motion.div
                    variants={fadeUp}
                    custom={3}
                    className="mt-8 flex flex-wrap gap-3"
                >
                    <button
                        onClick={() => scrollTo('contact-form-sales')}
                        className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all"
                        style={{
                            background: isDark
                                ? 'rgba(0,229,255,0.12)'
                                : 'rgba(0,163,184,0.10)',
                            color: isDark ? 'var(--cyan-aeos)' : '#0891B2',
                            border: `1px solid ${isDark ? 'rgba(0,229,255,0.28)' : 'rgba(0,163,184,0.28)'}`,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        &#8594;&nbsp; Contact Sales
                    </button>
                    <button
                        onClick={() => scrollTo('contact-form-support')}
                        className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all"
                        style={{
                            background: isDark
                                ? 'rgba(99,102,241,0.12)'
                                : 'rgba(99,102,241,0.08)',
                            color: isDark ? 'var(--indigo-aeos)' : '#4F46E5',
                            border: `1px solid ${isDark ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.22)'}`,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        &#8594;&nbsp; Get Support
                    </button>
                </motion.div>

                {/* Trust micro-copy */}
                <motion.p
                    variants={fadeUp}
                    custom={4}
                    className="mt-8 text-xs"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.32)' : '#94A3B8',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Typical response within 1 business day&nbsp;·&nbsp;No spam, ever&nbsp;·&nbsp;ISO 27001 certified
                </motion.p>
            </motion.div>
        </section>
    );
}
