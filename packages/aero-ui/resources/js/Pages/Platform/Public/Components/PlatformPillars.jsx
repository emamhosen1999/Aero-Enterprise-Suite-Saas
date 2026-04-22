import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';
import { PLATFORM_PILLARS } from '../utils/pageData.js';

// ─── Pillar icon badge ─────────────────────────────────────────────────────
const PillarBadge = ({ label, accentColor }) => (
    <div
        style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
            color: accentColor,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
        }}
    >
        {label.slice(0, 2).toUpperCase()}
    </div>
);

export default function PlatformPillars() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative py-20 px-6 lg:px-10 overflow-hidden">
            {/* Background glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)',
                }}
            />

            <div className="max-w-screen-xl mx-auto">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="flex flex-col gap-12"
                >
                    {/* Section heading */}
                    <div className="text-center flex flex-col items-center gap-3">
                        <motion.h2
                            variants={fadeUp}
                            custom={0}
                            className="text-3xl sm:text-4xl font-extrabold"
                            style={{
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                fontFamily: "'Syne', sans-serif",
                            }}
                        >
                            Built differently.
                        </motion.h2>
                        {/* Cyan decorative underline */}
                        <motion.div
                            variants={fadeUp}
                            custom={0}
                            className="w-12 h-0.5 rounded-full"
                            style={{ background: 'var(--cyan-aeos)' }}
                        />
                        <motion.p
                            variants={fadeUp}
                            custom={1}
                            className="text-sm sm:text-base max-w-lg"
                            style={{
                                color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            The architecture behind aeos365
                        </motion.p>
                    </div>

                    {/* Pillars grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PLATFORM_PILLARS.map((pillar, idx) => (
                            <motion.div
                                key={pillar.title}
                                variants={fadeUp}
                                custom={idx}
                                className="relative flex flex-col gap-4 p-7 rounded-2xl"
                                style={{
                                    background: isDark
                                        ? 'rgba(255,255,255,0.04)'
                                        : 'white',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                                    boxShadow: isDark
                                        ? 'none'
                                        : '0 1px 4px rgba(0,0,0,0.05)',
                                }}
                            >
                                {/* Left accent border */}
                                <div
                                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                                    style={{
                                        background: pillar.accentColor,
                                        opacity: 0.6,
                                    }}
                                />

                                {/* Icon badge */}
                                <PillarBadge
                                    label={pillar.title}
                                    accentColor={pillar.accentColor}
                                />

                                {/* Title */}
                                <h3
                                    className="text-lg font-bold leading-snug"
                                    style={{
                                        color: isDark ? '#E8EDF5' : '#0F172A',
                                        fontFamily: "'Syne', sans-serif",
                                    }}
                                >
                                    {pillar.title}
                                </h3>

                                {/* Body */}
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{
                                        color: isDark
                                            ? 'rgba(255,255,255,0.5)'
                                            : '#64748B',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                >
                                    {pillar.body}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
