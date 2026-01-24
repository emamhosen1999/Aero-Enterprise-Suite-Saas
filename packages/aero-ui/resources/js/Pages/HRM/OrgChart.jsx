import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Tooltip,
    User
} from "@heroui/react";
import {
    BuildingOffice2Icon,
    UsersIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import {useHRMAC} from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';

// Department Node component for the org chart
const DepartmentNode = ({ department, allDepartments, level = 0, expandedNodes, toggleNode }) => {
    const children = allDepartments.filter(d => d.parent_id === department.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(department.id);
    const employeeCount = department.employees?.length || 0;

    return (
        <div className={`${level > 0 ? 'ml-8' : ''}`}>
            <div 
                className="flex items-center gap-3 p-3 rounded-lg border border-divider bg-content1 hover:bg-content2 transition-colors cursor-pointer mb-2"
                onClick={() => hasChildren && toggleNode(department.id)}
            >
                {hasChildren ? (
                    <button className="p-1 rounded hover:bg-default-200">
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4 text-default-500" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4 text-default-500" />
                        )}
                    </button>
                ) : (
                    <div className="w-6" />
                )}
                
                <div className="p-2 rounded-lg bg-primary/10">
                    <BuildingOffice2Icon className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{department.name}</span>
                        {department.code && (
                            <Chip size="sm" variant="flat" color="default">
                                {department.code}
                            </Chip>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-default-500">
                        {department.manager && (
                            <div className="flex items-center gap-1">
                                <UserCircleIcon className="w-4 h-4" />
                                <span>{department.manager.name}</span>
                            </div>
                        )}
                        {department.location && (
                            <span>{department.location}</span>
                        )}
                    </div>
                </div>
                
                <Tooltip content={`${employeeCount} employee(s)`}>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-default-100">
                        <UsersIcon className="w-4 h-4 text-default-500" />
                        <span className="text-sm text-default-600">{employeeCount}</span>
                    </div>
                </Tooltip>
                
                {hasChildren && (
                    <Chip size="sm" variant="flat" color="secondary">
                        {children.length} sub-dept
                    </Chip>
                )}
            </div>
            
            {/* Render children if expanded */}
            {isExpanded && hasChildren && (
                <div className="border-l-2 border-default-200 ml-3">
                    {children.map(child => (
                        <DepartmentNode
                            key={child.id}
                            department={child}
                            allDepartments={allDepartments}
                            level={level + 1}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const OrgChart = ({ title, departments, rootDepartments, stats }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    // HRMAC permissions
    const { hasAccess, canUpdate, isSuperAdmin } = useHRMAC();
    
    // TODO: Update with actual HRMAC module hierarchy path once defined
    const canViewOrgChart = hasAccess('hrm.organization.chart') || isSuperAdmin();
    const canEditDepartment = canUpdate('hrm.departments') || isSuperAdmin();
    
    // Responsive breakpoints
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

    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    // Toggle node expansion
    const toggleNode = useCallback((id) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Expand all nodes
    const expandAll = useCallback(() => {
        const allIds = new Set(departments?.map(d => d.id) || []);
        setExpandedNodes(allIds);
    }, [departments]);

    // Collapse all nodes
    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
    }, []);

    // Stats cards data
    const statsData = useMemo(() => [
        {
            title: "Total Departments",
            value: stats?.total_departments || 0,
            icon: <BuildingOffice2Icon className="w-5 h-5" />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Active departments"
        },
        {
            title: "Total Employees",
            value: stats?.total_employees || 0,
            icon: <UsersIcon className="w-5 h-5" />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Across all departments"
        },
        {
            title: "Root Departments",
            value: stats?.root_departments || 0,
            icon: <BuildingOffice2Icon className="w-5 h-5" />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Top-level units"
        }
    ], [stats]);

    // Filter departments by search query
    const filteredRootDepartments = useMemo(() => {
        if (!searchQuery.trim()) {
            return rootDepartments || [];
        }
        
        const query = searchQuery.toLowerCase();
        const matchingIds = new Set();
        
        // Find all departments matching the search
        departments?.forEach(dept => {
            if (
                dept.name?.toLowerCase().includes(query) ||
                dept.code?.toLowerCase().includes(query) ||
                dept.location?.toLowerCase().includes(query) ||
                dept.manager?.name?.toLowerCase().includes(query)
            ) {
                matchingIds.add(dept.id);
                // Also add all parent departments to show hierarchy
                let parentId = dept.parent_id;
                while (parentId) {
                    matchingIds.add(parentId);
                    const parent = departments.find(d => d.id === parentId);
                    parentId = parent?.parent_id;
                }
            }
        });
        
        // Return root departments that are in matching set or have matching children
        return (rootDepartments || []).filter(dept => matchingIds.has(dept.id));
    }, [searchQuery, departments, rootDepartments]);

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Organization Chart">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <BuildingOffice2Icon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                        style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                        Organization Chart
                                                    </h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        View your organization's department hierarchy
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                <Button 
                                                    variant="flat"
                                                    size={isMobile ? "sm" : "md"}
                                                    onPress={expandAll}
                                                >
                                                    Expand All
                                                </Button>
                                                <Button 
                                                    variant="flat"
                                                    size={isMobile ? "sm" : "md"}
                                                    onPress={collapseAll}
                                                >
                                                    Collapse All
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    {/* Search Filter */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            placeholder="Search departments..."
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            classNames={{
                                                inputWrapper: "bg-default-100"
                                            }}
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-md"
                                        />
                                    </div>
                                    
                                    {/* Org Chart Tree */}
                                    <div className="space-y-2">
                                        {filteredRootDepartments.length > 0 ? (
                                            filteredRootDepartments.map(dept => (
                                                <DepartmentNode
                                                    key={dept.id}
                                                    department={dept}
                                                    allDepartments={departments || []}
                                                    level={0}
                                                    expandedNodes={expandedNodes}
                                                    toggleNode={toggleNode}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-default-500">
                                                <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">No departments found</p>
                                                <p className="text-sm">
                                                    {searchQuery 
                                                        ? "Try adjusting your search query"
                                                        : "Create departments to build your organization chart"
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

OrgChart.layout = (page) => <App children={page} />;
export default OrgChart;
