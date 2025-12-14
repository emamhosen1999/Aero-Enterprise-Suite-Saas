import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { 
    Card, 
    CardBody, 
    CardHeader,
    Progress,
    Chip
} from "@heroui/react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const ComplianceAnalytics = ({ timeRange = 'last_30_days' }) => {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState({
        policyCompliance: [],
        riskDistribution: [],
        trainingCompletion: [],
        auditFindings: [],
        complianceTrends: []
    });
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/compliance/analytics', {
                    params: { time_range: selectedTimeRange }
                });
                setAnalyticsData(response.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedTimeRange]);

    // Chart configurations
    const policyComplianceChart = useMemo(() => ({
        data: {
            labels: analyticsData.policyCompliance.map(item => item.policy_name),
            datasets: [{
                label: 'Acknowledgment Rate (%)',
                data: analyticsData.policyCompliance.map(item => item.acknowledgment_rate),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Policy Acknowledgment Rates'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    }), [analyticsData.policyCompliance]);

    const riskDistributionChart = useMemo(() => ({
        data: {
            labels: analyticsData.riskDistribution.map(item => item.risk_level),
            datasets: [{
                data: analyticsData.riskDistribution.map(item => item.count),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // High Risk - Red
                    'rgba(245, 158, 11, 0.8)',  // Medium Risk - Amber
                    'rgba(34, 197, 94, 0.8)',   // Low Risk - Green
                    'rgba(156, 163, 175, 0.8)'  // Unknown - Gray
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Risk Distribution'
                }
            }
        }
    }), [analyticsData.riskDistribution]);

    const trainingCompletionChart = useMemo(() => ({
        data: {
            labels: analyticsData.trainingCompletion.map(item => item.training_type),
            datasets: [
                {
                    label: 'Completed',
                    data: analyticsData.trainingCompletion.map(item => item.completed),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                },
                {
                    label: 'In Progress',
                    data: analyticsData.trainingCompletion.map(item => item.in_progress),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                },
                {
                    label: 'Not Started',
                    data: analyticsData.trainingCompletion.map(item => item.not_started),
                    backgroundColor: 'rgba(156, 163, 175, 0.8)',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Training Completion Status'
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    }), [analyticsData.trainingCompletion]);

    const complianceTrendsChart = useMemo(() => ({
        data: {
            labels: analyticsData.complianceTrends.map(item => item.month),
            datasets: [
                {
                    label: 'Overall Compliance %',
                    data: analyticsData.complianceTrends.map(item => item.compliance_rate),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Policy Acknowledgments %',
                    data: analyticsData.complianceTrends.map(item => item.policy_acknowledgment_rate),
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Training Completion %',
                    data: analyticsData.complianceTrends.map(item => item.training_completion_rate),
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Compliance Trends Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    }), [analyticsData.complianceTrends]);

    // Calculate summary metrics
    const summaryMetrics = useMemo(() => {
        const totalPolicies = analyticsData.policyCompliance.length;
        const avgAcknowledgmentRate = analyticsData.policyCompliance.reduce((sum, item) => sum + item.acknowledgment_rate, 0) / totalPolicies || 0;
        
        const totalRisks = analyticsData.riskDistribution.reduce((sum, item) => sum + item.count, 0);
        const highRisks = analyticsData.riskDistribution.find(item => item.risk_level === 'High')?.count || 0;
        
        const totalTraining = analyticsData.trainingCompletion.reduce((sum, item) => sum + item.completed + item.in_progress + item.not_started, 0);
        const completedTraining = analyticsData.trainingCompletion.reduce((sum, item) => sum + item.completed, 0);
        const trainingCompletionRate = totalTraining > 0 ? (completedTraining / totalTraining) * 100 : 0;
        
        return {
            avgAcknowledgmentRate: Math.round(avgAcknowledgmentRate),
            highRiskPercentage: totalRisks > 0 ? Math.round((highRisks / totalRisks) * 100) : 0,
            trainingCompletionRate: Math.round(trainingCompletionRate),
            totalPolicies,
            totalRisks,
            totalTraining
        };
    }, [analyticsData]);

    if (loading) {
        return (
            <Card className="shadow-lg">
                <CardBody className="p-6 text-center">
                    <Typography>Loading analytics...</Typography>
                </CardBody>
            </Card>
        );
    }

    return (
        <Box>
            {/* Controls */}
            <Box className="mb-6 flex justify-between items-center">
                <Typography variant="h5" className="flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6" />
                    Compliance Analytics
                </Typography>
                <FormControl size="small" sx={{ minWidth: 192 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Time Range
                    </InputLabel>
                    <Select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        label="Time Range"
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '12px',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(59, 130, 246, 0.5)',
                            },
                            '& .MuiSelect-select': {
                                color: 'rgba(255, 255, 255, 0.9)',
                            },
                            '& .MuiSelect-icon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                            },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    '& .MuiMenuItem-root': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                        },
                                    },
                                },
                            },
                        }}
                    >
                        <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                        <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                        <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                        <MenuItem value="last_6_months">Last 6 Months</MenuItem>
                        <MenuItem value="last_year">Last Year</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Summary Metrics */}
            <Grid container spacing={3} className="mb-6">
                <Grid item xs={12} sm={6} md={3}>
                    <Card className="shadow-lg">
                        <CardBody className="p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                            </div>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {summaryMetrics.avgAcknowledgmentRate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Avg Policy Acknowledgment
                            </Typography>
                            <Progress 
                                value={summaryMetrics.avgAcknowledgmentRate} 
                                color="success" 
                                className="mt-2" 
                                size="sm"
                            />
                        </CardBody>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card className="shadow-lg">
                        <CardBody className="p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {summaryMetrics.highRiskPercentage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                High Risk Items
                            </Typography>
                            <Progress 
                                value={summaryMetrics.highRiskPercentage} 
                                color="danger" 
                                className="mt-2" 
                                size="sm"
                            />
                        </CardBody>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card className="shadow-lg">
                        <CardBody className="p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <ArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />
                            </div>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {summaryMetrics.trainingCompletionRate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Training Completion
                            </Typography>
                            <Progress 
                                value={summaryMetrics.trainingCompletionRate} 
                                color="primary" 
                                className="mt-2" 
                                size="sm"
                            />
                        </CardBody>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card className="shadow-lg">
                        <CardBody className="p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <ChartBarIcon className="w-8 h-8 text-purple-500" />
                            </div>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {summaryMetrics.totalPolicies}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Active Policies
                            </Typography>
                            <div className="mt-2 flex justify-center">
                                <Chip size="sm" color="secondary" variant="flat">
                                    {summaryMetrics.totalRisks} Risks
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                {/* Policy Compliance Chart */}
                <Grid item xs={12} lg={6}>
                    <Card className="shadow-lg">
                        <CardBody className="p-6">
                            <Bar {...policyComplianceChart} />
                        </CardBody>
                    </Card>
                </Grid>

                {/* Risk Distribution Chart */}
                <Grid item xs={12} lg={6}>
                    <Card className="shadow-lg">
                        <CardBody className="p-6">
                            <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Doughnut {...riskDistributionChart} />
                            </div>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Training Completion Chart */}
                <Grid item xs={12} lg={6}>
                    <Card className="shadow-lg">
                        <CardBody className="p-6">
                            <Bar {...trainingCompletionChart} />
                        </CardBody>
                    </Card>
                </Grid>

                {/* Compliance Trends Chart */}
                <Grid item xs={12} lg={6}>
                    <Card className="shadow-lg">
                        <CardBody className="p-6">
                            <Line {...complianceTrendsChart} />
                        </CardBody>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ComplianceAnalytics;
