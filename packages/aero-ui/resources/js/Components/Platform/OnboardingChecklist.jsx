import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardBody, Progress, Chip, Button } from '@heroui/react';
import {
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { hasRoute, safeRoute } from '@/utils/routeUtils';

/**
 * Onboarding Tasks Configuration
 */
const defaultTasks = [
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add your personal details and profile photo',
    icon: UserIcon,
    route: 'profile.edit',
    checkField: 'profile_completed',
  },
  {
    id: 'company',
    title: 'Set up company info',
    description: 'Add your company address and contact details',
    icon: BuildingOfficeIcon,
    route: 'settings.company',
    checkField: 'company_setup',
  },
  {
    id: 'branding',
    title: 'Upload company logo',
    description: 'Customize your workspace with your brand',
    icon: PhotoIcon,
    route: 'settings.branding',
    checkField: 'logo_uploaded',
  },
  {
    id: 'team',
    title: 'Invite team members',
    description: 'Add your first team member to collaborate',
    icon: UserGroupIcon,
    route: 'users.create',
    checkField: 'team_invited',
  },
  {
    id: 'module',
    title: 'Configure a module',
    description: 'Set up your first business module',
    icon: Cog6ToothIcon,
    route: 'settings.modules',
    checkField: 'module_configured',
  },
];

/**
 * Progressive Onboarding Checklist Component
 * 
 * Displays an inline checklist on the dashboard to guide users
 * through completing their workspace setup. Can be dismissed.
 */
export default function OnboardingChecklist({
  tasks = defaultTasks,
  completionStatus = {},
  onDismiss,
  className = '',
}) {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  // Calculate completion status
  const { completedCount, totalCount, progressPercent, tasksWithStatus } = useMemo(() => {
    const tasksWithStatus = tasks.map((task) => ({
      ...task,
      completed: completionStatus[task.checkField] || completionStatus[task.id] || false,
    }));

    const completedCount = tasksWithStatus.filter((t) => t.completed).length;
    const totalCount = tasksWithStatus.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { completedCount, totalCount, progressPercent, tasksWithStatus };
  }, [tasks, completionStatus]);

  const palette = {
    surface: isDarkMode
      ? 'bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-primary/20'
      : 'bg-gradient-to-br from-primary/5 via-secondary/5 to-white border border-primary/20',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    taskBg: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50',
    completedText: isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through',
  };

  // Don't show if all completed
  if (completedCount === totalCount) {
    return null;
  }

  return (
    <Card className={`${palette.surface} ${className}`} shadow="sm">
      <CardBody className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`font-semibold text-lg ${palette.text}`}>
                Complete your setup
              </h3>
              <Chip size="sm" color="primary" variant="flat">
                {completedCount}/{totalCount}
              </Chip>
            </div>
            <Progress
              value={progressPercent}
              color="primary"
              size="sm"
              className="max-w-xs"
              aria-label="Setup progress"
            />
          </div>

          {onDismiss && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onDismiss}
              aria-label="Dismiss onboarding checklist"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasksWithStatus.map((task) => {
            const Icon = task.icon;
            const routeExists = hasRoute(task.route);

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${palette.taskBg}`}
              >
                {/* Completion Icon */}
                <div className="shrink-0">
                  {task.completed ? (
                    <CheckCircleSolid className="w-6 h-6 text-success" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-default-300" />
                  )}
                </div>

                {/* Task Icon */}
                <div className={`p-2 rounded-lg shrink-0 ${
                  task.completed 
                    ? 'bg-default-100' 
                    : isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    task.completed ? 'text-default-400' : 'text-primary'
                  }`} />
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${
                    task.completed ? palette.completedText : palette.text
                  }`}>
                    {task.title}
                  </p>
                  <p className={`text-xs ${palette.muted} truncate`}>
                    {task.description}
                  </p>
                </div>

                {/* Action Button */}
                {!task.completed && routeExists && (
                  <Link href={safeRoute(task.route)}>
                    <Button size="sm" variant="flat" color="primary">
                      Start
                    </Button>
                  </Link>
                )}

                {task.completed && (
                  <Chip size="sm" color="success" variant="flat">
                    Done
                  </Chip>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`mt-4 pt-4 border-t border-divider ${palette.muted}`}>
          <p className="text-xs text-center">
            Complete all steps to get the most out of your workspace
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
