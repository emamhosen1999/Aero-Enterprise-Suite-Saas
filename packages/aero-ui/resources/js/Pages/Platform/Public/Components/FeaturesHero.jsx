import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function FeaturesHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section
            ref={ref}
            className="relative py-24 px-6 text-center overflow-hidden"
        >
            {/* Primary cyan radial glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(0,229,255,0.10) 0%, transparent 65%)',
                }}
            />
            {/* Secondary indigo glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 45% 35% at 85% 70%, rgba(99,102,241,0.06) 0%, transparent 60%)',
                }}
            />
            {/* Amber tertiary glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 35% 30% at 15% 80%, rgba(255,179,71,0.05) 0%, transparent 60%)',
                }}
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6"
            >
                {/* Badge */}
                <motion.div variants={fadeUp} custom={0}>
                    <span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                        style={{
                            background: isDark
                                ? 'rgba(0,229,255,0.08)'
                                : 'rgba(0,229,255,0.1)',
                            border: '1px solid rgba(0,229,255,0.25)',
                            color: 'var(--cyan-aeos)',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: 'var(--cyan-aeos)' }}
                        />
                        All Features
                    </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    variants={fadeUp}
                    custom={1}
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
                    style={{
                        color: isDark ? '#E8EDF5' : '#0F172A',
                        fontFamily: "'Syne', sans-serif",
                    }}
                >
                    Every tool your enterprise needs.
                </motion.h1>

                {/* Sub-heading */}
                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="text-xl sm:text-2xl font-semibold"
                    style={{
                        color: isDark ? 'rgba(255,255,255,0.75)' : '#1E293B',
                        fontFamily: "'Syne', sans-serif",
                    }}
                >
                    One platform. 17+ modules.{' '}
                    <span className="text-gradient-cyan">Zero compromise.</span>
                </motion.p>

                {/* Body */}
                <motion.p
                    variants={fadeUp}
                    custom={3}
                    className="text-base sm:text-lg leading-relaxed max-w-2xl"
                    style={{
                        color: isDark ? 'rgba(255,255,255,0.55)' : '#64748B',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    From HR and payroll to supply chain and AI-assisted operations — aeos365 gives
                    every department the purpose-built tools they need, all sharing one
                    authentication layer, one permission system, and one tenant context.
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                    variants={fadeUp}
                    custom={4}
                    className="flex flex-col sm:flex-row items-center gap-3 mt-2"
                >
                    <a
                        href="#modules"
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{
                            background: 'var(--cyan-aeos)',
                            color: '#03040A',
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 0 24px rgba(0,229,255,0.25)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 0 36px rgba(0,229,255,0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 0 24px rgba(0,229,255,0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Explore All Modules
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </a>
                    <a
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{
                            background: 'transparent',
                            color: isDark ? 'rgba(255,255,255,0.75)' : '#374151',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)';
                            e.currentTarget.style.color = 'var(--cyan-aeos)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
                            e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.75)' : '#374151';
                        }}
                    >
                        View Pricing
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </motion.div>
            </motion.div>
        </section>
    );
}
