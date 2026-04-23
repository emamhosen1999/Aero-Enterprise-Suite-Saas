import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer, scaleIn } from '../utils/motionVariants.js';

const SUBJECT_OPTIONS = [
    { value: '', label: 'Select a subject…' },
    { value: 'sales', label: 'Sales Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'billing', label: 'Billing' },
    { value: 'other', label: 'Other' },
];

const INITIAL_FORM = {
    fullName: '',
    workEmail: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
};

function SuccessPanel({ isDark, onReset }) {
    return (
        <motion.div
            key="success"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-5 py-16 text-center"
        >
            {/* Checkmark circle */}
            <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,229,255,0.12)', border: '1.5px solid rgba(0,229,255,0.30)' }}
            >
                <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="var(--cyan-aeos)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </div>

            <h3
                className="text-2xl font-bold"
                style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
            >
                Message received!
            </h3>
            <p
                className="max-w-sm text-sm leading-relaxed"
                style={{ color: isDark ? 'rgba(232,237,245,0.62)' : '#64748B' }}
            >
                Thanks for reaching out. A member of our team will get back to you within{' '}
                <strong style={{ color: isDark ? '#E8EDF5' : '#0F172A' }}>1 business day</strong>. In the
                meantime, feel free to explore our documentation.
            </p>
            <button
                onClick={onReset}
                className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{
                    background: 'rgba(0,229,255,0.10)',
                    border: '1px solid rgba(0,229,255,0.22)',
                    color: 'var(--cyan-aeos)',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                }}
            >
                Send another message
            </button>
        </motion.div>
    );
}

