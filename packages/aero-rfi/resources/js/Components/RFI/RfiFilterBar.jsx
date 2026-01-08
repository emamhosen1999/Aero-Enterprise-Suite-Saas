import React from 'react';
import { Input, Select, SelectItem, Button } from "@heroui/react";
import { 
    MagnifyingGlassIcon, 
    FunnelIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";

/**
 * RfiFilterBar - Comprehensive filter interface for RFI list
 * 
 * Filters:
 * - Search (by RFI number, description, location)
 * - Status (pending, approved, rejected, etc.)
 * - GPS Validation (all, valid, invalid)
 * - Permit Status (all, required, approved, pending)
 * - Work Layer
 * - Date Range
 * 
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Callback when filters change
 * @param {Array} workLayers - Available work layers for filter
 * @param {string} className - Additional CSS classes
 */
const RfiFilterBar = ({ 
    filters = {}, 
    onFilterChange, 
    workLayers = [],
    className = '' 
}) => {
    // Theme radius helper
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            status: [],
            gps_validation: 'all',
            permit_status: 'all',
            work_layer_id: '',
            date_from: '',
            date_to: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.search || 
               (filters.status && filters.status.length > 0) || 
               (filters.gps_validation && filters.gps_validation !== 'all') ||
               (filters.permit_status && filters.permit_status !== 'all') ||
               filters.work_layer_id ||
               filters.date_from ||
               filters.date_to;
    };

    const themeRadius = getThemeRadius();

    return (
        <div className={`space-y-4 ${className}`}>
            {/* First Row - Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <Input
                    placeholder="Search by RFI number, description, location..."
                    value={filters.search || ''}
                    onValueChange={(value) => handleChange('search', value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    classNames={{
                        inputWrapper: "bg-default-100"
                    }}
                    radius={themeRadius}
                    className="flex-1"
                />

                {/* Status Filter */}
                <Select
                    placeholder="Status"
                    selectedKeys={filters.status || []}
                    onSelectionChange={(keys) => handleChange('status', Array.from(keys))}
                    selectionMode="multiple"
                    classNames={{ trigger: "bg-default-100 min-w-[150px]" }}
                    radius={themeRadius}
                    renderValue={(items) => {
                        if (items.length === 0) return "All Status";
                        if (items.length === 1) return items[0].textValue;
                        return `${items.length} selected`;
                    }}
                >
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="approved">Approved</SelectItem>
                    <SelectItem key="rejected">Rejected</SelectItem>
                    <SelectItem key="scheduled">Scheduled</SelectItem>
                    <SelectItem key="completed">Completed</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                </Select>

                {/* GPS Validation Filter */}
                <Select
                    placeholder="GPS Validation"
                    selectedKeys={filters.gps_validation ? [filters.gps_validation] : ['all']}
                    onSelectionChange={(keys) => handleChange('gps_validation', Array.from(keys)[0] || 'all')}
                    classNames={{ trigger: "bg-default-100 min-w-[140px]" }}
                    radius={themeRadius}
                >
                    <SelectItem key="all">All GPS</SelectItem>
                    <SelectItem key="valid">Valid</SelectItem>
                    <SelectItem key="invalid">Invalid</SelectItem>
                    <SelectItem key="not_checked">Not Checked</SelectItem>
                </Select>

                {/* Permit Status Filter */}
                <Select
                    placeholder="Permit Status"
                    selectedKeys={filters.permit_status ? [filters.permit_status] : ['all']}
                    onSelectionChange={(keys) => handleChange('permit_status', Array.from(keys)[0] || 'all')}
                    classNames={{ trigger: "bg-default-100 min-w-[140px]" }}
                    radius={themeRadius}
                >
                    <SelectItem key="all">All Permits</SelectItem>
                    <SelectItem key="not_required">N/A</SelectItem>
                    <SelectItem key="required">Required</SelectItem>
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="approved">Approved</SelectItem>
                </Select>
            </div>

            {/* Second Row - Advanced Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Work Layer Filter */}
                <Select
                    placeholder="All Layers"
                    selectedKeys={filters.work_layer_id ? [String(filters.work_layer_id)] : []}
                    onSelectionChange={(keys) => handleChange('work_layer_id', Array.from(keys)[0] || '')}
                    classNames={{ trigger: "bg-default-100" }}
                    radius={themeRadius}
                    className="flex-1"
                >
                    <SelectItem key="">All Layers</SelectItem>
                    {workLayers?.map(layer => (
                        <SelectItem key={String(layer.id)}>
                            {layer.name}
                        </SelectItem>
                    ))}
                </Select>

                {/* Date Range */}
                <Input
                    type="date"
                    placeholder="From Date"
                    value={filters.date_from || ''}
                    onValueChange={(value) => handleChange('date_from', value)}
                    classNames={{ inputWrapper: "bg-default-100" }}
                    radius={themeRadius}
                    className="flex-1"
                />

                <Input
                    type="date"
                    placeholder="To Date"
                    value={filters.date_to || ''}
                    onValueChange={(value) => handleChange('date_to', value)}
                    classNames={{ inputWrapper: "bg-default-100" }}
                    radius={themeRadius}
                    className="flex-1"
                />

                {/* Clear Filters Button */}
                {hasActiveFilters() && (
                    <Button
                        variant="flat"
                        color="default"
                        onPress={clearFilters}
                        startContent={<XMarkIcon className="w-4 h-4" />}
                        className="min-w-fit"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Active Filter Count */}
            {hasActiveFilters() && (
                <div className="flex items-center gap-2">
                    <FunnelIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-default-600">
                        {(() => {
                            let count = 0;
                            if (filters.search) count++;
                            if (filters.status && filters.status.length > 0) count++;
                            if (filters.gps_validation && filters.gps_validation !== 'all') count++;
                            if (filters.permit_status && filters.permit_status !== 'all') count++;
                            if (filters.work_layer_id) count++;
                            if (filters.date_from || filters.date_to) count++;
                            return `${count} filter${count !== 1 ? 's' : ''} active`;
                        })()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RfiFilterBar;
