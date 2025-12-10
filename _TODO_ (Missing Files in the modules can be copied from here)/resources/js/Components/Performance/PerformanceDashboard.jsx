import React, { useState, useEffect, useRef } from 'react';
import webVitalsMonitor from '../../utils/webVitals';

/**
 * Glass ERP Performance Dashboard
 * Real-time performance monitoring component for Phase 5 production optimization
 * 
 * Features:
 * - Real-time Core Web Vitals display
 * - Performance trends visualization
 * - Feature module load times
 * - Critical performance alerts
 * - Optimization recommendations
 */

const PerformanceDashboard = ({ isVisible = false, onToggle }) => {
    const [metrics, setMetrics] = useState({});
    const [baseline, setBaseline] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('vitals');
    const metricsRef = useRef({});

    useEffect(() => {
        // Listen for real-time Web Vitals updates
        const handleWebVitalsUpdate = (event) => {
            const { metricName, metric, rating, page } = event.detail;
            
            setMetrics(prev => ({
                ...prev,
                [metricName]: { ...metric, rating, page }
            }));

            // Add alert for poor performance
            if (rating === 'poor') {
                const alert = {
                    id: Date.now(),
                    type: 'performance',
                    severity: 'high',
                    message: `${metricName} performance issue on ${page}`,
                    value: metric.value,
                    threshold: getThreshold(metricName),
                    timestamp: Date.now()
                };
                
                setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
            }
        };

        window.addEventListener('webVitalsUpdate', handleWebVitalsUpdate);

        // Get initial data
        const updateData = () => {
            setMetrics(webVitalsMonitor.getCurrentMetrics());
            setBaseline(webVitalsMonitor.getBaseline());
        };

        updateData();
        const interval = setInterval(updateData, 2000); // Update every 2 seconds

        return () => {
            window.removeEventListener('webVitalsUpdate', handleWebVitalsUpdate);
            clearInterval(interval);
        };
    }, []);

    const getThreshold = (metricName) => {
        const thresholds = {
            FCP: 1800,
            LCP: 2500,
            FID: 100,
            CLS: 0.1,
            TTFB: 800
        };
        return thresholds[metricName] || 0;
    };

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'good': return 'text-green-600 bg-green-100';
            case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
            case 'poor': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatValue = (metricName, value) => {
        if (metricName === 'CLS') {
            return value?.toFixed(3) || '0.000';
        }
        return `${Math.round(value || 0)}ms`;
    };

    const generatePerformanceScore = () => {
        const coreMetrics = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'];
        let totalScore = 0;
        let validMetrics = 0;

        coreMetrics.forEach(metricName => {
            const metric = metrics[metricName];
            if (metric) {
                validMetrics++;
                switch (metric.rating) {
                    case 'good': totalScore += 100; break;
                    case 'needs-improvement': totalScore += 50; break;
                    case 'poor': totalScore += 0; break;
                }
            }
        });

        return validMetrics > 0 ? Math.round(totalScore / validMetrics) : 0;
    };

    const getModuleLoadTimes = () => {
        return metrics.modules || {};
    };

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
                title="Open Performance Dashboard"
            >
                📊 Performance
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-6xl h-5/6 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Glass ERP Performance Dashboard
                        </h2>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live Monitoring</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {generatePerformanceScore()}
                            </div>
                            <div className="text-xs text-gray-500">Performance Score</div>
                        </div>
                        <button
                            onClick={onToggle}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b">
                    {[
                        { id: 'vitals', label: 'Core Web Vitals', icon: '⚡' },
                        { id: 'modules', label: 'Module Performance', icon: '📦' },
                        { id: 'alerts', label: 'Alerts', icon: '🚨', count: alerts.length },
                        { id: 'baseline', label: 'Baseline Data', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            {tab.icon} {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {activeTab === 'vitals' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].map(metricName => {
                                const metric = metrics[metricName];
                                const baseline = baseline.averages?.[metricName];
                                
                                return (
                                    <div key={metricName} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800">
                                                {metricName}
                                            </h3>
                                            {metric && (
                                                <span className={`px-2 py-1 rounded-sm text-xs font-medium ${getRatingColor(metric.rating)}`}>
                                                    {metric.rating}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Current:</span>
                                                <span className="font-mono">
                                                    {metric ? formatValue(metricName, metric.value) : 'Measuring...'}
                                                </span>
                                            </div>
                                            
                                            {baseline && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Average:</span>
                                                        <span className="font-mono text-blue-600">
                                                            {formatValue(metricName, baseline.average)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Best:</span>
                                                        <span className="font-mono text-green-600">
                                                            {formatValue(metricName, baseline.min)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Target:</span>
                                                <span className="font-mono text-gray-500">
                                                    {formatValue(metricName, getThreshold(metricName))}
                                                </span>
                                            </div>
                                        </div>

                                        {metric?.page && (
                                            <div className="mt-2 pt-2 border-t">
                                                <span className="text-xs text-gray-500">
                                                    Page: {metric.page}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'modules' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Feature Module Load Performance
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(getModuleLoadTimes()).map(([moduleName, moduleData]) => (
                                    <div key={moduleName} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-800">{moduleName}</h4>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                moduleData.loadTime < 500 ? 'bg-green-100 text-green-800' :
                                                moduleData.loadTime < 1000 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {Math.round(moduleData.loadTime)}ms
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Size:</span>
                                                <span>{Math.round(moduleData.size / 1024)}KB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Cached:</span>
                                                <span className={moduleData.cached ? 'text-green-600' : 'text-red-600'}>
                                                    {moduleData.cached ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {Object.keys(getModuleLoadTimes()).length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No module load data available yet. Navigate through the application to collect data.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Performance Alerts
                            </h3>
                            
                            {alerts.length > 0 ? (
                                <div className="space-y-3">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-red-600 font-medium">
                                                            🚨 {alert.message}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-600">
                                                        Value: {formatValue(alert.message.split(' ')[0], alert.value)} 
                                                        (Target: {formatValue(alert.message.split(' ')[0], alert.threshold)})
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    🎉 No performance alerts! Everything is running smoothly.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'baseline' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Performance Baseline Data
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-3">Session Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Sessions:</span>
                                            <span>{baseline.sessions || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Current Session:</span>
                                            <span>{webVitalsMonitor.sessionId?.slice(-8) || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-3">Performance Trends</h4>
                                    <div className="text-sm text-gray-600">
                                        Track performance changes over time to identify optimization opportunities.
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3">Optimization Recommendations</h4>
                                <div className="space-y-2">
                                    {webVitalsMonitor.generateReport().recommendations.map((rec, index) => (
                                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                                            <div className="font-medium text-gray-800">
                                                {rec.metric} Optimization ({rec.priority} priority)
                                            </div>
                                            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                                {rec.actions.map((action, actionIndex) => (
                                                    <li key={actionIndex}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
