import { useState, useEffect } from 'react';
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
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    AdjustmentsHorizontalIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";

const Items = ({ items = [], categories = [], brands = [], auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBrand, setSelectedBrand] = useState('all');
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
    const sampleItems = [
        { id: 1, name: 'Wireless Mouse', sku: 'WM-2024-001', category: 'Electronics', brand: 'TechPro', unit_price: 29.99, stock: 150, reorder_level: 50, status: 'active', image: null },
        { id: 2, name: 'USB-C Cable', sku: 'UC-2024-002', category: 'Accessories', brand: 'ConnectPlus', unit_price: 12.50, stock: 45, reorder_level: 100, status: 'low_stock', image: null },
        { id: 3, name: 'Bluetooth Headset', sku: 'BH-2024-003', category: 'Electronics', brand: 'AudioMax', unit_price: 79.99, stock: 0, reorder_level: 30, status: 'out_of_stock', image: null },
        { id: 4, name: 'Laptop Stand', sku: 'LS-2024-004', category: 'Accessories', brand: 'ErgoSupport', unit_price: 45.00, stock: 200, reorder_level: 40, status: 'active', image: null },
        { id: 5, name: 'Mechanical Keyboard', sku: 'MK-2024-005', category: 'Electronics', brand: 'TechPro', unit_price: 129.99, stock: 85, reorder_level: 25, status: 'active', image: null },
        { id: 6, name: 'Monitor Arm', sku: 'MA-2024-006', category: 'Accessories', brand: 'ErgoSupport', unit_price: 89.99, stock: 15, reorder_level: 20, status: 'low_stock', image: null },
        { id: 7, name: 'Webcam HD', sku: 'WC-2024-007', category: 'Electronics', brand: 'VisionTech', unit_price: 69.99, stock: 110, reorder_level: 30, status: 'active', image: null },
        { id: 8, name: 'Phone Charger', sku: 'PC-2024-008', category: 'Accessories', brand: 'ConnectPlus', unit_price: 19.99, stock: 0, reorder_level: 200, status: 'discontinued', image: null },
    ];

    const itemData = items.length > 0 ? items : sampleItems;

    const filteredItems = itemData.filter(item => {
        const matchesSearch = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesBrand = selectedBrand === 'all' || item.brand === selectedBrand;
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
    });

    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const totalPages = Math.ceil(filteredItems.length / perPage);

    const statusColorMap = {
        'active': 'success',
        'low_stock': 'warning',
        'out_of_stock': 'danger',
        'discontinued': 'default',
    };

    const getStockStatus = (item) => {
        if (item.status === 'discontinued') return 'discontinued';
        if (item.stock === 0) return 'out_of_stock';
        if (item.stock <= item.reorder_level) return 'low_stock';
        return 'active';
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'image':
                return (
                    <Avatar
                        src={item.image}
                        name={item.name}
                        size="md"
                        className="flex-shrink-0"
                        showFallback
                    />
                );
            
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <span className="text-xs text-default-500 font-mono">{item.sku}</span>
                    </div>
                );
            
            case 'category':
                return <span className="text-sm text-default-600">{item.category}</span>;
            
            case 'brand':
                return <span className="text-sm text-default-600">{item.brand}</span>;
            
            case 'unit_price':
                return (
                    <span className="font-mono text-sm">
                        ${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                );
            
            case 'stock':
                const stockStatus = getStockStatus(item);
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{item.stock}</span>
                        {stockStatus === 'low_stock' && (
                            <Chip size="sm" color="warning" variant="dot">Low</Chip>
                        )}
                        {stockStatus === 'out_of_stock' && (
                            <Chip size="sm" color="danger" variant="dot">Out</Chip>
                        )}
                    </div>
                );
            
            case 'reorder_level':
                return <span className="font-mono text-sm text-default-500">{item.reorder_level}</span>;
            
            case 'status':
                const displayStatus = getStockStatus(item);
                return (
                    <Chip
                        color={statusColorMap[displayStatus]}
                        size="sm"
                        variant="flat"
                    >
                        {displayStatus === 'active' ? 'In Stock' : 
                         displayStatus === 'low_stock' ? 'Low Stock' :
                         displayStatus === 'out_of_stock' ? 'Out of Stock' :
                         'Discontinued'}
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
                        <DropdownMenu aria-label="Item actions">
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="adjust"
                                startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                            >
                                Adjust Stock
                            </DropdownItem>
                            <DropdownItem
                                key="barcode"
                                startContent={<QrCodeIcon className="w-4 h-4" />}
                            >
                                View Barcode
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
        { key: 'image', label: '' },
        { key: 'name', label: 'Item / SKU' },
        { key: 'category', label: 'Category' },
        { key: 'brand', label: 'Brand' },
        { key: 'unit_price', label: 'Unit Price' },
        { key: 'stock', label: 'Stock' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];

    return (
        <App>
            <Head title="Items & Products" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Items & Products</h1>
                        <p className="text-sm text-default-600 mt-1">
                            Manage your product catalog
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            variant="flat"
                        >
                            Export
                        </Button>
                        {hasPermission('inventory.items.create') && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                            >
                                New Item
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                        placeholder="Search by name or SKU..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            inputWrapper: "bg-default-100"
                        }}
                        className="sm:max-w-xs"
                    />
                    
                    <Select
                        placeholder="Category"
                        selectedKeys={selectedCategory !== 'all' ? [selectedCategory] : []}
                        onSelectionChange={(keys) => {
                            setSelectedCategory(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                        startContent={<FunnelIcon className="w-4 h-4" />}
                    >
                        <SelectItem key="all">All Categories</SelectItem>
                        <SelectItem key="Electronics">Electronics</SelectItem>
                        <SelectItem key="Accessories">Accessories</SelectItem>
                    </Select>

                    <Select
                        placeholder="Brand"
                        selectedKeys={selectedBrand !== 'all' ? [selectedBrand] : []}
                        onSelectionChange={(keys) => {
                            setSelectedBrand(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                    >
                        <SelectItem key="all">All Brands</SelectItem>
                        <SelectItem key="TechPro">TechPro</SelectItem>
                        <SelectItem key="ConnectPlus">ConnectPlus</SelectItem>
                        <SelectItem key="AudioMax">AudioMax</SelectItem>
                        <SelectItem key="ErgoSupport">ErgoSupport</SelectItem>
                        <SelectItem key="VisionTech">VisionTech</SelectItem>
                    </Select>

                    <Select
                        placeholder="Stock Status"
                        selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
                        onSelectionChange={(keys) => {
                            setSelectedStatus(Array.from(keys)[0] || 'all');
                            setCurrentPage(1);
                        }}
                        classNames={{ trigger: "bg-default-100" }}
                        className="sm:max-w-xs"
                    >
                        <SelectItem key="all">All Status</SelectItem>
                        <SelectItem key="active">In Stock</SelectItem>
                        <SelectItem key="low_stock">Low Stock</SelectItem>
                        <SelectItem key="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem key="discontinued">Discontinued</SelectItem>
                    </Select>
                </div>

                {/* Table */}
                <Table
                    aria-label="Items and products table"
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
                        items={paginatedItems}
                        emptyContent="No items found"
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

export default Items;
