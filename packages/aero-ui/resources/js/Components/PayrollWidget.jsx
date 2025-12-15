import React from 'react';
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function PayrollWidget({ data }) {
    const monthlyTrend = data.monthly_trend || [];
    const byDepartment = data.by_department?.slice(0, 8) || [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                        <BanknotesIcon className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Payroll Summary</h3>
                        <p className="text-sm text-default-500">Compensation analytics</p>
                    </div>
                </div>
                <Chip color="warning" variant="flat" size="sm">
                    {formatCurrency(data.total_payroll)}
                </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500 mb-1">Total Payroll</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(data.total_payroll)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500 mb-1">Avg Salary</p>
                        <p className="text-2xl font-bold text-success">{formatCurrency(data.avg_salary)}</p>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <p className="text-lg font-bold text-blue-500">{formatCurrency(data.total_gross)}</p>
                        <p className="text-xs text-default-500 mt-1">Gross Salary</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-lg font-bold text-red-500">{formatCurrency(data.total_deductions)}</p>
                        <p className="text-xs text-default-500 mt-1">Deductions</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                        <p className="text-lg font-bold text-orange-500">{formatCurrency(data.total_overtime_amount)}</p>
                        <p className="text-xs text-default-500 mt-1">Overtime Pay</p>
                    </div>
                </div>

                {/* Monthly Trend */}
                {monthlyTrend.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Monthly Payroll Trend</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis 
                                    fontSize={12}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="total_salary" 
                                    stroke="#f5a524" 
                                    strokeWidth={2}
                                    dot={{ fill: '#f5a524', r: 4 }}
                                    name="Total Payroll"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Department Breakdown */}
                {byDepartment.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Payroll by Department</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={byDepartment}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="department" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={100}
                                    fontSize={12}
                                />
                                <YAxis 
                                    fontSize={12}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="total_salary" 
                                    fill="#f5a524" 
                                    radius={[8, 8, 0, 0]}
                                    name="Total Salary"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Overtime Stats */}
                <div className="p-4 rounded-lg bg-default-100">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-default-500">Average Overtime Hours</span>
                        <span className="text-xl font-bold text-warning">{data.avg_overtime_hours} hrs</span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
