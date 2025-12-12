import React from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Input, Button, Chip, Switch, Checkbox } from '@heroui/react';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

export default function LogViewer() {
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [autoRefresh, setAutoRefresh] = React.useState(false);
    const [autoScroll, setAutoScroll] = React.useState(true);
    const [levelFilter, setLevelFilter] = React.useState('all');
    const [channelFilter, setChannelFilter] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [expandedLogs, setExpandedLogs] = React.useState(new Set());
    const [tailLines, setTailLines] = React.useState('100');
    const logsEndRef = React.useRef(null);

    const logLevels = [
        { key: 'all', label: 'All Levels', color: 'default' },
        { key: 'emergency', label: 'Emergency', color: 'danger' },
        { key: 'alert', label: 'Alert', color: 'danger' },
        { key: 'critical', label: 'Critical', color: 'danger' },
        { key: 'error', label: 'Error', color: 'danger' },
        { key: 'warning', label: 'Warning', color: 'warning' },
        { key: 'notice', label: 'Notice', color: 'primary' },
        { key: 'info', label: 'Info', color: 'primary' },
        { key: 'debug', label: 'Debug', color: 'default' },
    ];

    const channels = [
        { key: 'all', label: 'All Channels' },
        { key: 'application', label: 'Application' },
        { key: 'security', label: 'Security' },
        { key: 'database', label: 'Database' },
        { key: 'queue', label: 'Queue' },
        { key: 'mail', label: 'Mail' },
        { key: 'http', label: 'HTTP' },
    ];

    const fetchLogs = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(route('admin.developer-tools.logs'), {
                params: {
                    level: levelFilter !== 'all' ? levelFilter : null,
                    channel: channelFilter !== 'all' ? channelFilter : null,
                    search: searchTerm || null,
                    tail: tailLines,
                }
            });
            setLogs(response.data.logs || []);
        } catch (error) {
            showToast.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [levelFilter, channelFilter, searchTerm, tailLines]);

    React.useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    React.useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 2000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    React.useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    const handleDownloadLogs = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(route('admin.developer-tools.logs.download'), {
                    params: {
                        level: levelFilter !== 'all' ? levelFilter : null,
                        channel: channelFilter !== 'all' ? channelFilter : null,
                    },
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `logs-${new Date().toISOString()}.txt`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                resolve(['Logs downloaded successfully']);
            } catch (error) {
                reject(['Failed to download logs']);
            }
        });

        showToast.promise(promise, {
            loading: 'Downloading logs...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const handleClearLogs = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('admin.developer-tools.logs.clear'));
                setLogs([]);
                resolve([response.data.message || 'Logs cleared successfully']);
            } catch (error) {
                reject(['Failed to clear logs']);
            }
        });

        showToast.promise(promise, {
            loading: 'Clearing logs...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    const toggleExpandLog = (index) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedLogs(newExpanded);
    };

    const getLevelColor = (level) => {
        const levelObj = logLevels.find(l => l.key === level?.toLowerCase());
        return levelObj?.color || 'default';
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card>
                <CardHeader className="flex flex-col gap-3">
                    <div className="flex justify-between items-center w-full">
                        <h3 className="text-lg font-semibold">Log Viewer</h3>
                        <div className="flex gap-2">
                            <Switch
                                isSelected={autoRefresh}
                                onValueChange={setAutoRefresh}
                                size="sm"
                            >
                                <span className="text-sm">Auto-refresh</span>
                            </Switch>
                            <Switch
                                isSelected={autoScroll}
                                onValueChange={setAutoScroll}
                                size="sm"
                            >
                                <span className="text-sm">Auto-scroll</span>
                            </Switch>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Select
                            placeholder="Filter by level"
                            selectedKeys={[levelFilter]}
                            onSelectionChange={(keys) => setLevelFilter(Array.from(keys)[0])}
                            className="max-w-xs"
                        >
                            {logLevels.map((level) => (
                                <SelectItem key={level.key}>{level.label}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            placeholder="Filter by channel"
                            selectedKeys={[channelFilter]}
                            onSelectionChange={(keys) => setChannelFilter(Array.from(keys)[0])}
                            className="max-w-xs"
                        >
                            {channels.map((channel) => (
                                <SelectItem key={channel.key}>{channel.label}</SelectItem>
                            ))}
                        </Select>

                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                            className="max-w-xs"
                        />

                        <Select
                            placeholder="Tail lines"
                            selectedKeys={[tailLines]}
                            onSelectionChange={(keys) => setTailLines(Array.from(keys)[0])}
                            className="max-w-[120px]"
                        >
                            <SelectItem key="50">Last 50</SelectItem>
                            <SelectItem key="100">Last 100</SelectItem>
                            <SelectItem key="500">Last 500</SelectItem>
                            <SelectItem key="1000">Last 1000</SelectItem>
                        </Select>

                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onPress={fetchLogs}
                            isLoading={loading}
                        >
                            Refresh
                        </Button>

                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            onPress={handleDownloadLogs}
                        >
                            Download
                        </Button>

                        <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={handleClearLogs}
                        >
                            Clear
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Logs Display */}
            <Card>
                <CardBody>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-sm">
                        {logs.length === 0 ? (
                            <p className="text-center text-default-500 py-8">No logs found</p>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        expandedLogs.has(index)
                                            ? 'bg-default-100 border-default-300'
                                            : 'bg-default-50 border-default-200 hover:bg-default-100'
                                    }`}
                                    onClick={() => toggleExpandLog(index)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-default-500 min-w-[60px]">#{index + 1}</span>
                                        <Chip
                                            size="sm"
                                            color={getLevelColor(log.level)}
                                            variant="flat"
                                            className="min-w-[80px]"
                                        >
                                            {log.level?.toUpperCase()}
                                        </Chip>
                                        <span className="text-default-600 min-w-[150px]">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                        {log.channel && (
                                            <Chip size="sm" variant="flat" className="min-w-[100px]">
                                                {log.channel}
                                            </Chip>
                                        )}
                                        <p className="flex-1 text-default-900 dark:text-default-100">
                                            {expandedLogs.has(index) ? log.message : log.message.substring(0, 100)}
                                            {!expandedLogs.has(index) && log.message.length > 100 && '...'}
                                        </p>
                                    </div>

                                    {expandedLogs.has(index) && (log.context || log.stack_trace) && (
                                        <div className="mt-3 pl-[260px] space-y-2">
                                            {log.context && (
                                                <div className="p-2 bg-default-200 dark:bg-default-800 rounded">
                                                    <p className="text-xs font-semibold mb-1">Context:</p>
                                                    <pre className="text-xs whitespace-pre-wrap">
                                                        {JSON.stringify(log.context, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.stack_trace && (
                                                <div className="p-2 bg-danger-50 dark:bg-danger-900/20 rounded">
                                                    <p className="text-xs font-semibold mb-1 text-danger">
                                                        Stack Trace:
                                                    </p>
                                                    <pre className="text-xs whitespace-pre-wrap text-danger-800 dark:text-danger-200">
                                                        {log.stack_trace}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
