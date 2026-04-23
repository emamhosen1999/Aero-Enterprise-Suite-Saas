import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function DocsCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-20 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <div
                    className="relative overflow-hidden rounded-3xl border px-6 py-14 text-center md:px-10 md:py-20"
                    style={{
                        borderColor: isDark ? 'rgba(0,229,255,0.20)' : 'rgba(0,163,184,0.20)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(0,229,255,0.10), rgba(99,102,241,0.09), rgba(3,4,10,0.72))'
                            : 'linear-gradient(145deg, rgba(224,242,254,0.96), rgba(224,231,255,0.82), rgba(248,250,252,0.98))',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        className="pointer-events-none absolute inset-0 bg-grid"
                        style={{ opacity: isDark ? 0.20 : 0.06 }}
                    />
                    {/* Radial glow */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background: 'radial-gradient(ellipse 55% 50% at 50% 100%, rgba(0,229,255,0.10) 0%, transparent 65%)',
                        }}
                    />

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6"
                    >
                        <motion.p
                            variants={fadeUp}
                            custom={0}
                            className="label-mono"
                            style={{ color: 'var(--cyan-aeos)' }}
                        >
                            READY TO BUILD?
                        </motion.p>

                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            Start building on aeos365 today.
                        </motion.h2>

                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="max-w-xl text-base leading-relaxed md:text-lg"
                            style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#334155' }}
                        >
                            Your docs account is included with every plan — free to start, no credit card
                            required. Or contact our team to get a guided walkthrough for your use case.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            custom={3}
                            className="flex flex-wrap justify-center gap-3"
                        >
                            <Link href="/signup" className="btn-primary px-8 py-3 text-sm md:text-base">
                                Get started for free
                            </Link>
                            <Link
                                href="/contact"
                                className="rounded-xl px-8 py-3 text-sm font-semibold md:text-base"
                                style={{
                                    color: isDark ? '#E8EDF5' : '#0F172A',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.20)'}`,
                                }}
                            >
                                Talk to our team
                            </Link>
                        </motion.div>

                        <motion.p
                            variants={fadeUp}
                            custom={4}
                            className="text-xs"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.35)' : '#94A3B8',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            Free plan · No credit card · Up to 5 users
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
