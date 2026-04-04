import React, { useState } from 'react';
import { Accordion, AccordionItem } from '@heroui/react';

const AccordionBlock = ({ data = {} }) => {
    const {
        title = 'Accordion',
        defaultOpen = false,
        items = []
    } = data;

    const itemList = typeof items === 'string' ? JSON.parse(items || '[]') : (items || []);
    const [expandedKey, setExpandedKey] = useState(defaultOpen ? '0' : null);

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}

            <Accordion
                selectedKeys={expandedKey ? [expandedKey] : []}
                onSelectionChange={(keys) => setExpandedKey(Array.from(keys)[0] || null)}
                variant="splitted"
                className="gap-3"
            >
                {itemList.map((item, idx) => (
                    <AccordionItem
                        key={idx}
                        aria-label={item.title}
                        title={item.title}
                        className="px-4 py-2 border border-divider rounded-lg"
                    >
                        <div className="text-default-600">
                            {typeof item.content === 'string' && item.content.includes('<')
                                ? <div dangerouslySetInnerHTML={{ __html: item.content }} />
                                : <p>{item.content}</p>
                            }
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default AccordionBlock;
