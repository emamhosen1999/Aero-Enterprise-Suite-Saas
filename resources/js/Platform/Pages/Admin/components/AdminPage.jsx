import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';

/**
 * AdminPage - Layout wrapper for Platform Admin pages
 * Provides consistent styling and structure for admin section pages
 */
const AdminPage = ({ 
    title, 
    description, 
    actions,
    children 
}) => {
    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-default-500">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex shrink-0 gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Page Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
};

/**
 * SectionCard - Card component for organizing content sections
 */
export const SectionCard = ({ 
    title, 
    description, 
    actions,
    children,
    bleed = false,
    bodyClassName = ''
}) => {
    return (
        <Card 
            className="shadow-md"
            classNames={{
                base: "border border-divider bg-content1",
            }}
        >
            {(title || description || actions) && (
                <CardHeader className="flex flex-col gap-1 border-b border-divider px-6 py-4">
                    <div className="flex w-full items-start justify-between gap-4">
                        <div className="flex-1">
                            {title && (
                                <h2 className="text-lg font-semibold text-foreground">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-0.5 text-sm text-default-500">
                                    {description}
                                </p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex shrink-0 gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardBody className={bleed ? bodyClassName : `p-6 ${bodyClassName}`}>
                {children}
            </CardBody>
        </Card>
    );
};

/**
 * StatCard - Card component for displaying statistics
 */
export const StatCard = ({ 
    label, 
    value, 
    change, 
    icon: Icon,
    trend = 'up'
}) => {
    const trendColors = {
        up: 'text-success',
        down: 'text-danger',
        neutral: 'text-default-500'
    };

    return (
        <Card 
            className="shadow-sm"
            classNames={{
                base: "border border-divider bg-content1",
            }}
        >
            <CardBody className="flex flex-row items-center gap-4 p-4">
                {Icon && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-sm text-default-500">{label}</p>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                    {change && (
                        <p className={`text-xs ${trendColors[trend]}`}>
                            {change}
                        </p>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default AdminPage;
