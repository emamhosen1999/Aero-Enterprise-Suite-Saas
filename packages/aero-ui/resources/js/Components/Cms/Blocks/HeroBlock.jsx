import React from 'react';
import { Button } from '@heroui/react';

const HeroBlock = ({ data = {} }) => {
    const {
        title = 'Welcome',
        subtitle = '',
        backgroundImage = '',
        backgroundOverlay = 'rgba(0, 0, 0, 0.5)',
        ctaText = '',
        ctaUrl = '',
        alignment = 'center'
    } = data;

    const alignmentClass = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end'
    }[alignment] || 'text-center items-center';

    return (
        <div
            className="relative w-full h-96 overflow-hidden rounded-lg flex flex-col justify-center"
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: backgroundOverlay }}
            />

            {/* Content */}
            <div className={`relative z-10 px-6 py-12 flex flex-col ${alignmentClass}`}>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
                {subtitle && (
                    <p className="text-xl text-white/90 mb-8 max-w-2xl">{subtitle}</p>
                )}
                {ctaText && ctaUrl && (
                    <Button
                        as="a"
                        href={ctaUrl}
                        color="primary"
                        size="lg"
                        className="font-semibold"
                    >
                        {ctaText}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default HeroBlock;
