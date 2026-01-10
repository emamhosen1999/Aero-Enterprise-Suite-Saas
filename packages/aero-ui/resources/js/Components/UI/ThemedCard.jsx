import React from 'react';
import { CardBody, CardHeader } from '@heroui/react';

export const getThemedCardStyle = () => ({
    border: 'var(--borderWidth, 2px) solid transparent',
    borderRadius: 'var(--borderRadius, 12px)',
    fontFamily: 'var(--fontFamily, "Inter")',
    transform: 'scale(var(--scale, 1))',
    background: `linear-gradient(135deg,
        var(--theme-content1, #FAFAFA) 20%,
        var(--theme-content2, #F4F4F5) 10%,
        var(--theme-content3, #F1F3F4) 20%)`,
});

export const ThemedCardHeader = ({ children, ...props }) => (
    <CardHeader
        className="border-b p-0"
        style={{
            borderColor: 'var(--theme-divider, #E4E4E7)',
            background: `linear-gradient(135deg,
                color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
        }}
        {...props}
    >
        {children}
    </CardHeader>
);

export const ThemedCardBody = ({ children, className = 'p-6', ...props }) => (
    <CardBody className={className} {...props}>
        {children}
    </CardBody>
);
