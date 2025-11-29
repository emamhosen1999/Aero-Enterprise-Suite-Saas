import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Progress,
  Spinner,
  Tabs,
  Tab
} from "@heroui/react";

import {
  UsersIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  UserPlusIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PlayIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const HRDashboard = ({ 
    stats = {}, 
    recentReviews = [], 
    upcomingReviews = [], 
    pendingActions = [],
    attendanceOverview = {},
    trainingProgress = {},
    auth 
}) => {
  // Responsive design hooks
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1025);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  // Theme helper function
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

  // Helper function to check permissions
  const hasPermission = (permission) => {
    return auth.permissions && auth.permissions.includes(permission);
  };

  // Stats data for StatsCards component
  const dashboardStats = useMemo(() => [
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 142,
      icon: <UsersIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: `${stats?.activeEmployees || 138} active`
    },
    {
      title: "Active Reviews",
      value: stats?.pendingReviews || 23,
      icon: <TrophyIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: "Performance reviews"
    },
    {
      title: "Attendance Rate",
      value: `${attendanceOverview?.rate || 95}%`,
      icon: <CheckCircleIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: "Today's attendance"
    },
    {
      title: "Average Rating",
      value: stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : '4.2/5',
      icon: <ArrowTrendingUpIcon />,
      color: "text-purple-400",
      iconBg: "bg-purple-500/20",
      description: "Performance score"
    },
    {
      title: "Pending Actions",
      value: pendingActions?.length || 8,
      icon: <ExclamationTriangleIcon />,
      color: "text-red-400",
      iconBg: "bg-red-500/20",
      description: "Need attention"
    },
    {
      title: "Training Programs",
      value: trainingProgress?.activePrograms || 12,
      icon: <AcademicCapIcon />,
      color: "text-indigo-400",
      iconBg: "bg-indigo-500/20",
      description: "Active sessions"
    }
  ], [stats, attendanceOverview, pendingActions, trainingProgress]);

  // Quick action buttons
  const quickActions = [
    {
      title: "Add Employee",
      description: "Onboard new team member",
      icon: <UserPlusIcon className="w-4 h-4" />,
      color: "primary",
      onClick: () => router.visit(route('employees.index')),
      permission: "hr.employees.create"
    },
    {
      title: "Performance Review",
      description: "Schedule evaluation",
      icon: <TrophyIcon className="w-4 h-4" />,
      color: "secondary",
      onClick: () => router.visit(route('hr.performance.create')),
      permission: "hr.performance.create"
    },
    {
      title: "Manage Leaves",
      description: "Review time-off requests",
      icon: <CalendarDaysIcon className="w-4 h-4" />,
      color: "success",
      onClick: () => router.visit(route('hr.timeoff.index')),
      permission: "hr.timeoff.view"
    },
    {
      title: "Training",
      description: "Manage development",
      icon: <AcademicCapIcon className="w-4 h-4" />,
      color: "warning",
      onClick: () => router.visit(route('hr.training.index')),
      permission: "hr.training.view"
    },
    {
      title: "Analytics",
      description: "HR reports & insights",
      icon: <ChartBarIcon className="w-4 h-4" />,
      color: "danger",
      onClick: () => router.visit(route('hr.analytics.index')),
      permission: "hr.analytics.view"
    },
    {
      title: "Payroll",
      description: "Process salaries",
      icon: <ClockIcon className="w-4 h-4" />,
      color: "secondary",
      onClick: () => router.visit(route('hr.payroll.index')),
      permission: "hr.payroll.view"
    }
  ];

  // Module cards for navigation
  const moduleCards = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, departments, and organizational structure",
      icon: <UsersIcon className="w-6 h-6" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      route: route('employees.index'),
      permission: "hr.employees.view",
      stats: [
        { label: "Total", value: stats?.totalEmployees || 142 },
        { label: "Active", value: stats?.activeEmployees || 138 }
      ]
    },
    {
      title: "Attendance & Time",
      description: "Track attendance, manage time-off requests and schedules",
      icon: <ClockIcon className="w-6 h-6" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      route: '/attendance-admin',
      permission: "attendance.view",
      stats: [
        { label: "Present", value: attendanceOverview?.todayPresent || 128 },
        { label: "On Leave", value: attendanceOverview?.onLeave || 8 }
      ]
    },
    {
      title: "Performance Management",
      description: "Track performance reviews, goals, and employee development",
      icon: <TrophyIcon className="w-6 h-6" />,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      route: route('hr.performance.index'),
      permission: "hr.performance.view",
      stats: [
        { label: "Completed", value: 89 },
        { label: "Pending", value: stats?.pendingReviews || 23 }
      ]
    },
    {
      title: "Training & Development",
      description: "Manage training programs, skills, and professional development",
      icon: <AcademicCapIcon className="w-6 h-6" />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      route: route('hr.training.index'),
      permission: "hr.training.view",
      stats: [
        { label: "Active", value: trainingProgress?.activePrograms || 12 },
        { label: "Enrolled", value: 89 }
      ]
    },
    {
      title: "Analytics & Reports",
      description: "HR analytics, reports, and workforce insights",
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      route: route('hr.analytics.index'),
      permission: "hr.analytics.view",
      stats: [
        { label: "Reports", value: 24 },
        { label: "KPIs", value: 8 }
      ]
    },
    {
      title: "Payroll Management",
      description: "Process employee salaries and manage compensation",
      icon: <ClockIcon className="w-6 h-6" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      route: route('hr.payroll.index'),
      permission: "hr.payroll.view",
      stats: [
        { label: "Processed", value: 142 },
        { label: "Pending", value: 0 }
      ]
    }
  ];

  // Recent activities data
  const recentActivities = [
    {
      activity: "Performance review completed for John Doe",
      timestamp: "2 hours ago",
      type: "review",
      user: "Jane Smith",
      icon: <TrophyIcon className="w-4 h-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      activity: "Leave request approved for Sarah Wilson",
      timestamp: "4 hours ago", 
      type: "leave",
      user: "Mike Johnson",
      icon: <CalendarDaysIcon className="w-4 h-4" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      activity: "New employee onboarded - Alex Brown",
      timestamp: "1 day ago",
      type: "onboarding",
      user: "HR Team",
      icon: <UserPlusIcon className="w-4 h-4" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  return (
    <>
      <Head title="HR Dashboard" />
      
      <div 
        className="flex flex-col w-full h-full p-4"
        role="main"
        aria-label="HR Dashboard"
      >
        <div className="space-y-4">
          {/* Main Header Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card 
              className="transition-all duration-200"
              style={{
                border: `var(--borderWidth, 2px) solid transparent`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                background: `linear-gradient(135deg, 
                  var(--theme-content1, #FAFAFA) 20%, 
                  var(--theme-content2, #F4F4F5) 10%, 
                  var(--theme-content3, #F1F3F4) 20%)`,
              }}
            >
              <CardHeader 
                className="border-b p-0"
                style={{
                  borderColor: `var(--theme-divider, #E4E4E7)`,
                  background: `linear-gradient(135deg, 
                    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                }}
              >
                <div className={`${isLargeScreen ? 'p-6' : 'p-4'} w-full`}>
                  <div className="flex flex-col space-y-4">
                    {/* Main Header Content */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Title Section */}
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div 
                          className={`
                            ${isLargeScreen ? 'p-3' : 'p-2.5'} 
                            rounded-xl flex items-center justify-center
                          `}
                          style={{
                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                            borderWidth: `var(--borderWidth, 2px)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <UsersIcon 
                            className={`
                              ${isLargeScreen ? 'w-8 h-8' : 'w-6 h-6'}
                            `}
                            style={{ color: 'var(--theme-primary)' }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 
                            className={`
                              ${isLargeScreen ? 'text-2xl' : 'text-xl'}
                              font-bold text-foreground
                            `}
                            style={{
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            HR Dashboard
                          </h1>
                          <p 
                            className={`
                              ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                              text-default-500
                            `}
                            style={{
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            Welcome back, {auth.user.name}. Here's your HR overview.
                          </p>
                        </div>
                      </div>
                      
                      {/* Period Selector */}
                      <div className="flex items-center gap-2">
                        <ButtonGroup 
                          variant="bordered"
                          size="sm"
                          style={{
                            background: 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                          }}
                        >
                          {[
                            { key: 'week', label: 'Week' },
                            { key: 'month', label: 'Month' },
                            { key: 'quarter', label: 'Quarter' },
                            { key: 'year', label: 'Year' }
                          ].map((period) => (
                            <Button
                              key={period.key}
                              size="sm"
                              color={selectedPeriod === period.key ? 'primary' : 'default'}
                              onPress={() => setSelectedPeriod(period.key)}
                              style={{
                                background: selectedPeriod === period.key 
                                  ? `var(--theme-primary)` 
                                  : 'transparent',
                                color: selectedPeriod === period.key 
                                  ? 'white' 
                                  : 'var(--theme-foreground)',
                              }}
                            >
                              {period.label}
                            </Button>
                          ))}
                        </ButtonGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-6">
                {/* Statistics Cards */}
                <StatsCards 
                  stats={dashboardStats} 
                  className="mb-6" 
                  isLoading={loading}
                />

                {/* Main Content Tabs */}
                <div className="mb-6">
                  <Tabs 
                    aria-label="HR Dashboard Tabs"
                    variant="underlined"
                    color="primary"
                    className="w-full"
                  >
                    {/* Overview Tab */}
                    <Tab key="overview" title="Overview">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Quick Actions */}
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 
                              className="font-semibold"
                              style={{ color: 'var(--theme-foreground)' }}
                            >
                              Quick Actions
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {quickActions.slice(0, 4).map((action, index) => (
                                hasPermission(action.permission) && (
                                  <Button
                                    key={index}
                                    variant="flat"
                                    color={action.color}
                                    startContent={action.icon}
                                    className="w-full justify-start"
                                    onPress={action.onClick}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">{action.title}</span>
                                      <span className="text-xs opacity-70">{action.description}</span>
                                    </div>
                                  </Button>
                                )
                              ))}
                            </div>
                          </CardBody>
                        </Card>

                        {/* Recent Activities */}
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <h4 
                                className="font-semibold"
                                style={{ color: 'var(--theme-foreground)' }}
                              >
                                Recent Activities
                              </h4>
                              <ClockIcon className="w-5 h-5 opacity-60" />
                            </div>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                  <div className={`p-2 rounded-full ${activity.bgColor}`}>
                                    {React.cloneElement(activity.icon, {
                                      className: `w-4 h-4 ${activity.color}`
                                    })}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{activity.activity}</p>
                                    <p className="text-xs opacity-70">{activity.user} • {activity.timestamp}</p>
                                  </div>
                                </div>
                              ))}
                              <Button variant="ghost" className="w-full mt-4">
                                View All Activities
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </div>

                      {/* HR Modules Grid */}
                      <div className="mt-6">
                        <h3 
                          className="text-lg font-semibold mb-4"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          HR Modules
                        </h3>
                        <div className={`grid gap-4 ${
                          isMobile 
                            ? 'grid-cols-1' 
                            : isTablet 
                              ? 'grid-cols-2' 
                              : 'grid-cols-3'
                        }`}>
                          {moduleCards.map((module, index) => (
                            hasPermission(module.permission) && (
                              <Card 
                                key={index}
                                className="transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                                  border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                                  borderRadius: getThemeRadius(),
                                  backdropFilter: 'blur(16px)',
                                }}
                                onPress={() => router.visit(module.route)}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className={`p-2 rounded-lg ${module.bgColor}`}
                                    >
                                      {React.cloneElement(module.icon, {
                                        className: `w-6 h-6 ${module.color}`
                                      })}
                                    </div>
                                    <div className="flex-1">
                                      <h4 
                                        className="font-semibold text-foreground"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {module.title}
                                      </h4>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardBody className="pt-0">
                                  <p 
                                    className="text-sm text-default-600 mb-3"
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                  >
                                    {module.description}
                                  </p>
                                  <div className="flex items-center gap-4">
                                    {module.stats.map((stat, statIndex) => (
                                      <div key={statIndex} className="text-center">
                                        <div 
                                          className="font-bold text-lg"
                                          style={{ color: 'var(--theme-foreground)' }}
                                        >
                                          {stat.value}
                                        </div>
                                        <div 
                                          className="text-xs opacity-70"
                                          style={{ color: 'var(--theme-foreground)' }}
                                        >
                                          {stat.label}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardBody>
                              </Card>
                            )
                          ))}
                        </div>
                      </div>
                    </Tab>

                    {/* Performance Tab */}
                    <Tab key="performance" title="Performance">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Recent Reviews */}
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 className="font-semibold">Recent Performance Reviews</h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {recentReviews.length > 0 ? (
                                recentReviews.map((review, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium">{review.employee?.name}</p>
                                      <p className="text-sm text-default-600">
                                        Reviewed by {review.reviewer?.name}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <Chip 
                                        color={review.status === 'completed' ? 'success' : 'default'}
                                        variant="flat"
                                        size="sm"
                                      >
                                        {review.status}
                                      </Chip>
                                      {review.overall_rating && (
                                        <p className="text-sm text-default-500 mt-1">
                                          {review.overall_rating}/5
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-default-500 text-center py-4">No recent reviews</p>
                              )}
                              <Button 
                                variant="ghost" 
                                className="w-full" 
                                onPress={() => router.visit(route('hr.performance.index'))}
                              >
                                View All Reviews
                              </Button>
                            </div>
                          </CardBody>
                        </Card>

                        {/* Upcoming Reviews */}
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 className="font-semibold">Upcoming Reviews</h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {upcomingReviews.length > 0 ? (
                                upcomingReviews.map((review, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium">{review.employee?.name}</p>
                                      <p className="text-sm text-default-600">
                                        Due: {new Date(review.review_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Button size="sm" variant="flat" color="primary">
                                      Start Review
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-default-500 text-center py-4">No upcoming reviews</p>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </Tab>

                    {/* Attendance Tab */}
                    <Tab key="attendance" title="Attendance">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 className="font-semibold">Today's Attendance</h4>
                          </CardHeader>
                          <CardBody>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-green-600">
                                {attendanceOverview?.todayPresent || 85}
                              </p>
                              <p className="text-sm text-default-600">
                                out of {attendanceOverview?.totalEmployees || 100} employees
                              </p>
                            </div>
                          </CardBody>
                        </Card>

                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 className="font-semibold">Late Arrivals</h4>
                          </CardHeader>
                          <CardBody>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-red-600">
                                {attendanceOverview?.lateArrivals || 5}
                              </p>
                              <p className="text-sm text-default-600">employees late today</p>
                            </div>
                          </CardBody>
                        </Card>

                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <h4 className="font-semibold">On Leave</h4>
                          </CardHeader>
                          <CardBody>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600">
                                {attendanceOverview?.onLeave || 8}
                              </p>
                              <p className="text-sm text-default-600">employees on leave</p>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </Tab>

                    {/* Pending Actions Tab */}
                    <Tab key="actions" title="Pending Actions">
                      <div className="mt-6">
                        <Card 
                          style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">Pending Actions</h4>
                              <Chip color="danger" variant="flat" size="sm">
                                {pendingActions?.length || 3}
                              </Chip>
                            </div>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                background: 'color-mix(in srgb, var(--theme-warning) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--theme-warning) 20%, transparent)'
                              }}>
                                <div>
                                  <p className="font-medium">Leave Requests</p>
                                  <p className="text-sm text-default-600">5 pending approvals</p>
                                </div>
                                <Button size="sm" variant="flat" color="warning">Review</Button>
                              </div>
                              <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                              }}>
                                <div>
                                  <p className="font-medium">Performance Reviews</p>
                                  <p className="text-sm text-default-600">3 overdue reviews</p>
                                </div>
                                <Button size="sm" variant="flat" color="primary">View</Button>
                              </div>
                              <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                background: 'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--theme-danger) 20%, transparent)'
                              }}>
                                <div>
                                  <p className="font-medium">Document Renewals</p>
                                  <p className="text-sm text-default-600">2 expiring soon</p>
                                </div>
                                <Button size="sm" variant="flat" color="danger">Update</Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </Tab>
                  </Tabs>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};
