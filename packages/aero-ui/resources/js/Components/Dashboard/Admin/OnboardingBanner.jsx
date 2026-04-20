import React from 'react';
import { Card, CardBody, Progress, Chip } from '@heroui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

const OnboardingBanner = ({ steps = [] }) => {
    if (!steps || steps.length === 0) return null;

    const completedCount = steps.filter(s => s.completed).length;
    const percentage = Math.round((completedCount / steps.length) * 100);

    if (percentage === 100) return null;

    return (
        <Card
            className="transition-all duration-200"
            style={{
                ...getThemedCardStyle(),
                border: `var(--borderWidth, 1px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, var(--theme-divider, #E4E4E7))`,
                background: `linear-gradient(135deg,
                    color-mix(in srgb, var(--theme-primary, #006FEE) 8%, var(--theme-content1, #FAFAFA)) 0%,
                    var(--theme-content1, #FAFAFA) 55%,
                    color-mix(in srgb, var(--theme-primary, #006FEE) 4%, var(--theme-content2, #F4F4F5)) 100%)`,
            }}
        >
            <CardBody className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold mb-1">Complete Your Setup</h3>
                        <Progress
                            value={percentage}
                            color="primary"
                            size="sm"
                            className="mb-2"
                            aria-label="Setup progress"
                        />
                        <div className="flex flex-wrap gap-2">
                            {steps.map((step) => (
                                <Chip
                                    key={step.key}
                                    size="sm"
                                    variant={step.completed ? 'flat' : 'bordered'}
                                    color={step.completed ? 'success' : 'default'}
                                    startContent={step.completed ? <CheckCircleIcon className="w-3.5 h-3.5" /> : null}
                                    className="cursor-pointer"
                                    onClick={() => step.route && router.visit(route(step.route))}
                                >
                                    {step.label}
                                </Chip>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{percentage}%</span>
                        <p className="text-xs text-default-500">{completedCount}/{steps.length} steps</p>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default OnboardingBanner;
