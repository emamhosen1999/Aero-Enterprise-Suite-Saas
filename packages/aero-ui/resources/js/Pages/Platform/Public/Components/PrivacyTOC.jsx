import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const tocLinks = [
    { href: '#intro', label: '1. Introduction' },
    { href: '#data-collection', label: '2. Data We Collect' },
    { href: '#usage', label: '3. How We Use Data' },
    { href: '#sharing', label: '4. Data Sharing' },
    { href: '#retention-security', label: '5. Retention & Security' },
    { href: '#rights-choices', label: '6. Your Rights & Choices' },
    { href: '#cookies', label: '7. Cookies' },
    { href: '#contact', label: '8. Contact' },
];

export default function PrivacyTOC() {
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
                    <p
                        className="label-mono mb-4"
                        style={{ color: 'var(--cyan-aeos)' }}
                    >
                        ON THIS PAGE
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                                    e.currentTarget.style.color = 'var(--cyan-aeos)';
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(0,229,255,0.08)'
                                        : 'rgba(0,163,184,0.08)';
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
