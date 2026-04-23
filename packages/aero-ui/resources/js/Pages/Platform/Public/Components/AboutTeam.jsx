import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const departments = [
    { name: 'Engineering', count: '60%', description: 'Full-stack, infrastructure, and mobile engineers spread across three continents.' },
    { name: 'Product & Design', count: '15%', description: 'Product managers and UX designers embedded within cross-functional squads.' },
    { name: 'Customer Success', count: '15%', description: 'Dedicated CSMs, implementation specialists, and solutions architects.' },
    { name: 'Go-to-Market', count: '10%', description: 'Sales, marketing, and partnerships bringing aeos365 to new markets every quarter.' },
];

const openRoles = [
    { title: 'Senior Full-Stack Engineer', team: 'Platform', location: 'Remote (Global)' },
    { title: 'Product Designer', team: 'HRM Module', location: 'Remote (EU / APAC)' },
    { title: 'Customer Success Manager', team: 'Enterprise', location: 'Remote (Americas)' },
    { title: 'Solutions Architect', team: 'Pre-sales', location: 'Remote (Global)' },
];

export default function AboutTeam() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Background glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 55% 45% at 80% 40%, rgba(0,229,255,0.05) 0%, transparent 65%)'
                        : 'radial-gradient(ellipse 55% 45% at 80% 40%, rgba(224,242,254,0.60) 0%, transparent 65%)',
                }}
            />

            <div className="relative mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-12 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        THE TEAM
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        A distributed team building for the world.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        We&rsquo;re a remote-first company with team members across 18 countries. Diversity of
                        background and timezone isn&rsquo;t a challenge we manage — it&rsquo;s a deliberate advantage
                        that makes our product better.
                    </motion.p>
                </motion.div>

                {/* Department breakdown */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {departments.map((dept, index) => (
                        <motion.div
                            key={dept.name}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                            }}
                        >
                            <p
                                className="mb-1 text-4xl font-extrabold"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {dept.count}
                            </p>
                            <p
                                className="mb-3 text-sm font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--cyan-aeos)', fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                {dept.name}
                            </p>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: isDark ? 'rgba(232,237,245,0.56)' : '#64748B' }}
                            >
                                {dept.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Open roles strip */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <motion.div
                        variants={fadeUp}
                        custom={0}
                        className="mb-6 flex items-center justify-between gap-4"
                    >
                        <h3
                            className="text-xl font-semibold"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            We&rsquo;re hiring
                        </h3>
                        <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--cyan-aeos)', fontFamily: "'DM Sans', sans-serif" }}
                        >
                            {openRoles.length} open roles
                        </span>
                    </motion.div>

                    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)' }}>
                        {openRoles.map((role, index) => (
                            <motion.div
                                key={role.title}
                                variants={fadeUp}
                                custom={index + 1}
                                className="flex flex-col gap-1 border-b px-6 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                                style={{
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                                    background: isDark
                                        ? index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                                        : index % 2 === 0 ? 'rgba(255,255,255,0.90)' : 'rgba(248,250,252,0.90)',
                                }}
                            >
                                <div>
                                    <p
                                        className="font-medium"
                                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                                    >
                                        {role.title}
                                    </p>
                                    <p
                                        className="mt-0.5 text-sm"
                                        style={{ color: isDark ? 'rgba(232,237,245,0.50)' : '#64748B' }}
                                    >
                                        {role.team} · {role.location}
                                    </p>
                                </div>
                                <span
                                    className="mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold sm:mt-0"
                                    style={{
                                        background: isDark ? 'rgba(0,229,255,0.09)' : 'rgba(0,163,184,0.10)',
                                        color: 'var(--cyan-aeos)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    Apply
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.p
                        variants={fadeUp}
                        custom={openRoles.length + 2}
                        className="mt-4 text-center text-sm"
                        style={{ color: isDark ? 'rgba(232,237,245,0.42)' : '#94A3B8' }}
                    >
                        All roles are fully remote. We hire based on impact, not location.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}
