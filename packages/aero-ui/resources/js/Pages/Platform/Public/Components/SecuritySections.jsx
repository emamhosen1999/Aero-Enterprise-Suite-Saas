import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const sections = [
    {
        id: 'overview',
        title: 'Security Overview',
        body: [
            'We take the security of your data seriously. This policy describes the technical and organizational measures we implement to protect your information.',
            'Our security program is continuously reviewed and updated to address evolving threats, regulatory requirements, and the expanding scope of our platform capabilities.',
        ],
    },
    {
        id: 'iso-27001',
        title: 'ISO 27001 & Certifications',
        body: [
            'Our platform is designed to align with ISO/IEC 27001 information security management standards. We regularly review and update our security controls to maintain compliance with industry best practices and regulatory requirements.',
            'We assess our security posture against recognized frameworks to ensure our controls meet the expectations of enterprise customers operating in regulated industries.',
        ],
    },
    {
        id: 'encryption',
        title: 'Data Encryption',
        body: [
            'We apply encryption across all data layers — both in transit and at rest — using industry-standard algorithms and key management practices.',
        ],
        list: [
            'All data in transit is encrypted using TLS 1.2 or higher',
            'Data at rest is encrypted using AES-256',
            'Database credentials and secrets are stored in encrypted vaults',
            'Backups are encrypted before storage',
        ],
    },
    {
        id: 'access-control',
        title: 'Access Control',
        body: [
            'Access to platform resources is controlled through a layered model that enforces the principle of least privilege across all systems and user roles.',
        ],
        list: [
            'Role-based access control (RBAC) for all platform resources',
            'Multi-factor authentication (MFA) available for all accounts',
            'Principle of least privilege enforced across all systems',
            'Automated session expiry and token rotation',
            'Audit logs for all administrative actions',
        ],
    },
    {
        id: 'incident-response',
        title: 'Incident Response',
        body: [
            'Our incident response plan includes: detection and analysis, containment, eradication and recovery, and post-incident review. We commit to notifying affected customers within 72 hours of discovering a security breach that may affect their data.',
            'Our security team conducts regular tabletop exercises and simulation drills to ensure readiness and to continuously improve response capabilities.',
        ],
    },
    {
        id: 'data-residency',
        title: 'Data Residency',
        body: [
            'Customer data is stored in the region selected at the time of account creation. We do not transfer data outside the selected region without explicit consent, except where required by law.',
            'Tenants can view their configured data region from within their workspace settings. Region changes require a formal request and may involve data migration procedures.',
        ],
    },
    {
        id: 'penetration-testing',
        title: 'Penetration Testing',
        body: [
            'We conduct regular penetration testing through qualified third-party security firms. Results are reviewed by our security team and critical findings are remediated within 30 days of discovery.',
            'Penetration test summaries are available to enterprise customers upon request under NDA as part of our security review process.',
        ],
    },
    {
        id: 'vulnerability-disclosure',
        title: 'Vulnerability Disclosure',
        body: [
            'If you discover a security vulnerability, please report it to security@aeos365.com. We follow responsible disclosure practices and ask that you give us a reasonable timeframe to remediate before public disclosure.',
            'We do not take legal action against researchers who report vulnerabilities in good faith. We aim to acknowledge reports within 5 business days and provide remediation timelines as findings are validated.',
        ],
        emailLink: 'security@aeos365.com',
    },
];

export default function SecuritySections() {
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

                            {section.body.length > 0 && (
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
                            )}

                            {section.list && (
                                <ul className="mt-4 space-y-2">
                                    {section.list.map((item, i) => (
                                        <li
                                            key={`${section.id}-li-${i}`}
                                            className="flex items-start gap-2 text-sm leading-relaxed md:text-base"
                                            style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                                        >
                                            <span
                                                className="mt-1 shrink-0 text-xs"
                                                style={{ color: 'var(--cyan-aeos)' }}
                                            >
                                                ▸
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.id === 'vulnerability-disclosure' && (
                                <p
                                    className="mt-5 text-sm leading-relaxed md:text-base"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.72)' : '#334155' }}
                                >
                                    To report a vulnerability, email{' '}
                                    <a
                                        href="mailto:security@aeos365.com"
                                        className="font-semibold"
                                        style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                                    >
                                        security@aeos365.com
                                    </a>
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
