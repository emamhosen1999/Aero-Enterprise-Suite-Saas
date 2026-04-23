import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const sections = [
    {
        id: 'what-cookies-are',
        title: 'What Cookies Are',
        body: [
            'Cookies are small text files stored in your browser when you visit a website. They help services remember session state, preferences, and interactions across requests.',
            'In this policy, "cookies" also includes similar browser storage technologies used for functionality, analytics, and security signals.',
        ],
    },
    {
        id: 'cookie-categories',
        title: 'Cookie Categories',
        body: [
            'Essential cookies are required for core platform behavior such as login continuity, tenant routing, and security protections. Without these, key services may not function.',
            'Performance, analytics, and preference cookies help us measure reliability, improve onboarding flows, and remember your non-sensitive settings between visits.',
        ],
    },
    {
        id: 'how-we-use-cookies',
        title: 'How We Use Cookies',
        body: [
            'We use cookies to keep users signed in, preserve language and interface preferences, route requests correctly, and detect abuse or unusual activity.',
            'We also use aggregate cookie-backed metrics to understand feature adoption and improve documentation, support quality, and product performance.',
        ],
    },
    {
        id: 'third-party-cookies',
        title: 'Third-Party Cookies',
        body: [
            'Some pages may load third-party services for analytics, support tooling, or embedded content. These providers can set their own cookies according to their policies.',
            'We only enable third-party integrations where needed for service delivery, performance monitoring, and customer support operations.',
        ],
    },
    {
        id: 'managing-preferences',
        title: 'Managing Preferences',
        body: [
            'Where available, you can manage cookie preferences through on-site controls and account settings to adjust non-essential tracking behavior.',
            'Your choices may be stored in a cookie so preferences persist. Clearing browser storage can reset those choices.',
        ],
    },
    {
        id: 'browser-controls',
        title: 'Browser Controls',
        body: [
            'Most browsers let you block, delete, or limit cookies through privacy settings. You can also configure alerts when a site tries to set cookies.',
            'If you disable essential cookies, sign-in sessions and some tenant-specific workflows may not work as expected.',
        ],
    },
    {
        id: 'updates',
        title: 'Updates',
        body: [
            'We may update this Cookie Policy when legal requirements, product capabilities, or third-party integrations change.',
            'When material changes are made, we update the "Last updated" date and publish the revised policy on this page.',
        ],
    },
    {
        id: 'contact',
        title: 'Contact',
        body: [
            'If you have questions about cookie use, privacy controls, or compliance requests, contact us with your organization and workspace context.',
            'For implementation and technical behavior details, review our product documentation and setup references.',
        ],
    },
];

export default function CookiesSections() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 pb-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-screen-2xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="space-y-5"
                >
                    {sections.map((section, index) => (
                        <motion.article
                            key={section.id}
                            id={section.id}
                            variants={fadeUp}
                            custom={index}
                            className="rounded-2xl border p-6 md:p-8"
                            style={{
                                background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.9)',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                scrollMarginTop: '110px',
                            }}
                        >
                            <h2
                                className="text-2xl font-bold md:text-3xl"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                {section.title}
                            </h2>

                            <div className="mt-4 space-y-4">
                                {section.body.map((paragraph, pIndex) => (
                                    <p
                                        key={`${section.id}-${pIndex}`}
                                        className="text-sm leading-relaxed md:text-base"
                                        style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            {section.id === 'managing-preferences' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    Looking for setup guidance? Visit{' '}
                                    <Link href="/docs" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /docs
                                    </Link>
                                    {' '}for implementation references.
                                </p>
                            )}

                            {section.id === 'contact' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    Reach our team via{' '}
                                    <Link href="/contact" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /contact
                                    </Link>
                                    {' '}or create a workspace at{' '}
                                    <Link href="/signup" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /signup
                                    </Link>
                                    .
                                </p>
                            )}
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
