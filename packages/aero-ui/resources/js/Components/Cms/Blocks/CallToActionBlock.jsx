import React from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const CallToActionBlock = ({ data = {} }) => {
    const bgImage = data.background_image;
    const bgColor = data.background_color || 'var(--theme-primary, #0070F0)';
    const buttonStyle = data.button_style || 'primary';

    const buttonStyleMap = {
        primary: { color: 'primary', variant: 'shadow' },
        secondary: { color: 'secondary', variant: 'shadow' },
        outline: { color: 'primary', variant: 'bordered' },
    };

    const baseStyle = {
        background: bgImage
            ? `linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${bgImage}')`
            : bgColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: `var(--borderRadius, 12px)`,
    };

    if (!data.headline) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>CTA Block not properly configured</p>
            </div>
        );
    }

    return (
        <Card
            className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl"
            style={baseStyle}
        >
            <CardBody className="p-8 md:p-12 relative z-10 text-center space-y-6">
                <div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                        {data.headline}
                    </h2>
                </div>

                {data.description && (
                    <p className="text-lg text-white/90 max-w-2xl mx-auto">
                        {data.description}
                    </p>
                )}

                {data.button_text && (
                    <div className="pt-4">
                        <Button
                            as="a"
                            href={data.button_link || '#'}
                            color={buttonStyleMap[buttonStyle].color}
                            variant={buttonStyleMap[buttonStyle].variant}
                            size="lg"
                            endContent={<ArrowRightIcon className="w-5 h-5" />}
                            className={
                                buttonStyle === 'outline'
                                    ? 'border-white text-white hover:bg-white/10'
                                    : ''
                            }
                        >
                            {data.button_text}
                        </Button>
                    </div>
                )}
            </CardBody>

            {bgImage && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 -z-0"
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                    }}
                />
            )}
        </Card>
    );
};

export default CallToActionBlock;
