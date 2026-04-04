import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/react';

const StatsBlock = ({ data = {} }) => {
    const {
        title = 'By The Numbers',
        columns = 4,
        stats = []
    } = data;

    const [counts, setCounts] = useState({});
    const statList = typeof stats === 'string' ? JSON.parse(stats || '[]') : (stats || []);

    useEffect(() => {
        const newCounts = {};
        statList.forEach((stat, idx) => {
            newCounts[idx] = 0;
        });
        setCounts(newCounts);

        // Animate counters
        statList.forEach((stat, idx) => {
            const target = parseInt(stat.value) || 0;
            const duration = 2000;
            const increment = target / (duration / 50);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setCounts(prev => ({ ...prev, [idx]: target }));
                    clearInterval(timer);
                } else {
                    setCounts(prev => ({ ...prev, [idx]: Math.floor(current) }));
                }
            }, 50);
        });
    }, [statList]);

    const gridClass = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)}`;

    return (
        <div>
            {title && <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>}

            <div className={`grid ${gridClass} gap-6`}>
                {statList.map((stat, idx) => (
                    <Card key={idx} className="border border-divider">
                        <CardBody className="gap-2 p-6 text-center">
                            <div className="text-4xl md:text-5xl font-bold text-primary">
                                {counts[idx] || 0}{stat.suffix || ''}
                            </div>
                            <p className="text-lg font-semibold text-default-800">{stat.label}</p>
                            {stat.description && <p className="text-sm text-default-500">{stat.description}</p>}
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StatsBlock;
