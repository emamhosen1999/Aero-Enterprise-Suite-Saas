import React, { useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/react';

const FAQBlock = ({ data = {} }) => {
    const {
        title = 'Frequently Asked Questions',
        description = '',
        questions = []
    } = data;

    const questionList = typeof questions === 'string' ? JSON.parse(questions || '[]') : (questions || []);
    const [expandedKey, setExpandedKey] = useState(null);

    return (
        <div className="max-w-4xl mx-auto">
            {title && <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>}
            {description && (
                <p className="text-lg text-default-600 mb-8 text-center max-w-2xl mx-auto">
                    {description}
                </p>
            )}

            <Accordion
                selectedKeys={expandedKey ? [expandedKey] : []}
                onSelectionChange={(keys) => setExpandedKey(Array.from(keys)[0] || null)}
                variant="splitted"
                className="gap-3"
            >
                {questionList.map((item, idx) => (
                    <AccordionItem
                        key={idx}
                        aria-label={item.question}
                        title={
                            <div className="text-lg font-semibold text-default-800">
                                {item.question}
                            </div>
                        }
                        className="px-4 py-2 border border-divider rounded-lg"
                        classNames={{
                            trigger: "py-4"
                        }}
                    >
                        <div className="text-default-600 pb-4">
                            {typeof item.answer === 'string' && item.answer.includes('<')
                                ? <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                                : <p>{item.answer}</p>
                            }
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default FAQBlock;
