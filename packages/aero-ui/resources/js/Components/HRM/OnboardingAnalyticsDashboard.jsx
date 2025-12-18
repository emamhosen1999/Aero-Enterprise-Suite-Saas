import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Select, SelectItem, Spinner } from "@heroui/react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ChartBarIcon, ArrowTrendingUpIcon, ClockIcon, 
  ExclamationTriangleIcon, DocumentArrowDownIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const OnboardingAnalyticsDashboard = ({ dateRange = 30 }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedRange, setSelectedRange] = useState(String(dateRange));
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(route('hrm.employees.onboarding-analytics'), {
        params: { days: selectedRange }
      });
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedRange]);

  const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
  };

  const themeRadius = getThemeRadius();

  const getCardStyle = () => ({
    background: `var(--theme-content1, #FAFAFA)`,
    borderColor: `var(--theme-divider, #E4E4E7)`,
    borderWidth: `2px`,
    borderRadius: `var(--borderRadius, 12px)`,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={getCardStyle()}>
        <CardBody>
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-danger mb-2" />
            <p className="text-default-600">{error}</p>
            <Button
              color="primary"
              size="sm"
              onPress={fetchAnalytics}
              className="mt-4"
              radius={themeRadius}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!analytics) return null;

  const { metrics, departments, trend, status_distribution } = analytics;

  // Prepare chart data
  const statusData = Object.entries(status_distribution || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  const departmentData = (departments || []).map(dept => ({
    name: dept.name,
    completed: dept.completed,
    inProgress: dept.in_progress,
    total: dept.total
  }));

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Onboarding Analytics</h2>
          <p className="text-default-600 text-sm mt-1">
            Track and analyze employee onboarding performance
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Select
            size="sm"
            selectedKeys={[selectedRange]}
            onSelectionChange={(keys) => setSelectedRange(Array.from(keys)[0])}
            className="w-40"
            radius={themeRadius}
            aria-label="Date Range"
          >
            <SelectItem key="7">Last 7 days</SelectItem>
            <SelectItem key="30">Last 30 days</SelectItem>
            <SelectItem key="90">Last 90 days</SelectItem>
          </Select>
          <Button
            size="sm"
            variant="flat"
            startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
            radius={themeRadius}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={getCardStyle()}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-default-600">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics?.completion_rate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-success mt-1">
                  {metrics?.completed || 0} of {metrics?.total_onboardings || 0} completed
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card style={getCardStyle()}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-default-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics?.average_completion_days?.toFixed(1) || 0} days
                </p>
                <p className="text-xs text-primary mt-1">
                  Based on completed onboardings
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClockIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card style={getCardStyle()}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-default-600">Overdue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics?.overdue || 0}
                </p>
                <p className="text-xs text-danger mt-1">
                  Require immediate attention
                </p>
              </div>
              <div className="p-2 bg-danger/10 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card style={getCardStyle()}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-default-600">In Progress</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics?.in_progress || 0}
                </p>
                <p className="text-xs text-warning mt-1">
                  Currently being completed
                </p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card style={getCardStyle()}>
          <CardHeader className="border-b border-divider">
            <h3 className="text-lg font-semibold text-foreground">Completion Trend</h3>
          </CardHeader>
          <CardBody className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="started" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Started"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card style={getCardStyle()}>
          <CardHeader className="border-b border-divider">
            <h3 className="text-lg font-semibold text-foreground">Status Distribution</h3>
          </CardHeader>
          <CardBody className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Department Breakdown */}
        <Card style={getCardStyle()} className="lg:col-span-2">
          <CardHeader className="border-b border-divider">
            <h3 className="text-lg font-semibold text-foreground">Department Breakdown</h3>
          </CardHeader>
          <CardBody className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="inProgress" fill="#3B82F6" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingAnalyticsDashboard;
