import React, { useState } from 'react';
import { Card, CardBody } from '@heroui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const FAQSectionBlock = ({ data = {} }) => {
    const items = data.items || [];
    const [expandedKey, setExpandedKey] = useState(new Set([]));

    if (!items || items.length === 0) {
        return (
            <div className="text-center text-default-500 py-8">
                <p>No FAQ items to display</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {data.title && (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground">
                        {data.title}
                    </h2>
                    {data.description && (
                        <p className="text-default-600 mt-3">
                            {data.description}
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {items.map((item, index) => (
                    <Card
                        key={index}
                        className="transition-all duration-200"
                        style={{
                            background: `var(--theme-content1, #FAFAFA)`,
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            borderWidth: `var(--borderWidth, 2px)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                        }}
                    >
                        <CardBody className="p-0 overflow-hidden">
                            <button
                                onClick={() => {
                                    const newSet = new Set(expandedKey);
                                    if (newSet.has(index)) {
                                        newSet.delete(index);
                                    } else {
                                        newSet.add(index);
                                    }
                                    setExpandedKey(newSet);
                                }}
                                className="w-full flex items-center justify-between p-5 hover:bg-default-100/50 transition-colors text-left"
                            >
                                <h3 className="font-semibold text-foreground flex-grow">
                                    {item.question}
                                </h3>
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-default-400 transition-transform flex-shrink-0 ml-4 ${
                                        expandedKey.has(index) ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {expandedKey.has(index) && (
                                <div className="border-t border-divider px-5 py-4">
                                    <p className="text-default-600 leading-relaxed whitespace-pre-wrap">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FAQSectionBlock;
