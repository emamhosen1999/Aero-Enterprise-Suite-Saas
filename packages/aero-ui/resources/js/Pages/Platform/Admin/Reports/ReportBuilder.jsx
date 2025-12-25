import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Checkbox,
    Switch,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
    Divider,
    Skeleton,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Slider,
} from '@heroui/react';
import {
    PlusIcon,
    DocumentChartBarIcon,
    CalendarIcon,
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    ClockIcon,
    PlayIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    PencilIcon,
    EyeIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

// Theme utilities
const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};

const getCardStyle = () => ({
    background: `linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 20%, 
        var(--theme-content2, #F4F4F5) 10%, 
        var(--theme-content3, #F1F3F4) 20%)`,
    borderColor: `var(--theme-divider, #E4E4E7)`,
    borderWidth: `var(--borderWidth, 2px)`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
});

const ReportBuilder = ({ savedReports: initialReports = [], templates: initialTemplates = [] }) => {
    const [themeRadius, setThemeRadius] = useState('lg');
    const [activeTab, setActiveTab] = useState('builder');
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Report configuration
    const [reportConfig, setReportConfig] = useState({
        name: '',
        description: '',
        type: 'revenue',
        dateRange: {
            preset: '30',
            customStart: '',
            customEnd: '',
            comparison: false,
        },
        metrics: [],
        filters: [],
        groupBy: [],
        aggregateBy: 'sum',
        visualization: {
            type: 'line',
            showTrendLines: true,
            showDataLabels: false,
            showLegend: true,
            colorScheme: 'default',
        },
        schedule: {
            enabled: false,
            frequency: 'weekly',
            dayOfWeek: 'monday',
            dayOfMonth: 1,
            time: '09:00',
            recipients: [],
            formats: ['pdf'],
        },
        visibility: 'private',
    });

    // Preview data
    const [previewData, setPreviewData] = useState(null);

    // Saved reports
    const [savedReports, setSavedReports] = useState(initialReports);
    const [templates, setTemplates] = useState(initialTemplates);

    // Modal states
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // Initialize theme
    useEffect(() => {
        setThemeRadius(getThemeRadius());
        const handleResize = () => setThemeRadius(getThemeRadius());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Report type options
    const reportTypes = [
        { key: 'revenue', label: 'Revenue Report', description: 'MRR, ARR, trends, forecasting' },
        { key: 'subscription', label: 'Subscription Report', description: 'Signups, cancellations, conversions' },
        { key: 'cohort', label: 'Cohort Analysis', description: 'Retention, lifecycle analysis' },
        { key: 'plan_performance', label: 'Plan Performance', description: 'Per-plan metrics, distribution' },
        { key: 'customer_analytics', label: 'Customer Analytics', description: 'ARPU, LTV, segments' },
        { key: 'usage', label: 'Usage Report', description: 'Quota utilization, feature adoption' },
    ];

    // Metrics by category
    const metricCategories = {
        revenue: [
            'Total Revenue', 'MRR', 'ARR', 'ARPU', 'LTV', 'Average Order Value', 'Revenue Growth Rate',
            'Revenue Per Customer', 'Revenue Per Subscription', 'Gross Margin', 'Net Revenue',
            'Recurring Revenue', 'One-time Revenue', 'Refunds', 'Discounts Applied',
        ],
        subscription: [
            'Active Subscriptions', 'New Subscriptions', 'Cancelled Subscriptions', 'Trial Conversions',
            'Upgrade Count', 'Downgrade Count', 'Churn Rate', 'Retention Rate', 'Growth Rate',
            'Net Subscriber Growth', 'Trial Signups', 'Expired Trials',
        ],
        user: [
            'Total Users', 'Active Users', 'New Users', 'Inactive Users', 'User Growth Rate',
            'Users Per Plan', 'Login Frequency', 'Session Duration', 'User Engagement Score',
            'Last Active Date',
        ],
        quota: [
            'Storage Used', 'Storage Limit', 'API Calls Made', 'API Calls Limit',
            'Users Count', 'Users Limit', 'Employees Count', 'Projects Count',
        ],
        engagement: [
            'Feature Usage', 'Module Access Count', 'Page Views', 'Time on Platform',
            'Actions Performed', 'API Requests',
        ],
    };

    // Aggregate functions
    const aggregateFunctions = [
        { key: 'sum', label: 'Sum' },
        { key: 'average', label: 'Average' },
        { key: 'count', label: 'Count' },
        { key: 'min', label: 'Minimum' },
        { key: 'max', label: 'Maximum' },
        { key: 'median', label: 'Median' },
        { key: 'percentile', label: 'Percentile (P90)' },
    ];

    // Visualization types
    const visualizationTypes = [
        { key: 'line', label: 'Line Chart' },
        { key: 'bar', label: 'Bar Chart' },
        { key: 'horizontal_bar', label: 'Horizontal Bar' },
        { key: 'pie', label: 'Pie Chart' },
        { key: 'donut', label: 'Donut Chart' },
        { key: 'area', label: 'Area Chart' },
        { key: 'stacked_bar', label: 'Stacked Bar' },
        { key: 'stacked_area', label: 'Stacked Area' },
        { key: 'table', label: 'Table' },
    ];

    // Handle metric selection
    const toggleMetric = (metric) => {
        setReportConfig(prev => ({
            ...prev,
            metrics: prev.metrics.includes(metric)
                ? prev.metrics.filter(m => m !== metric)
                : [...prev.metrics, metric]
        }));
    };

    const selectAllMetrics = (category) => {
        const categoryMetrics = metricCategories[category];
        setReportConfig(prev => ({
            ...prev,
            metrics: [...new Set([...prev.metrics, ...categoryMetrics])]
        }));
    };

    const clearCategoryMetrics = (category) => {
        const categoryMetrics = metricCategories[category];
        setReportConfig(prev => ({
            ...prev,
            metrics: prev.metrics.filter(m => !categoryMetrics.includes(m))
        }));
    };

    // Generate preview
    const generatePreview = async () => {
        if (reportConfig.metrics.length === 0) {
            showToast.error('Please select at least one metric');
            return;
        }

        setPreviewLoading(true);
        try {
            const response = await axios.post(route('admin.reports.generate'), {
                config: reportConfig,
                preview: true,
            });
            setPreviewData(response.data);
        } catch (error) {
            showToast.error('Failed to generate preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    // Save report
    const saveReport = async () => {
        if (!reportConfig.name) {
            showToast.error('Please enter a report name');
            return;
        }

        const promise = axios.post(route('admin.reports.store'), reportConfig);

        showToast.promise(promise, {
            loading: 'Saving report...',
            success: (response) => {
                setSavedReports([...savedReports, response.data.report]);
                setSaveModalOpen(false);
                setReportConfig({
                    ...reportConfig,
                    name: '',
                    description: '',
                });
                return 'Report saved successfully';
            },
            error: 'Failed to save report',
        });
    };

    // Load template
    const loadTemplate = (template) => {
        setReportConfig({
            ...reportConfig,
            ...template.config,
            name: `${template.name} (Copy)`,
        });
        setTemplateModalOpen(false);
        showToast.success(`Template "${template.name}" loaded`);
    };

    // Run saved report
    const runReport = async (reportId) => {
        const promise = axios.post(route('admin.reports.run', reportId));

        showToast.promise(promise, {
            loading: 'Generating report...',
            success: 'Report generated successfully',
            error: 'Failed to generate report',
        });
    };

    // Delete saved report
    const deleteReport = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        const promise = axios.delete(route('admin.reports.destroy', reportId));

        showToast.promise(promise, {
            loading: 'Deleting report...',
            success: () => {
                setSavedReports(savedReports.filter(r => r.id !== reportId));
                return 'Report deleted successfully';
            },
            error: 'Failed to delete report',
        });
    };

    // Duplicate report
    const duplicateReport = async (reportId) => {
        const promise = axios.post(route('admin.reports.duplicate', reportId));

        showToast.promise(promise, {
            loading: 'Duplicating report...',
            success: (response) => {
                setSavedReports([...savedReports, response.data.report]);
                return 'Report duplicated successfully';
            },
            error: 'Failed to duplicate report',
        });
    };

    return (
        <>
            <Head title="Report Builder" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Custom Report Builder</h1>
                        <p className="text-sm text-default-500 mt-1">
                            Create, schedule, and manage custom reports
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            color="default"
                            variant="flat"
                            startContent={<DocumentChartBarIcon className="w-5 h-5" />}
                            onPress={() => setTemplateModalOpen(true)}
                            radius={themeRadius}
                        >
                            Load Template
                        </Button>
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            onPress={() => setSaveModalOpen(true)}
                            isDisabled={reportConfig.metrics.length === 0}
                            radius={themeRadius}
                        >
                            Save Report
                        </Button>
                    </div>
                </div>

                {/* Main Tabs */}
                <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={setActiveTab}
                    radius={themeRadius}
                    classNames={{
                        tabList: "w-full",
                        tab: "min-w-[150px]",
                    }}
                >
                    <Tab key="builder" title="Report Builder">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            {/* Configuration Panel */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Report Type */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Report Type</h3>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {reportTypes.map((type) => (
                                                <Card
                                                    key={type.key}
                                                    isPressable
                                                    isHoverable
                                                    className={`${
                                                        reportConfig.type === type.key
                                                            ? 'border-2 border-primary'
                                                            : 'border-2 border-transparent'
                                                    }`}
                                                    onPress={() => setReportConfig({ ...reportConfig, type: type.key })}
                                                >
                                                    <CardBody className="p-3">
                                                        <div className="font-medium">{type.label}</div>
                                                        <div className="text-xs text-default-500 mt-1">
                                                            {type.description}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Date Range */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Date Range</h3>
                                    </CardHeader>
                                    <CardBody className="p-4 space-y-4">
                                        <Select
                                            label="Preset Range"
                                            selectedKeys={[reportConfig.dateRange.preset]}
                                            onSelectionChange={(keys) =>
                                                setReportConfig({
                                                    ...reportConfig,
                                                    dateRange: { ...reportConfig.dateRange, preset: Array.from(keys)[0] },
                                                })
                                            }
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="7">Last 7 days</SelectItem>
                                            <SelectItem key="30">Last 30 days</SelectItem>
                                            <SelectItem key="90">Last 90 days</SelectItem>
                                            <SelectItem key="180">Last 6 months</SelectItem>
                                            <SelectItem key="365">Last 12 months</SelectItem>
                                            <SelectItem key="ytd">Year to date</SelectItem>
                                            <SelectItem key="qtd">Quarter to date</SelectItem>
                                            <SelectItem key="all">All time</SelectItem>
                                            <SelectItem key="custom">Custom range</SelectItem>
                                        </Select>

                                        {reportConfig.dateRange.preset === 'custom' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    type="date"
                                                    label="Start Date"
                                                    value={reportConfig.dateRange.customStart}
                                                    onChange={(e) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            dateRange: { ...reportConfig.dateRange, customStart: e.target.value },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                />
                                                <Input
                                                    type="date"
                                                    label="End Date"
                                                    value={reportConfig.dateRange.customEnd}
                                                    onChange={(e) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            dateRange: { ...reportConfig.dateRange, customEnd: e.target.value },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                />
                                            </div>
                                        )}

                                        <Switch
                                            isSelected={reportConfig.dateRange.comparison}
                                            onValueChange={(val) =>
                                                setReportConfig({
                                                    ...reportConfig,
                                                    dateRange: { ...reportConfig.dateRange, comparison: val },
                                                })
                                            }
                                        >
                                            Compare with previous period
                                        </Switch>
                                    </CardBody>
                                </Card>

                                {/* Metrics Selection */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4 flex justify-between items-center">
                                        <h3 className="font-semibold">
                                            Select Metrics
                                            <Chip size="sm" className="ml-2">
                                                {reportConfig.metrics.length} selected
                                            </Chip>
                                        </h3>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <Tabs radius={themeRadius}>
                                            {Object.entries(metricCategories).map(([category, metrics]) => (
                                                <Tab key={category} title={category.charAt(0).toUpperCase() + category.slice(1)}>
                                                    <div className="space-y-3 mt-4">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                onPress={() => selectAllMetrics(category)}
                                                                radius={themeRadius}
                                                            >
                                                                Select All
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                onPress={() => clearCategoryMetrics(category)}
                                                                radius={themeRadius}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {metrics.map((metric) => (
                                                                <Checkbox
                                                                    key={metric}
                                                                    isSelected={reportConfig.metrics.includes(metric)}
                                                                    onValueChange={() => toggleMetric(metric)}
                                                                    size="sm"
                                                                >
                                                                    {metric}
                                                                </Checkbox>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Tab>
                                            ))}
                                        </Tabs>
                                    </CardBody>
                                </Card>

                                {/* Grouping & Aggregation */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Grouping & Aggregation</h3>
                                    </CardHeader>
                                    <CardBody className="p-4 space-y-4">
                                        <Select
                                            label="Group By"
                                            selectionMode="multiple"
                                            selectedKeys={reportConfig.groupBy}
                                            onSelectionChange={(keys) =>
                                                setReportConfig({ ...reportConfig, groupBy: Array.from(keys) })
                                            }
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="day">Day</SelectItem>
                                            <SelectItem key="week">Week</SelectItem>
                                            <SelectItem key="month">Month</SelectItem>
                                            <SelectItem key="quarter">Quarter</SelectItem>
                                            <SelectItem key="year">Year</SelectItem>
                                            <SelectItem key="plan">Plan</SelectItem>
                                            <SelectItem key="currency">Currency</SelectItem>
                                            <SelectItem key="tenant">Tenant</SelectItem>
                                        </Select>

                                        <Select
                                            label="Aggregate Function"
                                            selectedKeys={[reportConfig.aggregateBy]}
                                            onSelectionChange={(keys) =>
                                                setReportConfig({ ...reportConfig, aggregateBy: Array.from(keys)[0] })
                                            }
                                            radius={themeRadius}
                                        >
                                            {aggregateFunctions.map((func) => (
                                                <SelectItem key={func.key}>{func.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </CardBody>
                                </Card>

                                {/* Visualization */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Visualization</h3>
                                    </CardHeader>
                                    <CardBody className="p-4 space-y-4">
                                        <Select
                                            label="Chart Type"
                                            selectedKeys={[reportConfig.visualization.type]}
                                            onSelectionChange={(keys) =>
                                                setReportConfig({
                                                    ...reportConfig,
                                                    visualization: {
                                                        ...reportConfig.visualization,
                                                        type: Array.from(keys)[0],
                                                    },
                                                })
                                            }
                                            radius={themeRadius}
                                        >
                                            {visualizationTypes.map((viz) => (
                                                <SelectItem key={viz.key}>{viz.label}</SelectItem>
                                            ))}
                                        </Select>

                                        <div className="space-y-2">
                                            <Switch
                                                isSelected={reportConfig.visualization.showTrendLines}
                                                onValueChange={(val) =>
                                                    setReportConfig({
                                                        ...reportConfig,
                                                        visualization: { ...reportConfig.visualization, showTrendLines: val },
                                                    })
                                                }
                                                size="sm"
                                            >
                                                Show trend lines
                                            </Switch>

                                            <Switch
                                                isSelected={reportConfig.visualization.showDataLabels}
                                                onValueChange={(val) =>
                                                    setReportConfig({
                                                        ...reportConfig,
                                                        visualization: { ...reportConfig.visualization, showDataLabels: val },
                                                    })
                                                }
                                                size="sm"
                                            >
                                                Show data labels
                                            </Switch>

                                            <Switch
                                                isSelected={reportConfig.visualization.showLegend}
                                                onValueChange={(val) =>
                                                    setReportConfig({
                                                        ...reportConfig,
                                                        visualization: { ...reportConfig.visualization, showLegend: val },
                                                    })
                                                }
                                                size="sm"
                                            >
                                                Show legend
                                            </Switch>
                                        </div>

                                        <Select
                                            label="Color Scheme"
                                            selectedKeys={[reportConfig.visualization.colorScheme]}
                                            onSelectionChange={(keys) =>
                                                setReportConfig({
                                                    ...reportConfig,
                                                    visualization: {
                                                        ...reportConfig.visualization,
                                                        colorScheme: Array.from(keys)[0],
                                                    },
                                                })
                                            }
                                            radius={themeRadius}
                                        >
                                            <SelectItem key="default">Default</SelectItem>
                                            <SelectItem key="vibrant">Vibrant</SelectItem>
                                            <SelectItem key="monochrome">Monochrome</SelectItem>
                                            <SelectItem key="custom">Custom</SelectItem>
                                        </Select>
                                    </CardBody>
                                </Card>

                                {/* Schedule Configuration */}
                                <Card style={getCardStyle()}>
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Schedule Delivery</h3>
                                    </CardHeader>
                                    <CardBody className="p-4 space-y-4">
                                        <Switch
                                            isSelected={reportConfig.schedule.enabled}
                                            onValueChange={(val) =>
                                                setReportConfig({
                                                    ...reportConfig,
                                                    schedule: { ...reportConfig.schedule, enabled: val },
                                                })
                                            }
                                        >
                                            Enable scheduled delivery
                                        </Switch>

                                        {reportConfig.schedule.enabled && (
                                            <>
                                                <Select
                                                    label="Frequency"
                                                    selectedKeys={[reportConfig.schedule.frequency]}
                                                    onSelectionChange={(keys) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            schedule: { ...reportConfig.schedule, frequency: Array.from(keys)[0] },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="daily">Daily</SelectItem>
                                                    <SelectItem key="weekly">Weekly</SelectItem>
                                                    <SelectItem key="monthly">Monthly</SelectItem>
                                                    <SelectItem key="custom">Custom (Cron)</SelectItem>
                                                </Select>

                                                {reportConfig.schedule.frequency === 'weekly' && (
                                                    <Select
                                                        label="Day of Week"
                                                        selectedKeys={[reportConfig.schedule.dayOfWeek]}
                                                        onSelectionChange={(keys) =>
                                                            setReportConfig({
                                                                ...reportConfig,
                                                                schedule: {
                                                                    ...reportConfig.schedule,
                                                                    dayOfWeek: Array.from(keys)[0],
                                                                },
                                                            })
                                                        }
                                                        radius={themeRadius}
                                                    >
                                                        <SelectItem key="monday">Monday</SelectItem>
                                                        <SelectItem key="tuesday">Tuesday</SelectItem>
                                                        <SelectItem key="wednesday">Wednesday</SelectItem>
                                                        <SelectItem key="thursday">Thursday</SelectItem>
                                                        <SelectItem key="friday">Friday</SelectItem>
                                                        <SelectItem key="saturday">Saturday</SelectItem>
                                                        <SelectItem key="sunday">Sunday</SelectItem>
                                                    </Select>
                                                )}

                                                {reportConfig.schedule.frequency === 'monthly' && (
                                                    <Input
                                                        type="number"
                                                        label="Day of Month"
                                                        min="1"
                                                        max="31"
                                                        value={reportConfig.schedule.dayOfMonth}
                                                        onChange={(e) =>
                                                            setReportConfig({
                                                                ...reportConfig,
                                                                schedule: {
                                                                    ...reportConfig.schedule,
                                                                    dayOfMonth: parseInt(e.target.value),
                                                                },
                                                            })
                                                        }
                                                        radius={themeRadius}
                                                    />
                                                )}

                                                <Input
                                                    type="time"
                                                    label="Time"
                                                    value={reportConfig.schedule.time}
                                                    onChange={(e) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            schedule: { ...reportConfig.schedule, time: e.target.value },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                />

                                                <Textarea
                                                    label="Email Recipients"
                                                    placeholder="Enter email addresses (comma separated)"
                                                    value={reportConfig.schedule.recipients.join(', ')}
                                                    onChange={(e) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            schedule: {
                                                                ...reportConfig.schedule,
                                                                recipients: e.target.value
                                                                    .split(',')
                                                                    .map((email) => email.trim())
                                                                    .filter((email) => email),
                                                            },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                />

                                                <Select
                                                    label="Export Formats"
                                                    selectionMode="multiple"
                                                    selectedKeys={reportConfig.schedule.formats}
                                                    onSelectionChange={(keys) =>
                                                        setReportConfig({
                                                            ...reportConfig,
                                                            schedule: { ...reportConfig.schedule, formats: Array.from(keys) },
                                                        })
                                                    }
                                                    radius={themeRadius}
                                                >
                                                    <SelectItem key="pdf">PDF</SelectItem>
                                                    <SelectItem key="csv">CSV</SelectItem>
                                                    <SelectItem key="excel">Excel</SelectItem>
                                                    <SelectItem key="json">JSON</SelectItem>
                                                </Select>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Preview Panel */}
                            <div className="lg:col-span-1">
                                <Card style={getCardStyle()} className="sticky top-4">
                                    <CardHeader className="border-b border-divider p-4">
                                        <h3 className="font-semibold">Preview</h3>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <div className="space-y-4">
                                            <Button
                                                fullWidth
                                                color="primary"
                                                startContent={<EyeIcon className="w-5 h-5" />}
                                                onPress={generatePreview}
                                                isLoading={previewLoading}
                                                isDisabled={reportConfig.metrics.length === 0}
                                                radius={themeRadius}
                                            >
                                                Generate Preview
                                            </Button>

                                            {previewLoading ? (
                                                <div className="space-y-3">
                                                    <Skeleton className="h-32 w-full rounded" />
                                                    <Skeleton className="h-20 w-full rounded" />
                                                    <Skeleton className="h-20 w-full rounded" />
                                                </div>
                                            ) : previewData ? (
                                                <div className="space-y-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium mb-2">Report Summary</div>
                                                        <div className="space-y-1 text-default-500">
                                                            <div>Type: {reportConfig.type}</div>
                                                            <div>Metrics: {reportConfig.metrics.length}</div>
                                                            <div>Period: {reportConfig.dateRange.preset}</div>
                                                            <div>Records: {previewData.recordCount || 0}</div>
                                                        </div>
                                                    </div>

                                                    <Divider />

                                                    <div className="text-xs text-default-500">
                                                        <div className="font-medium mb-2">Sample Data</div>
                                                        <pre className="bg-default-100 p-2 rounded overflow-auto max-h-48">
                                                            {JSON.stringify(previewData.sample, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-sm text-default-500 py-8">
                                                    Configure your report and click "Generate Preview" to see a sample
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </Tab>

                    <Tab key="saved" title="Saved Reports">
                        <div className="mt-6">
                            <Card style={getCardStyle()}>
                                <CardBody className="p-4">
                                    {savedReports.length === 0 ? (
                                        <div className="text-center py-12">
                                            <DocumentChartBarIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                            <p className="text-default-500">No saved reports yet</p>
                                            <p className="text-sm text-default-400 mt-1">
                                                Create your first report using the Report Builder
                                            </p>
                                        </div>
                                    ) : (
                                        <Table aria-label="Saved reports" radius={themeRadius}>
                                            <TableHeader>
                                                <TableColumn>NAME</TableColumn>
                                                <TableColumn>TYPE</TableColumn>
                                                <TableColumn>SCHEDULE</TableColumn>
                                                <TableColumn>LAST RUN</TableColumn>
                                                <TableColumn>ACTIONS</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {savedReports.map((report) => (
                                                    <TableRow key={report.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{report.name}</div>
                                                            <div className="text-xs text-default-500">{report.description}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip size="sm" variant="flat">
                                                                {report.type}
                                                            </Chip>
                                                        </TableCell>
                                                        <TableCell>
                                                            {report.schedule?.enabled ? (
                                                                <Chip size="sm" color="success" variant="flat">
                                                                    {report.schedule.frequency}
                                                                </Chip>
                                                            ) : (
                                                                <Chip size="sm" variant="flat">
                                                                    Manual
                                                                </Chip>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-default-500">
                                                            {report.last_run_at || 'Never'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Dropdown radius={themeRadius}>
                                                                <DropdownTrigger>
                                                                    <Button isIconOnly size="sm" variant="light">
                                                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                                                    </Button>
                                                                </DropdownTrigger>
                                                                <DropdownMenu aria-label="Report actions">
                                                                    <DropdownItem
                                                                        key="run"
                                                                        startContent={<PlayIcon className="w-4 h-4" />}
                                                                        onPress={() => runReport(report.id)}
                                                                    >
                                                                        Run Now
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="edit"
                                                                        startContent={<PencilIcon className="w-4 h-4" />}
                                                                        onPress={() => router.visit(route('admin.reports.edit', report.id))}
                                                                    >
                                                                        Edit
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="duplicate"
                                                                        startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                                                        onPress={() => duplicateReport(report.id)}
                                                                    >
                                                                        Duplicate
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="delete"
                                                                        className="text-danger"
                                                                        color="danger"
                                                                        startContent={<TrashIcon className="w-4 h-4" />}
                                                                        onPress={() => deleteReport(report.id)}
                                                                    >
                                                                        Delete
                                                                    </DropdownItem>
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    </Tab>
                </Tabs>
            </div>

            {/* Save Modal */}
            <Modal
                isOpen={saveModalOpen}
                onOpenChange={setSaveModalOpen}
                size="lg"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader>Save Report</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="Report Name"
                                placeholder="Enter report name"
                                value={reportConfig.name}
                                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                                isRequired
                                radius={themeRadius}
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter report description"
                                value={reportConfig.description}
                                onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                                radius={themeRadius}
                            />

                            <Select
                                label="Visibility"
                                selectedKeys={[reportConfig.visibility]}
                                onSelectionChange={(keys) =>
                                    setReportConfig({ ...reportConfig, visibility: Array.from(keys)[0] })
                                }
                                radius={themeRadius}
                            >
                                <SelectItem key="private">Private (Only me)</SelectItem>
                                <SelectItem key="team">Team</SelectItem>
                                <SelectItem key="organization">Organization</SelectItem>
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setSaveModalOpen(false)} radius={themeRadius}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={saveReport} radius={themeRadius}>
                            Save Report
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Template Modal */}
            <Modal
                isOpen={templateModalOpen}
                onOpenChange={setTemplateModalOpen}
                size="2xl"
                scrollBehavior="inside"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader>Load Report Template</ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <Card
                                    key={template.id}
                                    isPressable
                                    isHoverable
                                    onPress={() => loadTemplate(template)}
                                >
                                    <CardBody className="p-4">
                                        <div className="font-medium">{template.name}</div>
                                        <div className="text-sm text-default-500 mt-1">{template.description}</div>
                                        <div className="flex gap-2 mt-3">
                                            <Chip size="sm" variant="flat">
                                                {template.type}
                                            </Chip>
                                            <Chip size="sm" variant="flat" color="primary">
                                                {template.metrics?.length || 0} metrics
                                            </Chip>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setTemplateModalOpen(false)} radius={themeRadius}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ReportBuilder;
