import React, { useMemo, useState, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Progress,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Skeleton,
    Tooltip,
    Slider
} from '@heroui/react';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    FlagIcon
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const statusColorMap = {
    not_started: 'default',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger',
    on_hold: 'secondary'
};

const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
    on_hold: 'On Hold'
};

const columns = [
    { uid: 'title', name: 'Goal', sortable: true },
    { uid: 'employee', name: 'Owner', sortable: true },
    { uid: 'progress', name: 'Progress', sortable: true },
    { uid: 'status', name: 'Status', sortable: true },
    { uid: 'due_date', name: 'Due Date', sortable: true },
    { uid: 'actions', name: 'Actions' }
];

export default function GoalsTable({
    data = [],
    loading = false,
    permissions = {},
    onView,
    onEdit,
    onDelete,
    onComplete,
    onUpdateProgress
}) {
    const themeRadius = useThemeRadius();
    const [editingProgress, setEditingProgress] = useState(null);
    const [progressValue, setProgressValue] = useState(0);

    const handleProgressEdit = useCallback((goal) => {
        setEditingProgress(goal.id);
        setProgressValue(goal.progress || 0);
    }, []);

    const handleProgressSave = useCallback((goal) => {
        if (onUpdateProgress) {
            onUpdateProgress(goal, progressValue);
        }
        setEditingProgress(null);
    }, [onUpdateProgress, progressValue]);

    const renderCell = useCallback((goal, columnKey) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <FlagIcon className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">{goal.title}</span>
                        </div>
                        {goal.category && (
                            <Chip size="sm" variant="flat" className="text-xs">
                                {goal.category}
                            </Chip>
                        )}
                        {goal.description && (
                            <p className="text-xs text-default-500 line-clamp-1">{goal.description}</p>
                        )}
                    </div>
                );

            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            name={goal.employee?.name || 'N/A'}
                            size="sm"
                            src={goal.employee?.avatar}
                            className="shrink-0"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{goal.employee?.name || 'N/A'}</span>
                            {goal.employee?.department && (
                                <span className="text-xs text-default-400">{goal.employee.department}</span>
                            )}
                        </div>
                    </div>
                );

            case 'progress':
                return (
                    <div className="w-32">
                        {editingProgress === goal.id ? (
                            <div className="flex flex-col gap-2">
                                <Slider
                                    size="sm"
                                    step={5}
                                    minValue={0}
                                    maxValue={100}
                                    value={progressValue}
                                    onChange={setProgressValue}
                                    className="max-w-md"
                                />
                                <div className="flex gap-1">
                                    <Button 
                                        size="sm" 
                                        color="primary" 
                                        variant="flat"
                                        onPress={() => handleProgressSave(goal)}
                                    >
                                        Save
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="flat"
                                        onPress={() => setEditingProgress(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Tooltip content={permissions.canEdit ? "Click to edit progress" : `${goal.progress}%`}>
                                <div 
                                    className={`${permissions.canEdit ? 'cursor-pointer' : ''}`}
                                    onClick={() => permissions.canEdit && goal.status !== 'completed' && handleProgressEdit(goal)}
                                >
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>{goal.progress || 0}%</span>
                                    </div>
                                    <Progress
                                        value={goal.progress || 0}
                                        color={goal.progress >= 100 ? 'success' : goal.progress >= 50 ? 'primary' : 'warning'}
                                        size="sm"
                                        radius={themeRadius}
                                    />
                                </div>
                            </Tooltip>
                        )}
                    </div>
                );

            case 'status':
                return (
                    <Chip
                        color={statusColorMap[goal.status] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {statusLabels[goal.status] || goal.status}
                    </Chip>
                );

            case 'due_date':
                const isOverdue = goal.status !== 'completed' && new Date(goal.due_date) < new Date();
                return (
                    <span className={`text-sm ${isOverdue ? 'text-danger font-medium' : 'text-foreground'}`}>
                        {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'N/A'}
                    </span>
                );

            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="View">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onView?.(goal)}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        
                        {(permissions.canEdit || permissions.canDelete || permissions.canComplete) && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Goal actions">
                                    {permissions.canEdit && goal.status !== 'completed' && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit?.(goal)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {permissions.canComplete && goal.status !== 'completed' && (
                                        <DropdownItem
                                            key="complete"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            color="success"
                                            onPress={() => onComplete?.(goal)}
                                        >
                                            Mark Complete
                                        </DropdownItem>
                                    )}
                                    {permissions.canDelete && (
                                        <DropdownItem
                                            key="delete"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            color="danger"
                                            className="text-danger"
                                            onPress={() => onDelete?.(goal)}
                                        >
                                            Delete
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                );

            default:
                return goal[columnKey];
        }
    }, [themeRadius, permissions, onView, onEdit, onDelete, onComplete, editingProgress, progressValue, handleProgressEdit, handleProgressSave]);

    const renderSkeletonRow = useCallback((index) => (
        <TableRow key={`skeleton-${index}`}>
            <TableCell>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-24 rounded" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-20 rounded" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-8 w-16 rounded" />
            </TableCell>
        </TableRow>
    ), []);

    return (
        <Table
            aria-label="Goals table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody 
                items={loading ? [] : data} 
                emptyContent={loading ? ' ' : 'No goals found'}
                loadingContent={
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => renderSkeletonRow(i))}
                    </div>
                }
                isLoading={loading}
            >
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
