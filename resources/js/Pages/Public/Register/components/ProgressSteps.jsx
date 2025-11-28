import React from 'react';
import { Link } from '@inertiajs/react';
import { clsx } from 'clsx';

export default function ProgressSteps({ steps = [], currentStep }) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

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
                status === 'complete' && 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20',
                status === 'current' && 'border-white/30 bg-white/10 text-white',
                status === 'upcoming' && 'border-white/10 bg-white/5 text-white/60'
              )}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-semibold">
                {index + 1}
              </span>
              <span className="font-medium">{step.label}</span>
            </Component>
            {index < steps.length - 1 && (
              <span className="hidden md:block text-white/30">/</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
