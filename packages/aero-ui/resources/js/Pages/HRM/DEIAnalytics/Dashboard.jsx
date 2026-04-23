import React, { useMemo, useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tabs,
    Tab,
} from '@heroui/react';
import {
    UserGroupIcon,
    ScaleIcon,
    BanknotesIcon,
    BuildingOfficeIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    UsersIcon,
    CurrencyDollarIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

// ─── colour mappings ──────────────────────────────────────────────────────────

const genderColorMap = {
    female: 'success',
    male: 'primary',
    other: 'secondary',
    'non-binary': 'secondary',
    unknown: 'default',
};

const ageColorMap = {
    'under 25': 'primary',
    '25-34': 'success',
    '35-44': 'warning',
    '45-54': 'secondary',
    '55+': 'default',
};

const resolveGenderColor = (label = '') =>
    genderColorMap[label.toLowerCase()] ?? 'default';

const resolveAgeColor = (label = '') => {
    const lower = label.toLowerCase();
    for (const [key, val] of Object.entries(ageColorMap)) {
        if (lower.includes(key)) return val;
    }
    return 'default';
};

// ─── sub-components ───────────────────────────────────────────────────────────

const DistributionBar = ({ entry, color }) => (
    <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-sm text-default-600 truncate">{entry.label}</span>
        <div className="flex-1">
            <Progress
                value={entry.percentage}
                color={color}
                size="md"
                radius="full"
                aria-label={`${entry.label}: ${entry.percentage}%`}
            />
        </div>
        <span className="w-10 text-right text-sm font-medium">{entry.count}</span>
        <span className="w-14 text-right text-sm text-default-500">
            {Number(entry.percentage).toFixed(1)}%
        </span>
    </div>
);

const EmptyState = ({ message = 'No data available' }) => (
    <div className="flex flex-col items-center justify-center py-16 text-default-400 gap-3">
        <ChartBarIcon className="w-12 h-12" />
        <p className="text-sm">{message}</p>
    </div>
);

// ─── main component ───────────────────────────────────────────────────────────

const DEIAnalyticsDashboard = ({
    title,
    genderDistribution = [],
    ageDistribution = [],
    departmentMatrix = [],
    hiringTrends = [],
    payEquityData = [],
    summaryStats = {},
    error = null,
}) => {
    const themeRadius = useThemeRadius();
    const { canUpdate, isSuperAdmin } = useHRMAC();

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

    // ── permission
    const canManageDEI = canUpdate('hrm.dei-analytics') || isSuperAdmin();

    // ── stats
    const {
        total_employees = 0,
        gender_parity_index = 0,
        departments_with_data = 0,
        pay_gap_percentage = 0,
    } = summaryStats;

    const statsData = useMemo(() => [
        {
            title: 'Total Employees',
            value: total_employees,
            icon: <UserGroupIcon />,
            color: 'text-primary',
            iconBg: 'bg-primary/20',
            description: 'Across all departments',
        },
        {
            title: 'Gender Parity Index',
            value: `${(gender_parity_index * 100).toFixed(1)}%`,
            icon: <ScaleIcon />,
            color: gender_parity_index >= 0.8 ? 'text-success' : 'text-warning',
            iconBg: gender_parity_index >= 0.8 ? 'bg-success/20' : 'bg-warning/20',
            description: gender_parity_index >= 0.8 ? 'Good balance' : 'Needs improvement',
        },
        {
            title: 'Pay Gap',
            value: `${Number(pay_gap_percentage).toFixed(1)}%`,
            icon: <BanknotesIcon />,
            color: pay_gap_percentage > 5 ? 'text-warning' : 'text-success',
            iconBg: pay_gap_percentage > 5 ? 'bg-warning/20' : 'bg-success/20',
            description: pay_gap_percentage > 5 ? 'Action recommended' : 'Within target',
        },
        {
            title: 'Depts Tracked',
            value: departments_with_data,
            icon: <BuildingOfficeIcon />,
            color: 'text-secondary',
            iconBg: 'bg-secondary/20',
            description: 'Departments with DEI data',
        },
    ], [total_employees, gender_parity_index, pay_gap_percentage, departments_with_data]);

    // ── pay equity derived values
    const maxSalary = useMemo(
        () => Math.max(0, ...payEquityData.map((r) => r.avg_salary ?? 0)),
        [payEquityData],
    );

    // ── department matrix columns
    const genderColumns = useMemo(() => {
        const cols = new Set();
        departmentMatrix.forEach((row) => {
            if (row.gender_breakdown && typeof row.gender_breakdown === 'object') {
                Object.keys(row.gender_breakdown).forEach((k) => cols.add(k));
            }
        });
        return Array.from(cols);
    }, [departmentMatrix]);

    // ── tab content renderers ─────────────────────────────────────────────────

    const renderGenderTab = () => (
        <div className="space-y-3">
            {genderDistribution.length === 0 ? (
                <EmptyState message="No gender distribution data available" />
            ) : (
                genderDistribution.map((entry) => (
                    <DistributionBar
                        key={entry.label}
                        entry={entry}
                        color={resolveGenderColor(entry.label)}
                    />
                ))
            )}
        </div>
    );

    const renderAgeTab = () => (
        <div className="space-y-3">
            {ageDistribution.length === 0 ? (
                <EmptyState message="No age distribution data available" />
            ) : (
                ageDistribution.map((entry) => (
                    <DistributionBar
                        key={entry.label}
                        entry={entry}
                        color={resolveAgeColor(entry.label)}
                    />
                ))
            )}
        </div>
    );

    const renderPayEquityTab = () => (
        <div className="space-y-4">
            {/* Pay-gap badge */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-default-500">Current pay gap:</span>
                <Chip
                    color={pay_gap_percentage > 5 ? 'warning' : 'success'}
                    variant="flat"
                    size="sm"
                    startContent={<BanknotesIcon className="w-3 h-3" />}
                >
                    {Number(pay_gap_percentage).toFixed(1)}%
                </Chip>
            </div>

            {payEquityData.length === 0 ? (
                <EmptyState message="No pay equity data available" />
            ) : (
                <Table
                    aria-label="Pay equity by gender"
                    isHeaderSticky
                    classNames={{
                        wrapper: 'shadow-none border border-divider rounded-lg',
                        th: 'bg-content2 text-default-600 font-semibold',
                        td: 'py-3',
                    }}
                    radius={themeRadius}
                >
                    <TableHeader>
                        <TableColumn>Gender</TableColumn>
                        <TableColumn>Avg Salary</TableColumn>
                        <TableColumn>Employees</TableColumn>
                        <TableColumn>vs. Highest</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={payEquityData}
                        emptyContent="No pay equity data"
                    >
                        {(row) => {
                            const isLowest = row.avg_salary === Math.min(...payEquityData.map((r) => r.avg_salary));
                            const vsHighest = maxSalary > 0
                                ? ((row.avg_salary / maxSalary) * 100).toFixed(1)
                                : '0.0';
                            return (
                                <TableRow key={row.gender}>
                                    <TableCell>
                                        <span className="font-medium capitalize">{row.gender}</span>
                                    </TableCell>
                                    <TableCell className={isLowest ? 'text-danger font-medium' : ''}>
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                            maximumFractionDigits: 0,
                                        }).format(row.avg_salary)}
                                    </TableCell>
                                    <TableCell>{row.employee_count}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={parseFloat(vsHighest)}
                                                color={isLowest ? 'danger' : 'success'}
                                                size="sm"
                                                className="w-20"
                                                aria-label={`${vsHighest}% of highest`}
                                            />
                                            <span className="text-sm text-default-500">{vsHighest}%</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        }}
                    </TableBody>
                </Table>
            )}
        </div>
    );

    const renderDepartmentMatrixTab = () => (
        <div>
            {departmentMatrix.length === 0 ? (
                <EmptyState message="No department data available" />
            ) : (
                <Table
                    aria-label="Department diversity matrix"
                    isHeaderSticky
                    classNames={{
                        wrapper: 'shadow-none border border-divider rounded-lg',
                        th: 'bg-content2 text-default-600 font-semibold',
                        td: 'py-3',
                    }}
                    radius={themeRadius}
                >
                    <TableHeader>
                        <TableColumn>Department</TableColumn>
                        <TableColumn>Total</TableColumn>
                        {genderColumns.map((col) => (
                            <TableColumn key={col} className="capitalize">{col}</TableColumn>
                        ))}
                    </TableHeader>
                    <TableBody
                        items={departmentMatrix}
                        emptyContent="No department data available"
                    >
                        {(row) => (
                            <TableRow key={row.department}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <BuildingLibraryIcon className="w-4 h-4 text-default-400 shrink-0" />
                                        <span className="font-medium">{row.department}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Chip size="sm" variant="flat" color="primary">{row.total}</Chip>
                                </TableCell>
                                {genderColumns.map((col) => (
                                    <TableCell key={col}>
                                        {row.gender_breakdown?.[col] ?? 0}
                                    </TableCell>
                                ))}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );

    // ── tabs definition
    const tabItems = useMemo(() => [
        {
            key: 'gender',
            label: 'Gender Distribution',
            icon: <UsersIcon className="w-4 h-4" />,
            content: renderGenderTab,
        },
        {
            key: 'age',
            label: 'Age Distribution',
            icon: <UserGroupIcon className="w-4 h-4" />,
            content: renderAgeTab,
        },
        {
            key: 'pay-equity',
            label: 'Pay Equity',
            icon: <CurrencyDollarIcon className="w-4 h-4" />,
            content: renderPayEquityTab,
        },
        {
            key: 'department-matrix',
            label: 'Department Matrix',
            icon: <BuildingOfficeIcon className="w-4 h-4" />,
            content: renderDepartmentMatrixTab,
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [genderDistribution, ageDistribution, payEquityData, departmentMatrix, maxSalary, genderColumns, pay_gap_percentage, themeRadius, isMobile]);

    // ── content slot for StandardPageLayout
    const contentNode = (
        <div className="space-y-4">
            {/* Error banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card
                        classNames={{ base: 'border-warning' }}
                        style={{
                            border: `var(--borderWidth, 2px) solid`,
                            borderColor: 'var(--heroui-warning)',
                            borderRadius: `var(--borderRadius, 12px)`,
                        }}
                    >
                        <CardBody className="py-3 px-4">
                            <div className="flex items-center gap-2 text-warning">
                                <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}

            {/* Tabs */}
            <Tabs
                aria-label="DEI analytics views"
                color="primary"
                variant="underlined"
                radius={themeRadius}
                classNames={{
                    tabList: 'gap-4 border-b border-divider pb-0',
                    tab: 'px-2 pb-3',
                    panel: 'pt-4',
                }}
            >
                {tabItems.map((tab) => (
                    <Tab
                        key={tab.key}
                        title={
                            <div className="flex items-center gap-2">
                                {tab.icon}
                                {!isMobile && <span>{tab.label}</span>}
                            </div>
                        }
                    >
                        {tab.content()}
                    </Tab>
                ))}
            </Tabs>
        </div>
    );

    return (
        <>
            <Head title={title} />

            <StandardPageLayout
                title="DEI Analytics"
                subtitle="Diversity, Equity & Inclusion workforce insights"
                icon={<ScaleIcon />}
                stats={<StatsCards stats={statsData} />}
                ariaLabel="DEI Analytics Dashboard"
            >
                {contentNode}
            </StandardPageLayout>
        </>
    );
};

DEIAnalyticsDashboard.layout = (page) => <App children={page} />;
export default DEIAnalyticsDashboard;
