import React from 'react';
import { Button } from '@heroui/react';

const CTABlock = ({ data = {} }) => {
    const {
        title = 'Ready to Get Started?',
        description = '',
        buttonText = 'Learn More',
        buttonUrl = '#',
        backgroundColor = '#f3f4f6',
        buttonColor = 'primary'
    } = data;

    return (
        <div
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor }}
        >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            {description && (
                <p className="text-lg text-default-600 mb-8 max-w-2xl mx-auto">{description}</p>
            )}
            <Button
                as="a"
                href={buttonUrl}
                color={buttonColor}
                size="lg"
                className="font-semibold"
            >
                {buttonText}
            </Button>
        </div>
    );
};

export default CTABlock;
