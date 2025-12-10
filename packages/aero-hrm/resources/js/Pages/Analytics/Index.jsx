import React, {useState} from 'react';
import {Head, router} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Spinner,} from "@heroui/react";
import {ArrowDownTrayIcon, CalendarIcon, ChartBarIcon, FunnelIcon,} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import HeadcountWidget from "@/Components/Analytics/HeadcountWidget.jsx";
import TurnoverWidget from "@/Components/Analytics/TurnoverWidget.jsx";
import AttendanceWidget from "@/Components/Analytics/AttendanceWidget.jsx";
import PayrollWidget from "@/Components/Analytics/PayrollWidget.jsx";
import RecruitmentWidget from "@/Components/Analytics/RecruitmentWidget.jsx";

export default function AnalyticsIndex({ title, metrics, departments, filters }) {
    const [selectedDepartment, setSelectedDepartment] = useState(filters?.department_id || '');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleApplyFilters = () => {
        setIsLoading(true);
        router.get(route('hr.analytics.index'), {
            department_id: selectedDepartment,
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const handleResetFilters = () => {
        setSelectedDepartment('');
        setStartDate('');
        setEndDate('');
        setIsLoading(true);
        router.get(route('hr.analytics.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Exporting analytics data...');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col w-full h-full p-4 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <ChartBarIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">HR Analytics Dashboard</h1>
                                    <p className="text-sm text-default-500">
                                        Comprehensive workforce insights and metrics
                                    </p>
                                </div>
                            </div>
                            <Button
                                color="primary"
                                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                onClick={handleExport}
                            >
                                Export Report
                            </Button>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FunnelIcon className="w-5 h-5 text-default-500" />
                                <h3 className="text-lg font-semibold">Filters</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Input
                                    type="date"
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                                />
                                
                                <Input
                                    type="date"
                                    label="End Date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                                />
                                
                                <Select
                                    label="Department"
                                    placeholder="All Departments"
                                    selectedKeys={selectedDepartment ? [selectedDepartment] : []}
                                    onSelectionChange={(keys) => setSelectedDepartment(Array.from(keys)[0] || '')}
                                >
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                
                                <div className="flex gap-2">
                                    <Button
                                        color="primary"
                                        className="flex-1"
                                        onClick={handleApplyFilters}
                                        isLoading={isLoading}
                                    >
                                        Apply
                                    </Button>
                                    <Button
                                        variant="bordered"
                                        onClick={handleResetFilters}
                                        isDisabled={isLoading}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Analytics Widgets */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Headcount & Turnover Row */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HeadcountWidget data={metrics.headcount} />
                            <TurnoverWidget data={metrics.turnover} />
                        </motion.div>

                        {/* Attendance Row */}
                        <motion.div variants={itemVariants}>
                            <AttendanceWidget data={metrics.attendance} />
                        </motion.div>

                        {/* Payroll & Recruitment Row */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PayrollWidget data={metrics.payroll} />
                            <RecruitmentWidget data={metrics.recruitment} />
                        </motion.div>
                    </motion.div>
                )}

                {/* Quick Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <Card>
                        <CardHeader className="pb-2">
                            <h3 className="text-lg font-semibold">Quick Insights</h3>
                        </CardHeader>
                        <CardBody className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-primary/10">
                                    <p className="text-sm text-default-600 mb-2">Workforce Health</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {metrics.turnover.retention_rate >= 90 ? 'Excellent' : 
                                         metrics.turnover.retention_rate >= 80 ? 'Good' : 
                                         metrics.turnover.retention_rate >= 70 ? 'Fair' : 'Needs Attention'}
                                    </p>
                                    <p className="text-xs text-default-500 mt-1">
                                        Retention rate: {metrics.turnover.retention_rate}%
                                    </p>
                                </div>
                                
                                <div className="p-4 rounded-lg bg-success/10">
                                    <p className="text-sm text-default-600 mb-2">Attendance Performance</p>
                                    <p className="text-2xl font-bold text-success">
                                        {metrics.attendance.present_rate >= 95 ? 'Excellent' : 
                                         metrics.attendance.present_rate >= 90 ? 'Good' : 
                                         metrics.attendance.present_rate >= 85 ? 'Fair' : 'Needs Improvement'}
                                    </p>
                                    <p className="text-xs text-default-500 mt-1">
                                        Present rate: {metrics.attendance.present_rate}%
                                    </p>
                                </div>
                                
                                <div className="p-4 rounded-lg bg-secondary/10">
                                    <p className="text-sm text-default-600 mb-2">Recruitment Efficiency</p>
                                    <p className="text-2xl font-bold text-secondary">
                                        {metrics.recruitment.hire_rate >= 20 ? 'High' : 
                                         metrics.recruitment.hire_rate >= 10 ? 'Moderate' : 'Low'}
                                    </p>
                                    <p className="text-xs text-default-500 mt-1">
                                        Hire rate: {metrics.recruitment.hire_rate}%
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
}

AnalyticsIndex.layout = (page) => <App children={page} />;
