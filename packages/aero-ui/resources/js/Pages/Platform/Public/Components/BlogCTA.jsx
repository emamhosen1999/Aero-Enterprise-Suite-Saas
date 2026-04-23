import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function BlogCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-20 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="relative overflow-hidden rounded-3xl border px-6 py-14 text-center md:px-10"
                    style={{
                        borderColor: isDark ? 'rgba(0,229,255,0.2)' : 'rgba(0,163,184,0.2)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(0,229,255,0.09), rgba(99,102,241,0.09), rgba(3,4,10,0.75))'
                            : 'linear-gradient(145deg, rgba(224,242,254,0.96), rgba(224,231,255,0.92), rgba(248,250,252,0.98))',
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-grid" style={{ opacity: isDark ? 0.16 : 0.06 }} />

                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-4" style={{ color: 'var(--cyan-aeos)' }}>
                        Build Your Next Chapter
                    </motion.p>

                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                    >
                        Turn strategy into shipped outcomes with one connected platform.
                    </motion.h2>

                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed"
                        style={{ color: isDark ? 'rgba(232,237,245,0.64)' : '#475569', fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Start with a free workspace, align your teams, and scale with confidence.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link href="/signup" className="btn-primary px-8 py-3 text-sm md:text-base">
                            Start Free Trial
                        </Link>
                        <Link
                            href="/contact"
                            className="rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-80 md:text-base"
                            style={{
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.20)'}`,
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            Talk to our team
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-xl px-6 py-3 text-sm font-semibold"
                            style={{ color: 'var(--indigo-aeos)', fontFamily: "'DM Sans', sans-serif" }}
                        >
                            Compare plans
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
