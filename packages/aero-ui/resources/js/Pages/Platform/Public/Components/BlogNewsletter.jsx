import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

export default function BlogNewsletter() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();
    const [email, setEmail] = useState('');

    return (
        <section ref={ref} className="relative px-6 py-12 lg:px-10 xl:px-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="mx-auto max-w-screen-xl"
            >
                <motion.div
                    variants={fadeUp}
                    custom={0}
                    className="relative overflow-hidden rounded-3xl border px-6 py-10 md:px-10"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)',
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(13,17,32,0.88), rgba(7,11,20,0.95))'
                            : 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(241,245,249,0.95))',
                    }}
                >
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background: 'radial-gradient(ellipse 50% 45% at 90% 10%, rgba(0,229,255,0.1) 0%, transparent 60%)',
                        }}
                    />

                    <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
                        <motion.div variants={fadeUp} custom={1} className="md:col-span-7">
                            <p className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                                Newsletter
                            </p>
                            <h3
                                className="text-2xl font-bold md:text-3xl"
                                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                            >
                                Get one practical play every week.
                            </h3>
                            <p
                                className="mt-3 text-sm leading-relaxed md:text-base"
                                style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#475569', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                No fluff. Just actionable frameworks for leaders building modern operating systems.
                            </p>
                        </motion.div>

                        <motion.form
                            variants={fadeUp}
                            custom={2}
                            onSubmit={(e) => e.preventDefault()}
                            className="md:col-span-5"
                        >
                            <label className="sr-only" htmlFor="blog-newsletter-email">
                                Email address
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    id="blog-newsletter-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                                    style={{
                                        color: isDark ? '#E8EDF5' : '#0F172A',
                                        borderColor: isDark ? 'rgba(0,229,255,0.24)' : 'rgba(15,23,42,0.14)',
                                        background: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                />
                                <button type="submit" className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold">
                                    Subscribe
                                </button>
                            </div>
                            <p
                                className="mt-3 text-xs"
                                style={{ color: isDark ? 'rgba(232,237,245,0.4)' : '#64748B', fontFamily: "'DM Sans', sans-serif" }}
                            >
                                By subscribing, you agree to our documentation and communication guidelines.{' '}
                                <Link href="/docs" style={{ color: 'var(--indigo-aeos)' }}>Docs</Link> ·{' '}
                                <Link href="/contact" style={{ color: 'var(--indigo-aeos)' }}>Contact</Link>
                            </p>
                        </motion.form>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
