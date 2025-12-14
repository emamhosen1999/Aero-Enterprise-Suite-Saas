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
    Progress,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PlusIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const ProjectsIndex = ({ projects = [], auth }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
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
    const mockProjects = projects.length > 0 ? projects : [
        { id: 1, name: 'Website Redesign', client: 'Acme Corp', manager: 'John Doe', start_date: '2024-01-01', end_date: '2024-03-31', progress: 65, budget: 50000, actual: 32500, status: 'active', priority: 'high', team_count: 5 },
        { id: 2, name: 'Mobile App Development', client: 'Tech Solutions', manager: 'Jane Smith', start_date: '2024-01-15', end_date: '2024-06-30', progress: 40, budget: 120000, actual: 48000, status: 'active', priority: 'critical', team_count: 8 },
        { id: 3, name: 'Marketing Campaign', client: 'Retail Inc', manager: 'Mike Johnson', start_date: '2023-12-01', end_date: '2024-02-28', progress: 90, budget: 25000, actual: 22000, status: 'active', priority: 'medium', team_count: 3 },
    ];

    // Status color map
    const statusColorMap = {
        planning: 'default',
        active: 'primary',
        on_hold: 'warning',
        completed: 'success',
        cancelled: 'danger',
    };

    // Priority color map
    const priorityColorMap = {
        low: 'default',
        medium: 'primary',
        high: 'warning',
        critical: 'danger',
    };

    // Filter and search
    const filteredProjects = useMemo(() => {
        return mockProjects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                project.client.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClient = clientFilter === 'all' || project.client === clientFilter;
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
            return matchesSearch && matchesClient && matchesStatus && matchesPriority;
        });
    }, [mockProjects, searchTerm, clientFilter, statusFilter, priorityFilter]);

    // Pagination
    const pages = Math.ceil(filteredProjects.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredProjects.slice(start, end);
    }, [page, filteredProjects]);

    const formatCurrency = (amount) => `$${amount.toLocaleString()}`;

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const renderCell = (project, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-default-400">{project.team_count} team members</span>
                    </div>
                );
            case 'client':
                return <span>{project.client}</span>;
            case 'manager':
                return <span className="text-sm">{project.manager}</span>;
            case 'timeline':
                return (
                    <div className="flex flex-col text-sm">
                        <span>Start: {project.start_date}</span>
                        <span>End: {project.end_date}</span>
                    </div>
                );
            case 'progress':
                return (
                    <div className="flex flex-col gap-1">
                        <Progress
                            aria-label="Project progress"
                            value={project.progress}
                            color={project.progress < 30 ? 'danger' : project.progress < 70 ? 'warning' : 'success'}
                            className="max-w-md"
                        />
                        <span className="text-xs text-default-500">{project.progress}%</span>
                    </div>
                );
            case 'budget':
                const budgetUsed = (project.actual / project.budget) * 100;
                return (
                    <div className="flex flex-col text-sm">
                        <span>{formatCurrency(project.budget)}</span>
                        <span className={budgetUsed > 90 ? 'text-danger' : 'text-success'}>
                            {formatCurrency(project.actual)} used
                        </span>
                    </div>
                );
            case 'status':
                return (
                    <Chip color={statusColorMap[project.status]} size="sm" variant="flat">
                        {project.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Chip>
                );
            case 'priority':
                return (
                    <Chip color={priorityColorMap[project.priority]} size="sm" variant="flat">
                        {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Project actions">
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="tasks">View Tasks</DropdownItem>
                            <DropdownItem key="team">Manage Team</DropdownItem>
                            <DropdownItem key="edit">Edit</DropdownItem>
                            <DropdownItem key="archive" className="text-warning" color="warning">
                                Archive
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return null;
        }
    };

    const columns = [
        { uid: 'name', name: 'Project Name' },
        { uid: 'client', name: 'Client' },
        { uid: 'manager', name: 'Manager' },
        { uid: 'timeline', name: 'Timeline' },
        { uid: 'progress', name: 'Progress' },
        { uid: 'budget', name: 'Budget' },
        { uid: 'status', name: 'Status' },
        { uid: 'priority', name: 'Priority' },
        { uid: 'actions', name: 'Actions' },
    ];

    return (
        <App>
            <Head title="Projects" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
                        <p className="text-default-500">Manage your project portfolio</p>
                    </div>
                    {hasPermission('projects.projects.create') && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            radius={getThemeRadius()}
                        >
                            New Project
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="w-full sm:w-64"
                        radius={getThemeRadius()}
                    />
                    <Select
                        placeholder="All Clients"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setClientFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Clients</SelectItem>
                        {[...new Set(mockProjects.map(p => p.client))].map(client => (
                            <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Status"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Status</SelectItem>
                        <SelectItem key="planning" value="planning">Planning</SelectItem>
                        <SelectItem key="active" value="active">Active</SelectItem>
                        <SelectItem key="on_hold" value="on_hold">On Hold</SelectItem>
                        <SelectItem key="completed" value="completed">Completed</SelectItem>
                    </Select>
                    <Select
                        placeholder="All Priority"
                        className="w-full sm:w-48"
                        radius={getThemeRadius()}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <SelectItem key="all" value="all">All Priority</SelectItem>
                        <SelectItem key="low" value="low">Low</SelectItem>
                        <SelectItem key="medium" value="medium">Medium</SelectItem>
                        <SelectItem key="high" value="high">High</SelectItem>
                        <SelectItem key="critical" value="critical">Critical</SelectItem>
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
                    aria-label="Projects table"
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
                    <TableBody items={items} emptyContent="No projects found">
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

export default ProjectsIndex;
