import { useState, useEffect } from "react";
import { motion, AnimatePresence, useTransform, useScroll } from "framer-motion";
import { NAV_LINKS, FOOTER_LINKS, SOCIAL_LINKS } from "../utils/pageData";
import { navVariants, mobileMenuVariants, mobileMenuItemVariants, staggerContainer, fadeUp } from "../utils/motionVariants";
import { useNavScroll } from "../utils/hooks";

// ─── Navigation Header ────────────────────────────────────────────────────────
function Header() {
  const scrolled = useNavScroll(60);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on scroll
  useEffect(() => {
    if (scrolled) setMobileOpen(false);
  }, [scrolled]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      animate={scrolled ? "scrolled" : "top"}
      variants={navVariants}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{ borderBottomColor: "rgba(0,229,255,0)" }}
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* ── Logo ── */}
          <motion.a
            href="/"
            className="flex items-center gap-3 flex-shrink-0"
            whileHover={{ opacity: 0.85 }}
          >
            {/* Wordmark Logo */}
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500"
                   style={{ boxShadow: "0 0 16px rgba(0,229,255,0.5)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8L8 2L14 8L8 14L2 8Z" stroke="#03040A" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="2" fill="#03040A"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-800 text-white text-[1.05rem] tracking-tight" style={{fontFamily:"'Syne',sans-serif",fontWeight:800}}>
                AEOS
              </span>
              <span className="label-mono text-[0.58rem] tracking-[0.18em]" style={{color:"var(--text-muted)"}}>
                ENTERPRISE SUITE
              </span>
            </div>
          </motion.a>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => e.target.style.color = "#E8EDF5"}
                onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── CTA Buttons ── */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="/login" className="btn-ghost text-sm py-2.5 px-5">
              Sign In
            </a>
            <motion.a
              href="/demo"
              className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Request Demo</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </motion.a>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ border: "1px solid rgba(0,229,255,0.15)" }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <motion.div animate={mobileOpen ? "open" : "closed"} className="flex flex-col gap-1.5 w-5">
              {[0,1,2].map(i => (
                <motion.span
                  key={i}
                  className="block h-[1.5px] rounded-full bg-white origin-center"
                  variants={{
                    closed: { rotate: 0, y: 0, opacity: 1 },
                    open: i === 0
                      ? { rotate: 45, y: 6 }
                      : i === 2
                      ? { rotate: -45, y: -6 }
                      : { opacity: 0 },
                  }}
                  transition={{ duration: 0.25 }}
                />
              ))}
            </motion.div>
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
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
              background: "rgba(7,11,20,0.98)",
              borderTopColor: "rgba(0,229,255,0.1)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  custom={i}
                  variants={mobileMenuItemVariants}
                  initial="closed"
                  animate="open"
                  className="py-3 px-3 text-base rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#E8EDF5"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="flex gap-3 mt-4">
                <a href="/login" className="btn-ghost text-sm flex-1 text-center">Sign In</a>
                <a href="/demo" className="btn-primary text-sm flex-1 text-center">Request Demo</a>
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <footer className="relative border-t overflow-hidden" style={{ borderTopColor: "rgba(0,229,255,0.08)", background: "#03040A" }}>

      {/* Background mesh */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
           style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.04) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16 pt-16 pb-8">

        {/* ── Top Row: Logo + Newsletter ── */}
        <div className="flex flex-col lg:flex-row gap-10 justify-between pb-12 border-b"
             style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}>

          {/* Brand block */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center"
                   style={{ boxShadow: "0 0 12px rgba(0,229,255,0.4)" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8L8 2L14 8L8 14L2 8Z" stroke="#03040A" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="2" fill="#03040A"/>
                </svg>
              </div>
              <span className="font-display font-800 text-white text-base" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>
                AEOS Enterprise Suite
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
              The modular enterprise platform built for scale, security, and sovereignty. Every module. Every tenant. One coherent system.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { label: "GitHub", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.92.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                { label: "Twitter", path: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" },
                { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
              ].map(({ label, path }) => (
                <motion.a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}
                  whileHover={{ scale: 1.1, borderColor: "rgba(0,229,255,0.4)", color: "#00E5FF" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={path} />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="max-w-sm w-full">
            <p className="label-mono mb-2" style={{ color: "var(--cyan-aeos)" }}>STAY UPDATED</p>
            <h4 className="text-white font-semibold mb-1" style={{ fontFamily: "'Syne',sans-serif" }}>
              Platform & Module Updates
            </h4>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Release notes, feature previews, and architectural deep-dives. No spam.
            </p>
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSubscribe}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#E8EDF5",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <motion.button
                    type="submit"
                    className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Subscribe
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}
                >
                  <svg className="w-5 h-5" style={{ color: "var(--cyan-aeos)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-white">You're on the list. Thanks!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Link Columns ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b"
             style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}>
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="label-mono mb-4" style={{ color: "var(--cyan-aeos)" }}>{category.toUpperCase()}</p>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors duration-200"
                      style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}
                      onMouseEnter={e => e.target.style.color = "#E8EDF5"}
                      onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
            © {new Date().getFullYear()} AEOS Enterprise Suite. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>All systems operational</span>
          </div>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(item => (
              <a key={item} href="#" className="text-xs transition-colors"
                 style={{ color: "var(--text-muted)" }}
                 onMouseEnter={e => e.target.style.color = "#E8EDF5"}
                 onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PublicLayout ─────────────────────────────────────────────────────────────
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "#03040A", color: "#E8EDF5" }}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
