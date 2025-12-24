import React from 'react';
import { router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate } from '@/utils/routeUtils';
import {
  CalendarDaysIcon,
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// Time Off Management Navigation Component
const TimeOffNavigation = ({ currentRoute, permissions = [] }) => {
  const navigationItems = [
    {
      name: 'Dashboard',
      route: 'hr.timeoff.dashboard',
      icon: ChartBarIcon,
      description: 'Overview of time-off management',
      permission: 'hr.timeoff.view'
    },
    {
      name: 'My Requests',
      route: 'hr.timeoff.employee-requests',
      icon: DocumentTextIcon,
      description: 'Manage your time-off requests',
      permission: 'hr.timeoff.view'
    },
    {
      name: 'Company Holidays',
      route: 'hr.timeoff.holidays',
      icon: GlobeAltIcon,
      description: 'View and manage company holidays',
      permission: 'hr.timeoff.view'
    },
    {
      name: 'Team Calendar',
      route: 'hr.timeoff.calendar',
      icon: CalendarDaysIcon,
      description: 'View team time-off calendar',
      permission: 'hr.timeoff.view'
    },
    {
      name: 'Leave Requests',
      route: 'hr.timeoff.leave-requests',
      icon: UserGroupIcon,
      description: 'Manage team leave requests',
      permission: 'hr.timeoff.manage'
    },
    {
      name: 'Leave Balances',
      route: 'hr.timeoff.balances',
      icon: ClockIcon,
      description: 'View team leave balances',
      permission: 'hr.timeoff.manage'
    },
    {
      name: 'Reports',
      route: 'hr.timeoff.reports',
      icon: ChartBarIcon,
      description: 'Time-off analytics and reports',
      permission: 'hr.timeoff.reports'
    },
    {
      name: 'Settings',
      route: 'settings.leave',
      icon: CogIcon,
      description: 'Configure time-off policies',
      permission: 'hr.timeoff.settings'
    }
  ];

  const hasPermission = (permission) => {
    return permissions.includes(permission) || permissions.includes('*');
  };

  const handleNavigation = (route) => {
    // Use safe navigation with route validation
    if (typeof route === 'string') {
      safeNavigate(route);
    }
  };

  const isActive = (route) => {
    return currentRoute === route;
  };

  return (
    <div className="space-y-2">
      {navigationItems
        .filter(item => hasPermission(item.permission))
        .map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          
          return (
            <button
              key={index}
              onClick={() => handleNavigation(route(item.route))}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                ${active 
                  ? 'bg-linear-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30' 
                  : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs opacity-70 truncate">{item.description}</div>
              </div>
              {active && (
                <div className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
              )}
            </button>
          );
        })}
    </div>
  );
};

// Quick Actions Component for Time Off
export const TimeOffQuickActions = ({ permissions = [] }) => {
  const quickActions = [
    {
      name: 'Request Time Off',
      route: 'hr.timeoff.employee-requests',
      icon: PlusIcon,
      color: 'bg-linear-to-r from-blue-500 to-blue-600',
      permission: 'hr.timeoff.view'
    },
    {
      name: 'Add Holiday',
      route: 'hr.timeoff.holidays',
      icon: GlobeAltIcon,
      color: 'bg-linear-to-r from-green-500 to-green-600',
      permission: 'hr.timeoff.manage'
    },
    {
      name: 'View Calendar',
      route: 'hr.timeoff.calendar',
      icon: CalendarDaysIcon,
      color: 'bg-linear-to-r from-purple-500 to-purple-600',
      permission: 'hr.timeoff.view'
    }
  ];

  const hasPermission = (permission) => {
    return permissions.includes(permission) || permissions.includes('*');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {quickActions
        .filter(action => hasPermission(action.permission))
        .map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={() => safeNavigate(action.route)}
              className={`
                ${action.color} 
                p-4 rounded-lg text-white hover:opacity-90 transition-opacity duration-200
                flex items-center gap-3 shadow-lg
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium">{action.name}</span>
            </button>
          );
        })}
    </div>
  );
};

export default TimeOffNavigation;
