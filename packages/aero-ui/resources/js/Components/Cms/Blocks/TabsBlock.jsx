import React, { useState } from 'react';
import { Tabs, Tab, Card, CardBody } from '@heroui/react';

const TabsBlock = ({ data = {} }) => {
    const {
        title = 'Tabs',
        description = '',
        tabs = [],
        defaultTab = 0
    } = data;

    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const tabList = typeof tabs === 'string' ? JSON.parse(tabs || '[]') : (tabs || []);

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-default-600 mb-6">{description}</p>}

            <Tabs
                selectedKey={String(selectedTab)}
                onSelectionChange={(key) => setSelectedTab(parseInt(key))}
                variant="underlined"
                className="gap-4"
            >
                {tabList.map((tab, idx) => (
                    <Tab
                        key={idx}
                        title={tab.label}
                        className="w-full"
                    >
                        <Card className="border border-divider mt-4">
                            <CardBody className="p-6">
                                {typeof tab.content === 'string' && tab.content.includes('<')
                                    ? <div dangerouslySetInnerHTML={{ __html: tab.content }} />
                                    : <p className="text-default-700">{tab.content}</p>
                                }
                            </CardBody>
                        </Card>
                    </Tab>
                ))}
            </Tabs>
        </div>
    );
};

export default TabsBlock;
