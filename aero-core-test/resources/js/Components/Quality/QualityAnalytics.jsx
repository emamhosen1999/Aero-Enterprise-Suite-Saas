import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    BarChart3, 
    PieChart, 
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    Download,
    Zap
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale
);

const QualityAnalytics = ({ 
    inspectionData = [],
    ncrData = [],
    calibrationData = [],
    timeRange = '6months'
}) => {
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
    const [activeMetric, setActiveMetric] = useState('inspections');

    // Sample data - replace with actual data from props
    const sampleData = {
        inspections: {
            total: 245,
            passed: 210,
            failed: 25,
            conditionallyPassed: 10,
            trend: '+12%',
            trendDirection: 'up'
        },
        ncrs: {
            total: 28,
            open: 8,
            closed: 20,
            overdue: 3,
            trend: '-5%',
            trendDirection: 'down'
        },
        calibrations: {
            total: 156,
            calibrated: 140,
            due: 12,
            overdue: 4,
            trend: '+8%',
            trendDirection: 'up'
        }
    };

    // Chart data configurations
    const inspectionTrendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Passed',
                data: [35, 42, 38, 45, 48, 52],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Failed',
                data: [8, 6, 9, 5, 4, 3],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const inspectionDistributionData = {
        labels: ['Passed', 'Failed', 'Conditionally Passed'],
        datasets: [
            {
                data: [sampleData.inspections.passed, sampleData.inspections.failed, sampleData.inspections.conditionallyPassed],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(251, 191, 36)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const ncrSeverityData = {
        labels: ['Low', 'Medium', 'High'],
        datasets: [
            {
                data: [12, 10, 6],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(251, 191, 36)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const calibrationStatusData = {
        labels: ['Calibrated', 'Due Soon', 'Overdue'],
        datasets: [
            {
                data: [sampleData.calibrations.calibrated, sampleData.calibrations.due, sampleData.calibrations.overdue],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(251, 191, 36)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const qualityMetricsData = {
        labels: ['Inspection Pass Rate', 'NCR Resolution Rate', 'Calibration Compliance', 'Overall Quality Score'],
        datasets: [
            {
                label: 'Current Performance',
                data: [86, 92, 89, 88],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
            },
            {
                label: 'Target',
                data: [90, 95, 95, 90],
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
        scales: {
            r: {
                angleLines: {
                    display: false
                },
                suggestedMin: 0,
                suggestedMax: 100
            }
        }
    };

    const MetricCard = ({ title, value, subValue, trend, trendDirection, icon: Icon, color }) => (
        <div className={`p-6 rounded-lg border-2 ${color} transition-all duration-300 hover:shadow-lg`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
                    <div className="flex items-center mt-2">
                        {trendDirection === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend}
                        </span>
                    </div>
                </div>
                <Icon className="w-8 h-8 text-blue-600" />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quality Analytics Dashboard</h2>
                    <p className="text-gray-600">Comprehensive quality metrics and performance insights</p>
                </div>
                <div className="flex space-x-3">
                    <select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="1month">Last Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last Year</option>
                    </select>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-sm flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Inspections"
                    value={sampleData.inspections.total}
                    subValue={`${sampleData.inspections.passed} passed, ${sampleData.inspections.failed} failed`}
                    trend={sampleData.inspections.trend}
                    trendDirection={sampleData.inspections.trendDirection}
                    icon={CheckCircle}
                    color="bg-blue-50 border-blue-200"
                />
                <MetricCard
                    title="Active NCRs"
                    value={sampleData.ncrs.open}
                    subValue={`${sampleData.ncrs.overdue} overdue, ${sampleData.ncrs.closed} closed`}
                    trend={sampleData.ncrs.trend}
                    trendDirection={sampleData.ncrs.trendDirection}
                    icon={AlertTriangle}
                    color="bg-red-50 border-red-200"
                />
                <MetricCard
                    title="Calibration Status"
                    value={`${Math.round((sampleData.calibrations.calibrated / sampleData.calibrations.total) * 100)}%`}
                    subValue={`${sampleData.calibrations.due} due, ${sampleData.calibrations.overdue} overdue`}
                    trend={sampleData.calibrations.trend}
                    trendDirection={sampleData.calibrations.trendDirection}
                    icon={Target}
                    color="bg-green-50 border-green-200"
                />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inspection Trends */}
                <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                            Inspection Trends
                        </h3>
                        <select className="text-sm border border-gray-300 rounded-sm px-2 py-1">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-64">
                        <Line data={inspectionTrendData} options={chartOptions} />
                    </div>
                </div>

                {/* Quality Metrics Radar */}
                <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-blue-600" />
                            Quality Performance
                        </h3>
                    </div>
                    <div className="h-64">
                        <Radar data={qualityMetricsData} options={radarOptions} />
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inspection Results */}
                <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                        Inspection Results
                    </h3>
                    <div className="h-48">
                        <Doughnut data={inspectionDistributionData} options={doughnutOptions} />
                    </div>
                </div>

                {/* NCR Severity */}
                <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        NCR Severity
                    </h3>
                    <div className="h-48">
                        <Doughnut data={ncrSeverityData} options={doughnutOptions} />
                    </div>
                </div>

                {/* Calibration Status */}
                <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-green-600" />
                        Calibration Status
                    </h3>
                    <div className="h-48">
                        <Doughnut data={calibrationStatusData} options={doughnutOptions} />
                    </div>
                </div>
            </div>

            {/* Quality Insights */}
            <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Insights & Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Inspection Pass Rate Improving</p>
                                <p className="text-sm text-gray-600">
                                    Pass rate has increased by 12% over the last quarter, indicating improved quality processes.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="shrink-0">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Calibration Due Soon</p>
                                <p className="text-sm text-gray-600">
                                    12 equipment items require calibration within the next 30 days. Schedule maintenance accordingly.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="shrink-0">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">NCR Resolution Time</p>
                                <p className="text-sm text-gray-600">
                                    3 NCRs are overdue. Consider additional resources or process improvements to reduce resolution time.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="shrink-0">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Quality Score Target</p>
                                <p className="text-sm text-gray-600">
                                    Overall quality score of 88% is close to the 90% target. Focus on inspection consistency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QualityAnalytics;
