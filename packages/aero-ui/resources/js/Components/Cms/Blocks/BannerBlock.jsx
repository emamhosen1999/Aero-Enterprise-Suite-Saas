import React, { useState } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const BannerBlock = ({ data = {} }) => {
    const {
        title = 'Important Notice',
        message = 'This is a banner message',
        backgroundColor = '#f59e0b',
        textColor = '#ffffff',
        dismissible = true,
        dismissText = 'message'
    } = data;

    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed && dismissible) {
        return null;
    }

    return (
        <Card
            className="border-0 relative"
            style={{
                backgroundColor,
                color: textColor
            }}
        >
            <CardBody className="flex flex-row items-start justify-between gap-4 p-6">
                <div>
                    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
                    {message && <p>{message}</p>}
                </div>

                {dismissible && (
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => setIsDismissed(true)}
                        className="min-w-fit"
                        style={{ color: textColor }}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </Button>
                )}
            </CardBody>
        </Card>
    );
};

export default BannerBlock;
