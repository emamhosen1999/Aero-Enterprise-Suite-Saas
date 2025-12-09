import React from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Progress,
    Chip,
    Button,
    Avatar,
    AvatarGroup,
    Tooltip,
    Badge,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Checkbox,
    Divider,
} from "@heroui/react";
import {
    BriefcaseIcon,
    CalendarDaysIcon,
    UserIcon,
    ChartBarSquareIcon,
    ClockIcon,
    DocumentTextIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseCircleIcon,
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    BanknotesIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    FlagIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    BeakerIcon,
    AcademicCapIcon,
    SparklesIcon,
    TrophyIcon,
    FireIcon,
} from "@heroicons/react/24/outline";

const ProjectCard = ({
    project,
    isSelected = false,
    onSelect,
    canView,
    getStatusColor,
    getStatusIcon,
    getPriorityColor,
    getHealthColor,
    getRiskColor,
    onQuickAction,
    formatCurrency,
    formatDate,
    userRole,
    className = "",
}) => {
    const calculateProgress = () => {
        if (!project.total_tasks || project.total_tasks === 0) return project.progress || 0;
        return Math.round((project.completed_tasks / project.total_tasks) * 100);
    };

    const getHealthIcon = (health) => {
        switch (health) {
            case 'good':
                return <CheckCircleIcon className="w-4 h-4 text-success" />;
            case 'at_risk':
                return <ExclamationTriangleIcon className="w-4 h-4 text-warning" />;
            case 'critical':
                return <XCircleIcon className="w-4 h-4 text-danger" />;
            default:
                return <ClockIcon className="w-4 h-4 text-default-400" />;
        }
    };

    const getMethodologyIcon = (methodology) => {
        switch (methodology?.toLowerCase()) {
            case 'agile':
            case 'scrum':
                return <BeakerIcon className="w-4 h-4" />;
            case 'waterfall':
                return <DocumentTextIcon className="w-4 h-4" />;
            case 'prince2':
                return <AcademicCapIcon className="w-4 h-4" />;
            case 'kanban':
                return <SparklesIcon className="w-4 h-4" />;
            default:
                return <BriefcaseIcon className="w-4 h-4" />;
        }
    };

    const getBudgetUtilization = () => {
        if (!project.budget_allocated || project.budget_allocated === 0) return 0;
        return (project.budget_spent / project.budget_allocated) * 100;
    };

    const getSPIColor = (spi) => {
        if (spi >= 0.95) return 'success';
        if (spi >= 0.85) return 'warning';
        return 'danger';
    };

    const getCPIColor = (cpi) => {
        if (cpi >= 0.95) return 'success';
        if (cpi >= 0.85) return 'warning';
        return 'danger';
    };

    const progress = calculateProgress();
    const budgetUtilization = getBudgetUtilization();
    const health = project.health_status || 'unknown';
    const spi = project.spi || 1.0;
    const cpi = project.cpi || 1.0;

    // Role-based actions
    const getAvailableActions = () => {
        const actions = [];
        
        if (canView('view')) {
            actions.push({
                key: 'view',
                label: 'View',
                icon: <EyeIcon className="w-4 h-4" />,
                color: 'primary',
            });
        }
        
        if (canView('edit')) {
            actions.push({
                key: 'edit',
                label: 'Edit',
                icon: <PencilIcon className="w-4 h-4" />,
                color: 'default',
            });
        }
        
        if (canView('view')) {
            actions.push({
                key: 'tasks',
                label: 'Tasks',
                icon: <DocumentTextIcon className="w-4 h-4" />,
                color: 'default',
            });
        }
        
        if (canView('reports')) {
            actions.push({
                key: 'reports',
                label: 'Reports',
                icon: <ChartBarSquareIcon className="w-4 h-4" />,
                color: 'default',
            });
        }
        
        if (canView('clone')) {
            actions.push({
                key: 'clone',
                label: 'Clone',
                icon: <DocumentDuplicateIcon className="w-4 h-4" />,
                color: 'default',
            });
        }
        
        if (canView('archive')) {
            actions.push({
                key: 'archive',
                label: 'Archive',
                icon: <ArchiveBoxIcon className="w-4 h-4" />,
                color: 'warning',
            });
        }
        
        if (canView('delete')) {
            actions.push({
                key: 'delete',
                label: 'Delete',
                icon: <TrashIcon className="w-4 h-4" />,
                color: 'danger',
            });
        }

        return actions;
    };

    const actions = getAvailableActions();

    return (
        <Card
            className={`h-full transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50/50' : ''
            } ${className}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between w-full">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            isSelected={isSelected}
                            onValueChange={onSelect}
                            size="sm"
                            className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                            {/* Project Icon & Title */}
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                        {project.type === 'digital' ? '🏢' : 
                                         project.type === 'enhancement' ? '🚀' : 
                                         project.type === 'analytics' ? '📊' : 
                                         project.type === 'integration' ? '🌐' : 
                                         project.type === 'security' ? '🔒' : 
                                         project.type === 'marketing' ? '🎨' : '📋'}
                                    </span>
                                    <h3 className="font-semibold text-lg truncate">
                                        {project.project_name}
                                    </h3>
                                </div>
                                {getHealthIcon(health)}
                            </div>

                            {/* Project ID & Priority */}
                            <div className="flex items-center space-x-2 text-sm text-default-500 mb-2">
                                <span className="font-mono">ID: {project.project_code}</span>
                                <span>•</span>
                                <Chip
                                    size="sm"
                                    color={getPriorityColor(project.priority)}
                                    variant="flat"
                                    startContent={<FlagIcon className="w-3 h-3" />}
                                >
                                    {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)} Priority
                                </Chip>
                            </div>
                        </div>
                    </div>
                    
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-default-400 hover:text-default-600"
                            >
                                <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Project actions"
                            onAction={(key) => onQuickAction(key, project)}
                        >
                            {actions.map((action) => (
                                <DropdownItem
                                    key={action.key}
                                    startContent={action.icon}
                                    color={action.color}
                                >
                                    {action.label}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </CardHeader>

            <CardBody className="pt-0 pb-3">
                <div className="space-y-3">
                    {/* Status & Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Chip
                                size="sm"
                                color={getStatusColor(project.status)}
                                variant="flat"
                                startContent={getStatusIcon(project.status)}
                            >
                                Status: {project.status?.replace('_', ' ')}
                            </Chip>
                            <span className="text-sm text-default-500">
                                {project.phase && `(${project.phase})`}
                            </span>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress
                                value={progress}
                                color={progress >= 75 ? 'success' : progress >= 50 ? 'warning' : 'danger'}
                                size="sm"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center space-x-2 text-sm">
                        <CalendarDaysIcon className="w-4 h-4 text-default-400" />
                        <span className="text-default-600">
                            Timeline: {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </span>
                    </div>

                    {/* Budget Information */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                                <BanknotesIcon className="w-4 h-4 text-default-400" />
                                <span>Budget</span>
                            </div>
                            <span className="text-default-600">
                                {formatCurrency(project.budget_spent || 0)} / {formatCurrency(project.budget_allocated || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-default-500">
                            <span>({budgetUtilization.toFixed(0)}% used)</span>
                            <Chip
                                size="sm"
                                variant="dot"
                                color={budgetUtilization > 100 ? 'danger' : 
                                       budgetUtilization > 90 ? 'warning' : 'success'}
                            >
                                {budgetUtilization > 100 ? 'Over budget' : 
                                 budgetUtilization > 90 ? 'High usage' : 'Good'}
                            </Chip>
                        </div>
                    </div>

                    {/* ISO Performance Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-default-600">📊 SPI:</span>
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getSPIColor(spi)}
                            >
                                {spi.toFixed(2)}
                            </Chip>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-default-600">💰 CPI:</span>
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getCPIColor(cpi)}
                            >
                                {cpi.toFixed(2)}
                            </Chip>
                        </div>
                    </div>

                    {/* Team & Department */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                            <UserIcon className="w-4 h-4 text-default-400" />
                            <span className="text-default-600">
                                Lead: {project.project_leader?.name || 'Unassigned'}
                            </span>
                            <span className="text-default-500">
                                ({project.project_leader?.role || 'PM'})
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <BuildingOfficeIcon className="w-4 h-4 text-default-400" />
                            <span className="text-default-600">
                                Dept: {project.department?.name || 'General'}
                            </span>
                        </div>
                    </div>

                    {/* Risk & Health */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2 text-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 text-default-400" />
                            <span className="text-default-600">Risk:</span>
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getRiskColor(project.risk_level)}
                            >
                                {project.risk_level || 'Low'}
                            </Chip>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <ShieldCheckIcon className="w-4 h-4 text-default-400" />
                            <span className="text-default-600">Health:</span>
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getHealthColor(health)}
                            >
                                {health === 'good' ? '✅ Good' : 
                                 health === 'at_risk' ? '🟡 At Risk' : 
                                 health === 'critical' ? '🔴 Critical' : '⚪ Unknown'}
                            </Chip>
                        </div>
                    </div>

                    {/* Methodology */}
                    <div className="flex items-center space-x-2 text-sm">
                        {getMethodologyIcon(project.methodology)}
                        <span className="text-default-600">
                            Methodology: {project.methodology || 'Standard'}
                        </span>
                    </div>

                    {/* Next Milestone */}
                    {project.next_milestone && (
                        <div className="flex items-center space-x-2 text-sm">
                            <TrophyIcon className="w-4 h-4 text-default-400" />
                            <span className="text-default-600">
                                Next: {project.next_milestone}
                            </span>
                        </div>
                    )}
                </div>
            </CardBody>

            <CardFooter className="pt-2">
                <div className="w-full space-y-2">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                        {actions.slice(0, 3).map((action) => (
                            <Button
                                key={action.key}
                                size="sm"
                                variant="flat"
                                color={action.color}
                                startContent={action.icon}
                                onPress={() => onQuickAction(action.key, project)}
                                className="flex-1 min-w-0"
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>

                    {/* Additional Actions */}
                    {actions.length > 3 && (
                        <div className="flex flex-wrap gap-2">
                            {actions.slice(3, 6).map((action) => (
                                <Button
                                    key={action.key}
                                    size="sm"
                                    variant="light"
                                    color={action.color}
                                    startContent={action.icon}
                                    onPress={() => onQuickAction(action.key, project)}
                                    className="flex-1 min-w-0"
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* Last Update */}
                    <div className="text-xs text-default-500 text-center border-t border-default-200 pt-2">
                        Last updated: {formatDate(project.updated_at)}
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

export default ProjectCard;
