import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const articles = [
    {
        title: 'Setting up multi-factor authentication for tenant users',
        category: 'Security',
        categoryColor: 'var(--cyan-aeos)',
        categoryBg: 'rgba(0,229,255,0.10)',
        categoryBgLight: 'rgba(0,163,184,0.10)',
        readTime: '5 min read',
        tags: ['MFA', 'Auth', 'Security'],
        views: '12.4k',
    },
    {
        title: 'Configuring payroll rules, tax bands, and deduction schedules',
        category: 'HRM',
        categoryColor: 'var(--indigo-aeos)',
        categoryBg: 'rgba(99,102,241,0.10)',
        categoryBgLight: 'rgba(79,70,229,0.09)',
        readTime: '9 min read',
        tags: ['Payroll', 'HRM', 'Tax'],
        views: '9.1k',
    },
    {
        title: 'Using the REST API: authentication, pagination, and rate limits',
        category: 'API',
        categoryColor: 'var(--amber-aeos)',
        categoryBg: 'rgba(255,179,71,0.10)',
        categoryBgLight: 'rgba(217,119,6,0.09)',
        readTime: '7 min read',
        tags: ['REST', 'OAuth2', 'Rate Limits'],
        views: '8.7k',
    },
    {
        title: 'Importing employees via CSV with field mapping and validation',
        category: 'HRM',
        categoryColor: 'var(--indigo-aeos)',
        categoryBg: 'rgba(99,102,241,0.10)',
        categoryBgLight: 'rgba(79,70,229,0.09)',
        readTime: '6 min read',
        tags: ['Import', 'CSV', 'Employees'],
        views: '7.9k',
    },
    {
        title: 'Creating custom approval workflows across HR and Finance',
        category: 'Platform',
        categoryColor: 'var(--cyan-aeos)',
        categoryBg: 'rgba(0,229,255,0.10)',
        categoryBgLight: 'rgba(0,163,184,0.10)',
        readTime: '8 min read',
        tags: ['Workflows', 'Approvals', 'HR'],
        views: '7.3k',
    },
    {
        title: 'Connecting Slack for notifications, approvals, and leave requests',
        category: 'Integrations',
        categoryColor: 'var(--amber-aeos)',
        categoryBg: 'rgba(255,179,71,0.10)',
        categoryBgLight: 'rgba(217,119,6,0.09)',
        readTime: '4 min read',
        tags: ['Slack', 'Notifications', 'Webhooks'],
        views: '6.8k',
    },
    {
        title: 'Multi-currency invoicing, FX rates, and realized gain/loss',
        category: 'Finance',
        categoryColor: 'var(--cyan-aeos)',
        categoryBg: 'rgba(0,229,255,0.10)',
        categoryBgLight: 'rgba(0,163,184,0.10)',
        readTime: '11 min read',
        tags: ['Finance', 'FX', 'Invoicing'],
        views: '5.9k',
    },
    {
        title: 'Subdomain tenancy architecture and database isolation explained',
        category: 'Platform',
        categoryColor: 'var(--indigo-aeos)',
        categoryBg: 'rgba(99,102,241,0.10)',
        categoryBgLight: 'rgba(79,70,229,0.09)',
        readTime: '10 min read',
        tags: ['Tenancy', 'Architecture', 'Databases'],
        views: '5.4k',
    },
];

export default function DocsPopular() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            {/* Accent */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: isDark
                        ? 'radial-gradient(ellipse 60% 40% at 90% 30%, rgba(255,179,71,0.04) 0%, transparent 62%)'
                        : 'radial-gradient(ellipse 60% 40% at 90% 30%, rgba(254,243,199,0.70) 0%, transparent 62%)',
                }}
            />

            <div className="relative mx-auto max-w-screen-2xl">
                {/* Header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
                >
                    <div>
                        <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                            MOST VIEWED
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="display-section"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                        >
                            Popular documentation.
                        </motion.h2>
                    </div>
                    <motion.a
                        variants={fadeUp}
                        custom={2}
                        href="#"
                        className="label-mono shrink-0 text-xs transition-opacity hover:opacity-70"
                        style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                    >
                        Browse all articles →
                    </motion.a>
                </motion.div>

                {/* Article grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    {articles.map((article, index) => (
                        <motion.a
                            key={article.title}
                            href="#"
                            variants={fadeUp}
                            custom={index}
                            className="group flex flex-col rounded-2xl border p-5 transition-all duration-200"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                                textDecoration: 'none',
                            }}
                            whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
                        >
                            {/* Category chip */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span
                                    className="label-mono inline-block rounded-full px-2.5 py-1 text-xs"
                                    style={{
                                        background: isDark ? article.categoryBg : article.categoryBgLight,
                                        color: article.categoryColor,
                                    }}
                                >
                                    {article.category}
                                </span>
                                <span
                                    className="text-xs"
                                    style={{
                                        color: isDark ? 'rgba(232,237,245,0.30)' : '#94A3B8',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {article.views} views
                                </span>
                            </div>

                            {/* Title */}
                            <h3
                                className="mb-3 grow text-sm font-semibold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                {article.title}
                            </h3>

                            {/* Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {article.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-md px-2 py-0.5 text-xs"
                                            style={{
                                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                                                color: isDark ? 'rgba(232,237,245,0.45)' : '#64748B',
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Read time */}
                                <span
                                    className="shrink-0 text-xs"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.30)' : '#94A3B8' }}
                                >
                                    {article.readTime}
                                </span>
                            </div>
                        </motion.a>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
