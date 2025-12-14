import React from 'react';
import { Card, CardHeader, CardBody, Chip, Progress } from "@heroui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function TurnoverWidget({ data }) {
    const turnoverTrend = data.turnover_trend || [];
    const turnoverByDepartment = data.turnover_by_department?.slice(0, 8) || [];

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-danger/10">
                        <ArrowRightOnRectangleIcon className="w-6 h-6 text-danger" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Turnover Analysis</h3>
                        <p className="text-sm text-default-500">Employee retention metrics</p>
                    </div>
                </div>
                <Chip color="danger" variant="flat" size="sm">
                    {data.turnover_rate}% Turnover
                </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500 mb-2">Turnover Rate</p>
                        <p className="text-3xl font-bold text-danger">{data.turnover_rate}%</p>
                        <Progress 
                            value={data.turnover_rate} 
                            color="danger" 
                            className="mt-2"
                            size="sm"
                        />
                    </div>
                    <div className="p-4 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500 mb-2">Retention Rate</p>
                        <p className="text-3xl font-bold text-success">{data.retention_rate}%</p>
                        <Progress 
                            value={data.retention_rate} 
                            color="success" 
                            className="mt-2"
                            size="sm"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-2xl font-bold text-red-500">{data.employees_left}</p>
                        <p className="text-xs text-default-500 mt-1">Employees Left</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-500">{data.new_hires}</p>
                        <p className="text-xs text-default-500 mt-1">New Hires</p>
                    </div>
                </div>

                {/* Turnover Trend */}
                {turnoverTrend.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Monthly Turnover Trend</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={turnoverTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="turnover" 
                                    stroke="#f31260" 
                                    strokeWidth={2}
                                    dot={{ fill: '#f31260', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Turnover by Department */}
                {turnoverByDepartment.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Turnover by Department</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={turnoverByDepartment}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="department" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80}
                                    fontSize={12}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f31260" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
