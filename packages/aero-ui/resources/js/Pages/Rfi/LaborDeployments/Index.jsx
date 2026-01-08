import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const LaborDeploymentsIndex = ({ title }) => {
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
    const [deployments, setDeployments] = useState([]);
    const [filters, setFilters] = useState({ search: '', skill_category: 'all', trade: 'all' });
    const [pagination, setPagination] = useState({ perPage: 30, currentPage: 1, total: 0, lastPage: 1 });
    const [stats, setStats] = useState({ total: 0, totalWorkers: 0, totalManHours: 0, avgProductivity: 0, safetyIncidents: 0 });

    const statsData = useMemo(() => [
        { title: "Total Deployments", value: stats.total, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Workers", value: stats.totalWorkers, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Man-Hours", value: `${stats.totalManHours.toFixed(1)}h`, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Avg Productivity", value: `${stats.avgProductivity.toFixed(2)}`, icon: <UserGroupIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
        { title: "Safety Incidents", value: stats.safetyIncidents, icon: <UserGroupIcon className="w-6 h-6" />, color: stats.safetyIncidents > 0 ? "text-danger" : "text-success", iconBg: stats.safetyIncidents > 0 ? "bg-danger/20" : "bg-success/20" },
    ], [stats]);

    // Permissions using HRMAC
    // TODO: Update with correct HRMAC path once module hierarchy is defined for RFI
    const canCreateDeployment = canCreate('rfi.labor-deployments') || isSuperAdmin();
    const canEditDeployment = canUpdate('rfi.labor-deployments') || isSuperAdmin();
    const canDeleteDeployment = canDelete('rfi.labor-deployments') || isSuperAdmin();

    const fetchDeployments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.labor-deployments.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            
            if (response.status === 200) {
                setDeployments(response.data.data || []);
                setPagination(prev => ({ ...prev, total: response.data.total || 0, lastPage: response.data.last_page || 1 }));
                
                const data = response.data.data || [];
                setStats({
                    total: response.data.total || 0,
                    totalWorkers: data.reduce((sum, d) => sum + (parseInt(d.number_of_workers) || 0), 0),
                    totalManHours: data.reduce((sum, d) => sum + (parseFloat(d.total_man_hours) || 0), 0),
                    avgProductivity: data.length > 0 ? data.reduce((sum, d) => sum + (parseFloat(d.productivity_per_man_hour) || 0), 0) / data.length : 0,
                    safetyIncidents: data.reduce((sum, d) => sum + (parseInt(d.safety_incidents) || 0), 0),
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch labor deployments' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => { fetchDeployments(); }, [fetchDeployments]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleDelete = async (deployment) => {
        if (!confirm(`Delete deployment ${deployment.skill_category}?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.labor-deployments.destroy', deployment.id));
                if (response.status === 200) {
                    await fetchDeployments();
                    resolve([response.data.message || 'Deployment deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete deployment']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting deployment...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const columns = [
        { name: "DATE", uid: "date" },
        { name: "SKILL", uid: "skill" },
        { name: "TRADE", uid: "trade" },
        { name: "WORKERS", uid: "workers" },
        { name: "MAN-HOURS", uid: "hours" },
        { name: "PRODUCTIVITY", uid: "productivity" },
        { name: "SAFETY", uid: "safety" },
        { name: "ACTIONS", uid: "actions" },
    ];

    const renderCell = useCallback((deployment, columnKey) => {
        switch (columnKey) {
            case "date":
                return <span className="text-sm font-semibold">{new Date(deployment.deployment_date).toLocaleDateString()}</span>;
            case "skill":
                return <span className="text-sm capitalize">{deployment.skill_category || '-'}</span>;
            case "trade":
                return <span className="text-sm capitalize">{deployment.trade || '-'}</span>;
            case "workers":
                return <span className="text-sm font-semibold">{deployment.number_of_workers || 0}</span>;
            case "hours":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold">{parseFloat(deployment.total_man_hours || 0).toFixed(1)}h</p>
                        <p className="text-xs text-default-500">{deployment.work_shift || '-'}</p>
                    </div>
                );
            case "productivity":
                const prod = parseFloat(deployment.productivity_per_man_hour || 0);
                return <span className="text-sm font-semibold">{prod.toFixed(2)}</span>;
            case "safety":
                const incidents = parseInt(deployment.safety_incidents || 0);
                const isCompliant = deployment.safety_compliant;
                return (
                    <div className="flex flex-col gap-1">
                        <Chip color={isCompliant ? "success" : "danger"} size="sm" variant="flat">
                            {isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
                        </Chip>
                        {incidents > 0 && <span className="text-xs text-danger">{incidents} incident(s)</span>}
                    </div>
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
                            {canEditDeployment && <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>Edit</DropdownItem>}
                            {canDeleteDeployment && (
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(deployment)}>
                                    Delete
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return deployment[columnKey];
        }
    }, [canEdit, canDelete]);

    return (
        <>
            <Head title={title || "Labor Deployments"} />
            
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
                                                    <UserGroupIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Labor Deployments</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Track manpower with productivity and safety metrics</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreateDeployment && (
                                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>Add Deployment</Button>
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
                                        
                                        <Select label="Skill Category" placeholder="All Skills" selectedKeys={filters.skill_category !== 'all' ? [filters.skill_category] : []}
                                            onSelectionChange={(keys) => handleFilterChange('skill_category', Array.from(keys)[0] || 'all')} variant="bordered" size="sm" radius={getThemeRadius()} classNames={{ trigger: "bg-default-100" }}>
                                            <SelectItem key="all">All Skills</SelectItem>
                                            <SelectItem key="skilled">Skilled</SelectItem>
                                            <SelectItem key="semi_skilled">Semi-Skilled</SelectItem>
                                            <SelectItem key="unskilled">Unskilled</SelectItem>
                                        </Select>
                                        
                                        <Select label="Trade" placeholder="All Trades" selectedKeys={filters.trade !== 'all' ? [filters.trade] : []}
                                            onSelectionChange={(keys) => handleFilterChange('trade', Array.from(keys)[0] || 'all')} variant="bordered" size="sm" radius={getThemeRadius()} classNames={{ trigger: "bg-default-100" }}>
                                            <SelectItem key="all">All Trades</SelectItem>
                                            <SelectItem key="mason">Mason</SelectItem>
                                            <SelectItem key="carpenter">Carpenter</SelectItem>
                                            <SelectItem key="electrician">Electrician</SelectItem>
                                            <SelectItem key="plumber">Plumber</SelectItem>
                                            <SelectItem key="welder">Welder</SelectItem>
                                            <SelectItem key="laborer">Laborer</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
                                    ) : (
                                        <Table aria-label="Labor deployments table" isHeaderSticky classNames={{ wrapper: "shadow-none border border-divider rounded-lg", th: "bg-default-100 text-default-600 font-semibold", td: "py-3" }}>
                                            <TableHeader columns={columns}>
                                                {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                            </TableHeader>
                                            <TableBody items={deployments} emptyContent="No deployments found">
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

LaborDeploymentsIndex.layout = (page) => <App children={page} />;
export default LaborDeploymentsIndex;
