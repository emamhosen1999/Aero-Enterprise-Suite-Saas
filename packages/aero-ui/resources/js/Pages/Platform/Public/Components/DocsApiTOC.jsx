import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const tocLinks = [
    { href: '#overview', label: 'Overview & Base URL' },
    { href: '#authentication', label: 'Authentication' },
    { href: '#rate-limiting', label: 'Rate Limiting' },
    { href: '#endpoints', label: 'Core Endpoints' },
    { href: '#pagination', label: 'Pagination & Filtering' },
    { href: '#errors', label: 'Error Codes' },
    { href: '#versioning', label: 'API Versioning' },
    { href: '#sdks', label: 'SDKs & Tools' },
];

export default function DocsApiTOC() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const { isDark } = usePublicTheme();

    return (
        // hidden on mobile, visible on md+; sticky sidebar on lg+
        <aside ref={ref} className="hidden md:block lg:w-56 lg:shrink-0">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="lg:sticky"
                style={{ top: '90px' }}
            >
                <motion.div
                    variants={fadeUp}
                    custom={0}
                    className="rounded-2xl border p-4"
                    style={{
                        background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.9)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    }}
                >
                    <p className="label-mono mb-4" style={{ color: 'var(--cyan-aeos)' }}>
                        ON THIS PAGE
                    </p>

                    {/* md tablet: 2-col grid; lg desktop: vertical list */}
                    <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
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
                                    display: 'block',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--cyan-aeos)';
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(0,229,255,0.1)'
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
        </aside>
    );
}
