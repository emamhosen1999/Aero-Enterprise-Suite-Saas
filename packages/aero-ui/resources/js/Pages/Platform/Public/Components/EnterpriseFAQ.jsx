import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const faqItems = [
    {
        q: 'Can we adopt aeos365 without replacing everything at once?',
        a: 'Yes. Most enterprise customers start with priority modules and connect existing systems through phased integration and data synchronization.',
    },
    {
        q: 'How does aeos365 support governance and audit readiness?',
        a: 'The platform includes role-scoped workflows, approval traceability, and centralized policy controls designed for enterprise accountability needs.',
    },
    {
        q: 'Do you support multi-entity and multi-region operations?',
        a: 'Yes. The architecture supports multiple entities, localized processes, and tenant-safe boundaries to align with regional operating models.',
    },
    {
        q: 'What does implementation support look like?',
        a: 'Enterprise onboarding includes discovery, pilot deployment, rollout planning, enablement sessions, and iterative optimization support.',
    },
];

function EnterpriseFAQItem({ item, isOpen, onToggle, isDark, index }) {
    return (
        <motion.div
            variants={fadeUp}
            custom={index}
            className="border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.09)' }}
        >
            <button
                onClick={onToggle}
                className="focus-aeos flex w-full items-center justify-between gap-4 py-5 text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <span
                    className="text-base font-semibold leading-snug"
                    style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                >
                    {item.q}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke={isOpen ? 'var(--cyan-aeos)' : isDark ? 'rgba(232,237,245,0.4)' : '#64748B'}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </motion.svg>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p className="pb-5 text-sm leading-relaxed md:text-base" style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#64748B' }}>
                            {item.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function EnterpriseFAQ() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();
    const [openIdx, setOpenIdx] = useState(0);

    return (
        <section ref={ref} className="relative px-6 py-16 lg:px-10 xl:px-16">
            <div className="mx-auto max-w-4xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-8 text-center"
                >
                    <motion.p variants={fadeUp} custom={0} className="label-mono mb-3" style={{ color: 'var(--cyan-aeos)' }}>
                        FAQ
                    </motion.p>
                    <motion.h2 variants={fadeUp} custom={1} className="display-section" style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}>
                        Common enterprise questions, answered.
                    </motion.h2>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
                    {faqItems.map((item, index) => (
                        <EnterpriseFAQItem
                            key={item.q}
                            item={item}
                            index={index}
                            isDark={isDark}
                            isOpen={openIdx === index}
                            onToggle={() => setOpenIdx((prev) => (prev === index ? null : index))}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
