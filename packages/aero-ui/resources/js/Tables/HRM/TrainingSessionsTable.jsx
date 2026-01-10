import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Chip,
    Tooltip,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Avatar,
    AvatarGroup,
} from "@heroui/react";
import {
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    UserPlusIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";

const statusColorMap = {
    scheduled: "primary",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
};

const TrainingSessionsTable = ({
    trainings = [],
    loading = false,
    onEdit,
    onDelete,
    onView,
    onEnroll,
    canEdit = false,
    canDelete = false,
    canEnroll = false,
}) => {
    const columns = [
        { key: "title", label: "TRAINING" },
        { key: "category", label: "CATEGORY" },
        { key: "trainer", label: "TRAINER" },
        { key: "dates", label: "SCHEDULE" },
        { key: "participants", label: "PARTICIPANTS" },
        { key: "status", label: "STATUS" },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (training, columnKey) => {
        switch (columnKey) {
            case "title":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{training.title}</p>
                        {training.location && (
                            <p className="text-xs text-default-400">{training.location}</p>
                        )}
                    </div>
                );
            case "category":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{training.category?.name || '-'}</p>
                    </div>
                );
            case "trainer":
                return (
                    <div className="flex items-center gap-2">
                        {training.trainer ? (
                            <>
                                <Avatar 
                                    name={training.trainer.name} 
                                    size="sm" 
                                    src={training.trainer.avatar}
                                />
                                <div className="flex flex-col">
                                    <p className="text-sm font-semibold">{training.trainer.name}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-default-400">-</p>
                        )}
                    </div>
                );
            case "dates":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {training.start_date ? new Date(training.start_date).toLocaleDateString() : '-'}
                        </p>
                        {training.end_date && (
                            <p className="text-xs text-default-400">
                                to {new Date(training.end_date).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                );
            case "participants":
                return (
                    <div className="flex items-center gap-2">
                        {training.enrollments?.length > 0 ? (
                            <>
                                <AvatarGroup max={3} size="sm">
                                    {training.enrollments.map((enrollment) => (
                                        <Avatar 
                                            key={enrollment.id} 
                                            name={enrollment.employee?.name}
                                            src={enrollment.employee?.avatar}
                                        />
                                    ))}
                                </AvatarGroup>
                                <span className="text-sm text-default-500">
                                    {training.enrollments.length}
                                    {training.max_participants && `/${training.max_participants}`}
                                </span>
                            </>
                        ) : (
                            <p className="text-sm text-default-400">No participants</p>
                        )}
                    </div>
                );
            case "status":
                return (
                    <Chip
                        color={statusColorMap[training.status] || "default"}
                        size="sm"
                        variant="flat"
                    >
                        {training.status?.replace('_', ' ').toUpperCase()}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {onView && (
                            <Tooltip content="View">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => onView(training)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {canEnroll && training.status === 'scheduled' && (
                            <Tooltip content="Manage Enrollments">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    onPress={() => onEnroll(training)}
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                </Button>
                            </Tooltip>
                        )}
                        {(canEdit || canDelete) && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Actions">
                                    {canEdit && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit(training)}
                                        >
                                            Edit
                                        </DropdownItem>
                                    )}
                                    {canDelete && training.status !== 'in_progress' && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => onDelete(training)}
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
                return training[columnKey];
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <Table
            aria-label="Training sessions table"
            isHeaderSticky
            classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3",
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>
            <TableBody items={trainings} emptyContent="No training sessions found">
                {(training) => (
                    <TableRow key={training.id}>
                        {(columnKey) => (
                            <TableCell>{renderCell(training, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default TrainingSessionsTable;
