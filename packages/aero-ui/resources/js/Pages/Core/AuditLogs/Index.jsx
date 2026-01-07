import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Select,
  SelectItem,
  Chip,
  Spinner,
  Button,
  Tabs,
  Tab,
  User,
  Skeleton
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StandardPageLayout from "@/Layouts/StandardPageLayout.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import {useThemeRadius} from '@/Hooks/useThemeRadius.js';
import {useMediaQuery} from '@/Hooks/useMediaQuery.js';
import axios from 'axios';

const AuditLogsIndex = () => {
  const { title } = usePage().props;
  const themeRadius = useThemeRadius();
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  const [activeTab, setActiveTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_activities: 0,
    today_activities: 0,
    security_events: 0,
    active_users_today: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    action: ''
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/audit-logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'activity' ? '/audit-logs/activity' : '/audit-logs/security';
      const response = await axios.get(endpoint, {
        params: {
          page,
          per_page: pagination.perPage,
          search: filters.search,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
          action: filters.action
        }
      });
      
      setLogs(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        currentPage: response.data.current_page || page,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, pagination.perPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs(1);
  }, [activeTab, filters]);

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Action buttons
  const actionButtons = [
    <Button
      key="refresh"
      variant="flat"
      startContent={<ArrowPathIcon className="w-4 h-4" />}
      onPress={() => fetchLogs(pagination.currentPage)}
      isLoading={loading}
      size={isMobile ? "sm" : "md"}
    >
      Refresh
    </Button>,
    <Button
      key="export"
      variant="flat"
      color="primary"
      startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
      size={isMobile ? "sm" : "md"}
    >
      Export
    </Button>
  ];

  const statsData = [
    {
      title: 'Total Activities',
      value: stats.total_activities?.toLocaleString() || '0',
      icon: ClipboardDocumentListIcon,
      color: 'primary'
    },
    {
      title: 'Today\'s Activities',
      value: stats.today_activities?.toLocaleString() || '0',
      icon: CalendarIcon,
      color: 'success'
    },
    {
      title: 'Security Events',
      value: stats.security_events?.toLocaleString() || '0',
      icon: ShieldExclamationIcon,
      color: 'warning'
    },
    {
      title: 'Active Users Today',
      value: stats.active_users_today?.toLocaleString() || '0',
      icon: ClipboardDocumentListIcon,
      color: 'secondary'
    }
  ];

  const activityColumns = [
    { uid: 'description', name: 'Description' },
    { uid: 'causer', name: 'User' },
    { uid: 'log_name', name: 'Type' },
    { uid: 'created_at', name: 'Date' }
  ];

  const securityColumns = [
    { uid: 'event_type', name: 'Event Type' },
    { uid: 'description', name: 'Description' },
    { uid: 'user', name: 'User' },
    { uid: 'ip_address', name: 'IP Address' },
    { uid: 'created_at', name: 'Date' }
  ];

  const renderActivityCell = (log, columnKey) => {
    switch (columnKey) {
      case 'description':
        return (
          <div className="max-w-md">
            <p className="text-sm text-foreground truncate">{log.description}</p>
            {log.subject_type && (
              <p className="text-xs text-default-400">{log.subject_type}</p>
            )}
          </div>
        );
      case 'causer':
        return (
          <User
            name={log.causer_name || 'System'}
            description={log.causer_email || ''}
            avatarProps={{ size: 'sm', name: log.causer_name?.charAt(0) }}
          />
        );
      case 'log_name':
        return (
          <Chip size="sm" variant="flat" color="primary">
            {log.log_name || 'default'}
          </Chip>
        );
      case 'created_at':
        return (
          <span className="text-sm text-default-500">
            {new Date(log.created_at).toLocaleString()}
          </span>
        );
      default:
        return log[columnKey];
    }
  };

  const renderSecurityCell = (log, columnKey) => {
    switch (columnKey) {
      case 'event_type':
        const eventColors = {
          'login': 'success',
          'logout': 'default',
          'failed_login': 'danger',
          'password_reset': 'warning',
          'permission_denied': 'danger'
        };
        return (
          <Chip 
            size="sm" 
            variant="flat" 
            color={eventColors[log.event_type] || 'default'}
          >
            {log.event_type}
          </Chip>
        );
      case 'description':
        return (
          <p className="text-sm text-foreground max-w-md truncate">
            {log.description}
          </p>
        );
      case 'user':
        return (
          <User
            name={log.user_name || 'Unknown'}
            description={log.user_email || ''}
            avatarProps={{ size: 'sm', name: log.user_name?.charAt(0) }}
          />
        );
      case 'ip_address':
        return (
          <span className="text-sm font-mono text-default-500">
            {log.ip_address || '-'}
          </span>
        );
      case 'created_at':
        return (
          <span className="text-sm text-default-500">
            {new Date(log.created_at).toLocaleString()}
          </span>
        );
      default:
        return log[columnKey];
    }
  };

  return (
    <>
      <Head title={title} />
      
      <StandardPageLayout
        ariaLabel="Audit Logs Management"
        title="Audit Logs"
        subtitle="Track system activities and security events"
        icon={ClipboardDocumentListIcon}
        actions={<div className="flex items-center gap-2">{actionButtons}</div>}
        stats={<StatsCards stats={statsData} isLoading={statsLoading} />}
        filters={
          <div className="space-y-4">
            <Tabs 
              selectedKey={activeTab} 
              onSelectionChange={setActiveTab}
              variant="underlined"
              color="primary"
              size={isMobile ? "sm" : "md"}
            >
              <Tab 
                key="activity" 
                title={
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    <span>Activity Logs</span>
                  </div>
                }
              />
              <Tab 
                key="security" 
                title={
                  <div className="flex items-center gap-2">
                    <ShieldExclamationIcon className="w-4 h-4" />
                    <span>Security Logs</span>
                  </div>
                }
              />
            </Tabs>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onValueChange={handleSearchChange}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                classNames={{ inputWrapper: "bg-default-100" }}
                className="w-full sm:w-64"
                radius={themeRadius}
              />
              <Input
                type="date"
                label="From"
                labelPlacement="outside-left"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                classNames={{ inputWrapper: "bg-default-100" }}
                className="w-full sm:w-auto"
                radius={themeRadius}
              />
              <Input
                type="date"
                label="To"
                labelPlacement="outside-left"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                classNames={{ inputWrapper: "bg-default-100" }}
                className="w-full sm:w-auto"
                radius={themeRadius}
              />
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Table
              aria-label={`${activeTab === 'activity' ? 'Activity' : 'Security'} logs`}
              isHeaderSticky
              classNames={{
                wrapper: "shadow-none border border-divider rounded-lg",
                th: "bg-default-100 text-default-600 font-semibold",
                td: "py-3"
              }}
            >
              <TableHeader columns={activeTab === 'activity' ? activityColumns : securityColumns}>
                {(column) => (
                  <TableColumn key={column.uid}>{column.name}</TableColumn>
                )}
              </TableHeader>
              <TableBody 
                items={logs} 
                emptyContent="No logs found"
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell>
                        {activeTab === 'activity' 
                          ? renderActivityCell(item, columnKey)
                          : renderSecurityCell(item, columnKey)}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  total={pagination.lastPage}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </StandardPageLayout>
    </>
  );
};

AuditLogsIndex.layout = (page) => <App children={page} />;

export default AuditLogsIndex;
