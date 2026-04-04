import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { StarIcon } from '@heroicons/react/24/solid';

const TestimonialsBlock = ({ data = {} }) => {
    const {
        title = 'What Our Customers Say',
        description = '',
        columns = 3,
        testimonials = []
    } = data;

    const testimonialList = typeof testimonials === 'string' ? JSON.parse(testimonials || '[]') : (testimonials || []);
    const gridClass = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)}`;

    const renderStars = (rating = 5) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>}
            {description && <p className="text-lg text-default-600 mb-8 max-w-3xl mx-auto text-center">{description}</p>}

            <div className={`grid ${gridClass} gap-6`}>
                {testimonialList.map((testimonial, idx) => (
                    <Card key={idx} className="border border-divider">
                        <CardBody className="gap-4 p-6">
                            {/* Rating */}
                            <div className="flex gap-1">
                                {renderStars(testimonial.rating || 5)}
                            </div>

                            {/* Quote */}
                            <p className="text-default-700 italic">"{testimonial.quote}"</p>

                            {/* Author */}
                            <div>
                                <p className="font-semibold text-default-800">{testimonial.author}</p>
                                {testimonial.position && (
                                    <p className="text-sm text-default-500">{testimonial.position}</p>
                                )}
                                {testimonial.company && (
                                    <p className="text-sm text-default-500">{testimonial.company}</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TestimonialsBlock;
