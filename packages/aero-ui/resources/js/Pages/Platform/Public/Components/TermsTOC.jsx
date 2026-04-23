import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const tocLinks = [
    { href: '#acceptance', label: '1. Acceptance of Terms' },
    { href: '#account-responsibilities', label: '2. Account Responsibilities' },
    { href: '#acceptable-use', label: '3. Acceptable Use' },
    { href: '#billing-subscription', label: '4. Billing & Subscription' },
    { href: '#intellectual-property', label: '5. Intellectual Property' },
    { href: '#confidentiality-data', label: '6. Confidentiality & Data Handling' },
    { href: '#availability-disclaimer', label: '7. Service Availability & Disclaimer' },
    { href: '#liability', label: '8. Limitation of Liability' },
    { href: '#termination', label: '9. Termination' },
    { href: '#governing-law-changes', label: '10. Governing Law & Changes' },
    { href: '#contact', label: '11. Contact' },
];

export default function TermsTOC() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="px-6 pb-8 lg:px-10 xl:px-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="mx-auto max-w-screen-2xl"
            >
                <motion.div
                    variants={fadeUp}
                    custom={0}
                    className="rounded-2xl border p-5 md:p-6"
                    style={{
                        background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.9)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    }}
                >
                    <p className="label-mono mb-4" style={{ color: 'var(--indigo-aeos)' }}>
                        ON THIS PAGE
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {tocLinks.map((item, index) => (
                            <motion.a
                                key={item.href}
                                href={item.href}
                                variants={fadeUp}
                                custom={index + 1}
                                className="rounded-lg px-3 py-2 text-sm transition-colors"
                                style={{
                                    color: isDark ? 'rgba(232,237,245,0.72)' : '#334155',
                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.03)',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--indigo-aeos)';
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(99,102,241,0.14)'
                                        : 'rgba(99,102,241,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = isDark ? 'rgba(232,237,245,0.72)' : '#334155';
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(255,255,255,0.02)'
                                        : 'rgba(15,23,42,0.03)';
                                }}
                            >
                                {item.label}
                            </motion.a>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
