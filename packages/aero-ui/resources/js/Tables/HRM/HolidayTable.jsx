import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {
    Button,
    ButtonGroup,
    Card,
    CardBody,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Pagination,
    ScrollShadow,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/react";
import {
    AdjustmentsHorizontalIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import {differenceInDays, format, isAfter, isBefore} from 'date-fns';
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';

// Theme utility function
const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};

const HolidayTable = ({ 
    holidaysData, 
    onEdit, 
    onDelete,
    onFilteredDataChange,
    isLoading = false 
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallScreen = useMediaQuery('(max-width: 640px)');
    
    // State for filtering and pagination
    const [filterValue, setFilterValue] = useState('');
    const [typeFilter, setTypeFilter] = useState([]);
    const [statusFilter, setStatusFilter] = useState([]);
    const [yearFilter, setYearFilter] = useState([new Date().getFullYear().toString()]); // Default to current year
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);

    // Holiday type configurations with theme colors
    const holidayTypes = {
        public: { 
            label: 'Public', 
            color: 'danger', 
            icon: '🏛️',
            bgColor: 'color-mix(in srgb, var(--theme-danger) 20%, transparent)',
            textColor: 'var(--theme-danger)'
        },
        religious: { 
            label: 'Religious', 
            color: 'secondary', 
            icon: '🕌',
            bgColor: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)',
            textColor: 'var(--theme-secondary)'
        },
        national: { 
            label: 'National', 
            color: 'primary', 
            icon: '🇧🇩',
            bgColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
            textColor: 'var(--theme-primary)'
        },
        company: { 
            label: 'Company', 
            color: 'warning', 
            icon: '🏢',
            bgColor: 'color-mix(in srgb, var(--theme-warning) 20%, transparent)',
            textColor: 'var(--theme-warning)'
        },
        optional: { 
            label: 'Optional', 
            color: 'default', 
            icon: '📅',
            bgColor: 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
            textColor: 'var(--theme-foreground)'
        }
    };

    // Status configurations
    const getHolidayStatus = useCallback((holiday) => {
        const today = new Date();
        const fromDate = new Date(holiday.from_date);
        const toDate = new Date(holiday.to_date);
        
        if (isBefore(today, fromDate)) {
            return { status: 'upcoming', label: 'Upcoming', color: 'primary', icon: ClockIcon };
        } else if (isAfter(today, toDate)) {
            return { status: 'past', label: 'Past', color: 'default', icon: CheckCircleIcon };
        } else {
            return { status: 'ongoing', label: 'Ongoing', color: 'success', icon: CheckCircleIcon };
        }
    }, []);

    // Filter holidays
    const filteredHolidays = useMemo(() => {
        let filtered = holidaysData;

        // Text filter
        if (filterValue) {
            filtered = filtered.filter(holiday =>
                holiday.title?.toLowerCase().includes(filterValue.toLowerCase()) ||
                holiday.description?.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        // Type filter
        if (Array.isArray(typeFilter) && typeFilter.length > 0) {
            filtered = filtered.filter(holiday => typeFilter.includes(holiday.type));
        }

        // Status filter
        if (Array.isArray(statusFilter) && statusFilter.length > 0) {
            filtered = filtered.filter(holiday => {
                const status = getHolidayStatus(holiday);
                return statusFilter.includes(status.status);
            });
        }

        // Year filter
        if (Array.isArray(yearFilter) && yearFilter.length > 0) {
            filtered = filtered.filter(holiday => {
                const holidayYear = new Date(holiday.from_date).getFullYear().toString();
                return yearFilter.includes(holidayYear);
            });
        }

        return filtered;
    }, [holidaysData, filterValue, typeFilter, statusFilter, yearFilter, getHolidayStatus]);

    // Notify parent component of filtered data changes
    useEffect(() => {
        if (onFilteredDataChange) {
            onFilteredDataChange(filteredHolidays);
        }
    }, [filteredHolidays, onFilteredDataChange]);

    // Pagination
    const pages = Math.ceil(filteredHolidays.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredHolidays.slice(start, end);
    }, [page, filteredHolidays, rowsPerPage]);

    
    // Table columns
    const columns = [
        { name: "Holiday", uid: "title", sortable: true },
        { name: "Duration", uid: "duration", sortable: true },
        { name: "Type", uid: "type", sortable: true },
        { name: "Status", uid: "status", sortable: true },
        { name: "Actions", uid: "actions" }
    ];

    // Render cell content
    const renderCell = useCallback((holiday, columnKey) => {
        const cellValue = holiday[columnKey];

        switch (columnKey) {
            case "title":
                const duration = differenceInDays(new Date(holiday.to_date), new Date(holiday.from_date)) + 1;
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize text-foreground">
                            {holiday.title}
                        </p>
                        <div className="flex items-center gap-2 text-tiny text-default-400">
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>
                                {format(new Date(holiday.from_date), 'MMM dd, yyyy')}
                                {duration > 1 && (
                                    <> - {format(new Date(holiday.to_date), 'MMM dd, yyyy')}</>
                                )}
                            </span>
                        </div>
                        {holiday.description && (
                            <p className="text-tiny text-default-500 mt-1 line-clamp-2">
                                {holiday.description}
                            </p>
                        )}
                    </div>
                );
            
            case "duration":
                const days = differenceInDays(new Date(holiday.to_date), new Date(holiday.from_date)) + 1;
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-bold text-sm text-foreground">
                            {days} {days === 1 ? 'day' : 'days'}
                        </span>
                    </div>
                );

            case "type":
                const typeConfig = holidayTypes[holiday.type] || holidayTypes.company;
                return (
                    <Chip
                        className="capitalize"
                        color={typeConfig.color}
                        size="sm"
                        variant="bordered"
                        startContent={<span className="text-xs">{typeConfig.icon}</span>}
                        radius={getThemeRadius()}
                        classNames={{
                            base: "border-default-200",
                            content: "text-foreground",
                        }}
                        style={{
                            background: typeConfig.bgColor,
                            color: typeConfig.textColor,
                            fontFamily: `var(--fontFamily, "Inter")`,
                            border: `1px solid var(--theme-divider)`,
                        }}
                    >
                        {typeConfig.label}
                    </Chip>
                );

            case "status":
                const statusConfig = getHolidayStatus(holiday);
                const StatusIcon = statusConfig.icon;
                return (
                    <Chip
                        className="capitalize"
                        color={statusConfig.color}
                        size="sm"
                        variant="bordered"
                        startContent={<StatusIcon className="w-3 h-3" />}
                        radius={getThemeRadius()}
                        classNames={{
                            base: "border-default-200",
                            content: "text-foreground",
                        }}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                            border: `1px solid var(--theme-divider)`,
                        }}
                    >
                        {statusConfig.label}
                    </Chip>
                );

            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem
                                    key="view"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                >
                                    View Details
                                </DropdownItem>
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="w-4 h-4" />}
                                    onPress={() => onEdit(holiday)}
                                >
                                    Edit Holiday
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="w-4 h-4" />}
                                    onPress={() => onDelete(holiday.id)}
                                >
                                    Delete Holiday
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );

            default:
                return cellValue;
        }
    }, [getHolidayStatus, onEdit, onDelete]);

    // Top content with filters
    const topContent = useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                {/* Main search and filter toggle - Matching Leave page */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by title or description..."
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            size={isMobile ? "sm" : "md"}
                            startContent={
                                <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                            }
                            variant="bordered"
                            radius={getThemeRadius()}
                            classNames={{
                                inputWrapper: "border-default-200 hover:border-default-300 focus-within:border-primary",
                                input: "text-foreground",
                            }}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                                border: `1px solid var(--theme-divider)`,
                            }}
                        />
                    </div>
                    <div className="flex gap-2 items-end">
                        <ButtonGroup variant="bordered">
                            <Button
                                isIconOnly={isMobile}
                                color={showFilters ? 'primary' : 'default'}
                                onPress={() => setShowFilters(!showFilters)}
                                radius={getThemeRadius()}
                                classNames={{
                                    base: "border-default-200 hover:border-default-300",
                                }}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    border: `1px solid var(--theme-divider)`,
                                }}
                            >
                                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                {!isMobile && <span className="ml-1">Filters</span>}
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>

                {/* Advanced filters panel - Matching Leave page */}
                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="p-4 border border-divider rounded-lg"
                        style={{
                            background: `var(--theme-content2)`,
                            border: `1px solid var(--theme-divider)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Select
                                    label="Holiday Type"
                                    selectionMode="multiple"
                                    variant="bordered"
                                    selectedKeys={new Set(typeFilter)}
                                    onSelectionChange={(keys) => setTypeFilter(Array.from(keys))}
                                    radius={getThemeRadius()}
                                    classNames={{ 
                                        trigger: "border-default-200 hover:border-default-300 focus-within:border-primary",
                                        popoverContent: "border-default-200",
                                        value: "text-foreground",
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        border: `1px solid var(--theme-divider)`,
                                    }}
                                >
                                    {Object.entries(holidayTypes).map(([key, config]) => (
                                        <SelectItem key={key} value={key} textValue={config.label}>
                                            <div className="flex items-center gap-2">
                                                <span>{config.icon}</span>
                                                <span>{config.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Holiday Status"
                                    selectionMode="multiple"
                                    variant="bordered"
                                    selectedKeys={new Set(statusFilter)}
                                    onSelectionChange={(keys) => setStatusFilter(Array.from(keys))}
                                    radius={getThemeRadius()}
                                    classNames={{ 
                                        trigger: "border-default-200 hover:border-default-300 focus-within:border-primary",
                                        popoverContent: "border-default-200",
                                        value: "text-foreground",
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        border: `1px solid var(--theme-divider)`,
                                    }}
                                >
                                    <SelectItem key="upcoming" value="upcoming" textValue="Upcoming">
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="w-3 h-3" />
                                            <span>Upcoming</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem key="ongoing" value="ongoing" textValue="Ongoing">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-3 h-3" />
                                            <span>Ongoing</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem key="past" value="past" textValue="Past">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-3 h-3" />
                                            <span>Past</span>
                                        </div>
                                    </SelectItem>
                                </Select>

                                <Select
                                    label="Year"
                                    selectionMode="multiple"
                                    variant="bordered"
                                    selectedKeys={new Set(yearFilter)}
                                    onSelectionChange={(keys) => setYearFilter(Array.from(keys))}
                                    radius={getThemeRadius()}
                                    classNames={{ 
                                        trigger: "border-default-200 hover:border-default-300 focus-within:border-primary",
                                        popoverContent: "border-default-200",
                                        value: "text-foreground",
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        border: `1px solid var(--theme-divider)`,
                                    }}
                                >
                                    {/* Generate year options from 2020 to current year + 2 */}
                                    {Array.from({ length: new Date().getFullYear() - 2019 + 3 }, (_, i) => {
                                        const year = (2020 + i).toString();
                                        return (
                                            <SelectItem key={year} value={year} textValue={year}>
                                                <div className="flex items-center gap-2">
                                                    <span>📅</span>
                                                    <span>{year}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                            </div>

                            {/* Second row for additional controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                <Select
                                    label="Rows per page"
                                    variant="bordered"
                                    selectedKeys={new Set([rowsPerPage.toString()])}
                                    onSelectionChange={(keys) => setRowsPerPage(Number(Array.from(keys)[0]))}
                                    radius={getThemeRadius()}
                                    classNames={{ 
                                        trigger: "border-default-200 hover:border-default-300 focus-within:border-primary",
                                        popoverContent: "border-default-200",
                                        value: "text-foreground",
                                    }}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        border: `1px solid var(--theme-divider)`,
                                    }}
                                >
                                    <SelectItem key="5" value="5" textValue="5">5</SelectItem>
                                    <SelectItem key="10" value="10" textValue="10">10</SelectItem>
                                    <SelectItem key="15" value="15" textValue="15">15</SelectItem>
                                    <SelectItem key="25" value="25" textValue="25">25</SelectItem>
                                </Select>
                            </div>

                            {/* Active Filters as Chips - Matching Leave page */}
                            {(filterValue || 
                              (Array.isArray(typeFilter) && typeFilter.length > 0) || 
                              (Array.isArray(statusFilter) && statusFilter.length > 0) ||
                              (Array.isArray(yearFilter) && yearFilter.length > 0)) && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex flex-wrap gap-2">
                                        {filterValue && (
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                onClose={() => setFilterValue('')}
                                            >
                                                Search: {filterValue}
                                            </Chip>
                                        )}
                                        {Array.isArray(typeFilter) && typeFilter.map(type => (
                                            <Chip
                                                key={type}
                                                size="sm"
                                                variant="flat"
                                                color="secondary"
                                                onClose={() => setTypeFilter(prev => prev.filter(t => t !== type))}
                                            >
                                                {holidayTypes[type]?.icon} {holidayTypes[type]?.label}
                                            </Chip>
                                        ))}
                                        {Array.isArray(statusFilter) && statusFilter.map(status => (
                                            <Chip
                                                key={status}
                                                size="sm"
                                                variant="flat"
                                                color="warning"
                                                onClose={() => setStatusFilter(prev => prev.filter(s => s !== status))}
                                            >
                                                {status === 'upcoming' && '🕐'} 
                                                {status === 'ongoing' && '✅'} 
                                                {status === 'past' && '📋'} 
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Chip>
                                        ))}
                                        {Array.isArray(yearFilter) && yearFilter.map(year => (
                                            <Chip
                                                key={year}
                                                size="sm"
                                                variant="flat"
                                                color="secondary"
                                                onClose={() => setYearFilter(prev => prev.filter(y => y !== year))}
                                            >
                                                📅 {year}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </motion.div>
                )}

                {/* Results count */}
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">
                        Total {filteredHolidays.length} holidays
                        {(Array.isArray(typeFilter) && typeFilter.length > 0) || 
                         (Array.isArray(statusFilter) && statusFilter.length > 0) || 
                         filterValue ? ` (filtered from ${holidaysData.length})` : ''}
                    </span>
                </div>
            </div>
        );
    }, [filterValue, typeFilter, statusFilter, filteredHolidays.length, holidaysData.length, rowsPerPage, showFilters, isMobile]);

    // Bottom content with pagination
    const bottomContent = useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400">
                    {`${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filteredHolidays.length)} of ${filteredHolidays.length}`}
                </span>
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    variant="bordered"
                    page={page}
                    total={pages}
                    onChange={setPage}
                    radius={getThemeRadius()}
                    classNames={{
                        wrapper: "border-default-200",
                        item: "border-default-200",
                        cursor: "bg-primary text-primary-foreground"
                    }}
                    style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button
                        isDisabled={pages === 1}
                        size="sm"
                        variant="flat"
                        onPress={() => setPage(1)}
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        First
                    </Button>
                    <Button
                        isDisabled={pages === 1}
                        size="sm"
                        variant="flat"
                        onPress={() => setPage(pages)}
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Last
                    </Button>
                </div>
            </div>
        );
    }, [page, pages, filteredHolidays.length, rowsPerPage]);

    // Mobile card component for better mobile experience
    const MobileHolidayCard = ({ holiday }) => {
        const typeConfig = holidayTypes[holiday.type] || holidayTypes.company;
        const statusConfig = getHolidayStatus(holiday);
        const days = differenceInDays(new Date(holiday.to_date), new Date(holiday.from_date)) + 1;

        return (
            <Card 
                className="mb-2"
                style={{
                    background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
                    backdropFilter: 'blur(16px)',
                    border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                    borderRadius: getThemeRadius(),
                }}
            >
                <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h4 className="font-semibold text-base mb-2" style={{
                                color: `var(--theme-foreground)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {holiday.title}
                            </h4>
                            {holiday.description && (
                                <p className="text-sm mb-3 line-clamp-2" style={{
                                    color: `var(--theme-foreground-600)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {holiday.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <Chip
                                className="capitalize"
                                color={statusConfig.color}
                                size="md"
                                variant="bordered"
                                startContent={<statusConfig.icon className="w-3 h-3" />}
                                radius={getThemeRadius()}
                                classNames={{
                                    base: "border-default-200",
                                    content: "text-foreground font-medium",
                                }}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    border: `1px solid var(--theme-divider)`,
                                }}
                            >
                                {statusConfig.label}
                            </Chip>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="min-w-8 h-8"
                                        style={{
                                            borderRadius: getThemeRadius(),
                                        }}
                                    >
                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Holiday actions">
                                    <DropdownItem
                                        key="view"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                    >
                                        View Details
                                    </DropdownItem>
                                    <DropdownItem
                                        key="edit"
                                        startContent={<PencilIcon className="w-4 h-4" />}
                                        onPress={() => onEdit && onEdit(holiday)}
                                    >
                                        Edit Holiday
                                    </DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => onDelete && onDelete(holiday.id)}
                                    >
                                        Delete Holiday
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium mb-1" style={{
                                    color: `var(--theme-foreground-500)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Type
                                </span>
                                <Chip
                                    className="capitalize self-start"
                                    color={typeConfig.color}
                                    size="sm"
                                    variant="bordered"
                                    startContent={<span className="text-xs">{typeConfig.icon}</span>}
                                    radius={getThemeRadius()}
                                    classNames={{
                                        base: "border-default-200",
                                        content: "text-foreground font-medium",
                                    }}
                                    style={{
                                        background: typeConfig.bgColor,
                                        color: typeConfig.textColor,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                        border: `1px solid var(--theme-divider)`,
                                    }}
                                >
                                    {typeConfig.label}
                                </Chip>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium mb-1" style={{
                                    color: `var(--theme-foreground-500)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Duration
                                </span>
                                <span className="font-semibold" style={{
                                    color: `var(--theme-foreground)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {days} {days === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium mb-1" style={{
                                    color: `var(--theme-foreground-500)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Start Date
                                </span>
                                <span className="font-semibold" style={{
                                    color: `var(--theme-foreground)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    {format(new Date(holiday.from_date), 'MMM dd, yyyy')}
                                </span>
                            </div>
                            {holiday.from_date !== holiday.to_date && (
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium mb-1" style={{
                                        color: `var(--theme-foreground-500)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        End Date
                                    </span>
                                    <span className="font-semibold" style={{
                                        color: `var(--theme-foreground)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {format(new Date(holiday.to_date), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };



    if (holidaysData.length === 0) {
        return (
            <Card 
                className="shadow-md"
                radius={getThemeRadius()}
                style={{
                    background: `var(--theme-content1)`,
                    border: `1px solid var(--theme-divider)`,
                }}
            >
                <CardBody className="text-center py-12" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Holidays Found
                    </h3>
                    <p className="text-default-500 text-sm">
                        No company holidays have been configured yet.
                    </p>
                </CardBody>
            </Card>
        );
    }

    // Mobile view
    if (isMobile) {
        return (
            <div className="space-y-4" style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}>
                {/* Top content for mobile */}
                {topContent}
                
                {/* Mobile cards */}
                <div className="space-y-3">
                    {items.map((holiday) => (
                        <MobileHolidayCard
                            key={holiday.id}
                            holiday={holiday}
                        />
                    ))}
                </div>

                {/* Bottom content for mobile */}
                {filteredHolidays.length > rowsPerPage && (
                    <div className="py-2 px-2 flex justify-center">
                        <Pagination
                            initialPage={1}
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            variant="bordered"
                            page={page}
                            total={pages}
                            onChange={setPage}
                            radius={getThemeRadius()}
                            classNames={{
                                wrapper: "border-default-200",
                                item: "border-default-200",
                                cursor: "bg-primary text-primary-foreground"
                            }}
                            style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Desktop view
    return (
        <div className="space-y-4" style={{
            fontFamily: `var(--fontFamily, "Inter")`,
        }}>
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    isStriped
                    aria-label="Holiday management table"
                    isHeaderSticky
                    topContent={topContent}
                    topContentPlacement="outside"
                    isCompact
                    removeWrapper
                    radius={getThemeRadius()}
                    classNames={{
                        base: "max-h-[520px] overflow-auto",
                        table: "min-h-[200px] w-full",
                        thead: "z-10",
                        tbody: "overflow-y-auto",
                        th: "bg-default-100 text-default-700 font-semibold",
                        td: "text-default-600",
                    }}
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === "actions" ? "center" : "start"}
                                allowsSorting={column.sortable}
                                className="backdrop-blur-md"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                                    color: 'var(--theme-foreground)',
                                    borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold">{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CalendarDaysIcon 
                                    className="w-12 h-12 mb-4 opacity-40"
                                    style={{ color: 'var(--theme-foreground-400)' }}
                                />
                                <p className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>
                                    No holidays found
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--theme-foreground-500)' }}>
                                    Try adjusting your filters or add a new holiday
                                </p>
                            </div>
                        } 
                        items={items}
                        isLoading={isLoading}
                        loadingContent={
                            <div style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                                color: `var(--theme-foreground)`
                            }}>
                                Loading holidays...
                            </div>
                        }
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>

            {/* Bottom pagination */}
            {filteredHolidays.length > rowsPerPage && (
                <div className="py-2 px-2 flex justify-center">
                    <Pagination
                        initialPage={1}
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        variant="bordered"
                        page={page}
                        total={pages}
                        onChange={setPage}
                        radius={getThemeRadius()}
                        classNames={{
                            wrapper: "border-default-200",
                            item: "border-default-200",
                            cursor: "bg-primary text-primary-foreground"
                        }}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default HolidayTable;
