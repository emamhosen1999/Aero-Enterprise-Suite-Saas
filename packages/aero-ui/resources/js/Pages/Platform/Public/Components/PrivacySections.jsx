import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const sections = [
    {
        id: 'intro',
        title: 'Introduction',
        body: [
            'aeos365 provides business software for operations, collaboration, and reporting across enterprise teams. This Privacy Policy applies to our websites, public product pages, and services that reference this policy.',
            'By using aeos365, you acknowledge this policy and understand that we process information to deliver secure and reliable service.'
        ],
    },
    {
        id: 'data-collection',
        title: 'Data We Collect',
        body: [
            'We collect account data such as name, work email, organization, and role details when you register or are invited to a workspace.',
            'We also collect usage data including page interactions, feature usage, logs, and device metadata needed to maintain performance, auditability, and security.'
        ],
    },
    {
        id: 'usage',
        title: 'How We Use Data',
        body: [
            'We use data to operate and improve the platform, authenticate users, support tenant-level configuration, prevent abuse, and provide technical support.',
            'We may use aggregated and de-identified analytics to improve product quality, documentation, and onboarding experiences.'
        ],
    },
    {
        id: 'sharing',
        title: 'Data Sharing',
        body: [
            'We do not sell personal information. Data may be shared with trusted processors (such as infrastructure, email, and support providers) only as needed to deliver services under contractual safeguards.',
            'We may disclose information where required by law, legal process, or to protect the rights, safety, and security of customers, users, and aeos365.'
        ],
    },
    {
        id: 'retention-security',
        title: 'Retention & Security',
        body: [
            'We retain data for as long as needed to provide services, satisfy legal obligations, and resolve disputes. Retention windows vary by data type and tenant configuration.',
            'Security controls include encryption in transit, access controls, activity monitoring, and periodic security reviews. No method of transmission or storage is completely risk-free.'
        ],
    },
    {
        id: 'rights-choices',
        title: 'Your Rights & Choices',
        body: [
            'Depending on your region, you may have rights to access, correct, export, delete, or restrict processing of your personal data.',
            'Workspace administrators can manage many account-level controls directly. You can also contact us for request handling and verification support.'
        ],
    },
    {
        id: 'cookies',
        title: 'Cookies',
        body: [
            'We use cookies and similar technologies for authentication, session continuity, preferences, and analytics related to product reliability.',
            'You can manage cookie settings in your browser. Disabling certain cookies may impact parts of the service.'
        ],
    },
    {
        id: 'contact',
        title: 'Contact',
        body: [
            'For privacy requests, legal questions, or data protection concerns, contact our team through our contact page. Please include your organization and workspace details so we can process your request quickly.',
            'For technical integration or implementation guidance, our documentation contains setup, API, and operational references.'
        ],
    },
];

export default function PrivacySections() {
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

                            {section.id === 'rights-choices' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    Need account self-service options? Visit{' '}
                                    <Link href="/signup" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /signup
                                    </Link>
                                    {' '}to create a workspace, or review guides in{' '}
                                    <Link href="/docs" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /docs
                                    </Link>
                                    .
                                </p>
                            )}

                            {section.id === 'contact' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    Privacy-specific questions can be sent through{' '}
                                    <Link href="/contact" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /contact
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
