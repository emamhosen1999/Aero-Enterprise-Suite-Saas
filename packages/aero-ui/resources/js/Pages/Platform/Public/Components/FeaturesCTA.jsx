import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const FEATURE_TRIO = [
    { label: '17+ Modules', icon: '⬡' },
    { label: '14-day free trial', icon: '◈' },
    { label: 'Isolated per-tenant database', icon: '◉' },
];

export default function FeaturesCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative py-24 px-6 text-center overflow-hidden">
            {/* Background radial glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,229,255,0.07) 0%, transparent 70%)',
                }}
            />
            {/* Indigo secondary glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 45% 40% at 80% 70%, rgba(99,102,241,0.05) 0%, transparent 60%)',
                }}
            />

            {/* Decorative corner accents (same as CTASection.jsx pattern) */}
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none">
                <div
                    className="absolute top-4 left-4 w-px h-12"
                    style={{ background: 'linear-gradient(to bottom, var(--cyan-aeos), transparent)' }}
                />
                <div
                    className="absolute top-4 left-4 w-12 h-px"
                    style={{ background: 'linear-gradient(to right, var(--cyan-aeos), transparent)' }}
                />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none">
                <div
                    className="absolute bottom-4 right-4 w-px h-12"
                    style={{ background: 'linear-gradient(to top, var(--amber-aeos), transparent)' }}
                />
                <div
                    className="absolute bottom-4 right-4 w-12 h-px"
                    style={{ background: 'linear-gradient(to left, var(--amber-aeos), transparent)' }}
                />
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-7"
            >
                {/* Label mono */}
                <motion.p
                    variants={fadeUp}
                    custom={0}
                    className="label-mono"
                    style={{ color: 'var(--cyan-aeos)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 600 }}
                >
                    GET STARTED
                </motion.p>

                {/* Heading */}
                <motion.h2
                    variants={fadeUp}
                    custom={1}
                    className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
                    style={{
                        color: isDark ? '#E8EDF5' : '#0F172A',
                        fontFamily: "'Syne', sans-serif",
                    }}
                >
                    Start with the modules you need.
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="text-base sm:text-lg leading-relaxed"
                    style={{
                        color: isDark ? 'rgba(255,255,255,0.55)' : '#64748B',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    Add more as your business grows. No lock-in. No surprises.
                </motion.p>

                {/* Feature trio */}
                <motion.div
                    variants={fadeUp}
                    custom={3}
                    className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
                >
                    {FEATURE_TRIO.map((item, i) => (
                        <span key={item.label} className="flex items-center gap-2">
                            {i > 0 && (
                                <span
                                    className="hidden sm:inline"
                                    style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                                >
                                    ·
                                </span>
                            )}
                            <span
                                className="text-sm font-semibold"
                                style={{
                                    color: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                <span style={{ color: 'var(--cyan-aeos)', marginRight: 4 }}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </span>
                        </span>
                    ))}
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                    variants={fadeUp}
                    custom={4}
                    className="flex flex-col sm:flex-row items-center gap-3 mt-2"
                >
                    <a
                        href="/signup"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all"
                        style={{
                            background: 'var(--cyan-aeos)',
                            color: '#03040A',
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 0 28px rgba(0,229,255,0.28)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 0 40px rgba(0,229,255,0.44)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,255,0.28)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Start Free Trial
                    </a>
                    <a
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all"
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
                        Compare Plans
                    </a>
                </motion.div>
            </motion.div>
        </section>
    );
}
