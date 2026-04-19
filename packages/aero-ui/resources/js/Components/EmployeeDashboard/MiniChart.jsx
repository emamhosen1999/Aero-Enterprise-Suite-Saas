import React from 'react';
import { Tooltip } from '@heroui/react';

/**
 * Reusable simple CSS vertical bar chart.
 * @param {{ data: Array<{label: string, value: number}>, maxValue?: number, height?: number, barColor?: string }} props
 */
const MiniChart = ({ data = [], maxValue, height = 100, barColor = 'primary' }) => {
    if (!data.length) return null;

    const computedMax = maxValue || Math.max(...data.map((d) => Number(d.value) || 0), 1);

    const colorVar = {
        primary: 'var(--theme-primary, #006FEE)',
        success: 'var(--theme-success, #17C964)',
        warning: 'var(--theme-warning, #F5A524)',
        danger: 'var(--theme-danger, #F31260)',
        secondary: 'var(--theme-secondary, #7828C8)',
    }[barColor] || 'var(--theme-primary, #006FEE)';

    return (
        <div className="flex items-end gap-1.5" style={{ height }}>
            {data.map((item, idx) => {
                const val = Number(item.value) || 0;
                const pct = computedMax > 0 ? (val / computedMax) * 100 : 0;

                return (
                    <Tooltip key={idx} content={`${item.label}: ${val}`}>
                        <div className="flex flex-col items-center gap-1 flex-1 cursor-default">
                            <div
                                className="w-full rounded-t transition-all duration-300"
                                style={{
                                    height: `${Math.max(pct, 4)}%`,
                                    backgroundColor: colorVar,
                                    minHeight: '3px',
                                    borderRadius: 'var(--borderRadius, 4px) var(--borderRadius, 4px) 0 0',
                                }}
                            />
                            <span className="text-[10px] text-default-400 leading-none truncate w-full text-center">
                                {item.label}
                            </span>
                        </div>
                    </Tooltip>
                );
            })}
        </div>
    );
};

export default MiniChart;
