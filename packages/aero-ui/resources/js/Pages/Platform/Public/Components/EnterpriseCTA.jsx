import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function EnterpriseCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-20 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <div
                    className="relative overflow-hidden rounded-3xl border px-6 py-12 text-center md:px-10 md:py-16"
                    style={{
                        borderColor: isDark ? 'rgba(0,229,255,0.22)' : 'rgba(0,163,184,0.21)',
                        background: isDark
                            ? 'linear-gradient(140deg, rgba(0,229,255,0.12), rgba(99,102,241,0.10), rgba(3,4,10,0.75))'
                            : 'linear-gradient(140deg, rgba(224,242,254,0.95), rgba(224,231,255,0.84), rgba(248,250,252,0.98))',
                    }}
                >
                    <div
                        className="pointer-events-none absolute inset-0 bg-grid"
                        style={{ opacity: isDark ? 0.22 : 0.07 }}
                    />
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6"
                    >
                        <motion.p variants={fadeUp} custom={0} className="label-mono" style={{ color: 'var(--cyan-aeos)' }}>
                            READY TO ELEVATE EXECUTION?
                        </motion.p>

                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            Move from fragmented systems to enterprise flow.
                        </motion.h2>

                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="max-w-2xl text-base leading-relaxed md:text-lg"
                            style={{ color: isDark ? 'rgba(232,237,245,0.7)' : '#334155' }}
                        >
                            Partner with aeos365 to modernize operations, strengthen governance, and unlock organization-wide performance.
                        </motion.p>

                        <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
                            <Link href="/signup" className="btn-primary px-7 py-3 text-sm md:text-base">
                                Speak with Enterprise Team
                            </Link>
                            <Link
                                href="/signup"
                                className="rounded-xl px-7 py-3 text-sm font-semibold md:text-base"
                                style={{
                                    color: isDark ? '#E8EDF5' : '#0F172A',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)'}`,
                                }}
                            >
                                Start Pilot Program
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
