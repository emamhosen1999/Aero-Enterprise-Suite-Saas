import React from 'react';
import { router } from '@inertiajs/react';
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Chip,
    AvatarGroup,
    Progress,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Checkbox,
    Tooltip,
    Badge,
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
    ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import ProfileAvatar from '@/Components/ProfileAvatar';

const ProjectListView = ({
    projects = [],
    selectedProjects = new Set(),
    onProjectSelect,
    onSelectAll,
    canView,
    getStatusColor,
    getStatusIcon,
    getPriorityColor,
    getHealthColor,
    getRiskColor,
    handleQuickAction,
    userRole,
    formatCurrency,
    formatDate,
    handleSort,
    sortConfig,
}) => {
    const formatCurrencyLocal = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const calculateProgress = (project) => {
        if (!project.total_tasks || project.total_tasks === 0) return 0;
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

    const getBudgetStatus = (project) => {
        if (!project.budget_allocated || project.budget_allocated === 0) return 'none';
        const utilization = (project.budget_spent / project.budget_allocated) * 100;
        if (utilization > 100) return 'over';
        if (utilization > 90) return 'high';
        if (utilization > 70) return 'medium';
        return 'low';
    };

    const getBudgetColor = (status) => {
        switch (status) {
            case 'over': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'primary';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getSortIcon = (field) => {
        if (sortConfig?.field !== field) return <ArrowsUpDownIcon className="w-4 h-4 text-default-400" />;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const columns = [
        { key: 'select', label: '', width: '50px' },
        { key: 'project_name', label: 'Project', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'priority', label: 'Priority', sortable: true },
        { key: 'progress', label: 'Progress', sortable: true },
        { key: 'health', label: 'Health', sortable: true },
        { key: 'budget', label: 'Budget', sortable: true },
        { key: 'timeline', label: 'Timeline', sortable: true },
        { key: 'team', label: 'Team', sortable: false },
        { key: 'actions', label: 'Actions', width: '100px' },
    ];

    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <BriefcaseIcon className="w-16 h-16 text-default-300 mb-4" />
                <h3 className="text-lg font-medium text-default-700 mb-2">No Projects Found</h3>
                <p className="text-default-500 mb-4">
                    Get started by creating your first project or adjusting your filters.
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
        <div className="space-y-4">
            {/* Bulk Selection Summary */}
            {selectedProjects.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            isSelected={selectedProjects.size === projects.length}
                            isIndeterminate={selectedProjects.size > 0 && selectedProjects.size < projects.length}
                            onValueChange={onSelectAll}
                        />
                        <span className="text-sm font-medium">
                            {selectedProjects.size} of {projects.length} projects selected
                        </span>
                    </div>
                    <Chip color="primary" variant="flat">
                        {selectedProjects.size} selected
                    </Chip>
                </div>
            )}

            {/* Projects Table */}
            <Table
                aria-label="Projects table with advanced filtering and sorting"
                className="min-w-full"
                classNames={{
                    wrapper: "min-h-[400px]",
                    th: "bg-default-100 text-default-700 font-semibold",
                    td: "py-3",
                }}
            >
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn
                            key={column.key}
                            width={column.width}
                            className={column.sortable ? "cursor-pointer hover:bg-default-200" : ""}
                            onClick={() => column.sortable && onSort && onSort(column.key)}
                        >
                            <div className="flex items-center space-x-2">
                                <span>{column.label}</span>
                                {column.sortable && getSortIcon(column.key)}
                            </div>
                        </TableColumn>
                    ))}
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        const progress = calculateProgress(project);
                        const budgetStatus = getBudgetStatus(project);
                        const isSelected = selectedProjects.has(project.id);
                        const health = project.health || 'unknown';

                        return (
                            <TableRow
                                key={project.id}
                                className={`hover:bg-default-50 ${isSelected ? 'bg-primary-50' : ''}`}
                            >
                                {/* Selection Checkbox */}
                                <TableCell>
                                    <Checkbox
                                        isSelected={isSelected}
                                        onValueChange={() => onProjectSelect(project.id)}
                                        size="sm"
                                    />
                                </TableCell>

                                {/* Project Name & Code */}
                                <TableCell>
                                    <div className="flex items-center space-x-3">
                                        <div className="shrink-0">
                                            {getHealthIcon(health)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-default-900 hover:text-primary-600 cursor-pointer"
                                                 onClick={() => handleQuickAction('view', project)}>
                                                {project.project_name}
                                            </div>
                                            <div className="text-sm text-default-500">
                                                #{project.project_code}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    <Chip
                                        size="sm"
                                        color={getStatusColor(project.status)}
                                        variant="flat"
                                        startContent={getStatusIcon(project.status)}
                                    >
                                        {project.status?.replace('_', ' ')}
                                    </Chip>
                                </TableCell>

                                {/* Priority */}
                                <TableCell>
                                    <Chip
                                        size="sm"
                                        color={getPriorityColor(project.priority)}
                                        variant="flat"
                                    >
                                        {project.priority?.toUpperCase()}
                                    </Chip>
                                </TableCell>

                                {/* Progress */}
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">{progress}%</span>
                                            <span className="text-xs text-default-500">
                                                {project.completed_tasks || 0}/{project.total_tasks || 0}
                                            </span>
                                        </div>
                                        <Progress
                                            value={progress}
                                            color={progress > 75 ? 'success' : progress > 50 ? 'warning' : 'primary'}
                                            size="sm"
                                            className="w-24"
                                        />
                                    </div>
                                </TableCell>

                                {/* Health */}
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        {getHealthIcon(health)}
                                        <Chip
                                            size="sm"
                                            color={getHealthColor(health)}
                                            variant="flat"
                                        >
                                            {health.replace('_', ' ')}
                                        </Chip>
                                    </div>
                                </TableCell>

                                {/* Budget */}
                                <TableCell>
                                    {project.budget_allocated ? (
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">
                                                {formatCurrency(project.budget_allocated)}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-default-500">
                                                    Used: {formatCurrency(project.budget_spent || 0)}
                                                </span>
                                                <Chip
                                                    size="sm"
                                                    color={getBudgetColor(budgetStatus)}
                                                    variant="dot"
                                                >
                                                    {budgetStatus}
                                                </Chip>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-default-400">Not set</span>
                                    )}
                                </TableCell>

                                {/* Timeline */}
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="text-sm">
                                            <div className="flex items-center space-x-1">
                                                <CalendarDaysIcon className="w-3 h-3 text-default-400" />
                                                <span>{formatDate(project.start_date)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-default-400">to</span>
                                                <span>{formatDate(project.end_date)}</span>
                                            </div>
                                        </div>
                                        {project.end_date && (
                                            <div className="text-xs text-default-500">
                                                {Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days left
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Team */}
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <AvatarGroup max={3} size="sm">
                                            {project.team_members?.slice(0, 3).map((member, index) => (
                                                <Tooltip key={index} content={member.name}>
                                                    <ProfileAvatar
                                                        src={member.avatar}
                                                        name={member.name}
                                                        size="sm"
                                                    />
                                                </Tooltip>
                                            ))}
                                        </AvatarGroup>
                                        {project.team_members?.length > 3 && (
                                            <span className="text-xs text-default-500">
                                                +{project.team_members.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-default-400"
                                            >
                                                <EllipsisVerticalIcon className="w-4 h-4" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu>
                                            <DropdownItem
                                                key="view"
                                                startContent={<EyeIcon className="w-4 h-4" />}
                                                onPress={() => handleQuickAction('view', project)}
                                                textValue="View Details"
                                            >
                                                View Details
                                            </DropdownItem>
                                            {canView('edit') && (
                                                <DropdownItem
                                                    key="edit"
                                                    startContent={<PencilIcon className="w-4 h-4" />}
                                                    onPress={() => handleQuickAction('edit', project)}
                                                    textValue="Edit Project"
                                                >
                                                    Edit Project
                                                </DropdownItem>
                                            )}
                                            {canView('clone') && (
                                                <DropdownItem
                                                    key="clone"
                                                    startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                                    onPress={() => handleQuickAction('clone', project)}
                                                >
                                                    Clone Project
                                                </DropdownItem>
                                            )}
                                            {canView('archive') && (
                                                <DropdownItem
                                                    key="archive"
                                                    startContent={<ArchiveBoxIcon className="w-4 h-4" />}
                                                    onPress={() => handleQuickAction('archive', project)}
                                                    className="text-warning"
                                                >
                                                    Archive
                                                </DropdownItem>
                                            )}
                                            {canView('delete') && (
                                                <DropdownItem
                                                    key="delete"
                                                    startContent={<TrashIcon className="w-4 h-4" />}
                                                    onPress={() => handleQuickAction('delete', project)}
                                                    className="text-danger"
                                                    color="danger"
                                                >
                                                    Delete
                                                </DropdownItem>
                                            )}
                                        </DropdownMenu>
                                    </Dropdown>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default ProjectListView;
