import React, { useEffect, useState } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Select,
    SelectItem,
    Input,
    Textarea,
    Button,
    Tooltip,
    User,
    Chip,
    Pagination,
    Spinner
} from "@heroui/react";
import {
    PencilIcon,
    TrashIcon,
    EyeIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    LinkIcon as LinkIconHero,
    EllipsisVerticalIcon,
    ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import Loader from "@/Components/Loader.jsx";
import { usePage } from '@inertiajs/react';

const LettersTable = ({ allData, setData, users, loading, handleClickOpen, openModal, setCurrentRow, search }) => {
    const { auth } = usePage().props;
    const [currentPage, setCurrentPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "received_date",
        direction: "descending",
    });

    const userIsAdmin = auth.roles.includes('Administrator');
    const userIsSe = auth.designation === 'Supervision Engineer';
    const itemsPerPage = 10;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open':
                return 'danger';
            case 'Closed':
                return 'success';
            case 'Processing':
                return 'primary';
            case 'Signed':
                return 'warning';
            case 'Sent':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusChip = (status, letterId) => {
        return (
            <Select
                aria-label="Status"
                selectedKeys={[status]}
                onSelectionChange={(keys) => handleChange(letterId, 'status', Array.from(keys)[0])}
                size="sm"
                variant="flat"
                color={getStatusColor(status)}
                className="min-w-[120px]"
            >
                <SelectItem key="Open" value="Open">Open</SelectItem>
                <SelectItem key="Processing" value="Processing">Processing</SelectItem>
                <SelectItem key="Signed" value="Signed">Signed</SelectItem>
                <SelectItem key="Sent" value="Sent">Sent</SelectItem>
                <SelectItem key="Closed" value="Closed">Closed</SelectItem>
            </Select>
        );
    };

    const highlightText = (text) => {
        if (!search || !text) return text;
        const searchTerms = search.split(' ').filter(Boolean);
        const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            searchTerms.some(term => part.toLowerCase() === term.toLowerCase()) ? (
                <span key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</span>
            ) : (
                part
            )
        );
    };

    const columns = [
        { name: "From", uid: "from", sortable: true },
        { name: "Status", uid: "status", sortable: true },
        { name: "Subject", uid: "subject", sortable: true },
        { name: "Action Taken", uid: "action_taken", sortable: false },
        { name: "Assigned To", uid: "assigned_to", sortable: true },
        { name: "Date", uid: "received_date", sortable: true },
        { name: "Actions", uid: "actions" }
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "from":
                return (
                    <span className="text-sm">
                        {highlightText(item.from)}
                    </span>
                );
            case "status":
                return getStatusChip(item.status, item.id);
            case "subject":
                return (
                    <Tooltip content={item.subject} placement="top">
                        <div className="max-w-[200px] truncate text-sm">
                            {highlightText(item.subject)}
                        </div>
                    </Tooltip>
                );
            case "action_taken":
                return (
                    <Textarea
                        variant="flat"
                        size="sm"
                        value={item.action_taken || ''}
                        onValueChange={(value) => handleChange(item.id, 'action_taken', value)}
                        minRows={1}
                        maxRows={3}
                        className="min-w-[200px]"
                        placeholder="Enter action taken..."
                    />
                );
            case "assigned_to":
                const assignedUser = users.find(user => user.id === item.assigned_to);
                return (
                    <Select
                        aria-label="Assigned To"
                        selectedKeys={item.assigned_to ? [item.assigned_to.toString()] : []}
                        onSelectionChange={(keys) => handleChange(item.id, 'assigned_to', Array.from(keys)[0])}
                        size="sm"
                        variant="flat"
                        className="min-w-[140px]"
                        placeholder="Select user"
                        renderValue={(items) => {
                            return items.map((item) => {
                                const user = users.find(u => u.id.toString() === item.key);
                                return user ? (
                                    <User
                                        key={user.id}
                                        name={user.name}
                                        avatarProps={{
                                            src: user.profile_image_url || user.profile_image || user.profile_photo_url,
                                            size: "sm"
                                        }}
                                    />
                                ) : null;
                            });
                        }}
                    >
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                <User
                                    name={user.name}
                                    avatarProps={{
                                        src: user.profile_image_url || user.profile_image || user.profile_photo_url,
                                        size: "sm"
                                    }}
                                />
                            </SelectItem>
                        ))}
                    </Select>
                );
            case "received_date":
                return (
                    <span className="text-sm">
                        {item.received_date ? new Date(item.received_date).toLocaleDateString() : 'N/A'}
                    </span>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        <Tooltip content="View Details">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => {
                                    setCurrentRow(item);
                                    openModal('view_letter');
                                }}
                            >
                                <EyeIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        
                        {(userIsAdmin || userIsSe) && (
                            <>
                                <Tooltip content="Edit Letter">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => {
                                            setCurrentRow(item);
                                            openModal('edit_letter');
                                        }}
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                                
                                <Tooltip content="Delete Letter" color="danger">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => handleClickOpen(item.id, 'delete_letter')}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </div>
                );
            default:
                return item[columnKey];
        }
    };

    // Sort data
    const sortedItems = React.useMemo(() => {
        return [...allData].sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [allData, sortDescriptor]);

    // Paginate data
    const items = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        return sortedItems.slice(start, end);
    }, [currentPage, sortedItems]);

    const pages = Math.ceil(sortedItems.length / itemsPerPage);

    const handleChange = async (letterId, key, value) => {
        try {
            const response = await axios.put(route('letters.update'), {
                id: letterId,
                [key]: value,
            });

            if (response.status === 200) {
                setData(prevLetters =>
                    prevLetters.map(letter =>
                        letter.id === letterId ? { ...letter, [key]: value } : letter
                    )
                );

                showToast.success(response.data.messages || 'Letter updated successfully');
            } else {
                showToast.error(response.data.error || `Failed to update letter ${key}.`);
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'An unexpected error occurred.');
        }
    };

    return (
        <div className="w-full">
            {loading && <Loader />}
            <Table
                aria-label="Letters table"
                isHeaderSticky
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                classNames={{
                    wrapper: "glass-table max-h-[600px]",
                    th: "bg-transparent",
                    td: "group-data-[hover=true]:bg-default-50",
                }}
                bottomContent={
                    pages > 1 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={currentPage}
                                total={pages}
                                onChange={setCurrentPage}
                            />
                        </div>
                    ) : null
                }
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={items}
                    isLoading={loading}
                    loadingContent={<Spinner label="Loading..." />}
                    emptyContent="No letters found"
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default LettersTable;
