import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const posts = [
    {
        title: 'The 90-day operating system for fast-scaling teams',
        category: 'Operations',
        date: 'Apr 20, 2026',
        readTime: '8 min',
        excerpt: 'How to align weekly rituals, decision rights, and KPI ownership before growth creates fragmentation.',
    },
    {
        title: 'Designing finance workflows your non-finance teams can actually use',
        category: 'Finance',
        date: 'Apr 18, 2026',
        readTime: '7 min',
        excerpt: 'A practical model for moving from spreadsheet dependency to auditable, shared process orchestration.',
    },
    {
        title: 'Why modular platforms beat all-in-one hype in complex organizations',
        category: 'Product',
        date: 'Apr 14, 2026',
        readTime: '9 min',
        excerpt: 'When flexibility, governance, and deployment speed matter more than checkbox depth.',
    },
    {
        title: 'Playbook: rolling out AI assistants without creating shadow operations',
        category: 'AI Workflows',
        date: 'Apr 11, 2026',
        readTime: '6 min',
        excerpt: 'Guardrails, access controls, and accountability loops for safe AI deployment at scale.',
    },
    {
        title: 'People systems that keep culture intact during hypergrowth',
        category: 'People & Culture',
        date: 'Apr 08, 2026',
        readTime: '10 min',
        excerpt: 'From onboarding quality to manager enablement, the HR motions that prevent silent churn.',
    },
    {
        title: 'Security posture reviews that engineering and leadership both trust',
        category: 'Security',
        date: 'Apr 04, 2026',
        readTime: '11 min',
        excerpt: 'A cross-functional approach to evidence, incident readiness, and executive communication.',
    },
];

export default function BlogGrid() {
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
                <motion.div variants={fadeUp} custom={0} className="mb-6 flex items-end justify-between gap-4">
                    <h2
                        className="text-2xl font-bold md:text-3xl"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                    >
                        Latest stories
                    </h2>
                    <Link href="/blog" className="text-sm font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                        View all posts
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post, index) => (
                        <motion.article
                            key={post.title}
                            variants={fadeUp}
                            custom={index + 1}
                            className="group rounded-2xl border p-5 transition-transform duration-300 hover:-translate-y-0.5"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)',
                            }}
                        >
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                        color: isDark ? '#9EEBFF' : '#0C4A6E',
                                        background: isDark ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.14)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {post.category}
                                </span>
                                <span className="text-xs" style={{ color: isDark ? 'rgba(232,237,245,0.42)' : '#64748B' }}>
                                    {post.date} • {post.readTime}
                                </span>
                            </div>

                            <h3
                                className="text-xl font-bold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {post.title}
                            </h3>

                            <p
                                className="mt-3 text-sm leading-relaxed"
                                style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#475569', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                {post.excerpt}
                            </p>

                            <Link
                                href="/blog"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                                style={{ color: 'var(--indigo-aeos)', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                Read story
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
