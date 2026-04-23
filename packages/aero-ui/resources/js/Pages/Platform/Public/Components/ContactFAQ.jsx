import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const FAQ_ITEMS = [
    {
        q: 'How quickly do you respond to enquiries?',
        a: 'For all enquiries submitted via our contact form, you can expect a response within 1 business day. Enterprise customers with a Premium or Platinum support plan benefit from a 4-hour SLA during business hours. If your matter is urgent, mark your subject as "Technical Support" and our on-call engineer will prioritise it.',
    },
    {
        q: 'Do you offer onboarding and implementation assistance?',
        a: 'Yes. Every paid plan includes guided onboarding via our in-app checklist and documentation. Business and Enterprise plans also receive a dedicated onboarding call with a Customer Success Engineer. For complex deployments — multi-tenant setups, custom integrations, or large-scale data migrations — our Professional Services team is available for a scoped engagement.',
    },
    {
        q: 'Is there a free trial?',
        a: 'Absolutely. aeos365 offers a full-featured 14-day trial with no credit card required. You get access to all core modules, unlimited users, and hands-on support from our team. At the end of your trial you can choose a plan, or your workspace will automatically shift to our permanent free tier with a generous feature set.',
    },
    {
        q: 'Can I speak to someone from Sales before committing?',
        a: 'Of course. Simply click "Contact Sales" above or select "Sales Inquiry" in the contact form. A member of our team will schedule a discovery call at your convenience — typically within 24 hours. We\u2019ll walk you through the platform, answer pricing questions, and build a proposal tailored to your organisation.',
    },
    {
        q: 'What is your support SLA for paid plans?',
        a: 'Starter: community forum + email, 48-hour response target. Growth: email + live chat, 24-hour response target. Business: priority email + live chat, 8-hour response target. Enterprise: dedicated Slack channel, phone escalation, and a 4-hour SLA with a named Account Engineer. SLA commitments are detailed in our Service Agreement, which Enterprise customers receive at contract signing.',
    },
];

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ item, isOpen, onToggle, isDark, index }) {
    return (
        <motion.div
            variants={fadeUp}
            custom={index}
            className="border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
        >
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-4 py-5 text-left focus-aeos"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1.25rem 0' }}
            >
                <span
                    className="text-base font-semibold leading-snug"
                    style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                >
                    {item.q}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke={isOpen ? 'var(--cyan-aeos)' : isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8'}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </motion.svg>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p
                            className="pb-5 text-sm leading-relaxed"
                            style={{
                                color: isDark ? 'rgba(255,255,255,0.55)' : '#64748B',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            {item.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── ContactFAQ ────────────────────────────────────────────────────────────────
export default function ContactFAQ() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();
    const [openIdx, setOpenIdx] = useState(0);

    const toggle = (idx) => setOpenIdx((prev) => (prev === idx ? null : idx));

    return (
        <section ref={ref} className="relative overflow-hidden px-6 py-16 lg:px-10 xl:px-16">
            {/* Subtle radial */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,229,255,0.03) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-3xl">
                {/* Heading */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="mb-12 text-center"
                >
                    <motion.p
                        variants={fadeUp}
                        custom={0}
                        className="label-mono mb-4"
                        style={{ color: 'var(--cyan-aeos)' }}
                    >
                        FAQ
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        custom={1}
                        className="text-3xl font-extrabold sm:text-4xl"
                        style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                    >
                        Common questions answered.
                    </motion.h2>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        className="mt-3 text-sm leading-relaxed"
                        style={{ color: isDark ? 'rgba(232,237,245,0.58)' : '#64748B', fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Can&rsquo;t find your answer? Use the contact form above or{' '}
                        <a
                            href="/docs"
                            style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                        >
                            browse the docs
                        </a>
                        .
                    </motion.p>
                </motion.div>

                {/* Accordion */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    {FAQ_ITEMS.map((item, i) => (
                        <FAQItem
                            key={item.q}
                            item={item}
                            isOpen={openIdx === i}
                            onToggle={() => toggle(i)}
                            isDark={isDark}
                            index={i + 2}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
