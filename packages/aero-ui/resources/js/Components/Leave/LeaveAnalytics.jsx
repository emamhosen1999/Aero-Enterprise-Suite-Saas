import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Skeleton } from '@heroui/react';
import { 
    ChartBarIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { route } from 'ziggy-js';

export default function LeaveAnalytics({ year, departmentId, departments = [] }) {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedDepartment, setSelectedDepartment] = useState(departmentId || '');

    useEffect(() => {
        fetchAnalytics();
    }, [selectedYear, selectedDepartment]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('leaves.analytics'), {
                params: {
                    year: selectedYear,
                    department_id: selectedDepartment || undefined
                }
            });

            if (response.data.success) {
                setAnalytics(response.data.analytics);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - i);
    }, []);

    const getMonthName = (monthStr) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthStr || '';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardBody className="p-6">
                            <Skeleton className="w-full h-64 rounded" />
                        </CardBody>
                    </Card>
                ))}
            </div>
        );
    }

    if (!analytics) {
        return (
            <Card>
                <CardBody className="p-6 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-warning mb-2" />
                    <p className="text-default-500">No analytics data available</p>
                </CardBody>
            </Card>
        );
    }

    const maxTrendValue = Math.max(
        ...analytics.monthly_trends.map(m => Math.max(m.leaves_taken, m.leaves_approved))
    );

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Select
                    label="Year"
                    selectedKeys={[String(selectedYear)]}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full sm:w-48"
                    size="sm"
                >
                    {years.map((y) => (
                        <SelectItem key={y} value={y}>
                            {y}
                        </SelectItem>
                    ))}
                </Select>

                {departments.length > 0 && (
                    <Select
                        label="Department"
                        placeholder="All Departments"
                        selectedKeys={selectedDepartment ? [String(selectedDepartment)] : []}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full sm:w-64"
                        size="sm"
                    >
                        <SelectItem key="" value="">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </Select>
                )}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Monthly Leave Trends</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {analytics.monthly_trends.map((month, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{month.month}</span>
                                        <span className="text-default-500">
                                            {month.leaves_taken} days / {month.leaves_approved} requests
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-default-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ 
                                                    width: `${(month.leaves_taken / maxTrendValue) * 100}%` 
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 bg-default-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-success rounded-full transition-all"
                                                style={{ 
                                                    width: `${(month.leaves_approved / maxTrendValue) * 100}%` 
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-divider">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-xs text-default-500">Days Taken</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-success" />
                                <span className="text-xs text-default-500">Requests Approved</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Department Comparison */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Department Comparison</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {analytics.department_comparison.map((dept, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium truncate">{dept.department}</span>
                                        <span className="text-sm text-default-500">{dept.average_days} days</span>
                                    </div>
                                    <div className="bg-default-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-warning rounded-full transition-all"
                                            style={{ 
                                                width: `${Math.min((dept.average_days / 20) * 100, 100)}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {analytics.department_comparison.length === 0 && (
                                <p className="text-center text-default-500 text-sm">No data available</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Leave Type Distribution */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">Leave Type Distribution</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {analytics.leave_type_distribution.map((type, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{type.type}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-default-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-secondary rounded-full transition-all"
                                                style={{ 
                                                    width: `${(type.count / Math.max(...analytics.leave_type_distribution.map(t => t.count))) * 100}%` 
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm text-default-500 w-8 text-right">{type.count}</span>
                                    </div>
                                </div>
                            ))}
                            {analytics.leave_type_distribution.length === 0 && (
                                <p className="text-center text-default-500 text-sm">No data available</p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Absenteeism & Peak Periods */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Absenteeism Rate */}
                            <div className="text-center">
                                <h4 className="text-sm font-medium text-default-500 mb-3">Absenteeism Rate</h4>
                                <div className="text-5xl font-bold text-primary mb-2">
                                    {analytics.absenteeism_rate.toFixed(2)}%
                                </div>
                                <p className="text-xs text-default-500">Current Year</p>
                            </div>

                            {/* Peak Periods */}
                            <div>
                                <h4 className="text-sm font-medium text-default-500 mb-3">Peak Leave Periods</h4>
                                <div className="space-y-2">
                                    {analytics.peak_periods.slice(0, 5).map((period, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-default-50 dark:bg-default-100 rounded">
                                            <span className="text-sm font-medium">{period.period}</span>
                                            <span className="text-sm text-default-500">{period.count} requests</span>
                                        </div>
                                    ))}
                                    {analytics.peak_periods.length === 0 && (
                                        <p className="text-center text-default-500 text-sm">No peak periods identified</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
