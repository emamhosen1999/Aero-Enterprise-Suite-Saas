import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Button } from '@heroui/react';
import { Link } from '@inertiajs/react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const OnboardingProgressWidget = ({ onboarding }) => {
  // Helper function to calculate days between dates
  const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
  };

  // Helper function to format relative time
  const formatRelativeTime = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} ago`;
  };

  // Calculate progress metrics
  const metrics = useMemo(() => {
    if (!onboarding || !onboarding.tasks) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        isOverdue: false,
      };
    }

    const tasks = onboarding.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed_at).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const startDate = onboarding.start_date ? new Date(onboarding.start_date) : new Date();
    const expectedDate = onboarding.expected_completion_date
      ? new Date(onboarding.expected_completion_date)
      : new Date();
    const today = new Date();

    const daysElapsed = daysBetween(startDate, today);
    const daysRemaining = daysBetween(today, expectedDate);
    const isOverdue = onboarding.status === 'in_progress' && daysRemaining < 0;

    return {
      totalTasks,
      completedTasks,
      progress: Math.round(progress),
      daysElapsed,
      daysRemaining,
      isOverdue,
    };
  }, [onboarding]);

  // Get status badge configuration
  const getStatusConfig = () => {
    if (!onboarding) {
      return { color: 'default', label: 'No Onboarding', icon: null };
    }

    if (onboarding.status === 'completed' || metrics.progress === 100) {
      return {
        color: 'success',
        label: 'Completed',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      };
    }

    if (metrics.isOverdue) {
      return {
        color: 'danger',
        label: 'Overdue',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      };
    }

    if (onboarding.status === 'in_progress' || metrics.progress > 0) {
      return {
        color: 'primary',
        label: `${metrics.progress}% Complete`,
        icon: <ClockIcon className="w-4 h-4" />,
      };
    }

    return {
      color: 'default',
      label: 'Not Started',
      icon: <CalendarIcon className="w-4 h-4" />,
    };
  };

  // Get progress color
  const getProgressColor = () => {
    if (metrics.progress === 100) return 'success';
    if (metrics.isOverdue) return 'danger';
    if (metrics.progress > 50) return 'primary';
    if (metrics.progress > 0) return 'warning';
    return 'default';
  };

  const statusConfig = getStatusConfig();

  // If no onboarding data, don't render
  if (!onboarding) {
    return null;
  }

  return (
    <Card
      shadow="sm"
      className="w-full"
      style={{
        background: 'var(--theme-content1, #FAFAFA)',
        borderColor: 'var(--theme-divider, #E4E4E7)',
        borderWidth: '1px',
        borderRadius: 'var(--borderRadius, 12px)',
      }}
    >
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Onboarding Progress</h3>
          <Chip
            color={statusConfig.color}
            variant="flat"
            size="sm"
            startContent={statusConfig.icon}
          >
            {statusConfig.label}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Progress Circle and Stats */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Circular Progress */}
            <div className="flex-shrink-0">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-default-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - metrics.progress / 100)}`}
                    className={`text-${getProgressColor()} transition-all duration-500`}
                    style={{
                      stroke:
                        metrics.progress === 100
                          ? 'rgb(34, 197, 94)'
                          : metrics.isOverdue
                          ? 'rgb(239, 68, 68)'
                          : 'rgb(59, 130, 246)',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{metrics.progress}%</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3 w-full">
              {/* Tasks Completion */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-default-600">Tasks Completed</span>
                  <span className="text-sm font-semibold text-foreground">
                    {metrics.completedTasks} / {metrics.totalTasks}
                  </span>
                </div>
                <Progress
                  value={metrics.progress}
                  color={getProgressColor()}
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Time Information */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-default-500">Days Elapsed</p>
                  <p className="font-semibold text-foreground">{metrics.daysElapsed} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-default-500">
                    {metrics.isOverdue ? 'Days Overdue' : 'Days Remaining'}
                  </p>
                  <p
                    className={`font-semibold ${
                      metrics.isOverdue ? 'text-danger' : 'text-foreground'
                    }`}
                  >
                    {metrics.isOverdue
                      ? `${Math.abs(metrics.daysRemaining)} days`
                      : metrics.daysRemaining === 0
                      ? 'Due today'
                      : `${metrics.daysRemaining} days`}
                  </p>
                </div>
              </div>

              {/* Expected Completion */}
              {onboarding.expected_completion_date && (
                <div className="text-sm">
                  <p className="text-default-500">Expected Completion</p>
                  <p className="font-medium text-foreground">
                    {new Date(onboarding.expected_completion_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' '}
                    <span className="text-default-400">
                      ({formatRelativeTime(metrics.daysRemaining)})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Task Preview List */}
          {onboarding.tasks && onboarding.tasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Recent Tasks</h4>
              <div className="space-y-1">
                {onboarding.tasks.slice(0, 5).map((task, index) => (
                  <div
                    key={task.id || index}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    {task.completed_at ? (
                      <CheckIcon className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-default-300 flex-shrink-0" />
                    )}
                    <span
                      className={`flex-1 ${
                        task.completed_at ? 'text-default-400 line-through' : 'text-foreground'
                      }`}
                    >
                      {task.title || task.name || 'Untitled Task'}
                    </span>
                  </div>
                ))}
                {onboarding.tasks.length > 5 && (
                  <p className="text-xs text-default-400 pl-6">
                    +{onboarding.tasks.length - 5} more tasks
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Link href={`/hrm/onboarding/${onboarding.id}`}>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                fullWidth
                className="font-medium"
              >
                View Full Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default OnboardingProgressWidget;
