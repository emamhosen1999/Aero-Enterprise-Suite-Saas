import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { useThemeRadius } from '@/Hooks/useThemeRadius';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const NetworkAnalyticsChart = ({ 
  data = [], 
  loading = false, 
  type = 'line', // 'line' or 'area'
  title = "Network Analytics",
  dataKey = 'value',
  timeKey = 'timestamp',
  height = 300
}) => {
  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Format the data for the chart
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedTime: new Date(item[timeKey]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [data, timeKey]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-content1 p-3 border border-divider rounded-lg shadow-lg">
          <p className="text-sm font-medium text-default-600">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
            <p>No data available</p>
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

    if (type === 'area') {
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
              dataKey={dataKey}
              stroke="var(--theme-primary, #3B82F6)"
              fill="var(--theme-primary, #3B82F6)"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

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
            dataKey={dataKey}
            stroke="var(--theme-primary, #3B82F6)"
            strokeWidth={2}
            dot={{ fill: 'var(--theme-primary, #3B82F6)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'var(--theme-primary, #3B82F6)', strokeWidth: 2 }}
            name="Value"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full" style={{ borderRadius: `var(--borderRadius, 12px)` }}>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody className="pt-2">
        {renderChart()}
      </CardBody>
    </Card>
  );
};

export default NetworkAnalyticsChart;