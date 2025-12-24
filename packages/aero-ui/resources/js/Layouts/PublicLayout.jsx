import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { Button } from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding';
import Footer from '@/Layouts/Footer';
import { publicNavLinks } from '@/Config/publicNavigation';
import MaintenanceModeBanner from '@/Components/Platform/MaintenanceModeBanner.jsx';

export default function PublicLayout({ children, extraNavLinks = [], mainClassName = 'pt-24', title }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { themeSettings, toggleMode } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { logo, favicon, siteName } = useBranding();

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

  const combinedLinks = [...publicNavLinks, ...extraNavLinks];

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
    <>
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-14 md:h-16">
          {/* Mobile: Hamburger on left */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`md:hidden p-2 -ml-2 transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'} rounded-md`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo - centered on mobile, left on desktop */}
          <SafeLink route="landing" className="flex items-center gap-2 md:gap-3 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            {logo ? (
              <img src={logo} alt={siteName} className="h-8 md:h-10 w-auto" />
            ) : (
              <>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-base md:text-lg">
                  {siteName.charAt(0)}
                </div>
                <span className={`text-sm md:text-base font-semibold hidden sm:inline ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{siteName}</span>
              </>
            )}
          </SafeLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {publicNavLinks.map((link) => {
              const isActive = route().current(link.routeName);
              return link.type === 'anchor' ? (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className={`${isActive ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : palette.navLink} ${palette.navLinkHover} px-3 py-2 text-sm font-medium transition-colors rounded-md`}
                >
                  {link.label}
                </a>
              ) : (
                <Link 
                  key={link.label} 
                  href={route(link.routeName)} 
                  className={`${isActive ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : palette.navLink} ${palette.navLinkHover} px-3 py-2 text-sm font-medium transition-colors rounded-md`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile: Only user icon */}
            <button
              type="button"
              onClick={toggleMode}
              className={` md:flex items-center justify-center w-9 h-9 rounded-md transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
              aria-label="Toggle color mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>

          
           
            <Button 
              as={Link} 
              href={route('platform.register.index')} 
              size="sm"
              className="hidden md:inline-flex bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium px-4 h-9 text-sm"
            >
              Start Trial
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t ${isDarkMode ? 'border-white/5 bg-slate-950/95' : 'border-slate-200 bg-white/95'} backdrop-blur-xl`}> 
            <div className="px-4 py-4 flex flex-col gap-1">
              {combinedLinks.map((link) => (
                link.type === 'anchor' ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`${palette.navLink} ${palette.navLinkHover} px-4 py-3 text-sm font-medium transition-colors rounded-md hover:bg-slate-100/50`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={route(link.routeName)}
                    onClick={closeMobileMenu}
                    className={`${palette.navLink} ${palette.navLinkHover} px-4 py-3 text-sm font-medium transition-colors rounded-md hover:bg-slate-100/50`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'} my-2`}></div>
              
             
            </div>
          </div>
        )}
      </nav>

      <main className={`relative z-10 flex-1 ${mainClassName}`}>
        {children}
      </main>

      <Footer />
      
      {/* Maintenance/Debug Mode Indicator */}
      <MaintenanceModeBanner position="bottom-right" />
    </div>
    </>
  );
}
