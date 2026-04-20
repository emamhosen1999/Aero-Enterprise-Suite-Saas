import React, { useState, useEffect } from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { SunIcon, MoonIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';

const WelcomeWidget = ({ data = {} }) => {
    const { auth } = usePage().props;
    const {
        greeting = 'Hello',
        userName = auth?.user?.name ?? 'User',
        date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    } = data;

    // Live clock
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const formattedTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const hour = time.getHours();

    const Icon = hour >= 5 && hour < 17 ? SunIcon : hour >= 17 && hour < 21 ? SparklesIcon : MoonIcon;
    const iconColor = hour >= 5 && hour < 12 ? '#F59E0B' : hour >= 12 && hour < 17 ? '#3B82F6' : hour >= 17 && hour < 21 ? '#8B5CF6' : '#6B7280';

    return (
        <Card
            className="border-none shadow-sm overflow-hidden w-full transition-all duration-200"
            style={{
                transform: 'scale(var(--scale, 1))',
                fontFamily: 'var(--fontFamily, "Inter")',
                borderRadius: 'var(--borderRadius, 12px)',
                background: `linear-gradient(135deg,
                    color-mix(in srgb, ${iconColor} 12%, var(--theme-content1, #FAFAFA)) 0%,
                    var(--theme-content1, #FAFAFA) 55%,
                    color-mix(in srgb, ${iconColor} 6%, var(--theme-content2, #F4F4F5)) 100%)`,
            }}
        >
            <CardBody className="p-0 overflow-hidden">
                <div className="relative p-5 sm:p-6 overflow-hidden">
                    {/* Background decorative circles — kept fully inside via overflow-hidden on parent */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
                        style={{ background: iconColor }} />
                    <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"
                        style={{ background: iconColor }} />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Left: greeting */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-3 rounded-2xl shadow-sm shrink-0"
                                style={{ background: `color-mix(in srgb, ${iconColor} 20%, var(--theme-content1, #FAFAFA))` }}>
                                <Icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: iconColor }} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight" style={{ color: 'var(--theme-foreground, #11181C)' }}>
                                    {greeting}, {userName}!
                                </h1>
                                <p className="text-sm text-default-500 mt-0.5 flex items-center gap-1.5">
                                    <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                                    {date}
                                </p>
                            </div>
                        </div>

                        {/* Right: live clock */}
                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-light tabular-nums tracking-tight" style={{ color: 'var(--theme-foreground, #11181C)' }}>
                                {formattedTime}
                            </p>
                            <Chip
                                size="sm"
                                variant="flat"
                                style={{
                                    background: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
                                    color: iconColor,
                                }}
                            >
                                {greeting.split(' ')[1] || greeting}
                            </Chip>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

WelcomeWidget.displayName = 'WelcomeWidget';
export default WelcomeWidget;
