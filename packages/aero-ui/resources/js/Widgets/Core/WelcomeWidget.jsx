import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { SunIcon, MoonIcon, SparklesIcon } from '@heroicons/react/24/outline';

/**
 * WelcomeWidget
 * 
 * Displays a personalized greeting with the user's name and current date/time.
 * This is a header-style widget that spans the full width.
 */
const WelcomeWidget = ({ data = {} }) => {
    const { 
        greeting = 'Hello', 
        userName = 'User', 
        date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        })
    } = data;

    // Determine icon based on greeting
    const getIcon = () => {
        if (greeting.toLowerCase().includes('morning') || greeting.toLowerCase().includes('afternoon')) {
            return <SunIcon className="w-8 h-8 text-warning" />;
        } else if (greeting.toLowerCase().includes('evening')) {
            return <MoonIcon className="w-8 h-8 text-secondary" />;
        }
        return <SparklesIcon className="w-8 h-8 text-primary" />;
    };

    return (
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-none shadow-sm">
            <CardBody className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-white/80 dark:bg-default-100 shadow-sm">
                            {getIcon()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {greeting}, {userName}!
                            </h1>
                            <p className="text-default-500 mt-1">
                                {date}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-3xl font-light text-default-600">
                            {time}
                        </p>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

WelcomeWidget.displayName = 'WelcomeWidget';

export default WelcomeWidget;
