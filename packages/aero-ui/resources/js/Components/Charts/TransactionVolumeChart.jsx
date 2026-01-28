import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

const TransactionVolumeChart = ({ 
  data = [], 
  loading = false, 
  type = 'bar', // 'bar', 'area', or 'composed'
  title = "Transaction Volume",
  volumeKey = 'volume',
  countKey = 'count',
  timeKey = 'timestamp',
  height = 300
}) => {
  // Theme radius helper
  const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
  };

  // Format the data for the chart
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedTime: new Date(item[timeKey]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      formattedVolume: typeof item[volumeKey] === 'number' 
        ? item[volumeKey].toFixed(2) 
        : parseFloat(item[volumeKey] || 0).toFixed(2)
    }));
  }, [data, timeKey, volumeKey]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-content1 p-3 border border-divider rounded-lg shadow-lg">
          <p className="text-sm font-medium text-default-600 mb-2">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm">
                {`${entry.name}: `}
                <span className="font-medium">
                  {entry.dataKey === volumeKey 
                    ? `${parseFloat(entry.value).toLocaleString()} ETH`
                    : entry.value.toLocaleString()
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

  // Format Y-axis labels
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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
            <p>No transaction data available</p>
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
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={volumeKey}
                stroke="var(--theme-primary, #3B82F6)"
                fill="var(--theme-primary, #3B82F6)"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Volume (ETH)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer {...commonProps}>
            <ComposedChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-divider, #E4E4E7)" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <YAxis 
                yAxisId="volume"
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
                tickFormatter={formatYAxis}
              />
              <YAxis 
                yAxisId="count"
                orientation="right"
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="volume"
                dataKey={volumeKey}
                fill="var(--theme-primary, #3B82F6)"
                opacity={0.8}
                name="Volume (ETH)"
              />
              <Area
                yAxisId="count"
                type="monotone"
                dataKey={countKey}
                stroke="var(--theme-success, #10B981)"
                fill="var(--theme-success, #10B981)"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Transaction Count"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-divider, #E4E4E7)" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--theme-default-500, #6B7280)"
                fontSize={12}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={volumeKey}
                fill="var(--theme-primary, #3B82F6)"
                radius={[4, 4, 0, 0]}
                name="Volume (ETH)"
              />
              {countKey && (
                <Bar
                  dataKey={countKey}
                  fill="var(--theme-success, #10B981)"
                  radius={[4, 4, 0, 0]}
                  name="Transaction Count"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // Calculate summary stats
  const totalVolume = formattedData.reduce((sum, item) => sum + parseFloat(item[volumeKey] || 0), 0);
  const totalTransactions = formattedData.reduce((sum, item) => sum + parseInt(item[countKey] || 0), 0);
  const avgVolume = formattedData.length > 0 ? totalVolume / formattedData.length : 0;

  return (
    <Card className="w-full" style={{ borderRadius: `var(--borderRadius, 12px)` }}>
      <CardHeader>
        <div className="flex justify-between items-start w-full">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-right">
            <div className="text-sm text-default-500">
              Total Volume: <span className="font-semibold text-primary">{totalVolume.toFixed(2)} ETH</span>
            </div>
            {totalTransactions > 0 && (
              <div className="text-xs text-default-400">
                {totalTransactions.toLocaleString()} transactions
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {renderChart()}
        {formattedData.length > 1 && (
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-divider">
            <div className="text-center">
              <div className="text-xs text-default-500">Avg Daily Volume</div>
              <div className="text-sm font-semibold">{avgVolume.toFixed(2)} ETH</div>
            </div>
            {totalTransactions > 0 && (
              <div className="text-center">
                <div className="text-xs text-default-500">Avg Daily Transactions</div>
                <div className="text-sm font-semibold">
                  {Math.round(totalTransactions / formattedData.length).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TransactionVolumeChart;