import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

// ─── Pin SVG Icon ──────────────────────────────────────────────────────────────
function PinIcon({ color }) {
    return (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

// ─── Clock Icon ────────────────────────────────────────────────────────────────
function ClockIcon({ color }) {
    return (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

// ─── Mail Icon ─────────────────────────────────────────────────────────────────
function MailIcon({ color }) {
    return (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

// ─── Response Icon ─────────────────────────────────────────────────────────────
function ResponseIcon({ color }) {
    return (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

// ─── Map Placeholder ───────────────────────────────────────────────────────────
function MapPlaceholder({ isDark }) {
    return (
        <div
            className="relative flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden rounded-2xl border"
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(99,102,241,0.05) 50%, rgba(3,4,10,0.60) 100%)'
                    : 'linear-gradient(135deg, rgba(224,242,254,0.90) 0%, rgba(224,231,255,0.70) 60%, rgba(248,250,252,0.95) 100%)',
                borderColor: isDark ? 'rgba(0,229,255,0.14)' : 'rgba(0,163,184,0.16)',
            }}
        >
            {/* Grid overlay */}
            <div
                className="pointer-events-none absolute inset-0 bg-grid"
                style={{ opacity: isDark ? 0.18 : 0.07 }}
            />
            {/* Subtle pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="h-40 w-40 rounded-full"
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, rgba(0,229,255,0.10) 0%, transparent 72%)'
                            : 'radial-gradient(circle, rgba(0,163,184,0.10) 0%, transparent 72%)',
                    }}
                />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="h-24 w-24 rounded-full border"
                    style={{ borderColor: isDark ? 'rgba(0,229,255,0.15)' : 'rgba(0,163,184,0.18)' }}
                />
            </div>

            {/* Center pin */}
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                        background: isDark ? 'rgba(0,229,255,0.14)' : 'rgba(0,163,184,0.12)',
                        border: `1.5px solid ${isDark ? 'rgba(0,229,255,0.30)' : 'rgba(0,163,184,0.28)'}`,
                    }}
                >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--cyan-aeos)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </div>
                <span
                    className="text-xs font-semibold tracking-wide"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.45)' : '#64748B',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    San Francisco, CA
                </span>
            </div>
        </div>
    );
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, isDark }) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: isDark ? 'rgba(0,229,255,0.09)' : 'rgba(0,163,184,0.08)' }}
            >
                {icon}
            </div>
            <div>
                <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.40)' : '#94A3B8',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    {label}
                </p>
                <p
                    className="mt-0.5 text-sm leading-snug"
                    style={{
                        color: isDark ? '#E8EDF5' : '#0F172A',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── ContactInfo ───────────────────────────────────────────────────────────────
export default function ContactInfo() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Subtle bg accent */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 55% 40% at 0% 60%, rgba(255,179,71,0.04) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 55% 40% at 0% 60%, rgba(255,179,71,0.05) 0%, transparent 65%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-screen-2xl">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">

                    {/* Left — info strips */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="flex flex-col gap-8"
                    >
                        <motion.div variants={fadeUp} custom={0} className="flex flex-col gap-1">
                            <p className="label-mono mb-2" style={{ color: 'var(--amber-aeos)' }}>
                                FIND US
                            </p>
                            <h2
                                className="text-2xl font-bold leading-snug md:text-3xl"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                Our office &amp; contact details.
                            </h2>
                            <p
                                className="mt-2 text-sm leading-relaxed"
                                style={{ color: isDark ? 'rgba(232,237,245,0.58)' : '#64748B', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                We&rsquo;re headquartered in San Francisco with a distributed team across Europe and Asia-Pacific.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} custom={1} className="flex flex-col gap-5">
                            <InfoRow
                                icon={<PinIcon color="var(--amber-aeos)" />}
                                label="Head Office"
                                value="100 Montgomery Street, Suite 1600, San Francisco, CA 94104, USA"
                                isDark={isDark}
                            />
                            <InfoRow
                                icon={<ClockIcon color="var(--cyan-aeos)" />}
                                label="Business Hours"
                                value="Monday – Friday, 9:00 AM – 6:00 PM UTC"
                                isDark={isDark}
                            />
                            <InfoRow
                                icon={<MailIcon color="var(--indigo-aeos)" />}
                                label="General Enquiries"
                                value="hello@aeos365.com"
                                isDark={isDark}
                            />
                            <InfoRow
                                icon={<ResponseIcon color="var(--cyan-aeos)" />}
                                label="Typical Response Time"
                                value="Within 1 business day · Priority SLA available on Enterprise plans"
                                isDark={isDark}
                            />
                        </motion.div>

                        {/* Micro-badges */}
                        <motion.div
                            variants={fadeUp}
                            custom={2}
                            className="flex flex-wrap gap-2"
                        >
                            {['ISO 27001', 'SOC 2 Type II', 'GDPR Compliant', 'CCPA Ready'].map((badge) => (
                                <span
                                    key={badge}
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                                        color: isDark ? 'rgba(232,237,245,0.55)' : '#64748B',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)'}`,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {badge}
                                </span>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right — map placeholder */}
                    <motion.div
                        variants={fadeUp}
                        custom={3}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="h-full min-h-[240px] lg:min-h-[380px]"
                    >
                        <MapPlaceholder isDark={isDark} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
