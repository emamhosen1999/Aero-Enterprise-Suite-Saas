import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function DocsApiCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <section ref={ref} className="relative px-6 pb-24 lg:px-10 xl:px-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="mx-auto max-w-screen-2xl"
            >
                <motion.div
                    variants={fadeUp}
                    custom={0}
                    className="cta-glass rounded-3xl p-8 md:p-10"
                >
                    <motion.h3
                        variants={fadeUp}
                        custom={1}
                        className="text-2xl font-bold md:text-3xl"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                    >
                        Ready to integrate?
                    </motion.h3>

                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mt-3 max-w-2xl text-sm leading-relaxed md:text-base"
                        style={{ color: isDark ? 'rgba(232,237,245,0.65)' : '#475569' }}
                    >
                        Generate your API key from the dashboard or contact our developer support team.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={3} className="mt-6 flex flex-wrap gap-3">
                        <Link href="/signup" className="btn-primary px-6 py-3 text-sm md:text-base">
                            Get Started Free
                        </Link>
                        <Link
                            href="/contact"
                            className="rounded-xl px-6 py-3 text-sm font-semibold transition-colors md:text-base"
                            style={{
                                color: isDark ? 'rgba(232,237,245,0.86)' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.15)'}`,
                                textDecoration: 'none',
                            }}
                        >
                            Contact Developer Support
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}
