import React, {useMemo, useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {Button, Card, CardBody, CardHeader, Chip, Divider, Progress} from "@heroui/react";
import {useTheme} from '@/Context/ThemeContext';

import {
    CalendarDaysIcon,
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    CogIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    PlusIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const TimeOffDashboard = ({ title, holidays, leaveTypes, userLeaves, stats, currentYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');

  // Calculate comprehensive statistics
  const dashboardStats = useMemo(() => [
    {
      title: "Available PTO",
      value: Object.values(stats).reduce((sum, stat) => sum + stat.available, 0),
      icon: <CalendarDaysIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: "Days available",
      trend: "+2 from last month"
    },
    {
      title: "Used This Year",
      value: Object.values(stats).reduce((sum, stat) => sum + stat.used, 0),
      icon: <CheckCircleIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: "Days taken",
      trend: `${Math.round((Object.values(stats).reduce((sum, stat) => sum + stat.used, 0) / Object.values(stats).reduce((sum, stat) => sum + stat.allocated, 0)) * 100)}% of allocation`
    },
    {
      title: "Pending Requests",
      value: Object.values(stats).reduce((sum, stat) => sum + stat.pending, 0),
      icon: <ClockIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: "Awaiting approval",
      trend: userLeaves.filter(leave => leave.status === 'pending').length + " requests"
    },
    {
      title: "Company Holidays",
      value: holidays.length,
      icon: <GlobeAltIcon />,
      color: "text-purple-400",
      iconBg: "bg-purple-500/20",
      description: "This year",
      trend: holidays.filter(h => new Date(h.from_date) > new Date()).length + " upcoming"
    }
  ], [stats, holidays, userLeaves]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter(holiday => new Date(holiday.from_date) > new Date())
      .slice(0, 3)
      .map(holiday => ({
        ...holiday,
        daysUntil: Math.ceil((new Date(holiday.from_date) - new Date()) / (1000 * 60 * 60 * 24))
      }));
  }, [holidays]);

  // Recent leave requests
  const recentLeaveRequests = useMemo(() => {
    return userLeaves.slice(0, 5);
  }, [userLeaves]);

  // Leave balance breakdown
  const leaveBalanceData = useMemo(() => {
    return Object.entries(stats).map(([leaveType, data]) => ({
      type: leaveType,
      ...data,
      percentage: Math.round((data.used / data.allocated) * 100) || 0
    }));
  }, [stats]);

  const quickActions = [
    {
      label: "Request Time Off",
      icon: <PlusIcon className="w-4 h-4" />,
      color: "primary",
      onClick: () => router.visit(route('leaves-employee')),
      description: "Submit new request"
    },
    {
      label: "Admin Panel",
      icon: <UserGroupIcon className="w-4 h-4" />,
      color: "secondary", 
      onClick: () => router.visit(route('leaves')),
      description: "Manage all leaves"
    },
    {
      label: "Leave Reports",
      icon: <ChartBarIcon className="w-4 h-4" />,
      color: "success",
      onClick: () => router.visit(route('leave-summary')),
      description: "Analytics & insights"
    }
  ];

  return (
    <>
      <Head title={title} />

      <div className="flex justify-center p-2">
        <div>
          <Card className="shadow-lg">
            <PageHeader
              title="Time Off Management"
              subtitle="Manage leave requests, holidays, and time-off policies"
              icon={<CalendarDaysIcon className="w-8 h-8" />}
              variant="default"
              actionButtons={[
                {
                  label: isMobile ? "Request" : "Request Time Off",
                  icon: <PlusIcon className="w-4 h-4" />,
                  onClick: () => router.visit(route('leaves-employee')),
                  className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
                }
              ]}
            >
              <div className="p-4 sm:p-6">
                {/* Statistics Cards */}
                <StatsCards stats={dashboardStats} className="mb-6" />

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  
                  {/* Leave Balance Overview */}
                  <div className="lg:col-span-2">
                    <HeroCard className="bg-white/5 backdrop-blur-md border-white/10 h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Typography variant="h6" className="font-semibold text-foreground">
                            Leave Balance Overview
                          </Typography>
                          <Chip size="sm" variant="flat" color="primary">
                            {currentYear}
                          </Chip>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody className="pt-4">
                        <div className="space-y-4">
                          {leaveBalanceData.map((balance, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                  {balance.type}
                                </span>
                                <span className="text-xs text-default-500">
                                  {balance.used}/{balance.allocated} days
                                </span>
                              </div>
                              
                              <Progress
                                value={balance.percentage}
                                color={balance.percentage > 80 ? "danger" : balance.percentage > 60 ? "warning" : "success"}
                                className="max-w-full"
                                size="sm"
                                showValueLabel
                                formatOptions={{
                                  style: "percent",
                                  maximumFractionDigits: 0
                                }}
                              />
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-500">
                                  Available: {balance.available} days
                                </span>
                                {balance.pending > 0 && (
                                  <span className="text-orange-500">
                                    Pending: {balance.pending} days
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </HeroCard>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <HeroCard className="bg-white/5 backdrop-blur-md border-white/10">
                      <CardHeader>
                        <Typography variant="h6" className="font-semibold text-foreground">
                          Quick Actions
                        </Typography>
                      </CardHeader>
                      <Divider />
                      <CardBody className="pt-4">
                        <div className="space-y-3">
                          {quickActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="flat"
                              color={action.color}
                              startContent={action.icon}
                              className="w-full justify-start"
                              onPress={action.onClick}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{action.label}</span>
                                <span className="text-xs opacity-70">{action.description}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardBody>
                    </HeroCard>
                  </div>
                </div>

                {/* Secondary Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Upcoming Holidays */}
                  <HeroCard className="bg-white/5 backdrop-blur-md border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Typography variant="h6" className="font-semibold text-foreground">
                          Upcoming Company Holidays
                        </Typography>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => router.visit(route('holidays'))}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="pt-4">
                      {upcomingHolidays.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingHolidays.map((holiday, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <div>
                                  <Typography variant="subtitle2" className="font-medium text-foreground">
                                    {holiday.title}
                                  </Typography>
                                  <Typography variant="caption" className="text-default-500">
                                    {new Date(holiday.from_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: holiday.from_date.includes(new Date().getFullYear()) ? undefined : 'numeric'
                                    })}
                                  </Typography>
                                </div>
                              </div>
                              <Chip size="sm" variant="flat" color="danger">
                                {holiday.daysUntil} days
                              </Chip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CalendarIcon className="w-8 h-8 mx-auto text-default-300 mb-2" />
                          <Typography variant="body2" color="textSecondary">
                            No upcoming holidays
                          </Typography>
                        </div>
                      )}
                    </CardBody>
                  </HeroCard>

                  {/* Recent Leave Requests */}
                  <HeroCard className="bg-white/5 backdrop-blur-md border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Typography variant="h6" className="font-semibold text-foreground">
                          Recent Leave Requests
                        </Typography>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => router.visit(route('leaves-employee'))}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="pt-4">
                      {recentLeaveRequests.length > 0 ? (
                        <div className="space-y-3">
                          {recentLeaveRequests.map((leave, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  leave.status === 'approved' ? 'bg-green-400' :
                                  leave.status === 'pending' ? 'bg-orange-400' : 'bg-red-400'
                                }`}></div>
                                <div>
                                  <Typography variant="subtitle2" className="font-medium text-foreground">
                                    {leave.leave_setting?.type || 'Leave'}
                                  </Typography>
                                  <Typography variant="caption" className="text-default-500">
                                    {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}
                                  </Typography>
                                </div>
                              </div>
                              <Chip 
                                size="sm" 
                                variant="flat" 
                                color={
                                  leave.status === 'approved' ? 'success' :
                                  leave.status === 'pending' ? 'warning' : 'danger'
                                }
                              >
                                {leave.status}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <DocumentTextIcon className="w-8 h-8 mx-auto text-default-300 mb-2" />
                          <Typography variant="body2" color="textSecondary">
                            No recent requests
                          </Typography>
                        </div>
                      )}
                    </CardBody>
                  </HeroCard>
                </div>

                {/* Management Links (for HR users) */}
                <div className="mt-6">
                  <HeroCard className="bg-white/5 backdrop-blur-md border-white/10">
                    <CardHeader>
                      <Typography variant="h6" className="font-semibold text-foreground">
                        Time Off Management
                      </Typography>
                    </CardHeader>
                    <Divider />
                    <CardBody className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                          variant="flat"
                          color="primary"
                          startContent={<UserGroupIcon className="w-4 h-4" />}
                          onPress={() => router.visit(route('leaves'))}
                          className="h-16 flex-col"
                        >
                          <span className="font-medium">Leave Requests</span>
                          <span className="text-xs opacity-70">Manage team requests</span>
                        </Button>
                        
                        <Button
                          variant="flat"
                          color="secondary"
                          startContent={<ChartBarIcon className="w-4 h-4" />}
                          onPress={() => router.visit(route('leave-summary'))}
                          className="h-16 flex-col"
                        >
                          <span className="font-medium">Leave Summary</span>
                          <span className="text-xs opacity-70">View all balances</span>
                        </Button>
                        
                        <Button
                          variant="flat"
                          color="success"
                          startContent={<GlobeAltIcon className="w-4 h-4" />}
                          onPress={() => router.visit(route('holidays'))}
                          className="h-16 flex-col"
                        >
                          <span className="font-medium">Holidays</span>
                          <span className="text-xs opacity-70">Manage company holidays</span>
                        </Button>
                        
                        <Button
                          variant="flat"
                          color="warning"
                          startContent={<CogIcon className="w-4 h-4" />}
                          onPress={() => router.visit(route('settings.leave'))}
                          className="h-16 flex-col"
                        >
                          <span className="font-medium">Settings</span>
                          <span className="text-xs opacity-70">Leave policies</span>
                        </Button>
                      </div>
                    </CardBody>
                  </HeroCard>
                </div>
              </div>
            </PageHeader>
          </Card>
        </div>
      </div>
    </>
  );
};

TimeOffDashboard.layout = (page) => <App>{page}</App>;
export default TimeOffDashboard;
