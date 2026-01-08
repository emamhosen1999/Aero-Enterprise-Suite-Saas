import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, DocumentTextIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const SiteInstructionsIndex = ({ title }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
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
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [instructions, setInstructions] = useState([]);
    const [filters, setFilters] = useState({ search: '', priority: 'all', status: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });

    const statsData = useMemo(() => [
        { title: "Total Instructions", value: stats.total, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Pending", value: stats.pending, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "In Progress", value: stats.inProgress, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
        { title: "Completed", value: stats.completed, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Overdue", value: stats.overdue, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for RFI
    const canCreateInstruction = canCreate('rfi.site-instructions') || isSuperAdmin();
    const canEditInstruction = canUpdate('rfi.site-instructions') || isSuperAdmin();
    const canDeleteInstruction = canDelete('rfi.site-instructions') || isSuperAdmin();

    const fetchInstructions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.site-instructions.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            
            if (response.status === 200) {
                setInstructions(response.data.data || []);
                setPagination(prev => ({ ...prev, total: response.data.total || 0, lastPage: response.data.last_page || 1 }));
                
                const data = response.data.data || [];
                setStats({
                    total: response.data.total || 0,
                    pending: data.filter(i => i.status === 'pending').length,
                    inProgress: data.filter(i => i.status === 'in_progress').length,
                    completed: data.filter(i => i.status === 'completed').length,
                    overdue: data.filter(i => i.is_overdue).length,
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch site instructions' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => { fetchInstructions(); }, [fetchInstructions]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleDelete = async (instruction) => {
        if (!confirm(`Delete instruction ${instruction.instruction_number}?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.site-instructions.destroy', instruction.id));
                if (response.status === 200) {
                    await fetchInstructions();
                    resolve([response.data.message || 'Instruction deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete instruction']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting instruction...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const priorityColorMap = { urgent: "danger", high: "warning", medium: "primary", low: "default" };
    const statusColorMap = { pending: "warning", in_progress: "primary", completed: "success", cancelled: "default" };

    const columns = [
        { name: "NUMBER", uid: "number" },
        { name: "TITLE", uid: "title" },
        { name: "PRIORITY", uid: "priority" },
        { name: "STATUS", uid: "status" },
        { name: "ISSUED BY", uid: "issued_by" },
        { name: "DEADLINE", uid: "deadline" },
        { name: "RESPONSE", uid: "response" },
        { name: "ACTIONS", uid: "actions" },
    ];

    const renderCell = useCallback((instruction, columnKey) => {
        switch (columnKey) {
            case "number":
                return <span className="text-sm font-semibold">{instruction.instruction_number}</span>;
            case "title":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{instruction.title}</p>
                        <p className="text-xs text-default-500 truncate max-w-[200px]">{instruction.description}</p>
                    </div>
                );
            case "priority":
                return (
                    <Chip color={priorityColorMap[instruction.priority]} size="sm" variant="flat">
                        {instruction.priority?.toUpperCase()}
                    </Chip>
                );
            case "status":
                return (
                    <Chip color={statusColorMap[instruction.status]} size="sm" variant="flat">
                        {instruction.status?.replace('_', ' ').toUpperCase()}
                    </Chip>
                );
            case "issued_by":
                return <span className="text-sm">{instruction.issued_by || '-'}</span>;
            case "deadline":
                const isOverdue = instruction.is_overdue;
                const daysToDeadline = instruction.days_to_deadline;
                return (
                    <div className="flex flex-col">
                        <p className={`text-sm ${isOverdue ? 'text-danger font-semibold' : ''}`}>
                            {new Date(instruction.deadline).toLocaleDateString()}
                        </p>
                        {daysToDeadline !== null && (
                            <p className={`text-xs ${isOverdue ? 'text-danger' : 'text-default-500'}`}>
                                {isOverdue ? `${Math.abs(daysToDeadline)} days overdue` : `${daysToDeadline} days left`}
                            </p>
                        )}
                    </div>
                );
            case "response":
                return instruction.response_date ? (
                    <span className="text-sm">{new Date(instruction.response_date).toLocaleDateString()}</span>
                ) : (
                    <span className="text-xs text-default-400">No response</span>
                );
            case "actions":
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            {canEditInstruction && <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>Edit</DropdownItem>}
                            {canDeleteInstruction && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(instruction)}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return instruction[columnKey];
        }
    }, [canEdit, canDelete]);

    return (
        <>
            <Head title={title || "Site Instructions"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card className="transition-all duration-200" style={{ border: `var(--borderWidth, 2px) solid transparent`, borderRadius: `var(--borderRadius, 12px)`, fontFamily: `var(--fontFamily, "Inter")`, background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)` }}>
                                <CardHeader className="border-b p-0" style={{ borderColor: `var(--theme-divider, #E4E4E7)`, background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)` }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`} style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`, borderRadius: `var(--borderRadius, 12px)` }}>
                                                    <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Site Instructions</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Track directives with response tracking</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateInstruction && (
                                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>Add Instruction</Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input label="Search" placeholder="Search..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={getThemeRadius()} classNames={{ inputWrapper: "bg-default-100" }} />
                                        
                                        <Select label="Priority" placeholder="All Priority" selectedKeys={filters.priority !== 'all' ? [filters.priority] : []}
                                            onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0] || 'all')} variant="bordered" size="sm" radius={getThemeRadius()} classNames={{ trigger: "bg-default-100" }}>
                                            <SelectItem key="all">All Priority</SelectItem>
                                            <SelectItem key="urgent">Urgent</SelectItem>
                                            <SelectItem key="high">High</SelectItem>
                                            <SelectItem key="medium">Medium</SelectItem>
                                            <SelectItem key="low">Low</SelectItem>
                                        </Select>
                                        
                                        <Select label="Status" placeholder="All Status" selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')} variant="bordered" size="sm" radius={getThemeRadius()} classNames={{ trigger: "bg-default-100" }}>
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="pending">Pending</SelectItem>
                                            <SelectItem key="in_progress">In Progress</SelectItem>
                                            <SelectItem key="completed">Completed</SelectItem>
                                            <SelectItem key="cancelled">Cancelled</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
                                    ) : (
                                        <Table aria-label="Site instructions table" isHeaderSticky classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100 text-default-600 font-semibold", td: "py-3" }}>
                                            <TableHeader columns={columns}>
                                                {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                            </TableHeader>
                                            <TableBody items={instructions} emptyContent="No instructions found">
                                                {(item) => (
                                                    <TableRow key={item.id}>
                                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                    
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination total={pagination.lastPage} page={pagination.currentPage} onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls color="primary" />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

SiteInstructionsIndex.layout = (page) => <App children={page} />;
export default SiteInstructionsIndex;
