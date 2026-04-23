import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const sections = [
    {
        id: 'acceptance',
        title: 'Acceptance of Terms',
        body: [
            'By accessing or using aeos365, you agree to these Terms and any policies incorporated by reference. If you use the platform on behalf of an organization, you represent that you are authorized to bind that organization.',
            'If you do not agree with these Terms, do not access or use the service.',
        ],
    },
    {
        id: 'account-responsibilities',
        title: 'Account Responsibilities',
        body: [
            'You are responsible for maintaining the confidentiality of account credentials and for activity under your account, including actions taken by invited users in your workspace.',
            'You must provide accurate account information, keep it current, and promptly notify us of any unauthorized access or suspected security incident.',
        ],
    },
    {
        id: 'acceptable-use',
        title: 'Acceptable Use',
        body: [
            'You may not use aeos365 to violate applicable law, infringe rights, interfere with platform operation, distribute malware, or attempt unauthorized access to systems or data.',
            'We may investigate suspected misuse and take reasonable protective actions, including temporary suspension, access restrictions, or data preservation where required by law.',
        ],
    },
    {
        id: 'billing-subscription',
        title: 'Billing & Subscription',
        body: [
            'Paid features are offered through subscription plans with pricing and limits disclosed at purchase or order form. Fees are due according to the selected billing cycle and are generally non-refundable except where required by law or contract.',
            'You authorize aeos365 and its payment processors to charge applicable fees, taxes, and renewals until cancellation. Plan upgrades, downgrades, and add-ons may affect current billing periods as described in your plan terms.',
        ],
    },
    {
        id: 'intellectual-property',
        title: 'Intellectual Property',
        body: [
            'aeos365 and its licensors retain all rights, title, and interest in the platform, software, documentation, branding, and related content. These Terms do not grant ownership rights to you.',
            'Subject to these Terms, we grant you a limited, non-exclusive, non-transferable right to access and use the service for your internal business operations.',
        ],
    },
    {
        id: 'confidentiality-data',
        title: 'Confidentiality & Data Handling',
        body: [
            'Each party may receive confidential information in connection with service use. The receiving party agrees to protect such information with reasonable care and use it only for permitted purposes.',
            'Customer data handling, security controls, and privacy rights are further described in our Privacy Policy and related data processing commitments.',
        ],
    },
    {
        id: 'availability-disclaimer',
        title: 'Service Availability & Disclaimer',
        body: [
            'We aim to provide reliable and secure service, but availability may be affected by maintenance, network conditions, third-party dependencies, or events beyond our control.',
            'Except as expressly stated in a written agreement, the service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.',
        ],
    },
    {
        id: 'liability',
        title: 'Limitation of Liability',
        body: [
            'To the maximum extent permitted by law, aeos365 and its affiliates are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill, or data.',
            'Where liability cannot be fully excluded, aggregate liability is limited to amounts paid by you for the affected services during the twelve months preceding the claim.',
        ],
    },
    {
        id: 'termination',
        title: 'Termination',
        body: [
            'You may stop using the service at any time and may cancel subscriptions according to your plan terms. We may suspend or terminate access for material breach, security risk, non-payment, or unlawful activity.',
            'Upon termination, access rights end, and data retention or deletion follows applicable law, contractual obligations, and documented retention practices.',
        ],
    },
    {
        id: 'governing-law-changes',
        title: 'Governing Law & Changes',
        body: [
            'These Terms are governed by the laws specified in your order form or applicable service agreement. If not specified, governing law is determined by the contracting aeos365 entity and applicable conflict rules.',
            'We may update these Terms from time to time. Material updates will be posted with a revised effective date, and continued use after that date constitutes acceptance of the updated Terms.',
        ],
    },
    {
        id: 'contact',
        title: 'Contact',
        body: [
            'For legal notices, contractual questions, or policy clarifications, contact our team through the official contact channel with your organization and workspace details.',
            'For implementation guidance, onboarding, and product references, consult our documentation library.',
        ],
    },
];

export default function TermsSections() {
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

                            {section.id === 'confidentiality-data' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    Review the companion privacy commitments in our legal privacy page and technical controls in{' '}
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
                                    Reach legal support via{' '}
                                    <Link href="/contact" className="font-semibold" style={{ color: 'var(--cyan-aeos)' }}>
                                        /contact
                                    </Link>
                                    {' '}or create a trial workspace at{' '}
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
