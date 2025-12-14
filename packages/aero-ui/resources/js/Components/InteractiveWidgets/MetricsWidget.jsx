
import React, { useState, useEffect } from 'react';
import { Button, Card } from '@heroui/react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';


const MetricsWidget = ({ 
  title, 
  value, 
  previousValue, 
  unit = '', 
  icon: IconComponent,
  color = '#0ea5e9',
  interactive = true,
  sparklineData = [],
  onClick
}) => {

  const [isHovered, setIsHovered] = useState(false);

  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) return { trend: 0, isPositive: true };
    const trend = ((value - previousValue) / previousValue) * 100;
    return { trend: Math.abs(trend), isPositive: trend >= 0 };
  };

  const { trend, isPositive } = calculateTrend();

  const renderSparkline = () => {
    if (!sparklineData.length) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, index) => {
      const x = (index / (sparklineData.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 30" className="w-full h-8 mt-2 opacity-60">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          className="drop-shadow-xs"
        />
      </svg>
    );
  };

  return (
    <Card
      className={`shadow-lg cursor-pointer transition-all duration-300 ${interactive ? 'hover:scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl border flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                borderColor: `${color}30`,
              }}
            >
              <IconComponent 
                className="w-6 h-6"
                style={{ color: color }}
              />
            </div>
            <h4 className="text-sm font-semibold text-default-600">
              {title}
            </h4>
          </div>
          {interactive && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <h2 
            className="text-3xl sm:text-4xl font-extrabold leading-none bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${color}, ${color}CC)`
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
            <span className="text-xl ml-1">{unit}</span>
          </h2>
        </div>

        {/* Trend Indicator */}
        {previousValue && (
          <div className="flex items-center gap-2 mb-4">
            {isPositive ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
            )}
            <span 
              className={`text-xs font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}
            >
              {trend.toFixed(1)}% {isPositive ? 'increase' : 'decrease'}
            </span>
          </div>
        )}

        {/* Sparkline */}
        {renderSparkline()}

        {/* Interactive Glow Effect */}
        {interactive && isHovered && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${color}15 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </Card>
  );
};

export default MetricsWidget;
