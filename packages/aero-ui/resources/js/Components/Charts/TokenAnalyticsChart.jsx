import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const TokenAnalyticsChart = ({ 
  data = [], 
  loading = false, 
  type = 'line', // 'line', 'area', or 'pie'
  title = "Token Analytics",
  priceKey = 'price',
  volumeKey = 'volume',
  timeKey = 'timestamp',
  height = 300
}) => {
  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Colors for pie chart
  const COLORS = [
    'var(--theme-primary, #3B82F6)',
    'var(--theme-success, #10B981)',
    'var(--theme-warning, #F59E0B)',
    'var(--theme-danger, #EF4444)',
    'var(--theme-secondary, #8B5CF6)',
    'var(--theme-default-400, #A1A1AA)'
  ];

  // Format the data for the chart
  const formattedData = useMemo(() => {
    if (type === 'pie') {
      return data; // Pie chart data should already be formatted
    }
    
    return data.map(item => ({
      ...item,
      formattedTime: new Date(item[timeKey]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: timeKey.includes('hour') ? '2-digit' : undefined
      }),
      formattedPrice: typeof item[priceKey] === 'number' 
        ? item[priceKey].toFixed(6) 
        : parseFloat(item[priceKey] || 0).toFixed(6),
      formattedVolume: typeof item[volumeKey] === 'number' 
        ? item[volumeKey].toFixed(2) 
        : parseFloat(item[volumeKey] || 0).toFixed(2)
    }));
  }, [data, timeKey, priceKey, volumeKey, type]);

  // Custom tooltip for line/area charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-content1 p-3 border border-divider rounded-lg shadow-lg">
          <p className="text-sm font-medium text-default-600 mb-2">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm">
                {`${entry.name}: `}
                <span className="font-medium">
                  {entry.dataKey === priceKey 
                    ? `$${parseFloat(entry.value).toFixed(6)}`
                    : `${parseFloat(entry.value).toLocaleString()}`
                  }
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center items-center" style={{ height: `${height}px` }}>
            <Spinner size="lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center items-center text-default-400" style={{ height: `${height}px` }}>
            <p>No token data available</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: height,
      data: formattedData,
      margin: {
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      },
    };

    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-divider, #E4E4E7)" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={priceKey}
                stroke="var(--theme-success, #10B981)"
                fill="var(--theme-success, #10B981)"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Price ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                name="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  backgroundColor: 'var(--theme-content1)',
                  border: '1px solid var(--theme-divider)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-divider, #E4E4E7)" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={priceKey}
                stroke="var(--theme-success, #10B981)"
                strokeWidth={2}
                dot={{ fill: 'var(--theme-success, #10B981)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--theme-success, #10B981)', strokeWidth: 2 }}
                name="Price ($)"
              />
              {volumeKey && (
                <Line
                  type="monotone"
                  dataKey={volumeKey}
                  stroke="var(--theme-primary, #3B82F6)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--theme-primary, #3B82F6)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--theme-primary, #3B82F6)', strokeWidth: 2 }}
                  name="Volume"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Calculate price change for line/area charts
  const priceChange = useMemo(() => {
    if (type === 'pie' || formattedData.length < 2) return null;
    
    const firstPrice = parseFloat(formattedData[0][priceKey] || 0);
    const lastPrice = parseFloat(formattedData[formattedData.length - 1][priceKey] || 0);
    
    if (firstPrice === 0) return null;
    
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    return {
      percentage: change.toFixed(2),
      isPositive: change >= 0,
      value: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    };
  }, [formattedData, priceKey, type]);

  return (
    <Card className="w-full" style={{ borderRadius: `var(--borderRadius, 12px)` }}>
      <CardHeader>
        <div className="flex justify-between items-start w-full">
          <h3 className="text-lg font-semibold">{title}</h3>
          {priceChange && (
            <div className="text-right">
              <div className={`text-sm font-semibold ${priceChange.isPositive ? 'text-success' : 'text-danger'}`}>
                {priceChange.value}
              </div>
              <div className="text-xs text-default-400">
                Price Change
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {renderChart()}
        {type !== 'pie' && formattedData.length > 0 && (
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-divider">
            <div className="text-center">
              <div className="text-xs text-default-500">Current Price</div>
              <div className="text-sm font-semibold">
                ${parseFloat(formattedData[formattedData.length - 1][priceKey] || 0).toFixed(6)}
              </div>
            </div>
            {volumeKey && (
              <div className="text-center">
                <div className="text-xs text-default-500">24h Volume</div>
                <div className="text-sm font-semibold">
                  {parseFloat(formattedData[formattedData.length - 1][volumeKey] || 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TokenAnalyticsChart;