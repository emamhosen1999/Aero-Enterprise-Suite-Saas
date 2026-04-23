import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const categories = [
    { name: 'Operations', posts: 18 },
    { name: 'Product', posts: 14 },
    { name: 'Finance', posts: 9 },
    { name: 'People & Culture', posts: 11 },
    { name: 'AI Workflows', posts: 13 },
    { name: 'Security', posts: 7 },
];

export default function BlogCategories() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-8 lg:px-10 xl:px-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="mx-auto max-w-screen-2xl"
            >
                <motion.div variants={fadeUp} custom={0} className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <p className="label-mono" style={{ color: 'var(--cyan-aeos)' }}>
                        Browse Categories
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: isDark ? 'rgba(232,237,245,0.46)' : '#64748B' }}>
                        <span>Need implementation details?</span>
                        <Link href="/docs" className="font-semibold" style={{ color: 'var(--indigo-aeos)' }}>
                            Visit docs
                        </Link>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} custom={1} className="flex flex-wrap gap-3">
                    {categories.map((category, i) => (
                        <button
                            key={category.name}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                            style={{
                                color: isDark ? '#E8EDF5' : '#0F172A',
                                borderColor: i % 2 === 0
                                    ? (isDark ? 'rgba(0,229,255,0.24)' : 'rgba(0,163,184,0.24)')
                                    : (isDark ? 'rgba(99,102,241,0.24)' : 'rgba(99,102,241,0.26)'),
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.85)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            <span>{category.name}</span>
                            <span
                                className="rounded-full px-2 py-0.5 text-[11px]"
                                style={{
                                    color: isDark ? 'rgba(232,237,245,0.72)' : '#334155',
                                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {category.posts}
                            </span>
                        </button>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
