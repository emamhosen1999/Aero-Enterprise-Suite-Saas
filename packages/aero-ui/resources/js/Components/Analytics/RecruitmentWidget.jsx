import React from 'react';
import { Card, CardHeader, CardBody, Chip, Progress } from "@heroui/react";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function RecruitmentWidget({ data }) {
    const applicationTrend = data.application_trend || [];
    const applicationsBySource = data.applications_by_source || [];
    const jobsByDepartment = data.jobs_by_department?.slice(0, 8) || [];

    return (
        <Card className="h-full">
            <CardHeader className="flex justify-between items-start pb-2">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                        <BriefcaseIcon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Recruitment Metrics</h3>
                        <p className="text-sm text-default-500">Hiring pipeline analytics</p>
                    </div>
                </div>
                <Chip color="secondary" variant="flat" size="sm">
                    {data.active_jobs} Active Jobs
                </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <p className="text-2xl font-bold text-blue-500">{data.active_jobs}</p>
                        <p className="text-xs text-default-500 mt-1">Open Positions</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                        <p className="text-2xl font-bold text-purple-500">{data.total_applications}</p>
                        <p className="text-xs text-default-500 mt-1">Applications</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-500">{data.hired_count}</p>
                        <p className="text-xs text-default-500 mt-1">Hired</p>
                    </div>
                </div>

                {/* Hiring Funnel */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Hire Rate</span>
                            <span className="text-sm text-success font-semibold">{data.hire_rate}%</span>
                        </div>
                        <Progress value={data.hire_rate} color="success" size="sm" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">In Progress</span>
                            <span className="text-sm text-warning font-semibold">{data.in_progress_count} applications</span>
                        </div>
                        <Progress 
                            value={(data.in_progress_count / data.total_applications) * 100} 
                            color="warning" 
                            size="sm"
                        />
                    </div>
                </div>

                {/* Time to Hire */}
                <div className="p-4 rounded-lg bg-default-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-default-500">Avg Time to Hire</p>
                            <p className="text-3xl font-bold text-primary mt-1">{data.avg_time_to_hire}</p>
                        </div>
                        <span className="text-sm text-default-500">days</span>
                    </div>
                </div>

                {/* Application Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                        <p className="text-xl font-bold text-orange-500">{data.in_progress_count}</p>
                        <p className="text-xs text-default-500 mt-1">In Progress</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-xl font-bold text-red-500">{data.rejected_count}</p>
                        <p className="text-xs text-default-500 mt-1">Rejected</p>
                    </div>
                </div>

                {/* Application Trend */}
                {applicationTrend.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Application & Hiring Trend</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={applicationTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="applications" 
                                    stroke="#9353d3" 
                                    strokeWidth={2}
                                    name="Applications"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="hired" 
                                    stroke="#17c964" 
                                    strokeWidth={2}
                                    name="Hired"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Applications by Source */}
                {applicationsBySource.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Applications by Source</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={applicationsBySource}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.source}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {applicationsBySource.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Jobs by Department */}
                {jobsByDepartment.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Open Jobs by Department</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={jobsByDepartment}>
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
                                <Bar dataKey="count" fill="#9353d3" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
