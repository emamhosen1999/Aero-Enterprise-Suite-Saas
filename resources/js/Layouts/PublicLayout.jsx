import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { useTheme } from '../Contexts/ThemeContext.jsx';

const navLinks = [
  { label: 'Overview', routeName: 'landing', type: 'route' },
  { label: 'Features', routeName: 'features', type: 'route' },
  { label: 'Pricing', routeName: 'pricing', type: 'route' },
  { label: 'About', routeName: 'about', type: 'route' },
  { label: 'Resources', routeName: 'resources', type: 'route' },
  { label: 'Support', routeName: 'support', type: 'route' },
  { label: 'Demo', routeName: 'demo', type: 'route' },
  { label: 'Contact', routeName: 'contact', type: 'route' },
];

const footerColumns = [
  {
    heading: 'Company',
    links: [
      { label: 'About', routeName: 'about' },
      { label: 'Careers', routeName: 'careers' },
      { label: 'Blog', routeName: 'blog' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', routeName: 'docs' },
      { label: 'Support', routeName: 'support' },
      { label: 'Security', routeName: 'legal.security' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', routeName: 'legal.privacy' },
      { label: 'Terms of Service', routeName: 'legal.terms' },
      { label: 'Cookie Policy', routeName: 'legal.cookies' },
    ],
  },
];

export default function PublicLayout({ children, extraNavLinks = [], mainClassName = 'pt-24' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { themeSettings, toggleMode } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const combinedLinks = [...navLinks, ...extraNavLinks];

  const palette = useMemo(() => ({
    page: isDarkMode
      ? 'min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'
      : 'min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-900',
    nav: isDarkMode
      ? isScrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      : isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm' : 'bg-white/70 backdrop-blur-xl border-b border-transparent',
    navLink: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    navLinkHover: isDarkMode ? 'hover:text-white' : 'hover:text-slate-900',
    loginLink: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    loginLinkHover: isDarkMode ? 'hover:text-white' : 'hover:text-slate-900',
    footer: isDarkMode
      ? 'border-t border-white/10 bg-slate-950/70 backdrop-blur-xl text-slate-400'
      : 'border-t border-slate-200 bg-white/90 backdrop-blur-xl text-slate-600',
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-400' : 'text-slate-600',
  }), [isDarkMode, isScrolled]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={palette.page}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: isDarkMode
              ? 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.25) 1px, transparent 0)'
              : 'radial-gradient(circle at 1px 1px, rgba(15,118,110,0.15) 1px, transparent 0)',
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10' : 'bg-gradient-to-br from-teal-500/5 via-blue-500/5 to-indigo-500/5'}`}
        />
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${palette.nav}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={route('landing')} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
              A
            </div>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Aero Enterprise Suite</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {combinedLinks.map((link) => (
              link.type === 'anchor' ? (
                <a key={link.label} href={link.href} className={`${palette.navLink} ${palette.navLinkHover} transition-colors`}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={route(link.routeName)} className={`${palette.navLink} ${palette.navLinkHover} transition-colors`}>
                  {link.label}
                </Link>
              )
            ))}
            
            <Button as={Link} href={route('platform.register.index')} color="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 font-semibold px-5">
              Start Trial
            </Button>
            <button
              type="button"
              onClick={toggleMode}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              aria-label="Toggle color mode"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMode}
              className={`rounded-full border p-2 text-xs font-semibold transition-colors ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              aria-label="Toggle color mode"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`rounded-full border p-2 transition-colors ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t ${isDarkMode ? 'border-white/5 bg-slate-950/95' : 'border-slate-200 bg-white/95'} backdrop-blur-xl`}> 
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 text-sm">
              {combinedLinks.map((link) => (
                link.type === 'anchor' ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`${palette.navLink} ${palette.navLinkHover} transition-colors`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={route(link.routeName)}
                    onClick={closeMobileMenu}
                    className={`${palette.navLink} ${palette.navLinkHover} transition-colors`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <Link href="/login" onClick={closeMobileMenu} className={`${palette.loginLink} ${palette.loginLinkHover} transition-colors`}>
                Login
              </Link>
              <Button as={Link} href={route('platform.register.index')} onClick={closeMobileMenu} color="primary" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 font-semibold">
                Start Trial
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main className={`relative z-10 flex-1 ${mainClassName}`}>
        {children}
      </main>

      <footer className={`relative z-10 text-sm ${palette.footer}`}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
          <div>
            <Link href={route('landing')} className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
                A
              </div>
              <span className={`font-semibold ${palette.heading}`}>Aero Enterprise Suite</span>
            </Link>
            <p className={palette.copy}>
              Modern SaaS OS for HR, Projects, Compliance, and Finance teams.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h4 className={`${palette.heading} font-semibold mb-3`}>{column.heading}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={route(link.routeName)} className={`${palette.navLink} ${palette.navLinkHover} hover:underline`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`max-w-6xl mx-auto px-6 pb-10 text-xs ${palette.copy}`}>
          © {new Date().getFullYear()} Aero Enterprise Suite. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
