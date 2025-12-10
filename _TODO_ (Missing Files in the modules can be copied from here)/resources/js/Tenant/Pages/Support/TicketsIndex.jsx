import { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Select,
    SelectItem,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    ChatBubbleLeftIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const TicketsIndex = ({ tickets = [], agents = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [agentFilter, setAgentFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Responsive
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Theme helper
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    // Permission helper
    const hasPermission = (permission) => {
        return auth?.user?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    // Mock data
    const mockTickets = tickets.length > 0 ? tickets : [
        { id: 1, ticket_number: 'TKT-2024-001', subject: 'Cannot access dashboard', customer: 'John Customer', priority: 'high', status: 'open', assigned_to: 'Jane Agent', created: '2024-01-22 10:30', last_updated: '2024-01-22 14:15', category: 'technical', rating: null },
        { id: 2, ticket_number: 'TKT-2024-002', subject: 'Billing question about invoice', customer: 'Sarah Client', priority: 'medium', status: 'in_progress', assigned_to: 'Mike Support', created: '2024-01-21 09:15', last_updated: '2024-01-22 11:20', category: 'billing', rating: null },
        { id: 3, ticket_number: 'TKT-2024-003', subject: 'Feature request for reports', customer: 'Bob User', priority: 'low', status: 'waiting', assigned_to: 'Jane Agent', created: '2024-01-20 16:45', last_updated: '2024-01-21 08:30', category: 'general', rating: null },
        { id: 4, ticket_number: 'TKT-2024-004', subject: 'System error on checkout', customer: 'Alice Buyer', priority: 'urgent', status: 'open', assigned_to: 'Mike Support', created: '2024-01-22 15:00', last_updated: '2024-01-22 15:05', category: 'technical', rating: null },
    ];

    // Priority color map
    const priorityColorMap = {
        low: 'default',
        medium: 'primary',
        high: 'warning',
        urgent: 'danger',
    };

    // Status color map
    const statusColorMap = {
        open: 'danger',
        in_progress: 'primary',
        waiting: 'warning',
        resolved: 'success',
        closed: 'default',
    };

    // Filter and search
    const filteredTickets = useMemo(() => {
        return mockTickets.filter(ticket => {
            const matchesSearch = ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.customer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesAgent = agentFilter === 'all' || ticket.assigned_to === agentFilter;
            const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
            return matchesSearch && matchesPriority && matchesStatus && matchesAgent && matchesCategory;
        });
    }, [mockTickets, searchTerm, priorityFilter, statusFilter, agentFilter, categoryFilter]);

    // Pagination
    const pages = Math.ceil(filteredTickets.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredTickets.slice(start, end);
    }, [page, filteredTickets]);

    // Check if overdue (older than 24 hours and not resolved/closed)
    const isOverdue = (created, status) => {
        if (status === 'resolved' || status === 'closed') return false;
        const createdTime = new Date(created);
        const now = new Date();
        const diffHours = (now - createdTime) / (1000 * 60 * 60);
        return diffHours > 24;
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (ticket, columnKey) => {
        switch (columnKey) {
            case 'ticket_number':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{ticket.ticket_number}</span>
                        {isOverdue(ticket.created, ticket.status) && (
                            <span className="text-xs text-danger">Overdue</span>
                        )}
                    </div>
                );
            case 'subject':
                return (
                    <div className="flex items-start gap-2">
                        <ChatBubbleLeftIcon className="w-4 h-4 text-default-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{ticket.subject}</span>
                    </div>
                );
            case 'customer':
                return (
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm">{ticket.customer}</span>
                    </div>
                );
            case 'priority':
                return (
                    <Chip color={priorityColorMap[ticket.priority]} size="sm" variant="flat">
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </Chip>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[ticket.status]} size="sm" variant="flat">
                        {ticket.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Chip>
                );
            case 'assigned_to':
                return <span className="text-sm">{ticket.assigned_to}</span>;
            case 'timestamps':
                return (
                    <div className="flex flex-col text-xs text-default-500">
                        <span>Created: {ticket.created}</span>
                        <span>Updated: {ticket.last_updated}</span>
                    </div>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Ticket actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="reply" startContent={<ChatBubbleLeftIcon className="w-4 h-4" />}>
                                Reply
                            </DropdownItem>
                            <DropdownItem key="assign">Reassign</DropdownItem>
                            <DropdownItem key="resolve" className="text-success" color="success">
                                Mark as Resolved
                            </DropdownItem>
                            <DropdownItem key="close">Close Ticket</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    const columns = [
        { uid: 'ticket_number', name: 'Ticket #' },
        { uid: 'subject', name: 'Subject' },
        { uid: 'customer', name: 'Customer' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'status', name: 'Status' },
        { uid: 'assigned_to', name: 'Assigned To' },
        { uid: 'timestamps', name: 'Created / Updated' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <App>
            <Head title="Support Tickets" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
                        <p className="text-default-500">Manage customer support requests</p>
                    </div>
                    {hasPermission('support.tickets.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            New Ticket
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="All Priority"
                        className="w-full sm:w-40"
                        radius={getThemeRadius()}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Priority</SelectItem>
                        <SelectItem key="low" value="low">Low</SelectItem>
                        <SelectItem key="medium" value="medium">Medium</SelectItem>
                        <SelectItem key="high" value="high">High</SelectItem>
                        <SelectItem key="urgent" value="urgent">Urgent</SelectItem>
                    </Select>
                    <Select
                        placeholder="All Status"
                        className="w-full sm:w-40"
                        radius={getThemeRadius()}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Status</SelectItem>
                        <SelectItem key="open" value="open">Open</SelectItem>
                        <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                        <SelectItem key="waiting" value="waiting">Waiting</SelectItem>
                        <SelectItem key="resolved" value="resolved">Resolved</SelectItem>
                        <SelectItem key="closed" value="closed">Closed</SelectItem>
                    </Select>
                    <Select
                        placeholder="All Agents"
                        className="w-full sm:w-40"
                        radius={getThemeRadius()}
                        onChange={(e) => setAgentFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Agents</SelectItem>
                        {[...new Set(mockTickets.map(t => t.assigned_to))].map(agent => (
                            <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Categories"
                        className="w-full sm:w-40"
                        radius={getThemeRadius()}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Categories</SelectItem>
                        <SelectItem key="technical" value="technical">Technical</SelectItem>
                        <SelectItem key="billing" value="billing">Billing</SelectItem>
                        <SelectItem key="general" value="general">General</SelectItem>
                    </Select>
                    <Button
                        variant="flat"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        radius={getThemeRadius()}
                    >
                        Export
                    </Button>
                </div>

                {/* Table */}
                <Table
                    aria-label="Support tickets table"
                    bottomContent={
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                            />
                        </div>
                    }
                >
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={items} emptyContent="No support tickets found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </App>
    );
};

export default TicketsIndex;
