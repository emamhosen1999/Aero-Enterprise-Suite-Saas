import React from 'react';
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { UsersIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function HeadcountWidget({ data }) {
    const growthColor = data.growth_rate >= 0 ? 'text-green-500' : 'text-red-500';
    const GrowthIcon = data.growth_rate >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

    // Prepare chart data
    const departmentData = data.by_department?.slice(0, 10) || [];
    const designationData = data.by_designation?.slice(0, 8) || [];

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <UsersIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Headcount Overview</h3>
                        <p className="text-sm text-default-500">Total workforce metrics</p>
                    </div>
                </div>
                <Chip color="primary" variant="flat" size="sm">
                    {data.total_headcount} Total
                </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-default-100">
                        <p className="text-2xl font-bold text-primary">{data.total_headcount}</p>
                        <p className="text-xs text-default-500 mt-1">Total Employees</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-default-100">
                        <p className="text-2xl font-bold text-success">{data.new_hires}</p>
                        <p className="text-xs text-default-500 mt-1">New Hires</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-default-100">
                        <div className="flex items-center justify-center gap-1">
                            <p className={`text-2xl font-bold ${growthColor}`}>{data.growth_rate}%</p>
                            <GrowthIcon className={`w-5 h-5 ${growthColor}`} />
                        </div>
                        <p className="text-xs text-default-500 mt-1">Growth Rate</p>
                    </div>
                </div>

                {/* Department Distribution */}
                {departmentData.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">By Department</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={departmentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="department" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={100}
                                    fontSize={12}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Designation Distribution */}
                {designationData.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">By Designation</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={designationData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.designation}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {designationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
