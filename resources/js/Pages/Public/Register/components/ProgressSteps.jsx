import React from 'react';
import { Link } from '@inertiajs/react';
import { clsx } from 'clsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

export default function ProgressSteps({ steps = [], currentStep }) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const palette = {
    complete: isDarkMode
      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    current: isDarkMode
      ? 'border-white/40 bg-white/10 text-white'
      : 'border-blue-300 bg-blue-50 text-blue-700',
    upcoming: isDarkMode
      ? 'border-white/10 bg-white/5 text-white/60'
      : 'border-slate-200 bg-white text-slate-500',
    divider: isDarkMode ? 'text-white/30' : 'text-slate-300',
    badge: isDarkMode ? 'border-white/20' : 'border-slate-200',
  };

  return (
    <ol className="flex flex-wrap items-center gap-4 text-sm">
      {steps.map((step, index) => {
        const status = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
        const Component = status === 'complete' ? Link : 'div';
        const commonProps = status === 'complete'
          ? { href: route(step.route) }
          : {};

        return (
          <li key={step.key} className="flex items-center gap-3">
            <Component
              {...commonProps}
              className={clsx(
                'flex items-center gap-2 rounded-full border px-4 py-1.5 transition-colors',
                status === 'complete' && palette.complete,
                status === 'current' && palette.current,
                status === 'upcoming' && palette.upcoming
              )}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${palette.badge}`}>
                {index + 1}
              </span>
              <span className="font-medium">{step.label}</span>
            </Component>
            {index < steps.length - 1 && (
              <span className={`hidden md:block ${palette.divider}`}>/</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
