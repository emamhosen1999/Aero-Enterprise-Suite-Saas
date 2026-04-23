import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const channels = [
    {
        badge: 'GH',
        title: 'GitHub',
        description: 'Browse our open-source packages, report bugs, and contribute to aero-ui and aero-core. Pull requests welcome.',
        cta: 'Open GitHub',
        href: '#',
        accent: 'var(--cyan-aeos)',
        accentBg: 'rgba(0,229,255,0.10)',
        accentBgLight: 'rgba(0,163,184,0.10)',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
        ),
    },
    {
        badge: 'DS',
        title: 'Discord Community',
        description: 'Join 8,000+ aeos365 users and builders — ask questions, share workflows, and get help from the community.',
        cta: 'Join Discord',
        href: '#',
        accent: 'var(--indigo-aeos)',
        accentBg: 'rgba(99,102,241,0.10)',
        accentBgLight: 'rgba(79,70,229,0.09)',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
        ),
    },
    {
        badge: 'SP',
        title: 'Support Portal',
        description: 'Submit tickets, track resolutions, and access your organization\'s support history. Enterprise plans get a dedicated CSM.',
        cta: 'Open support ticket',
        href: '/contact',
        accent: 'var(--amber-aeos)',
        accentBg: 'rgba(255,179,71,0.10)',
        accentBgLight: 'rgba(217,119,6,0.09)',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
];

export default function DocsCommunity() {
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
                        ? 'linear-gradient(180deg, transparent 0%, rgba(3,4,10,0.55) 100%)'
                        : 'transparent',
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
                        COMMUNITY & SUPPORT
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="display-section"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}
                    >
                        You&rsquo;re never building alone.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
                        style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                    >
                        Whether you need a quick answer, a deep integration guide, or a dedicated support partner —
                        the aeos365 community and team are here to help.
                    </motion.p>
                </motion.div>

                {/* Channel cards */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-5 md:grid-cols-3"
                >
                    {channels.map((channel, index) => (
                        <motion.div
                            key={channel.title}
                            variants={fadeUp}
                            custom={index}
                            className="flex flex-col rounded-2xl border p-6 md:p-8"
                            style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.88)',
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                                style={{
                                    background: isDark ? channel.accentBg : channel.accentBgLight,
                                    color: channel.accent,
                                }}
                            >
                                {channel.icon}
                            </div>

                            {/* Content */}
                            <h3
                                className="mb-2 text-xl font-semibold leading-snug"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {channel.title}
                            </h3>
                            <p
                                className="mb-6 grow text-sm leading-relaxed md:text-base"
                                style={{ color: isDark ? 'rgba(232,237,245,0.56)' : '#64748B' }}
                            >
                                {channel.description}
                            </p>

                            {/* CTA link */}
                            <a
                                href={channel.href}
                                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                                style={{ color: channel.accent, textDecoration: 'none' }}
                            >
                                {channel.cta}
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </a>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
