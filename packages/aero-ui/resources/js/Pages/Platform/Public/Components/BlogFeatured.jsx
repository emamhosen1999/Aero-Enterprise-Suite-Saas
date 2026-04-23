import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function BlogFeatured() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-8 lg:px-10 xl:px-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 lg:grid-cols-12"
            >
                <motion.article
                    variants={fadeUp}
                    custom={0}
                    className="relative overflow-hidden rounded-3xl border lg:col-span-8"
                    style={{
                        borderColor: isDark ? 'rgba(0,229,255,0.18)' : 'rgba(15,23,42,0.14)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(13,17,32,0.85), rgba(7,11,20,0.92))'
                            : 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(241,245,249,0.94))',
                        boxShadow: isDark ? '0 12px 50px rgba(0,0,0,0.35)' : '0 10px 36px rgba(15,23,42,0.08)',
                    }}
                >
                    <div
                        className="h-64 w-full md:h-72"
                        style={{
                            background:
                                'radial-gradient(circle at 20% 20%, rgba(0,229,255,0.32) 0%, transparent 40%), radial-gradient(circle at 85% 70%, rgba(99,102,241,0.28) 0%, transparent 45%), linear-gradient(135deg, rgba(3,4,10,0.96) 0%, rgba(13,17,32,0.95) 50%, rgba(30,41,59,0.9) 100%)',
                        }}
                    />

                    <div className="flex flex-col gap-4 px-6 py-7 md:px-8">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span
                                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                style={{
                                    color: 'var(--cyan-aeos)',
                                    border: '1px solid rgba(0,229,255,0.26)',
                                    background: isDark ? 'rgba(0,229,255,0.08)' : 'rgba(0,229,255,0.1)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                Featured
                            </span>
                            <span className="text-xs" style={{ color: isDark ? 'rgba(232,237,245,0.46)' : '#64748B' }}>
                                April 23, 2026 • 12 min read
                            </span>
                        </div>

                        <h2
                            className="text-2xl font-bold leading-tight md:text-3xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            How high-growth teams stop drowning in tools and start operating as one system.
                        </h2>

                        <p
                            className="text-sm leading-relaxed md:text-base"
                            style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#475569', fontFamily: "'DM Sans', sans-serif" }}
                        >
                            An operator playbook covering platform governance, cross-functional data contracts, and the fastest path from fragmented workflows to disciplined execution.
                        </p>

                        <Link
                            href="/blog"
                            className="inline-flex w-fit items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                            style={{ color: 'var(--cyan-aeos)', fontFamily: "'DM Sans', sans-serif" }}
                        >
                            Read featured article
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                    </div>
                </motion.article>

                <motion.aside
                    variants={fadeUp}
                    custom={1}
                    className="rounded-3xl border p-5 lg:col-span-4"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)',
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                    }}
                >
                    <p className="label-mono mb-3" style={{ color: 'var(--indigo-aeos)' }}>
                        Trending Paths
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/enterprise"
                            className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)',
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.9)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Enterprise Architecture Guide
                        </Link>
                        <Link
                            href="/features"
                            className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)',
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.9)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Product Surface Deep Dive
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)',
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.9)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Cost Model Benchmarks
                        </Link>
                    </div>
                </motion.aside>
            </motion.div>
        </section>
    );
}
