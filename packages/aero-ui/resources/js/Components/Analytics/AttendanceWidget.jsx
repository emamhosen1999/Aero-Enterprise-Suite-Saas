import React from 'react';
import { Card, CardHeader, CardBody, Chip, Progress } from "@heroui/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AttendanceWidget({ data }) {
    const dailyTrend = data.daily_trend || [];
    const byDepartment = data.by_department?.slice(0, 8) || [];

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                        <CalendarDaysIcon className="w-6 h-6 text-success" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Attendance Trends</h3>
                        <p className="text-sm text-default-500">Workforce presence metrics</p>
                    </div>
                </div>
                <Chip color="success" variant="flat" size="sm">
                    {data.present_rate}% Present
                </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
                {/* Attendance Rates */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Present Rate</span>
                            <span className="text-sm text-success font-semibold">{data.present_rate}%</span>
                        </div>
                        <Progress value={data.present_rate} color="success" size="sm" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Absent Rate</span>
                            <span className="text-sm text-danger font-semibold">{data.absent_rate}%</span>
                        </div>
                        <Progress value={data.absent_rate} color="danger" size="sm" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Late Rate</span>
                            <span className="text-sm text-warning font-semibold">{data.late_rate}%</span>
                        </div>
                        <Progress value={data.late_rate} color="warning" size="sm" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-xl font-bold text-green-500">{data.present_count}</p>
                        <p className="text-[10px] text-default-500 mt-1">Present</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-xl font-bold text-red-500">{data.absent_count}</p>
                        <p className="text-[10px] text-default-500 mt-1">Absent</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                        <p className="text-xl font-bold text-orange-500">{data.late_count}</p>
                        <p className="text-[10px] text-default-500 mt-1">Late</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                        <p className="text-xl font-bold text-purple-500">{data.early_leave_count}</p>
                        <p className="text-[10px] text-default-500 mt-1">Early</p>
                    </div>
                </div>

                {/* Work Hours */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500">Avg Work Hours</p>
                        <p className="text-2xl font-bold text-primary">{data.avg_work_hours}h</p>
                    </div>
                    <div className="p-3 rounded-lg bg-default-100">
                        <p className="text-sm text-default-500">Total Overtime</p>
                        <p className="text-2xl font-bold text-warning">{data.total_overtime_hours}h</p>
                    </div>
                </div>

                {/* Daily Trend */}
                {dailyTrend.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Daily Attendance Trend</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    fontSize={10}
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="present" 
                                    stackId="1"
                                    stroke="#17c964" 
                                    fill="#17c964"
                                    fillOpacity={0.6}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="absent" 
                                    stackId="1"
                                    stroke="#f31260" 
                                    fill="#f31260"
                                    fillOpacity={0.6}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Department Comparison */}
                {byDepartment.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Attendance by Department</h4>
                        <div className="space-y-2">
                            {byDepartment.map((dept, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs">{dept.department}</span>
                                        <span className="text-xs font-semibold">{dept.rate}%</span>
                                    </div>
                                    <Progress 
                                        value={dept.rate} 
                                        color={dept.rate >= 90 ? "success" : dept.rate >= 75 ? "warning" : "danger"} 
                                        size="sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
