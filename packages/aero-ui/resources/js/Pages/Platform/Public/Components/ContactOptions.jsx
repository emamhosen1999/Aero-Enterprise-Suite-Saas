import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const channels = [
    {
        key: 'sales',
        label: 'Sales Inquiry',
        color: 'var(--cyan-aeos)',
        colorRgb: '0,229,255',
        description:
            'Explore plans, request a demo, or discuss custom pricing for your organisation. Our sales team is ready to help you find the right fit.',
        cta: 'Contact Sales',
        href: '#contact-form-sales',
        icon: (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 8v4l3 3" />
            </svg>
        ),
    },
    {
        key: 'support',
        label: 'Technical Support',
        color: 'var(--indigo-aeos)',
        colorRgb: '99,102,241',
        description:
            'Experiencing an issue or have a technical question? Our engineering support team monitors tickets around the clock for paying customers.',
        cta: 'Open a Ticket',
        href: '#contact-form-support',
        icon: (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    },
    {
        key: 'billing',
        label: 'Billing & Accounts',
        color: 'var(--amber-aeos)',
        colorRgb: '255,179,71',
        description:
            'Questions about your invoice, subscription, or payment method? Our accounts team will sort it out quickly — usually within 4 business hours.',
        cta: 'Billing Query',
        href: '#contact-form-billing',
        icon: (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        ),
    },
    {
        key: 'partnership',
        label: 'Partnership',
        color: '#A78BFA',
        colorRgb: '167,139,250',
        description:
            'Integrators, resellers, system integrators, and technology partners — let&rsquo;s build something together. Tell us about your audience and goals.',
        cta: 'Explore Partnership',
        href: '#contact-form-partnership',
        icon: (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
];

export default function ContactOptions() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    const handleAnchorClick = (e, href) => {
        e.preventDefault();
        const id = href.replace('#', '');
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                {/* Section header */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-10 text-center"
                >
                    <motion.p
                        variants={fadeUp}
                        custom={0}
                        className="label-mono mb-3"
                        style={{ color: 'var(--cyan-aeos)' }}
                    >
                        CONTACT CHANNELS
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="text-2xl font-bold md:text-3xl"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                    >
                        Pick the right channel for your need.
                    </motion.h2>
                </motion.div>

                {/* Cards grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {channels.map((ch, i) => (
                        <motion.div
                            key={ch.key}
                            variants={fadeUp}
                            custom={i + 2}
                            className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.85)',
                                borderColor: isDark
                                    ? `rgba(${ch.colorRgb},0.18)`
                                    : `rgba(${ch.colorRgb},0.15)`,
                                boxShadow: isDark
                                    ? `0 0 0 0 rgba(${ch.colorRgb},0)`
                                    : `0 4px 24px rgba(15,23,42,0.06)`,
                            }}
                        >
                            {/* Hover glow */}
                            <div
                                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                style={{
                                    background: `radial-gradient(ellipse 60% 55% at 50% 0%, rgba(${ch.colorRgb},0.08) 0%, transparent 70%)`,
                                }}
                            />

                            {/* Icon */}
                            <div
                                className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
                                style={{
                                    background: `rgba(${ch.colorRgb},0.12)`,
                                    color: ch.color,
                                }}
                            >
                                {ch.icon}
                            </div>

                            {/* Label + description */}
                            <div className="relative z-10 flex flex-1 flex-col gap-2">
                                <h3
                                    className="text-base font-bold"
                                    style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                                >
                                    {ch.label}
                                </h3>
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.58)' : '#64748B' }}
                                    dangerouslySetInnerHTML={{ __html: ch.description }}
                                />
                            </div>

                            {/* CTA anchor */}
                            <a
                                href={ch.href}
                                onClick={(e) => handleAnchorClick(e, ch.href)}
                                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                                style={{ color: ch.color, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                {ch.cta}
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
