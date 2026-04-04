import React from 'react';
import { Card, CardBody } from '@heroui/react';

const FeaturesBlock = ({ data = {} }) => {
    const {
        title = 'Our Features',
        description = '',
        columns = 3,
        features = []
    } = data;

    const featureList = typeof features === 'string' ? JSON.parse(features || '[]') : (features || []);
    const gridClass = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)}`;

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-default-600 mb-8 max-w-3xl">{description}</p>}

            <div className={`grid ${gridClass} gap-6`}>
                {featureList.map((feature, idx) => (
                    <Card key={idx} className="border border-divider">
                        <CardBody className="gap-4 p-6">
                            {feature.icon && <div className="text-3xl">{feature.icon}</div>}
                            <h3 className="text-xl font-semibold">{feature.title}</h3>
                            <p className="text-default-600">{feature.description}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FeaturesBlock;
