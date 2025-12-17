import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MaintenanceModeBanner from '@/Components/Platform/MaintenanceModeBanner.jsx';

export default function RegisterLayout({ children, mainClassName = 'py-8 sm:py-16' }) {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { logo, squareLogo, siteName } = useBranding();

  const palette = useMemo(() => ({
    shell: isDarkMode
      ? 'from-slate-950 via-slate-900 to-slate-950 text-white'
      : 'from-white via-slate-50 to-blue-50 text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-slate-200/80',
    headerBg: isDarkMode ? 'bg-slate-950/80' : 'bg-white/80',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-600',
  }), [isDarkMode]);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br ${palette.shell}`}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: isDarkMode
              ? 'radial-gradient(circle at 1px 1px, rgba(147,197,253,0.2) 1px, transparent 0)'
              : 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.12) 1px, transparent 0)',
            backgroundSize: '90px 90px',
          }}
        />
        <div
          className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/10 via-purple-600/10 to-cyan-500/20' : 'bg-gradient-to-br from-blue-200/50 via-indigo-200/40 to-cyan-100/40'}`}
        />
      </div>

      {/* Desktop Header */}
      <header className={`hidden md:block relative z-10 border-b ${palette.border} ${palette.headerBg} backdrop-blur-xl`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={route('landing')} className="flex items-center gap-3">
            {squareLogo ? (
              <img src={squareLogo} alt={siteName || 'Logo'} className="h-12 w-12 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-semibold text-xl text-white">
                {siteName?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="h-12 w-px bg-slate-300 dark:bg-slate-600" />
            <div>
              <p className="font-semibold text-lg">{siteName || 'Enterprise Suite'}</p>
              <p className={`text-xs ${palette.muted}`}>Create your workspace</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={route('support')} className={`text-sm transition-colors hover:underline ${palette.muted}`}>
              Need help?
            </Link>
            <Link href={route('landing')} className="text-sm font-semibold text-blue-500 hover:text-blue-600">
              Back to site
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className={`md:hidden relative z-10 border-b ${palette.border} ${palette.headerBg} backdrop-blur-xl`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href={route('landing')} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          
          {logo ? (
            <img src={logo} alt={siteName || 'Logo'} className="h-8 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              {squareLogo ? (
                <img src={squareLogo} alt={siteName || 'Logo'} className="h-8 w-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center font-semibold text-sm text-white">
                  {siteName?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <span className="font-semibold text-sm">{siteName || 'Enterprise Suite'}</span>
            </div>
          )}
          
          <Link href={route('support')} className={`text-xs font-medium ${palette.muted} hover:text-blue-500 transition-colors`}>
            Need help?
          </Link>
        </div>
      </header>

      <main className={`relative z-10 flex-1 w-full ${mainClassName}`}>
        {children}
      </main>

      <footer className={`relative z-10 border-t ${palette.border} ${palette.headerBg}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={`${palette.muted} text-center sm:text-left`}>Secure enterprise workspace setup</p>
          <p className={`${palette.muted} text-center sm:text-right`}>© {new Date().getFullYear()} {siteName || 'Enterprise Suite'}</p>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      
      {/* Maintenance/Debug Mode Indicator */}
      <MaintenanceModeBanner position="bottom-right" />
    </div>
  );
}
