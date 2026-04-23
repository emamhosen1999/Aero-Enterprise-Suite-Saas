import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const tags = ['Product Strategy', 'Automation', 'Leadership', 'Operations'];

export default function BlogHero() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-22 lg:px-10 xl:px-16">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 72% 56% at 50% -8%, rgba(0,229,255,0.12) 0%, transparent 66%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 44% 36% at 85% 70%, rgba(99,102,241,0.08) 0%, transparent 60%)',
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
                className="relative z-10 mx-auto max-w-screen-2xl"
            >
                <motion.p variants={fadeUp} custom={0} className="label-mono mb-5" style={{ color: 'var(--cyan-aeos)' }}>
                    AEOS INSIGHTS
                </motion.p>

                <motion.h1
                    variants={fadeUp}
                    custom={1}
                    className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
                    style={{
                        color: isDark ? '#E8EDF5' : '#0F172A',
                        fontFamily: "'Syne', sans-serif",
                    }}
                >
                    Field notes for teams scaling faster than their playbook.
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    custom={2}
                    className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg"
                    style={{
                        color: isDark ? 'rgba(232,237,245,0.68)' : '#475569',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    Long-form strategy, practical templates, and real stories from operators building resilient organizations with aeos365.
                </motion.p>

                <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-2.5">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide"
                            style={{
                                color: isDark ? '#B8C2D8' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(0,229,255,0.24)' : 'rgba(15,23,42,0.16)'}`,
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.72)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </motion.div>

                <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap gap-3">
                    <Link href="/blog" className="btn-primary px-6 py-3 text-sm md:text-base">
                        Latest Articles
                    </Link>
                    <Link
                        href="/docs"
                        className="rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80 md:text-base"
                        style={{
                            color: isDark ? '#E8EDF5' : '#0F172A',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.18)'}`,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        Read Docs
                    </Link>
                </motion.div>
            </motion.div>
        </section>
    );
}
