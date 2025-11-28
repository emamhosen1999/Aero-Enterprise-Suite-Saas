import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Grid,
    Card,
    CardBody,
    CardHeader,
    Progress,
    Chip,
    Button,
    Divider,
    Spacer,
} from "@heroui/react";
import {
    ChartBarSquareIcon,
    ChartPieIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    BanknotesIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const ProjectAnalyticsView = ({
    projects = [],
    canView,
    userRole,
}) => {
    const analytics = useMemo(() => {
        if (!projects || projects.length === 0) {
            return {
                totalProjects: 0,
                statusDistribution: {},
                priorityDistribution: {},
                healthDistribution: {},
                budgetAnalysis: {},
                timelineAnalysis: {},
                teamAnalysis: {},
                performanceMetrics: {},
            };
        }

        const totalProjects = projects.length;
        
        // Status Distribution
        const statusDistribution = projects.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {});

        // Priority Distribution
        const priorityDistribution = projects.reduce((acc, project) => {
            acc[project.priority] = (acc[project.priority] || 0) + 1;
            return acc;
        }, {});

        // Health Distribution
        const healthDistribution = projects.reduce((acc, project) => {
            const health = project.health || 'unknown';
            acc[health] = (acc[health] || 0) + 1;
            return acc;
        }, {});

        // Budget Analysis
        const budgetAnalysis = projects.reduce((acc, project) => {
            if (project.budget_allocated) {
                acc.totalBudget += project.budget_allocated;
                acc.totalSpent += project.budget_spent || 0;
                acc.projectsWithBudget += 1;
            }
            return acc;
        }, { totalBudget: 0, totalSpent: 0, projectsWithBudget: 0 });

        // Timeline Analysis
        const now = new Date();
        const timelineAnalysis = projects.reduce((acc, project) => {
            if (project.start_date && project.end_date) {
                const startDate = new Date(project.start_date);
                const endDate = new Date(project.end_date);
                const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                acc.totalDuration += duration;
                acc.projectsWithTimeline += 1;
                
                if (endDate < now && project.status !== 'completed') {
                    acc.overdue += 1;
                } else if (endDate > now) {
                    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    if (daysRemaining <= 7) {
                        acc.dueSoon += 1;
                    }
                }
            }
            return acc;
        }, { totalDuration: 0, projectsWithTimeline: 0, overdue: 0, dueSoon: 0 });

        // Team Analysis
        const teamAnalysis = projects.reduce((acc, project) => {
            if (project.team_members) {
                acc.totalTeamMembers += project.team_members.length;
                acc.maxTeamSize = Math.max(acc.maxTeamSize, project.team_members.length);
                acc.minTeamSize = Math.min(acc.minTeamSize, project.team_members.length);
            }
            return acc;
        }, { totalTeamMembers: 0, maxTeamSize: 0, minTeamSize: Infinity });

        // Performance Metrics
        const performanceMetrics = projects.reduce((acc, project) => {
            if (project.total_tasks && project.total_tasks > 0) {
                const progress = (project.completed_tasks / project.total_tasks) * 100;
                acc.totalProgress += progress;
                acc.projectsWithTasks += 1;
                
                if (progress === 100) {
                    acc.completedProjects += 1;
                } else if (progress > 0) {
                    acc.inProgressProjects += 1;
                } else {
                    acc.notStartedProjects += 1;
                }
            }
            return acc;
        }, { 
            totalProgress: 0, 
            projectsWithTasks: 0,
            completedProjects: 0,
            inProgressProjects: 0,
            notStartedProjects: 0
        });

        return {
            totalProjects,
            statusDistribution,
            priorityDistribution,
            healthDistribution,
            budgetAnalysis,
            timelineAnalysis,
            teamAnalysis,
            performanceMetrics,
        };
    }, [projects]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status) => {
        const statusMap = {
            'not_started': 'default',
            'planning': 'primary',
            'in_progress': 'warning',
            'monitoring': 'info',
            'on_hold': 'warning',
            'completed': 'success',
            'cancelled': 'danger',
            'archived': 'secondary',
        };
        return statusMap[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const priorityMap = {
            'low': 'success',
            'medium': 'primary',
            'high': 'warning',
            'critical': 'danger',
        };
        return priorityMap[priority] || 'default';
    };

    const getHealthColor = (health) => {
        const healthMap = {
            'good': 'success',
            'at_risk': 'warning',
            'critical': 'danger',
            'unknown': 'default',
        };
        return healthMap[health] || 'default';
    };

    if (analytics.totalProjects === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <ChartBarSquareIcon className="w-16 h-16 text-default-300 mb-4" />
                <h3 className="text-lg font-medium text-default-700 mb-2">No Analytics Data</h3>
                <p className="text-default-500 mb-4">
                    Analytics will appear here once you have projects with data.
                </p>
                {canView('create') && (
                    <Button
                        color="primary"
                        onPress={() => router.visit(route('project-management.projects.create'))}
                    >
                        Create New Project
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <ChartBarSquareIcon className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Portfolio Analytics Dashboard</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<DocumentTextIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('project-management.reports.index'))}
                                disabled={!canView('reports')}
                            >
                                Full Reports
                            </Button>
                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                onPress={() => router.visit(route('project-management.dashboard'))}
                            >
                                Dashboard
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    <Grid container spacing={3}>
                        {/* Total Projects */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card className="bg-linear-to-r from-blue-500 to-purple-600 text-white">
                                <CardBody className="text-center">
                                    <div className="text-3xl font-bold mb-2">{analytics.totalProjects}</div>
                                    <div className="text-sm opacity-90">Total Projects</div>
                                </CardBody>
                            </Card>
                        </Grid>

                        {/* Average Progress */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card className="bg-linear-to-r from-green-500 to-teal-600 text-white">
                                <CardBody className="text-center">
                                    <div className="text-3xl font-bold mb-2">
                                        {analytics.performanceMetrics.projectsWithTasks > 0 
                                            ? Math.round(analytics.performanceMetrics.totalProgress / analytics.performanceMetrics.projectsWithTasks)
                                            : 0}%
                                    </div>
                                    <div className="text-sm opacity-90">Average Progress</div>
                                </CardBody>
                            </Card>
                        </Grid>

                        {/* Budget Utilization */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card className="bg-linear-to-r from-yellow-500 to-orange-600 text-white">
                                <CardBody className="text-center">
                                    <div className="text-3xl font-bold mb-2">
                                        {analytics.budgetAnalysis.totalBudget > 0 
                                            ? Math.round((analytics.budgetAnalysis.totalSpent / analytics.budgetAnalysis.totalBudget) * 100)
                                            : 0}%
                                    </div>
                                    <div className="text-sm opacity-90">Budget Utilization</div>
                                </CardBody>
                            </Card>
                        </Grid>

                        {/* Health Score */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card className="bg-linear-to-r from-red-500 to-pink-600 text-white">
                                <CardBody className="text-center">
                                    <div className="text-3xl font-bold mb-2">
                                        {Math.round(((analytics.healthDistribution.good || 0) / analytics.totalProjects) * 100)}%
                                    </div>
                                    <div className="text-sm opacity-90">Healthy Projects</div>
                                </CardBody>
                            </Card>
                        </Grid>
                    </Grid>
                </CardBody>
            </Card>

            <Grid container spacing={4}>
                {/* Status Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <ChartPieIcon className="w-5 h-5 text-primary" />
                                <h4 className="font-semibold">Status Distribution</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Chip
                                                size="sm"
                                                color={getStatusColor(status)}
                                                variant="flat"
                                            >
                                                {status.replace('_', ' ')}
                                            </Chip>
                                            <span className="text-sm">{count} projects</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Progress
                                                value={(count / analytics.totalProjects) * 100}
                                                color={getStatusColor(status)}
                                                size="sm"
                                                className="w-20"
                                            />
                                            <span className="text-sm text-default-500 min-w-[40px]">
                                                {Math.round((count / analytics.totalProjects) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Priority Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                                <h4 className="font-semibold">Priority Distribution</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {Object.entries(analytics.priorityDistribution).map(([priority, count]) => (
                                    <div key={priority} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Chip
                                                size="sm"
                                                color={getPriorityColor(priority)}
                                                variant="flat"
                                            >
                                                {priority.toUpperCase()}
                                            </Chip>
                                            <span className="text-sm">{count} projects</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Progress
                                                value={(count / analytics.totalProjects) * 100}
                                                color={getPriorityColor(priority)}
                                                size="sm"
                                                className="w-20"
                                            />
                                            <span className="text-sm text-default-500 min-w-[40px]">
                                                {Math.round((count / analytics.totalProjects) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Health Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-5 h-5 text-success" />
                                <h4 className="font-semibold">Project Health</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {Object.entries(analytics.healthDistribution).map(([health, count]) => (
                                    <div key={health} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Chip
                                                size="sm"
                                                color={getHealthColor(health)}
                                                variant="flat"
                                            >
                                                {health.replace('_', ' ')}
                                            </Chip>
                                            <span className="text-sm">{count} projects</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Progress
                                                value={(count / analytics.totalProjects) * 100}
                                                color={getHealthColor(health)}
                                                size="sm"
                                                className="w-20"
                                            />
                                            <span className="text-sm text-default-500 min-w-[40px]">
                                                {Math.round((count / analytics.totalProjects) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Budget Analysis */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <BanknotesIcon className="w-5 h-5 text-success" />
                                <h4 className="font-semibold">Budget Analysis</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Total Budget</span>
                                    <span className="font-semibold">{formatCurrency(analytics.budgetAnalysis.totalBudget)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Total Spent</span>
                                    <span className="font-semibold">{formatCurrency(analytics.budgetAnalysis.totalSpent)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Remaining</span>
                                    <span className="font-semibold text-success">
                                        {formatCurrency(analytics.budgetAnalysis.totalBudget - analytics.budgetAnalysis.totalSpent)}
                                    </span>
                                </div>
                                <Divider />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Utilization Rate</span>
                                    <div className="flex items-center space-x-2">
                                        <Progress
                                            value={analytics.budgetAnalysis.totalBudget > 0 
                                                ? (analytics.budgetAnalysis.totalSpent / analytics.budgetAnalysis.totalBudget) * 100
                                                : 0}
                                            color="primary"
                                            size="sm"
                                            className="w-20"
                                        />
                                        <span className="text-sm font-semibold">
                                            {analytics.budgetAnalysis.totalBudget > 0 
                                                ? Math.round((analytics.budgetAnalysis.totalSpent / analytics.budgetAnalysis.totalBudget) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Timeline Analysis */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <CalendarDaysIcon className="w-5 h-5 text-warning" />
                                <h4 className="font-semibold">Timeline Analysis</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Average Duration</span>
                                    <span className="font-semibold">
                                        {analytics.timelineAnalysis.projectsWithTimeline > 0 
                                            ? Math.round(analytics.timelineAnalysis.totalDuration / analytics.timelineAnalysis.projectsWithTimeline)
                                            : 0} days
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Overdue Projects</span>
                                    <div className="flex items-center space-x-2">
                                        <Chip size="sm" color="danger" variant="flat">
                                            {analytics.timelineAnalysis.overdue}
                                        </Chip>
                                        {analytics.timelineAnalysis.overdue > 0 && (
                                            <ArrowTrendingUpIcon className="w-4 h-4 text-danger" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Due This Week</span>
                                    <div className="flex items-center space-x-2">
                                        <Chip size="sm" color="warning" variant="flat">
                                            {analytics.timelineAnalysis.dueSoon}
                                        </Chip>
                                        {analytics.timelineAnalysis.dueSoon > 0 && (
                                            <ClockIcon className="w-4 h-4 text-warning" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Team Analysis */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <UserGroupIcon className="w-5 h-5 text-primary" />
                                <h4 className="font-semibold">Team Analysis</h4>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Total Team Members</span>
                                    <span className="font-semibold">{analytics.teamAnalysis.totalTeamMembers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Average Team Size</span>
                                    <span className="font-semibold">
                                        {analytics.totalProjects > 0 
                                            ? Math.round(analytics.teamAnalysis.totalTeamMembers / analytics.totalProjects)
                                            : 0} members
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Largest Team</span>
                                    <span className="font-semibold">
                                        {analytics.teamAnalysis.maxTeamSize > 0 ? analytics.teamAnalysis.maxTeamSize : 0} members
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Smallest Team</span>
                                    <span className="font-semibold">
                                        {analytics.teamAnalysis.minTeamSize !== Infinity ? analytics.teamAnalysis.minTeamSize : 0} members
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default ProjectAnalyticsView;
