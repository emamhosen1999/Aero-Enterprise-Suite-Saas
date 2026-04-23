import { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, FOOTER_LINKS } from "../utils/pageData";
import { navVariants, mobileMenuVariants, mobileMenuItemVariants } from "../utils/motionVariants";
import { useNavScroll } from "../utils/hooks";
import { PublicI18nProvider, usePublicI18n, PUBLIC_LANGUAGES } from "../utils/publicI18n.jsx";
import { PublicThemeProvider, usePublicTheme } from "../utils/publicTheme.jsx";

// ─── Aeos Logo SVG ────────────────────────────────────────────────────────────
function AeosLogo({ size = 32 }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500"
           style={{ boxShadow: "0 0 16px rgba(0,229,255,0.5)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 16 16" fill="none">
          <path d="M2 8L8 2L14 8L8 14L2 8Z" stroke="#03040A" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="8" cy="8" r="2" fill="#03040A"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Dark / Light Toggle Button ───────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggle } = usePublicTheme();

  return (
    <motion.button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center justify-center rounded-lg transition-colors"
      style={{
        width: 36, height: 36,
        border: `1px solid ${isDark ? "rgba(0,229,255,0.18)" : "rgba(100,116,139,0.25)"}`,
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)",
        color: isDark ? "var(--pub-text-muted)" : "#64748B",
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Language Selector ────────────────────────────────────────────────────────
function LanguageSelector() {
  const { locale, language, setLocale, languages } = usePublicI18n();
  const { isDark } = usePublicTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
        style={{
          border: `1px solid ${isDark ? "rgba(0,229,255,0.18)" : "rgba(100,116,139,0.25)"}`,
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)",
          color: isDark ? "var(--pub-text-muted)" : "#64748B",
          fontFamily: "'DM Sans', sans-serif",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-base leading-none" aria-hidden="true">{language.flag}</span>
        <span className="hidden sm:block font-medium text-[0.8rem]">{language.code.toUpperCase().slice(0, 2)}</span>
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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
            className="absolute right-0 mt-2 z-[200] py-1 rounded-xl overflow-hidden"
            style={{
              minWidth: 168,
              background: isDark ? "rgba(7,11,20,0.97)" : "rgba(255,255,255,0.97)",
              border: `1px solid ${isDark ? "rgba(0,229,255,0.12)" : "rgba(100,116,139,0.18)"}`,
              boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(15,23,42,0.12)",
              backdropFilter: "blur(24px)",
            }}
          >
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  role="option"
                  aria-selected={locale === lang.code}
                  onClick={() => { setLocale(lang.code); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: locale === lang.code ? "var(--cyan-aeos)" : isDark ? "var(--pub-text-muted)" : "#475569",
                    background: locale === lang.code ? isDark ? "rgba(0,229,255,0.07)" : "rgba(0,163,184,0.07)" : "transparent",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = locale === lang.code ? isDark ? "rgba(0,229,255,0.07)" : "rgba(0,163,184,0.07)" : "transparent"}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  {locale === lang.code && (
                    <svg className="w-3.5 h-3.5" style={{ color: "var(--cyan-aeos)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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

// ─── Navigation Header ────────────────────────────────────────────────────────
function Header() {
  const scrolled = useNavScroll(60);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = usePublicI18n();
  const { isDark } = usePublicTheme();
  const { url } = usePage();
  const currentPath = url.split("?")[0];
  const isActive = (href) => href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(href + "/");

  const translatedNavLinks = [
    { label: t("nav_home"),   href: "/"   },
    { label: t("nav_features"),   href: "/features"   },
    { label: t("nav_pricing"),    href: "/pricing"     },
    { label: t("nav_enterprise"), href: "/enterprise"  },
    { label: t("nav_about"),      href: "/about"       },
    { label: t("nav_docs"),       href: "/docs"        },
    { label: t("nav_contact"),    href: "/contact"     },
  ];

  const textColor      = isDark ? "var(--pub-text-muted)" : "#475569";
  const textHoverColor = isDark ? "#E8EDF5" : "#0F172A";

  useEffect(() => {
    if (scrolled) setMobileOpen(false);
  }, [scrolled]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
      style={{
        background: scrolled
          ? isDark ? "rgba(3,4,10,0.95)" : "rgba(255,255,255,0.97)"
          : "transparent",
        borderBottomColor: scrolled
          ? isDark ? "rgba(0,229,255,0.1)" : "rgba(100,116,139,0.15)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">

          {/* Logo */}
          <motion.div whileHover={{ opacity: 0.85 }}>
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <AeosLogo size={32} />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[1.05rem] tracking-tight" style={{ fontFamily: "'Syne',sans-serif", color: isDark ? "#ffffff" : "#0F172A" }}>
                  aeos365
                </span>
                <span className="text-[0.58rem] tracking-[0.18em]" style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--pub-text-muted)" }}>
                  ENTERPRISE SUITE
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {translatedNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  color: isActive(link.href) ? "var(--cyan-aeos, #00E5FF)" : textColor,
                  fontFamily: "'DM Sans', sans-serif",
                  background: isActive(link.href)
                    ? isDark ? "rgba(0,229,255,0.07)" : "rgba(0,163,184,0.07)"
                    : "transparent",
                }}
                onMouseEnter={e => { if (!isActive(link.href)) e.currentTarget.style.color = textHoverColor; }}
                onMouseLeave={e => { if (!isActive(link.href)) e.currentTarget.style.color = textColor; }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{
                color: textColor,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.2)"}`,
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = textHoverColor;
                e.currentTarget.style.borderColor = isDark ? "rgba(0,229,255,0.3)" : "rgba(0,163,184,0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = textColor;
                e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.2)";
              }}
            >
              {t("sign_up")}
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a href="https://demo.aeos365.com" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                <span>{t("try_demo")}</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </motion.div>
          </div>

          {/* Mobile: Lang + Theme + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <button
              className="p-2 rounded-lg"
              style={{ border: `1px solid ${isDark ? "rgba(0,229,255,0.15)" : "rgba(100,116,139,0.2)"}` }}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <motion.div animate={mobileOpen ? "open" : "closed"} className="flex flex-col gap-1.5 w-5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="block h-[1.5px] rounded-full origin-center"
                    style={{ background: isDark ? "#E8EDF5" : "#0F172A" }}
                    variants={{
                      closed: { rotate: 0, y: 0, opacity: 1 },
                      open: i === 0 ? { rotate: 45, y: 6 } : i === 2 ? { rotate: -45, y: -6 } : { opacity: 0 },
                    }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="lg:hidden overflow-hidden border-t"
            style={{
              background: isDark ? "rgba(7,11,20,0.98)" : "rgba(255,255,255,0.98)",
              borderTopColor: isDark ? "rgba(0,229,255,0.1)" : "rgba(100,116,139,0.15)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {translatedNavLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  custom={i}
                  variants={mobileMenuItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href={link.href}
                    className="block py-3 px-3 text-base rounded-lg transition-all duration-200"
                    style={{
                      color: isActive(link.href) ? "var(--cyan-aeos, #00E5FF)" : textColor,
                      background: isActive(link.href)
                        ? isDark ? "rgba(0,229,255,0.07)" : "rgba(0,163,184,0.07)"
                        : "transparent",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={e => { if (!isActive(link.href)) e.currentTarget.style.color = textHoverColor; }}
                    onMouseLeave={e => { if (!isActive(link.href)) e.currentTarget.style.color = textColor; }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-3 mt-4">
                <Link href="/signup" className="btn-ghost text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>{t("sign_up")}</Link>
                <Link href="https://demo.aeos365.com" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>{t("try_demo")}</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const { t } = usePublicI18n();
  const { isDark } = usePublicTheme();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubmitted(true); setEmail(""); }
  };

  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(100,116,139,0.12)";
  const linkColor    = isDark ? "var(--pub-text-muted)" : "#64748B";
  const linkHover    = isDark ? "#E8EDF5" : "#0F172A";

  return (
    <footer
      className="relative border-t overflow-hidden"
      style={{
        borderTopColor: isDark ? "rgba(0,229,255,0.08)" : "rgba(100,116,139,0.15)",
        background: isDark ? "#03040A" : "var(--pub-footer-bg, #F1F5F9)",
      }}
    >
      <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: "var(--pub-grid-opacity, 0.3)" }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.04) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16 pt-16 pb-8">

        {/* Top Row */}
        <div className="flex flex-col lg:flex-row gap-10 justify-between pb-12 border-b" style={{ borderBottomColor: dividerColor }}>
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <AeosLogo size={28} />
              <span className="font-bold text-base" style={{ fontFamily: "'Syne',sans-serif", color: isDark ? "#ffffff" : "#0F172A" }}>
                aeos365
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: linkColor, fontFamily: "'DM Sans',sans-serif" }}>
              The modular enterprise platform built for scale, security, and sovereignty. Every module. Every tenant. One coherent system.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { label: "GitHub",   path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.92.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                { label: "Twitter",  path: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" },
                { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
              ].map(({ label, path }) => (
                <motion.a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.2)"}`, color: linkColor }}
                  whileHover={{ scale: 1.1, borderColor: "rgba(0,229,255,0.4)", color: "#00E5FF" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={path} /></svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="max-w-sm w-full">
            <p className="label-mono mb-2" style={{ color: "var(--cyan-aeos)" }}>{t("newsletter_label")}</p>
            <h4 className="font-semibold mb-1" style={{ fontFamily: "'Syne',sans-serif", color: isDark ? "#ffffff" : "#0F172A" }}>
              {t("newsletter_title")}
            </h4>
            <p className="text-sm mb-4" style={{ color: linkColor }}>{t("newsletter_body")}</p>
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={t("newsletter_input")} required
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--pub-input-bg, rgba(255,255,255,0.04))",
                      border: "1px solid var(--pub-input-border, rgba(255,255,255,0.1))",
                      color: isDark ? "#E8EDF5" : "#0F172A",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.4)"}
                    onBlur={e => e.target.style.borderColor = "var(--pub-input-border, rgba(255,255,255,0.1))"}
                  />
                  <motion.button type="submit" className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    {t("subscribe")}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: "var(--cyan-aeos)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm" style={{ color: isDark ? "#ffffff" : "#0F172A" }}>{t("subscribed_msg")}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b" style={{ borderBottomColor: dividerColor }}>
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="label-mono mb-4" style={{ color: "var(--cyan-aeos)" }}>{category.toUpperCase()}</p>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-sm transition-colors duration-200"
                        style={{ color: linkColor, fontFamily: "'DM Sans',sans-serif" }}
                        onMouseEnter={e => e.target.style.color = linkHover}
                        onMouseLeave={e => e.target.style.color = linkColor}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link href={href}
                        className="text-sm transition-colors duration-200"
                        style={{ color: linkColor, fontFamily: "'DM Sans',sans-serif" }}
                        onMouseEnter={e => e.target.style.color = linkHover}
                        onMouseLeave={e => e.target.style.color = linkColor}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs" style={{ color: linkColor, fontFamily: "'DM Sans',sans-serif" }}>
            © {new Date().getFullYear()} aeos365. {t("footer_copyright")}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
            <span className="text-xs" style={{ color: linkColor }}>{t("systems_ok")}</span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { key: "privacy_policy",   href: "/legal/privacy"  },
              { key: "terms_of_service", href: "/legal/terms"    },
              { key: "cookie_policy",    href: "/legal/cookies"  },
            ].map(({ key, href }) => (
              <Link key={key} href={href} className="text-xs transition-colors"
                style={{ color: linkColor }}
                onMouseEnter={e => e.target.style.color = linkHover}
                onMouseLeave={e => e.target.style.color = linkColor}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Inner Layout (consumes contexts) ────────────────────────────────────────
function PublicLayoutInner({ children }) {
  const { isDark } = usePublicTheme();

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{
        background: isDark ? "#03040A" : "#F8FAFC",
        color: isDark ? "#E8EDF5" : "#0F172A",
      }}
    >
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

// ─── PublicLayout (exported — wraps with providers) ───────────────────────────
export default function PublicLayout({ children }) {
  return (
    <PublicThemeProvider>
      <PublicI18nProvider>
        <PublicLayoutInner>{children}</PublicLayoutInner>
      </PublicI18nProvider>
    </PublicThemeProvider>
  );
}
