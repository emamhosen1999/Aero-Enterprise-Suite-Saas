import React from 'react';
import { Link } from '@inertiajs/react';
import { clsx } from 'clsx';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { CheckIcon } from '@heroicons/react/24/solid';

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
    divider: isDarkMode ? 'bg-white/20' : 'bg-slate-300',
    badge: isDarkMode ? 'border-white/20' : 'border-slate-200',
    completeBadge: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-500',
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <ol className="hidden md:flex items-center justify-center gap-3 lg:gap-4 text-sm">
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
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 lg:px-4 transition-colors',
                  status === 'complete' && palette.complete,
                  status === 'current' && palette.current,
                  status === 'upcoming' && palette.upcoming
                )}
              >
                <span className={clsx(
                  'inline-flex h-5 w-5 lg:h-6 lg:w-6 items-center justify-center rounded-full border text-xs font-semibold shrink-0',
                  palette.badge,
                  status === 'complete' && palette.completeBadge
                )}>
                  {status === 'complete' ? <CheckIcon className="h-3 w-3 lg:h-3.5 lg:w-3.5" /> : index + 1}
                </span>
                <span className="font-medium text-xs lg:text-sm">{step.label}</span>
              </Component>
              {index < steps.length - 1 && (
                <span className={`h-px w-6 lg:w-8 ${palette.divider}`}></span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile View - Compact Step Indicator */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
            {steps[currentIndex]?.label}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={clsx('h-1.5 rounded-full overflow-hidden', isDarkMode ? 'bg-white/10' : 'bg-slate-200')}>
          <div 
            className={clsx('h-full transition-all duration-300 rounded-full', isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-600')}
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((step, index) => {
            const status = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
            return (
              <div
                key={step.key}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shrink-0',
                  status === 'complete' && palette.complete,
                  status === 'current' && palette.current,
                  status === 'upcoming' && palette.upcoming
                )}
              >
                <span className={clsx(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold shrink-0',
                  status === 'complete' ? palette.completeBadge : palette.badge
                )}>
                  {status === 'complete' ? <CheckIcon className="h-2.5 w-2.5" /> : index + 1}
                </span>
                <span className="font-medium whitespace-nowrap">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
