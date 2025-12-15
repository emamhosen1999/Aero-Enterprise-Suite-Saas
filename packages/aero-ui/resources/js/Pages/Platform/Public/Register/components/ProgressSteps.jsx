import React from 'react';
import { Link } from '@inertiajs/react';
import { clsx } from 'clsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
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
      ? 'border-primary-400 bg-primary-500/20 text-primary-300 shadow-lg shadow-primary-500/20'
      : 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg shadow-primary-500/10',
    upcoming: isDarkMode
      ? 'border-white/10 bg-white/5 text-white/40'
      : 'border-slate-200 bg-slate-50 text-slate-400',
    divider: isDarkMode ? 'bg-white/20' : 'bg-slate-300',
    badge: isDarkMode ? 'border-white/20' : 'border-slate-200',
    completeBadge: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-500',
    wire: isDarkMode ? 'border-primary-400/60' : 'border-primary-500/60',
  };

  return (
    <div className="w-full relative">
      {/* Desktop View */}
      <ol className="hidden md:flex items-center justify-center gap-3 lg:gap-4 text-sm relative z-10">
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
                  'flex items-center gap-2 transition-all duration-300',
                  status === 'current' && 'relative'
                )}
              >
                <span className={clsx(
                  'inline-flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 text-sm font-bold shrink-0 transition-all duration-300',
                  status === 'complete' && 'border-emerald-500 bg-emerald-500 text-white',
                  status === 'current' && `${palette.current} scale-110`,
                  status === 'upcoming' && palette.upcoming
                )}>
                  {status === 'complete' ? <CheckIcon className="h-4 w-4 lg:h-5 lg:w-5" /> : index + 1}
                </span>
                {/* Show label only for current step */}
                {status === 'current' && (
                  <span className="font-semibold text-sm lg:text-base animate-fade-in ml-2">{step.label}</span>
                )}
              </Component>
              {index < steps.length - 1 && (
                <span className={clsx(
                  'h-0.5 w-6 lg:w-8 transition-all duration-300',
                  index < currentIndex ? 'bg-emerald-500' : palette.divider
                )}></span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile View - Compact Step Indicator */}
      <div className="md:hidden space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className={isDarkMode ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold'}>
            {steps[currentIndex]?.label}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={clsx('h-1.5 rounded-full overflow-hidden', isDarkMode ? 'bg-white/10' : 'bg-slate-200')}>
          <div 
            className={clsx('h-full transition-all duration-300 rounded-full', isDarkMode ? 'bg-gradient-to-r from-primary-400 to-primary-600' : 'bg-gradient-to-r from-primary-500 to-primary-700')}
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Numbers Only */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
          {steps.map((step, index) => {
            const status = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
            return (
              <div
                key={step.key}
                className={clsx(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shrink-0 transition-all duration-300',
                  status === 'complete' && 'border-emerald-500 bg-emerald-500 text-white',
                  status === 'current' && `${palette.current} scale-110`,
                  status === 'upcoming' && palette.upcoming
                )}
              >
                {status === 'complete' ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
