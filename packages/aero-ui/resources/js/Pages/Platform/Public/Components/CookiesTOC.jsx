import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const tocLinks = [
    { href: '#what-cookies-are', label: '1. What Cookies Are' },
    { href: '#cookie-categories', label: '2. Cookie Categories' },
    { href: '#how-we-use-cookies', label: '3. How We Use Cookies' },
    { href: '#third-party-cookies', label: '4. Third-Party Cookies' },
    { href: '#managing-preferences', label: '5. Managing Preferences' },
    { href: '#browser-controls', label: '6. Browser Controls' },
    { href: '#updates', label: '7. Policy Updates' },
    { href: '#contact', label: '8. Contact' },
];

export default function CookiesTOC() {
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
                    <p className="label-mono mb-4" style={{ color: 'var(--amber-aeos)' }}>
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
                                    e.currentTarget.style.color = 'var(--amber-aeos)';
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(255,179,71,0.12)'
                                        : 'rgba(245,158,11,0.12)';
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
