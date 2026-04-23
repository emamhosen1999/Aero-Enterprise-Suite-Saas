import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const proofPoints = [
    '99.99% uptime SLA options for mission-critical workloads',
    'Multi-entity governance with auditable enterprise controls',
    'Role-based approvals across HR, finance, operations, and procurement',
    'Deployment patterns for regional compliance and data residency',
];

export default function EnterpriseHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 70% 55% at 50% -10%, rgba(0,229,255,0.11) 0%, transparent 68%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 50% 40% at 85% 70%, rgba(99,102,241,0.09) 0%, transparent 62%)',
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
                className="relative z-10 mx-auto grid max-w-screen-2xl gap-10 lg:grid-cols-[1.18fr,0.82fr] lg:items-center"
            >
                <div className="space-y-6">
                    <motion.p variants={fadeUp} custom={0} className="label-mono" style={{ color: 'var(--cyan-aeos)' }}>
                        ENTERPRISE PLATFORM
                    </motion.p>

                    <motion.h1
                        variants={fadeUp}
                        custom={1}
                        className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                        style={{
                            color: isDark ? '#E8EDF5' : '#0F172A',
                            fontFamily: "'Syne', sans-serif",
                        }}
                    >
                        The operating system for modern enterprise execution.
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{
                            color: isDark ? 'rgba(232,237,245,0.72)' : '#475569',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        aeos365 helps complex organizations unify departments, standardize controls, and scale with confidence.
                        Connect strategy to execution across business units with one modular platform built for governance,
                        performance, and continuous adaptation.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                        <Link href="/signup" className="btn-primary px-6 py-3 text-sm md:text-base">
                            Request Executive Demo
                        </Link>
                        <Link
                            href="/pricing"
                            className="px-6 py-3 text-sm md:text-base rounded-xl font-semibold transition-colors"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.84)' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.15)'}`,
                            }}
                        >
                            Review Enterprise Plans
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        custom={4}
                        className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
                        style={{
                            color: isDark ? 'rgba(232,237,245,0.4)' : '#64748B',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        <span>Global readiness</span>
                        <span>•</span>
                        <span>Tenant-safe architecture</span>
                        <span>•</span>
                        <span>API-first integration</span>
                    </motion.div>
                </div>

                <motion.aside
                    variants={fadeUp}
                    custom={5}
                    className="rounded-2xl border p-6 md:p-8"
                    style={{
                        borderColor: isDark ? 'rgba(0,229,255,0.2)' : 'rgba(0,163,184,0.2)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))'
                            : 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(241,245,249,0.74))',
                        boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.45)' : '0 20px 56px rgba(15,23,42,0.12)',
                    }}
                >
                    <p className="label-mono mb-4" style={{ color: 'var(--cyan-aeos)' }}>
                        ENTERPRISE PROOF POINTS
                    </p>
                    <ul className="space-y-3">
                        {proofPoints.map((point) => (
                            <li
                                key={point}
                                className="flex items-start gap-3 text-sm md:text-base"
                                style={{
                                    color: isDark ? 'rgba(232,237,245,0.72)' : '#334155',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                <span className="mt-2 h-2 w-2 rounded-full" style={{ background: 'var(--cyan-aeos)' }} />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </motion.aside>
            </motion.div>
        </section>
    );
}