export default function ContactForm() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const inputStyle = (field) => ({
        background: isDark ? 'var(--pub-input-bg)' : '#FFFFFF',
        border: `1px solid ${errors[field]
            ? 'rgba(239,68,68,0.55)'
            : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.20)'}`,
        borderRadius: '12px',
        color: isDark ? '#E8EDF5' : '#0F172A',
        padding: '10px 14px',
        fontSize: '14px',
        width: '100%',
        outline: 'none',
        fontFamily: "'DM Sans', sans-serif",
        caretColor: 'var(--cyan-aeos)',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    });

    const labelStyle = {
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '6px',
        display: 'block',
        color: isDark ? 'rgba(232,237,245,0.75)' : '#475569',
        fontFamily: "'DM Sans', sans-serif",
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required.';
        if (!form.workEmail.trim()) {
            e.workEmail = 'Work email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) {
            e.workEmail = 'Please enter a valid email address.';
        }
        if (!form.company.trim()) e.company = 'Company name is required.';
        if (!form.subject) e.subject = 'Please select a subject.';
        if (!form.message.trim()) e.message = 'Please write a message.';
        else if (form.message.trim().length < 20) e.message = 'Message must be at least 20 characters.';
        return e;
    };

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setSubmitting(true);
        // Simulate async submission (client-side only, no real API call)
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
        }, 900);
    };

    const handleReset = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        setSubmitted(false);
    };

    const subjectIdMap = {
        sales: 'contact-form-sales',
        support: 'contact-form-support',
        billing: 'contact-form-billing',
        partnership: 'contact-form-partnership',
    };

    return (
        <section
            ref={ref}
            id="contact-form"
            className="relative px-6 py-16 lg:px-10 xl:px-16"
        >
            {/* Invisible anchor targets for each subject */}
            <span id="contact-form-sales" style={{ position: 'absolute', top: '-80px' }} />
            <span id="contact-form-support" style={{ position: 'absolute', top: '-80px' }} />
            <span id="contact-form-billing" style={{ position: 'absolute', top: '-80px' }} />
            <span id="contact-form-partnership" style={{ position: 'absolute', top: '-80px' }} />

            <div className="mx-auto max-w-screen-2xl">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    {/* Left copy */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="flex flex-col gap-5 lg:col-span-4 lg:pt-6"
                    >
                        <motion.p
                            variants={fadeUp}
                            custom={0}
                            className="label-mono"
                            style={{ color: 'var(--cyan-aeos)' }}
                        >
                            SEND A MESSAGE
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="text-2xl font-bold leading-snug md:text-3xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            Tell us how we can help.
                        </motion.h2>
                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="text-sm leading-relaxed md:text-base"
                            style={{ color: isDark ? 'rgba(232,237,245,0.60)' : '#64748B' }}
                        >
                            Fill in the form and select the topic that fits best — our team will route your
                            request to the right people and respond promptly.
                        </motion.p>

                        {/* Commitment list */}
                        <motion.ul
                            variants={staggerContainer}
                            initial="hidden"
                            animate={inView ? 'visible' : 'hidden'}
                            className="mt-2 flex flex-col gap-3"
                        >
                            {[
                                ['Responds within 1 business day', 'var(--cyan-aeos)'],
                                ['No unsolicited marketing', 'var(--indigo-aeos)'],
                                ['Data protected under ISO 27001', 'var(--amber-aeos)'],
                            ].map(([text, color], i) => (
                                <motion.li
                                    key={text}
                                    variants={fadeUp}
                                    custom={i + 3}
                                    className="flex items-center gap-2.5 text-sm"
                                    style={{ color: isDark ? 'rgba(232,237,245,0.70)' : '#475569' }}
                                >
                                    <span
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                        style={{ background: `rgba(${color === 'var(--cyan-aeos)' ? '0,229,255' : color === 'var(--indigo-aeos)' ? '99,102,241' : '255,179,71'},0.14)` }}
                                    >
                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </span>
                                    {text}
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    {/* Right form card */}
                    <motion.div
                        variants={fadeUp}
                        custom={2}
                        initial="hidden"
                        animate={inView ? 'visible' : 'hidden'}
                        className="lg:col-span-8"
                    >
                        <div
                            className="overflow-hidden rounded-3xl border"
                            style={{
                                background: isDark ? 'rgba(7,11,20,0.72)' : 'rgba(255,255,255,0.95)',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                boxShadow: isDark
                                    ? '0 8px 48px rgba(0,0,0,0.35)'
                                    : '0 8px 48px rgba(15,23,42,0.08)',
                            }}
                        >
                            <div className="px-6 py-8 md:px-10">
                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <SuccessPanel isDark={isDark} onReset={handleReset} />
                                    ) : (
                                        <motion.form
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onSubmit={handleSubmit}
                                            noValidate
                                        >
                                            {/* Row 1: Full name + Work email */}
                                            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                <div>
                                                    <label style={labelStyle}>
                                                        Full Name <span style={{ color: 'rgba(239,68,68,0.85)' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.fullName}
                                                        onChange={handleChange('fullName')}
                                                        placeholder="Jane Smith"
                                                        style={inputStyle('fullName')}
                                                        autoComplete="name"
                                                    />
                                                    {errors.fullName && (
                                                        <p style={{ color: 'rgba(239,68,68,0.90)', fontSize: '12px', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
                                                            {errors.fullName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>
                                                        Work Email <span style={{ color: 'rgba(239,68,68,0.85)' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={form.workEmail}
                                                        onChange={handleChange('workEmail')}
                                                        placeholder="jane@company.com"
                                                        style={inputStyle('workEmail')}
                                                        autoComplete="email"
                                                    />
                                                    {errors.workEmail && (
                                                        <p style={{ color: 'rgba(239,68,68,0.90)', fontSize: '12px', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
                                                            {errors.workEmail}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Row 2: Company + Phone */}
                                            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                <div>
                                                    <label style={labelStyle}>
                                                        Company <span style={{ color: 'rgba(239,68,68,0.85)' }}>*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.company}
                                                        onChange={handleChange('company')}
                                                        placeholder="Acme Corp"
                                                        style={inputStyle('company')}
                                                        autoComplete="organization"
                                                    />
                                                    {errors.company && (
                                                        <p style={{ color: 'rgba(239,68,68,0.90)', fontSize: '12px', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
                                                            {errors.company}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>
                                                        Phone <span style={{ color: isDark ? 'rgba(232,237,245,0.32)' : '#94A3B8', fontWeight: 400 }}>(optional)</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={form.phone}
                                                        onChange={handleChange('phone')}
                                                        placeholder="+1 555 000 0000"
                                                        style={inputStyle('phone')}
                                                        autoComplete="tel"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 3: Subject */}
                                            <div className="mb-5">
                                                <label style={labelStyle}>
                                                    Subject <span style={{ color: 'rgba(239,68,68,0.85)' }}>*</span>
                                                </label>
                                                <select
                                                    value={form.subject}
                                                    onChange={handleChange('subject')}
                                                    style={{
                                                        ...inputStyle('subject'),
                                                        appearance: 'none',
                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238892A4' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'right 14px center',
                                                        paddingRight: '40px',
                                                    }}
                                                >
                                                    {SUBJECT_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.subject && (
                                                    <p style={{ color: 'rgba(239,68,68,0.90)', fontSize: '12px', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>
                                                        {errors.subject}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Row 4: Message */}
                                            <div className="mb-7">
                                                <label style={labelStyle}>
                                                    Message <span style={{ color: 'rgba(239,68,68,0.85)' }}>*</span>
                                                </label>
                                                <textarea
                                                    value={form.message}
                                                    onChange={handleChange('message')}
                                                    rows={5}
                                                    placeholder="Describe what you need help with, or tell us about your project…"
                                                    style={{ ...inputStyle('message'), resize: 'vertical', minHeight: '120px' }}
                                                />
                                                <div className="mt-1 flex items-center justify-between">
                                                    {errors.message ? (
                                                        <p style={{ color: 'rgba(239,68,68,0.90)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                                                            {errors.message}
                                                        </p>
                                                    ) : (
                                                        <span />
                                                    )}
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: isDark ? 'rgba(232,237,245,0.28)' : '#94A3B8',
                                                            fontFamily: "'JetBrains Mono', monospace",
                                                        }}
                                                    >
                                                        {form.message.length} / 1000
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: isDark ? 'rgba(232,237,245,0.32)' : '#94A3B8',
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                    }}
                                                >
                                                    By submitting you agree to our{' '}
                                                    <a
                                                        href="#"
                                                        style={{ color: 'var(--cyan-aeos)', textDecoration: 'none' }}
                                                        onClick={(e) => e.preventDefault()}
                                                    >
                                                        Privacy Policy
                                                    </a>
                                                    .
                                                </p>
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="btn-primary flex items-center gap-2 px-7 py-3 text-sm font-semibold"
                                                    style={{
                                                        opacity: submitting ? 0.7 : 1,
                                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                                        fontFamily: "'DM Sans', sans-serif",
                                                    }}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                            </svg>
                                                            Sending…
                                                        </>
                                                    ) : (
                                                        <>
                                                            Send Message
                                                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                                            </svg>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
