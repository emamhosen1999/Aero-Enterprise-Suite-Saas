import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import App from '@/Layouts/App';
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
    Pagination
} from "@heroui/react";
import { 
    MagnifyingGlassIcon, 
    PlusIcon,
    EllipsisVerticalIcon,
    ArrowDownTrayIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const FixedAssets = ({ auth, assets = [], categories = [], locations = [] }) => {
    // Responsive hooks
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Theme radius helper
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

    const themeRadius = useMemo(() => getThemeRadius(), []);

    // Permission helper
    const hasPermission = (permission) => {
        return auth?.permissions?.includes(permission) || auth?.user?.is_super_admin;
    };

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        location: 'all',
        status: 'all'
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0
    });

    // Mock data
    const mockAssets = assets.length > 0 ? assets : [
        { id: 1, asset_number: 'FA-2024-001', name: 'Dell Laptop - Model XPS 15', category: 'IT Equipment', acquisition_date: '2024-01-15', acquisition_cost: 1500.00, accumulated_depreciation: 312.50, book_value: 1187.50, location: 'Head Office', status: 'active' },
        { id: 2, asset_number: 'FA-2024-002', name: 'Toyota Camry 2023', category: 'Vehicles', acquisition_date: '2023-06-20', acquisition_cost: 28000.00, accumulated_depreciation: 7000.00, book_value: 21000.00, location: 'Fleet Pool', status: 'active' },
        { id: 3, asset_number: 'FA-2024-003', name: 'Industrial Printer', category: 'Machinery', acquisition_date: '2022-09-10', acquisition_cost: 8500.00, accumulated_depreciation: 3400.00, book_value: 5100.00, location: 'Production Floor', status: 'active' },
        { id: 4, asset_number: 'FA-2023-045', name: 'Office Building - Downtown', category: 'Real Estate', acquisition_date: '2020-03-01', acquisition_cost: 500000.00, accumulated_depreciation: 50000.00, book_value: 450000.00, location: 'Downtown', status: 'active' },
        { id: 5, asset_number: 'FA-2022-112', name: 'Server Rack Equipment', category: 'IT Equipment', acquisition_date: '2021-11-15', acquisition_cost: 12000.00, accumulated_depreciation: 6000.00, book_value: 6000.00, location: 'Data Center', status: 'active' },
        { id: 6, asset_number: 'FA-2021-089', name: 'Forklift Model XYZ', category: 'Machinery', acquisition_date: '2019-05-22', acquisition_cost: 18000.00, accumulated_depreciation: 13500.00, book_value: 4500.00, location: 'Warehouse', status: 'disposed' }
    ];

    const mockCategories = categories.length > 0 ? categories : [
        { id: 1, name: 'IT Equipment' },
        { id: 2, name: 'Vehicles' },
        { id: 3, name: 'Machinery' },
        { id: 4, name: 'Real Estate' },
        { id: 5, name: 'Furniture' }
    ];

    const mockLocations = locations.length > 0 ? locations : [
        { id: 1, name: 'Head Office' },
        { id: 2, name: 'Fleet Pool' },
        { id: 3, name: 'Production Floor' },
        { id: 4, name: 'Downtown' },
        { id: 5, name: 'Data Center' },
        { id: 6, name: 'Warehouse' }
    ];

    // Filtered data
    const filteredAssets = useMemo(() => {
        return mockAssets.filter(asset => {
            const matchesSearch = !filters.search || 
                asset.asset_number.toLowerCase().includes(filters.search.toLowerCase()) ||
                asset.name.toLowerCase().includes(filters.search.toLowerCase());
            const matchesCategory = filters.category === 'all' || asset.category === filters.category;
            const matchesLocation = filters.location === 'all' || asset.location === filters.location;
            const matchesStatus = filters.status === 'all' || asset.status === filters.status;
            return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
        });
    }, [mockAssets, filters]);

    // Pagination
    const paginatedAssets = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        return filteredAssets.slice(startIndex, startIndex + pagination.perPage);
    }, [filteredAssets, pagination]);

    const totalPages = Math.ceil(filteredAssets.length / pagination.perPage);

    // Status color map
    const statusColorMap = {
        active: 'success',
        maintenance: 'warning',
        disposed: 'danger',
        inactive: 'default'
    };

    // Handlers
    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleExport = () => {
        console.log('Exporting assets...');
    };

    const handleEdit = (id) => {
        safeNavigate('finance.fixed-assets.edit', id);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this asset?')) {
            console.log('Deleting asset:', id);
        }
    };

    // Columns
    const columns = [
        { uid: 'asset_number', name: 'Asset Number' },
        { uid: 'name', name: 'Asset Name' },
        { uid: 'category', name: 'Category' },
        { uid: 'acquisition_date', name: 'Acquisition Date' },
        { uid: 'book_value', name: 'Book Value' },
        { uid: 'location', name: 'Location' },
        { uid: 'status', name: 'Status' },
        { uid: 'actions', name: 'Actions' }
    ];

    const renderCell = (asset, columnKey) => {
        switch (columnKey) {
            case 'asset_number':
                return <span className="font-semibold">{asset.asset_number}</span>;
            case 'name':
                return <span>{asset.name}</span>;
            case 'category':
                return <span>{asset.category}</span>;
            case 'acquisition_date':
                return <span>{new Date(asset.acquisition_date).toLocaleDateString()}</span>;
            case 'book_value':
                return <span className="font-semibold">${asset.book_value.toLocaleString()}</span>;
            case 'location':
                return <span>{asset.location}</span>;
            case 'status':
                return (
                    <Chip color={statusColorMap[asset.status]} size="sm" variant="flat">
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
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
                        <DropdownMenu aria-label="Asset actions">
                            {hasPermission('finance.fixed-assets.edit') && (
                                <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />} onPress={() => handleEdit(asset.id)}>
                                    Edit
                                </DropdownItem>
                            )}
                            <DropdownItem key="view">View Details</DropdownItem>
                            <DropdownItem key="depreciate">Record Depreciation</DropdownItem>
                            {hasPermission('finance.fixed-assets.delete') && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(asset.id)}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return asset[columnKey];
        }
    };

    return (
        <App user={auth.user}>
            <Head title="Fixed Assets" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6"
            >
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Fixed Assets</h1>
                        <p className="text-sm text-default-500 mt-1">Manage asset lifecycle and depreciation</p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('finance.fixed-assets.export') && (
                            <Button
                                color="default"
                                variant="flat"
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                onPress={handleExport}
                                radius={themeRadius}
                            >
                                Export
                            </Button>
                        )}
                        {hasPermission('finance.fixed-assets.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={() => safeNavigate('finance.fixed-assets.create')}
                                radius={themeRadius}
                            >
                                Add Asset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Search by asset number or name..."
                        value={filters.search}
                        onValueChange={handleSearchChange}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        className="sm:w-64"
                        radius={themeRadius}
                        classNames={{
                            inputWrapper: "bg-default-100"
                        }}
                    />
                    <Select
                        placeholder="All Categories"
                        selectedKeys={filters.category !== 'all' ? [filters.category] : []}
                        onSelectionChange={(keys) => handleFilterChange('category', Array.from(keys)[0] || 'all')}
                        className="sm:w-48"
                        radius={themeRadius}
                        classNames={{ trigger: "bg-default-100" }}
                    >
                        <SelectItem key="all">All Categories</SelectItem>
                        {mockCategories.map(cat => (
                            <SelectItem key={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Locations"
                        selectedKeys={filters.location !== 'all' ? [filters.location] : []}
                        onSelectionChange={(keys) => handleFilterChange('location', Array.from(keys)[0] || 'all')}
                        className="sm:w-48"
                        radius={themeRadius}
                        classNames={{ trigger: "bg-default-100" }}
                    >
                        <SelectItem key="all">All Locations</SelectItem>
                        {mockLocations.map(loc => (
                            <SelectItem key={loc.name}>{loc.name}</SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Status"
                        selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                        className="sm:w-40"
                        radius={themeRadius}
                        classNames={{ trigger: "bg-default-100" }}
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="active">Active</SelectItem>
                        <SelectItem key="maintenance">Maintenance</SelectItem>
                        <SelectItem key="disposed">Disposed</SelectItem>
                        <SelectItem key="inactive">Inactive</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Fixed assets table"
                    isHeaderSticky
                    classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={paginatedAssets} emptyContent="No assets found">
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={totalPages}
                            page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                            showControls
                            radius={themeRadius}
                        />
                    </div>
                )}
            </motion.div>
        </App>
    );
};

export default FixedAssets;
