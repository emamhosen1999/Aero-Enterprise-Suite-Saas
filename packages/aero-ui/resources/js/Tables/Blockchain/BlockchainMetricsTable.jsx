import React, { useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
  Chip,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Pagination,
  Progress
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  ChartBarIcon,
  CubeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";

const BlockchainMetricsTable = ({
  metrics = [],
  loading = false,
  onView = () => {},
  onAnalyze = () => {},
  pagination = { currentPage: 1, perPage: 10, total: 0 },
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
}) => {
  // Theme radius helper
  const themeRadius = useThemeRadius();
// Format numbers
  const formatNumber = useCallback((value, type = 'number') => {
    if (!value || isNaN(value)) return '0';
    
    const num = parseFloat(value);
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num);
      case 'percentage':
        return `${num.toFixed(2)}%`;
      case 'compact':
        if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toFixed(0);
      default:
        return num.toLocaleString();
    }
  }, []);

  // Format timestamp
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Network status colors
  const networkStatusColors = {
    healthy: 'success',
    warning: 'warning',
    congested: 'danger',
    maintenance: 'default'
  };

  // Performance level colors
  const performanceColors = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  };

  const columns = [
    { name: "Network", uid: "network" },
    { name: "Block Height", uid: "blockHeight" },
    { name: "TPS", uid: "tps" },
    { name: "Gas Price", uid: "gasPrice" },
    { name: "Network Status", uid: "status" },
    { name: "Performance", uid: "performance" },
    { name: "Last Updated", uid: "lastUpdated" },
    { name: "Actions", uid: "actions" },
  ];

  const renderCell = useCallback((metric, columnKey) => {
    const cellValue = metric[columnKey];

    switch (columnKey) {
      case "network":
        return (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              {metric.icon ? (
                <img src={metric.icon} alt={metric.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <CubeIcon className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
            <div>
              <p className="text-bold text-small">{metric.name}</p>
              <p className="text-tiny text-default-400">{metric.symbol}</p>
            </div>
          </div>
        );
      case "blockHeight":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{formatNumber(metric.blockHeight)}</p>
            <p className="text-tiny text-default-400">Current Block</p>
          </div>
        );
      case "tps":
        const tpsValue = parseFloat(metric.tps || 0);
        return (
          <div className="flex items-center gap-2">
            <p className="text-bold text-small">{tpsValue.toFixed(1)}</p>
            <div className="flex items-center">
              {metric.tpsChange >= 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3 text-success" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 text-danger" />
              )}
              <span className={`text-tiny ${metric.tpsChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatNumber(Math.abs(metric.tpsChange || 0), 'percentage')}
              </span>
            </div>
          </div>
        );
      case "gasPrice":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{metric.gasPrice} {metric.gasUnit || 'Gwei'}</p>
            <p className="text-tiny text-default-400">
              ~{formatNumber(metric.gasPriceUsd || 0, 'currency')}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={networkStatusColors[metric.status] || "default"}
            size="sm"
            variant="flat"
          >
            {metric.status || 'Unknown'}
          </Chip>
        );
      case "performance":
        const performanceValue = parseFloat(metric.performanceScore || 0);
        const performanceLevel = performanceValue >= 90 ? 'excellent' : 
                                performanceValue >= 75 ? 'good' : 
                                performanceValue >= 50 ? 'average' : 'poor';
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-tiny">{performanceValue}%</span>
              <span className={`text-tiny capitalize text-${performanceColors[performanceLevel]}`}>
                {performanceLevel}
              </span>
            </div>
            <Progress
              size="sm"
              radius="sm"
              classNames={{
                base: "max-w-md",
                track: "drop-shadow-md border border-default",
                indicator: `bg-gradient-to-r from-${performanceColors[performanceLevel]}-500 to-${performanceColors[performanceLevel]}-300`,
              }}
              value={performanceValue}
            />
          </div>
        );
      case "lastUpdated":
        return (
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-default-400" />
            <div>
              <p className="text-small">{formatDate(metric.lastUpdated)}</p>
              <p className="text-tiny text-default-400">
                {metric.updateFrequency || 'Real-time'}
              </p>
            </div>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  startContent={<EyeIcon className="w-4 h-4" />}
                  onPress={() => onView(metric)}
                >
                  View Details
                </DropdownItem>
                <DropdownItem
                  startContent={<ChartBarIcon className="w-4 h-4" />}
                  onPress={() => onAnalyze(metric)}
                >
                  Analyze Network
                </DropdownItem>
                {metric.explorerUrl && (
                  <DropdownItem
                    startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                    onPress={() => window.open(metric.explorerUrl, '_blank')}
                  >
                    View on Explorer
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, [formatNumber, formatDate, onView, onAnalyze]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {pagination.total} blockchain networks
          </span>
          <div className="flex gap-2">
            <Chip size="sm" color="success" variant="flat">
              {metrics.filter(m => m.status === 'healthy').length} Healthy
            </Chip>
            <Chip size="sm" color="warning" variant="flat">
              {metrics.filter(m => m.status === 'warning').length} Warning
            </Chip>
            <Chip size="sm" color="danger" variant="flat">
              {metrics.filter(m => m.status === 'congested').length} Congested
            </Chip>
          </div>
        </div>
      </div>
    );
  }, [pagination.total, metrics]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {metrics.length > 0 ? `${((pagination.currentPage - 1) * pagination.perPage) + 1}-${Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of ${pagination.total}` : ''}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={pagination.currentPage}
          total={Math.ceil(pagination.total / pagination.perPage)}
          onChange={onPageChange}
          radius={themeRadius}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          {/* Rows per page selector could go here */}
        </div>
      </div>
    );
  }, [pagination, metrics.length, onPageChange, getThemeRadius]);

  return (
    <Table
      aria-label="Blockchain metrics table"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "shadow-none border border-divider rounded-lg",
        th: "bg-default-100 text-default-600 font-semibold",
        td: "py-3"
      }}
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody 
        items={metrics || []}
        loadingContent={<Spinner />}
        loadingState={loading ? "loading" : "idle"}
        emptyContent="No blockchain metrics available"
      >
        {(item) => (
          <TableRow key={item.id || item.name}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default BlockchainMetricsTable;