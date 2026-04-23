import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { PublicI18nProvider, usePublicI18n } from '../utils/publicI18n.jsx';
import { PublicThemeProvider, usePublicTheme } from '../utils/publicTheme.jsx';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/solid';

function ThemeToggle() {
    const { isDark, toggle } = usePublicTheme();
    const { t } = usePublicI18n();

    return (
        <motion.button
            onClick={toggle}
            aria-label={isDark ? t('switch_to_light_mode') : t('switch_to_dark_mode')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            style={{
                border: `1px solid ${isDark ? 'rgba(0,229,255,0.18)' : 'rgba(100,116,139,0.25)'}`,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)',
                color: isDark ? 'var(--pub-text-muted)' : '#64748B',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.span
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    </motion.span>
                ) : (
                    <motion.span
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

function LanguageSelector() {
    const { locale, language, setLocale, languages, t } = usePublicI18n();
    const { isDark } = usePublicTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handler = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <motion.button
                onClick={() => setOpen((value) => !value)}
                aria-label={t('select_language')}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
                style={{
                    border: `1px solid ${isDark ? 'rgba(0,229,255,0.18)' : 'rgba(100,116,139,0.25)'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)',
                    color: isDark ? 'var(--pub-text-muted)' : '#64748B',
                    fontFamily: "'DM Sans', sans-serif",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
            >
                <span className="text-base leading-none" aria-hidden="true">{language.flag}</span>
                <span className="hidden text-[0.8rem] font-medium sm:block">{language.code.toUpperCase().slice(0, 2)}</span>
                <svg className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 z-[200] mt-2 overflow-hidden rounded-xl py-1"
                        style={{
                            minWidth: 168,
                            background: isDark ? 'rgba(7,11,20,0.97)' : 'rgba(255,255,255,0.97)',
                            border: `1px solid ${isDark ? 'rgba(0,229,255,0.12)' : 'rgba(100,116,139,0.18)'}`,
                            boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(15,23,42,0.12)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        {languages.map((lang) => (
                            <li key={lang.code}>
                                <button
                                    role="option"
                                    aria-selected={locale === lang.code}
                                    onClick={() => {
                                        setLocale(lang.code);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                                    style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        color: locale === lang.code ? 'var(--cyan-aeos)' : isDark ? 'var(--pub-text-muted)' : '#475569',
                                        background: locale === lang.code
                                            ? isDark ? 'rgba(0,229,255,0.07)' : 'rgba(0,163,184,0.07)'
                                            : 'transparent',
                                    }}
                                    onMouseEnter={(event) => {
                                        event.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
                                    }}
                                    onMouseLeave={(event) => {
                                        event.currentTarget.style.background = locale === lang.code
                                            ? isDark ? 'rgba(0,229,255,0.07)' : 'rgba(0,163,184,0.07)'
                                            : 'transparent';
                                    }}
                                >
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span className="flex-1">{lang.label}</span>
                                    {locale === lang.code && (
                                        <svg className="h-3.5 w-3.5" style={{ color: 'var(--cyan-aeos)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

function RegistrationLayoutInner({ children, steps = [], currentStep = 'account', savedData = {} }) {
    const { t } = usePublicI18n();
    const { isDark } = usePublicTheme();
    const activeIndex = Math.max(steps.findIndex((step) => step.key === currentStep), 0);

    const isStepComplete = (stepKey) => {
        const account = savedData?.account || {};
        const details = savedData?.details || {};
        const verification = savedData?.verification || {};
        const plan = savedData?.plan || {};
        const trial = savedData?.trial || {};

        if (stepKey === 'account') {
            return Boolean(account.type);
        }

        if (stepKey === 'details') {
            return Boolean(details.name && details.email && details.subdomain);
        }

        if (stepKey === 'verify-email') {
            return Boolean(verification.email_verified || verification.skipped_due_to_debug || verification.skipped_due_to_maintenance);
        }

        if (stepKey === 'verify-phone') {
            return Boolean(verification.phone_verified || verification.skipped_due_to_debug || verification.skipped_due_to_maintenance);
        }

        if (stepKey === 'plan') {
            return Boolean(plan.plan_id || (Array.isArray(plan.modules) && plan.modules.length > 0));
        }

        if (stepKey === 'payment') {
            return Boolean(trial.accept_terms || savedData?.payment?.completed);
        }

        if (stepKey === 'provisioning') {
            return Boolean(savedData?.provisioning?.tenant_id || verification.tenant_id);
        }

        return false;
    };

    const lastContiguousCompleteIndex = (() => {
        let lastIndex = -1;

        for (let index = 0; index < steps.length; index += 1) {
            if (isStepComplete(steps[index].key)) {
                lastIndex = index;
                continue;
            }

            break;
        }

        return lastIndex;
    })();

    const maxAllowedIndex = Math.max(activeIndex, lastContiguousCompleteIndex + 1);

    const handleStepNavigate = (step, index) => {
        if (!step?.route || index > maxAllowedIndex) {
            return;
        }

        router.visit(route(step.route));
    };

    return (
        <div className="public-page min-h-screen">
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

            <div className="relative z-10 min-h-screen px-4 py-8 md:px-8 lg:px-12">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <Link href="/" className="label-mono text-gradient-cyan text-sm">
                            <ArrowLeftCircleIcon className="h-5 w-5 inline-block -translate-y-px" />
                            <span className="ml-1">{t('back_to_home')}</span>
                        </Link>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <LanguageSelector />
                            <ThemeToggle />
                           
                            <Link href="/pricing" className="rounded-lg border border-[var(--pub-border)] px-3 py-1.5 text-sm text-[var(--pub-text-muted)] transition-colors hover:text-[var(--pub-text)]">
                                {t('compare_plans')}
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                        <aside className="glass rounded-2xl border border-[var(--pub-border)] p-5 md:p-6 h-fit sticky top-6">
                            <p className="label-mono mb-3 text-[var(--pub-text-muted)]">{t('registration_flow')}</p>
                            <ol className="space-y-3">
                                {steps.map((step, index) => {
                                    const isActive = step.key === currentStep;
                                    const isDone = index < activeIndex;
                                    const canNavigate = index <= maxAllowedIndex;

                                    return (
                                        <li key={step.key} className="flex items-center gap-3">
                                            <span
                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                                                    isActive
                                                        ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200'
                                                        : isDone
                                                            ? 'border-emerald-300 bg-emerald-400/20 text-emerald-200'
                                                            : isDark
                                                                ? 'border-white/20 bg-white/5 text-white/50'
                                                                : 'border-slate-300 bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleStepNavigate(step, index)}
                                                disabled={!canNavigate}
                                                className={`text-left transition-colors ${isActive ? 'font-medium text-[var(--pub-text)]' : 'text-[var(--pub-text-muted)]'} ${canNavigate ? 'hover:text-[var(--pub-text)]' : 'cursor-not-allowed opacity-50'}`}
                                                aria-label={step.label}
                                                title={canNavigate ? step.label : 'Complete previous step first'}
                                            >
                                                {step.label}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </aside>

                        <main className="glass rounded-2xl border border-[var(--pub-border)] p-5 md:p-8 lg:p-10">{children}</main>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegistrationLayout({ children, steps = [], currentStep = 'account', savedData = {} }) {
    return (
        <PublicThemeProvider>
            <PublicI18nProvider>
                <RegistrationLayoutInner steps={steps} currentStep={currentStep} savedData={savedData}>
                    {children}
                </RegistrationLayoutInner>
            </PublicI18nProvider>
        </PublicThemeProvider>
    );
}
