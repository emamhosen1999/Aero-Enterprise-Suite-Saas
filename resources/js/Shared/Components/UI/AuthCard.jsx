import React from 'react';
import { Card } from '@heroui/react';
import { clsx } from 'clsx';

/**
 * Shared auth surface that mirrors the frosted-glass cards used
 * inside the Employee module, keeping login + registration flows consistent.
 */
const AuthCard = ({
    children,
    className = '',
    contentClassName = 'p-6 sm:p-8',
    ...props
}) => {
    return (
        <Card
            radius="lg"
            shadow="lg"
            isBlurred
            className={clsx(
                'relative overflow-hidden border border-white/20 dark:border-white/10',
                'bg-white/10 dark:bg-slate-900/50 backdrop-blur-2xl',
                'shadow-[0_20px_45px_rgba(15,23,42,0.35)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]',
                'text-foreground',
                className
            )}
            {...props}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))'
                }}
            />
            <div
                className="pointer-events-none absolute -top-24 -right-6 h-56 w-56 rounded-full blur-3xl opacity-40"
                style={{ background: 'var(--theme-primary, #006FEE)' }}
            />
            <div
                className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full blur-3xl opacity-30"
                style={{ background: 'var(--theme-secondary, #7C3AED)' }}
            />
            <div className={clsx('relative z-10', contentClassName)}>
                {children}
            </div>
        </Card>
    );
};

export default AuthCard;
