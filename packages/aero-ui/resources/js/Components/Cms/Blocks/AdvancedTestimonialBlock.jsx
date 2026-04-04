import React, { useMemo } from 'react';
import { Card, CardBody, Avatar, Rating } from '@heroui/react';
import { StarIcon } from '@heroicons/react/24/solid';

const TestimonialBlock = ({ data = {} }) => {
    const testimonials = data.testimonials || [];
    const isGridLayout = testimonials.length > 1;

    // Handle single testimonial as full-width card
    const renderSingleTestimonial = (testimonial) => (
        <div key={testimonial.id || Math.random()} className="w-full">
            <Card className="transition-all duration-200 hover:shadow-lg"
                style={{
                    background: `var(--theme-content1, #FAFAFA)`,
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                }}
            >
                <CardBody className="p-8">
                    {/* Stars */}
                    {testimonial.rating && (
                        <div className="flex gap-1 mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon
                                    key={i}
                                    className={`w-5 h-5 ${
                                        i < testimonial.rating
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Quote */}
                    <p className="text-lg text-foreground mb-6 italic">
                        &quot;{testimonial.quote}&quot;
                    </p>

                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                        {testimonial.avatar && (
                            <Avatar
                                src={testimonial.avatar}
                                size="lg"
                                name={testimonial.author}
                            />
                        )}
                        <div>
                            <p className="font-semibold text-foreground">
                                {testimonial.author}
                            </p>
                            {testimonial.title && (
                                <p className="text-sm text-default-500">
                                    {testimonial.title}
                                    {testimonial.company && ` at ${testimonial.company}`}
                                </p>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );

    // Handle multiple testimonials as grid
    const renderTestimonialGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
                <div key={testimonial.id || Math.random()}>
                    <Card className="h-full transition-all duration-200 hover:shadow-lg"
                        style={{
                            background: `var(--theme-content1, #FAFAFA)`,
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            borderWidth: `var(--borderWidth, 2px)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                        }}
                    >
                        <CardBody className="p-5 flex flex-col justify-between">
                            {/* Stars */}
                            {testimonial.rating && (
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`w-4 h-4 ${
                                                i < testimonial.rating
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Quote */}
                            <p className="text-sm text-foreground mb-4 italic flex-grow">
                                &quot;{testimonial.quote}&quot;
                            </p>

                            {/* Author Info */}
                            <div className="flex items-center gap-3 pt-4 border-t border-divider">
                                {testimonial.avatar && (
                                    <Avatar
                                        src={testimonial.avatar}
                                        size="sm"
                                        name={testimonial.author}
                                    />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-foreground line-clamp-1">
                                        {testimonial.author}
                                    </p>
                                    {testimonial.title && (
                                        <p className="text-xs text-default-500 line-clamp-1">
                                            {testimonial.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            ))}
        </div>
    );

    if (!testimonials || testimonials.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No testimonials to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {data.title && (
                <div>
                    <h2 className="text-3xl font-bold text-foreground">{data.title}</h2>
                    {data.description && (
                        <p className="text-default-600 mt-2">{data.description}</p>
                    )}
                </div>
            )}

            {testimonials.length === 1 ? renderSingleTestimonial(testimonials[0]) : renderTestimonialGrid()}
        </div>
    );
};

export default TestimonialBlock;
