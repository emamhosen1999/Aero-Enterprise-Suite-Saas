import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Progress,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Card,
    CardBody,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const Warehouses = ({ warehouses = [], auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    // Sample data
    const sampleWarehouses = [
        { id: 1, name: 'Main Warehouse', location: 'New York, NY', type: 'main', capacity: 10000, items_count: 8500, total_value: 425000, status: 'active' },
        { id: 2, name: 'West Coast Distribution', location: 'Los Angeles, CA', type: 'regional', capacity: 5000, items_count: 3200, total_value: 160000, status: 'active' },
        { id: 3, name: 'East Coast Hub', location: 'Boston, MA', type: 'regional', capacity: 5000, items_count: 4100, total_value: 205000, status: 'active' },
        { id: 4, name: 'Transit Center', location: 'Chicago, IL', type: 'transit', capacity: 2000, items_count: 800, total_value: 40000, status: 'active' },
        { id: 5, name: 'Returns Processing', location: 'Newark, NJ', type: 'returns', capacity: 1000, items_count: 350, total_value: 17500, status: 'active' },
    ];

    const warehouseData = warehouses.length > 0 ? warehouses : sampleWarehouses;

    const enrichedWarehouses = warehouseData.map(warehouse => ({
        ...warehouse,
        utilization: ((warehouse.items_count / warehouse.capacity) * 100).toFixed(1)
    }));

    const filteredWarehouses = enrichedWarehouses.filter(warehouse => {
        const matchesSearch = searchQuery === '' || 
            warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            warehouse.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || warehouse.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || warehouse.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const paginatedWarehouses = filteredWarehouses.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const totalPages = Math.ceil(filteredWarehouses.length / perPage);

    const summaryStats = useMemo(() => {
        const totalCapacity = filteredWarehouses.reduce((sum, w) => sum + w.capacity, 0);
        const avgUtilization = filteredWarehouses.length > 0
            ? (filteredWarehouses.reduce((sum, w) => sum + parseFloat(w.utilization), 0) / filteredWarehouses.length).toFixed(1)
            : 0;
        
        return {
            total: filteredWarehouses.length,
            totalCapacity,
            avgUtilization
        };
    }, [filteredWarehouses]);

    const typeColorMap = {
        'main': 'primary',
        'regional': 'success',
        'transit': 'warning',
        'returns': 'secondary',
    };

    const getUtilizationColor = (utilization) => {
        const util = parseFloat(utilization);
        if (util >= 90) return 'danger';
        if (util >= 75) return 'warning';
        return 'success';
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const renderCell = (warehouse, columnKey) => {
        switch (columnKey) {
            case 'name':
                return <span className="font-semibold text-sm">{warehouse.name}</span>;
            
            case 'location':
                return <span className="text-sm text-default-600">{warehouse.location}</span>;
            
            case 'type':
                return (
                    <Chip
                        color={typeColorMap[warehouse.type] || 'default'}
                        size="sm"
                        variant="flat"
                    >
                        {warehouse.type.charAt(0).toUpperCase() + warehouse.type.slice(1)}
                    </Chip>
                );
            
            case 'capacity':
                return <span className="font-mono text-sm">{warehouse.capacity.toLocaleString()}</span>;
            
            case 'utilization':
                return (
                    <div className="flex items-center gap-2">
                        <Progress
                            size="sm"
                            value={parseFloat(warehouse.utilization)}
                            color={getUtilizationColor(warehouse.utilization)}
                            className="max-w-md"
                        />
                        <span className="text-sm font-mono min-w-[45px]">{warehouse.utilization}%</span>
                    </div>
                );
            
            case 'items_count':
                return <span className="font-mono text-sm">{warehouse.items_count.toLocaleString()}</span>;
            
            case 'total_value':
                return (
                    <span className="font-mono text-sm">
                        ${warehouse.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                );
            
            case 'status':
                return (
                    <Chip
                        color={warehouse.status === 'active' ? 'success' : 'default'}
                        size="sm"
                        variant="dot"
                    >
                        {warehouse.status === 'active' ? 'Active' : 'Inactive'}
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
                        <DropdownMenu aria-label="Warehouse actions">
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="transfer"
                                startContent={<ArrowsRightLeftIcon className="w-4 h-4" />}
                            >
                                Stock Transfer
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            
            default:
                return null;
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'location', label: 'Location' },
        { key: 'type', label: 'Type' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'utilization', label: 'Utilization' },
        { key: 'items_count', label: 'Items' },
        { key: 'total_value', label: 'Total Value' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    return (
        <App>
            <Head title="Warehouses" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
                        <p className="text-sm text-default-600 mt-1">
                            Manage warehouse locations and capacity
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            variant="flat"
                        >
                            Export
                        </Button>
                        {hasPermission('inventory.warehouses.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                New Warehouse
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Total Warehouses</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                                {summaryStats.total}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Total Capacity</p>
                            <p className="text-2xl font-bold text-primary mt-1">
                                {summaryStats.totalCapacity.toLocaleString()}
                            </p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <p className="text-sm text-default-600">Avg Utilization</p>
                            <p className="text-2xl font-bold text-success mt-1">
                                {summaryStats.avgUtilization}%
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                        placeholder="Search warehouses..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            inputWrapper: "bg-default-100"
                        }}
                        className="sm:max-w-xs"
                    />
                    
                    <Select
                        placeholder="Type"
                        selectedKeys={selectedType !== 'all' ? [selectedType] : []}
                        onSelectionChange={(keys) => {
                            setSelectedType(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                        startContent={<FunnelIcon className="w-4 h-4" />}
                    >
                        <SelectItem key="all">All Types</SelectItem>
                        <SelectItem key="main">Main</SelectItem>
                        <SelectItem key="regional">Regional</SelectItem>
                        <SelectItem key="transit">Transit</SelectItem>
                        <SelectItem key="returns">Returns</SelectItem>
                    </Select>

                    <Select
                        placeholder="Status"
                        selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
                        onSelectionChange={(keys) => {
                            setSelectedStatus(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="active">Active</SelectItem>
                        <SelectItem key="inactive">Inactive</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Warehouses table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.key}>
                                {column.label}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={paginatedWarehouses}
                        emptyContent="No warehouses found"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            showControls
                        />
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default Warehouses;
