import React, { useMemo, useCallback } from 'react';
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
    Tooltip
} from '@heroui/react';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    CheckBadgeIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const levelColorMap = {
    beginner: 'default',
    intermediate: 'warning',
    advanced: 'primary',
    expert: 'success'
};

const employeeSkillColumns = [
    { uid: 'employee', name: 'Employee', sortable: true },
    { uid: 'skill', name: 'Skill', sortable: true },
    { uid: 'level', name: 'Level', sortable: true },
    { uid: 'proficiency', name: 'Proficiency', sortable: true },
    { uid: 'verified', name: 'Verified', sortable: true },
    { uid: 'actions', name: 'Actions' }
];

const libraryColumns = [
    { uid: 'name', name: 'Skill Name', sortable: true },
    { uid: 'category', name: 'Category', sortable: true },
    { uid: 'description', name: 'Description' },
    { uid: 'employees', name: 'Employees' },
    { uid: 'actions', name: 'Actions' }
];

export default function SkillsTable({
    data = [],
    loading = false,
    mode = 'employee-skills',
    permissions = {},
    onView,
    onEdit,
    onDelete,
    onVerify
}) {
    const themeRadius = useThemeRadius();
    const columns = mode === 'skill-library' ? libraryColumns : employeeSkillColumns;

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            name={item.employee?.name || 'N/A'}
                            size="sm"
                            src={item.employee?.avatar}
                            className="shrink-0"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.employee?.name || 'N/A'}</span>
                            {item.employee?.designation && (
                                <span className="text-xs text-default-400">{item.employee.designation}</span>
                            )}
                        </div>
                    </div>
                );

            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <SparklesIcon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                    </div>
                );

            case 'skill':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{item.skill?.name || item.name}</span>
                        <Chip size="sm" variant="flat" className="mt-1">
                            {item.skill?.category || item.category}
                        </Chip>
                    </div>
                );

            case 'category':
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.category?.replace('_', ' ') || 'N/A'}
                    </Chip>
                );

            case 'level':
                return (
                    <Chip
                        color={levelColorMap[item.level] || 'default'}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                    >
                        {item.level || 'N/A'}
                    </Chip>
                );

            case 'proficiency':
                return (
                    <div className="w-28">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{item.proficiency || 0}%</span>
                        </div>
                        <Progress
                            value={item.proficiency || 0}
                            color={item.proficiency >= 80 ? 'success' : item.proficiency >= 50 ? 'primary' : 'warning'}
                            size="sm"
                            radius={themeRadius}
                        />
                    </div>
                );

            case 'verified':
                return item.is_verified ? (
                    <Chip
                        color="success"
                        size="sm"
                        variant="flat"
                        startContent={<CheckBadgeIcon className="w-3 h-3" />}
                    >
                        Verified
                    </Chip>
                ) : (
                    <Chip size="sm" variant="flat" color="default">
                        Unverified
                    </Chip>
                );

            case 'employees':
                return (
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{item.employee_count || 0}</span>
                        <span className="text-xs text-default-400">employees</span>
                    </div>
                );

            case 'description':
                return (
                    <p className="text-sm text-default-600 line-clamp-2 max-w-xs">
                        {item.description || 'No description'}
                    </p>
                );

            case 'actions':
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="View">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onView?.(item)}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        
                        {(permissions.canEdit || permissions.canDelete || permissions.canVerify) && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Skill actions">
                                    {permissions.canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit?.(item)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {permissions.canVerify && mode !== 'skill-library' && !item.is_verified && (
                                        <DropdownItem
                                            key="verify"
                                            startContent={<CheckBadgeIcon className="w-4 h-4" />}
                                            color="success"
                                            onPress={() => onVerify?.(item)}
                                        >
                                            Verify Skill
                                        </DropdownItem>
                                    )}
                                    {permissions.canDelete && (
                                        <DropdownItem
                                            key="delete"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            color="danger"
                                            className="text-danger"
                                            onPress={() => onDelete?.(item)}
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
                return item[columnKey];
        }
    }, [themeRadius, mode, permissions, onView, onEdit, onDelete, onVerify]);

    const renderSkeletonRow = useCallback((index) => (
        <TableRow key={`skeleton-${index}`}>
            {columns.map((col) => (
                <TableCell key={col.uid}>
                    <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
            ))}
        </TableRow>
    ), [columns]);

    return (
        <Table
            aria-label="Skills table"
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
                emptyContent={loading ? ' ' : 'No skills found'}
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
