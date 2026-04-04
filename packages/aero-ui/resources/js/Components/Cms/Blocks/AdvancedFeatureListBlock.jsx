import React, { useMemo } from 'react';
import { Card, CardBody } from '@heroui/react';
import * as HeroIcons from '@heroicons/react/24/outline';

const AdvancedFeatureListBlock = ({ data = {} }) => {
    const features = data.features || [];
    const columns = data.columns || 3;

    const gridColsClass = useMemo(() => {
        const colsMap = {
            1: 'grid-cols-1',
            2: 'md:grid-cols-2 grid-cols-1',
            3: 'md:grid-cols-2 lg:grid-cols-3 grid-cols-1',
            4: 'md:grid-cols-2 lg:grid-cols-4 grid-cols-1',
        };
        return colsMap[Math.min(columns, 4)] || colsMap[3];
    }, [columns]);

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

    if (!features || features.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No features to display</p>
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

            <div className={`grid ${gridColsClass} gap-6`}>
                {features.map((feature, index) => (
                    <div key={index}>
                        <Card
                            className="h-full transition-all duration-200 hover:shadow-lg group"
                            style={{
                                background: `var(--theme-content1, #FAFAFA)`,
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <CardBody className="p-6 space-y-4">
                                {feature.icon && (
                                    <div className="p-3 rounded-lg w-fit"
                                        style={{
                                            background: `color-mix(in srgb, var(--theme-primary, #0070F0) 15%, transparent)`,
                                        }}
                                    >
                                        {getIcon(feature.icon)}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        {feature.title}
                                    </h3>

                                    {feature.description && (
                                        <p className="text-sm text-default-600 line-clamp-3">
                                            {feature.description}
                                        </p>
                                    )}
                                </div>

                                {feature.image && (
                                    <div className="mt-4 rounded-lg overflow-hidden h-32">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdvancedFeatureListBlock;
