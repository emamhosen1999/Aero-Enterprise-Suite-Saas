import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/react';
import * as HeroIcons from '@heroicons/react/24/outline';

const StatsCounterBlock = ({ data = {} }) => {
    const stats = data.stats || [];
    const [animatedValues, setAnimatedValues] = useState({});

    useEffect(() => {
        stats.forEach((stat, index) => {
            if (stat.number) {
                const duration = 2000;
                const target = parseInt(stat.number);
                const start = Date.now();

                const animate = () => {
                    const elapsed = Date.now() - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.floor(target * progress);
                    setAnimatedValues((prev) => ({
                        ...prev,
                        [index]: current,
                    }));

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };

                animate();
            }
        });
    }, [stats]);

    const getIcon = (iconName) => {
        if (!iconName) return null;
        const normalizedName = iconName.replace(/Icon$/, '') + 'Icon';
        const IconComponent = HeroIcons[normalizedName];
        return IconComponent ? (
            <IconComponent className="w-6 h-6 text-primary" />
        ) : (
            <HeroIcons.SparklesIcon className="w-6 h-6 text-primary" />
        );
    };

    if (!stats || stats.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No statistics to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {data.title && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground">
                        {data.title}
                    </h2>
                    {data.description && (
                        <p className="text-default-600 mt-3 max-w-2xl mx-auto">
                            {data.description}
                        </p>
                    )}
                </div>
            )}

            <div
                className={`grid grid-cols-1 ${
                    stats.length === 2
                        ? 'md:grid-cols-2'
                        : stats.length <= 3
                          ? 'md:grid-cols-3'
                          : 'md:grid-cols-2 lg:grid-cols-4'
                } gap-6`}
            >
                {stats.map((stat, index) => (
                    <div key={index}>
                        <Card
                            className="transition-all duration-200 hover:shadow-lg text-center"
                            style={{
                                background: `var(--theme-content1, #FAFAFA)`,
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <CardBody className="py-8 px-6 space-y-4">
                                {stat.icon && (
                                    <div className="flex justify-center">
                                        <div
                                            className="p-3 rounded-lg"
                                            style={{
                                                background: `color-mix(in srgb, var(--theme-primary, #0070F0) 15%, transparent)`,
                                            }}
                                        >
                                            {getIcon(stat.icon)}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-4xl font-bold text-primary">
                                        {animatedValues[index] !== undefined
                                            ? animatedValues[index]
                                            : 0}
                                        {stat.suffix && (
                                            <span className="text-3xl ml-1">
                                                {stat.suffix}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-default-600">
                                        {stat.label}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsCounterBlock;
