import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

export default function RegisterLayout({ children, mainClassName = 'py-16' }) {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

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

      <header className={`relative z-10 border-b ${palette.border} ${palette.headerBg} backdrop-blur-xl`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-sm">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-semibold text-lg text-white">
              A
            </div>
            <div>
              <p className="font-semibold">Aero Enterprise Suite</p>
              <p className={`text-xs ${palette.muted}`}>Tenant registration</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/support" className={`transition-colors hover:underline ${palette.muted}`}>
              Need help?
            </Link>
            <Link href="/" className="font-semibold text-blue-500">
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className={`relative z-10 flex-1 w-full ${mainClassName}`}>
        {children}
      </main>

      <footer className={`relative z-10 border-t ${palette.border} ${palette.headerBg}`}>
        <div className="max-w-5xl mx-auto px-6 py-6 text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={palette.muted}>Secure multi-tenant onboarding powered by Laravel + Inertia.</p>
          <p className={palette.muted}>© {new Date().getFullYear()} Aero Enterprise Suite</p>
        </div>
      </footer>
    </div>
  );
}
