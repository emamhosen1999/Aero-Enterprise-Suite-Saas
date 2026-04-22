import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    Tooltip,
} from '@heroui/react';
import {
    ExclamationTriangleIcon,
    HeartIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { showToast } from '@/utils/toastUtils.jsx';
import axios from 'axios';

const riskColorMap = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
};

const getRiskLevel = (score) => {
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
};

const WellbeingDashboard = ({ title, burnoutRisks = [], departmentRiskSummary = [], riskTrend = [], stats = {}, error }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canUpdate: canManage } = useHRMAC();

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

    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [interventionModal, setInterventionModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [interventionNote, setInterventionNote] = useState('');
    const [interventionType, setInterventionType] = useState('counselling');

    const statsData = useMemo(() => [
        {
            title: 'High Risk',
            value: stats.high_risk ?? 0,
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            color: 'text-danger',
            iconBg: 'bg-danger/20',
        },
        {
            title: 'Medium Risk',
            value: stats.medium_risk ?? 0,
            icon: <BoltIcon className="w-6 h-6" />,
            color: 'text-warning',
            iconBg: 'bg-warning/20',
        },
        {
            title: 'Low Risk',
            value: stats.low_risk ?? 0,
            icon: <ShieldCheckIcon className="w-6 h-6" />,
            color: 'text-success',
            iconBg: 'bg-success/20',
        },
        {
            title: 'Total Monitored',
            value: stats.total_monitored ?? 0,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
        },
    ], [stats]);

    const filteredRisks = useMemo(() => {
        return burnoutRisks.filter(risk => {
            const matchesSearch = !search ||
                risk.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
                risk.employee?.department?.name?.toLowerCase().includes(search.toLowerCase());
            const level = getRiskLevel(risk.burnout_risk_score ?? 0);
            const matchesFilter = riskFilter === 'all' || level === riskFilter;
            return matchesSearch && matchesFilter;
        });
    }, [burnoutRisks, search, riskFilter]);

    const openIntervention = (risk) => {
        setSelectedEmployee(risk);
        setInterventionNote('');
        setInterventionType('counselling');
        setInterventionModal(true);
    };

    const handleIntervention = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('hrm.wellbeing.intervention', selectedEmployee.employee_id), {
                    intervention_type: interventionType,
                    notes: interventionNote,
                });
                if (response.status === 200) {
                    setInterventionModal(false);
                    resolve([response.data.message || 'Intervention recorded successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to record intervention']);
            }
        });

        showToast.promise(promise, {
            loading: 'Recording intervention...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const columns = [
        { uid: 'employee', name: 'Employee' },
        { uid: 'department', name: 'Department' },
        { uid: 'risk_score', name: 'Risk Score' },
        { uid: 'risk_level', name: 'Risk Level' },
        { uid: 'factors', name: 'Risk Factors' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (risk, columnKey) => {
        switch (columnKey) {
            case 'employee':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{risk.employee?.name || 'Unknown'}</span>
                        <span className="text-xs text-default-400">{risk.employee?.designation?.name || '—'}</span>
                    </div>
                );
            case 'department':
                return <span className="text-sm">{risk.employee?.department?.name || '—'}</span>;
            case 'risk_score':
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-default-200">
                            <div
                                className={`h-2 rounded-full ${risk.burnout_risk_score >= 60 ? 'bg-danger' : risk.burnout_risk_score >= 40 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${Math.min(risk.burnout_risk_score ?? 0, 100)}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{risk.burnout_risk_score ?? 0}%</span>
                    </div>
                );
            case 'risk_level': {
                const level = getRiskLevel(risk.burnout_risk_score ?? 0);
                return (
                    <Chip color={riskColorMap[level]} size="sm" variant="flat" className="capitalize">
                        {level}
                    </Chip>
                );
            }
            case 'factors':
                return (
                    <div className="flex gap-1 flex-wrap max-w-xs">
                        {(risk.risk_factors || []).slice(0, 2).map((f, i) => (
                            <Chip key={i} size="sm" variant="dot" color="default">{f}</Chip>
                        ))}
                        {(risk.risk_factors || []).length > 2 && (
                            <Chip size="sm" variant="flat" color="default">+{risk.risk_factors.length - 2}</Chip>
                        )}
                    </div>
                );
            case 'actions':
                return canManage ? (
                    <Button size="sm" color="primary" variant="flat" onPress={() => openIntervention(risk)}>
                        Intervene
                    </Button>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={title} />

            {/* Intervention Modal */}
            <Modal isOpen={interventionModal} onOpenChange={setInterventionModal} size="lg" scrollBehavior="inside"
                classNames={{ base: 'bg-content1', header: 'border-b border-divider', body: 'py-6', footer: 'border-t border-divider' }}>
                <ModalContent>
                    <ModalHeader>
                        <h2 className="text-lg font-semibold">Record Intervention — {selectedEmployee?.employee?.name}</h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Select
                                label="Intervention Type"
                                placeholder="Select type"
                                selectedKeys={interventionType ? [interventionType] : []}
                                onSelectionChange={(keys) => setInterventionType(Array.from(keys)[0])}
                                radius={themeRadius}
                            >
                                <SelectItem key="counselling">Counselling Session</SelectItem>
                                <SelectItem key="workload_reduction">Workload Reduction</SelectItem>
                                <SelectItem key="leave_recommended">Leave Recommended</SelectItem>
                                <SelectItem key="manager_meeting">Manager Meeting</SelectItem>
                                <SelectItem key="wellness_program">Wellness Program Referral</SelectItem>
                            </Select>
                            <Textarea
                                label="Notes"
                                placeholder="Describe the intervention plan..."
                                value={interventionNote}
                                onValueChange={setInterventionNote}
                                radius={themeRadius}
                                minRows={3}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setInterventionModal(false)}>Cancel</Button>
                        <Button color="primary" onPress={handleIntervention} isDisabled={!interventionType}>
                            Record Intervention
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Wellbeing Dashboard">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div
                                                    className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`, borderRadius: `var(--borderRadius, 12px)` }}
                                                >
                                                    <HeartIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Wellbeing & Burnout Monitor</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                        AI-powered employee wellbeing risk detection
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />

                                    {error && (
                                        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Department Risk Summary */}
                                    {departmentRiskSummary.length > 0 && (
                                        <div className="mb-6">
                                            <h5 className="text-base font-semibold mb-3 flex items-center gap-2">
                                                <ArrowTrendingUpIcon className="w-5 h-5 text-primary" />
                                                Department Risk Overview
                                            </h5>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {departmentRiskSummary.map((dept, i) => (
                                                    <Card key={i} className="p-3 border border-divider" shadow="none">
                                                        <p className="text-sm font-semibold truncate">{dept.department}</p>
                                                        <p className="text-xs text-default-400">{dept.employee_count} employees</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex-1 h-1.5 rounded-full bg-default-200">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${dept.average_risk >= 60 ? 'bg-danger' : dept.average_risk >= 40 ? 'bg-warning' : 'bg-success'}`}
                                                                    style={{ width: `${Math.min(dept.average_risk, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium">{dept.average_risk}%</span>
                                                        </div>
                                                        {dept.high_risk_count > 0 && (
                                                            <Chip size="sm" color="danger" variant="flat" className="mt-1">
                                                                {dept.high_risk_count} high risk
                                                            </Chip>
                                                        )}
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input
                                            label="Search"
                                            placeholder="Search by name or department..."
                                            value={search}
                                            onValueChange={setSearch}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                        />
                                        <Select
                                            label="Risk Level"
                                            placeholder="All Levels"
                                            selectedKeys={riskFilter !== 'all' ? [riskFilter] : []}
                                            onSelectionChange={(keys) => setRiskFilter(Array.from(keys)[0] || 'all')}
                                            size="sm"
                                            radius={themeRadius}
                                            className="max-w-xs"
                                        >
                                            <SelectItem key="all">All Levels</SelectItem>
                                            <SelectItem key="high">High Risk</SelectItem>
                                            <SelectItem key="medium">Medium Risk</SelectItem>
                                            <SelectItem key="low">Low Risk</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Risk Table */}
                                    <Table
                                        aria-label="Employee burnout risk table"
                                        isHeaderSticky
                                        classNames={{
                                            wrapper: 'shadow-none border border-divider rounded-lg',
                                            th: 'bg-default-100 text-default-600 font-semibold',
                                            td: 'py-3',
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                                        </TableHeader>
                                        <TableBody items={filteredRisks} emptyContent={
                                            <div className="py-12 text-center text-default-400">
                                                <HeartIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>No burnout risk data available</p>
                                                <p className="text-xs mt-1">Risk scores are calculated automatically from attendance and workload data</p>
                                            </div>
                                        }>
                                            {(item) => (
                                                <TableRow key={item.employee_id || item.id}>
                                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

WellbeingDashboard.layout = (page) => <App children={page} />;
export default WellbeingDashboard;
