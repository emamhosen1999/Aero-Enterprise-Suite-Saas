import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Chip,
  Button,
  Divider,
  Tooltip,
  Skeleton,
} from '@heroui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UsersIcon,
  ServerIcon,
  CpuChipIcon,
  BriefcaseIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const getThemeRadius = () => {
  if (typeof window === 'undefined') return 'lg';
  const rootStyles = getComputedStyle(document.documentElement);
  const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
  const radiusValue = parseInt(borderRadius);
  if (radiusValue === 0) return 'none';
  if (radiusValue <= 4) return 'sm';
  if (radiusValue <= 8) return 'md';
  if (radiusValue <= 12) return 'lg';
  return 'xl';
};

const getCardStyle = () => ({
  background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 0%, var(--theme-content2, #F4F4F5) 100%)`,
  borderColor: `var(--theme-divider, #E4E4E7)`,
  borderWidth: `var(--borderWidth, 2px)`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTA ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const quotaIcons = {
  users: UsersIcon,
  storage: ServerIcon,
  api_calls: CpuChipIcon,
  employees: BriefcaseIcon,
  projects: FolderIcon,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT QUOTA WIDGET COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TenantQuotaWidget({ tenantId, initialQuotas, collapsible = true }) {
  const [quotas, setQuotas] = useState(initialQuotas || []);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [themeRadius, setThemeRadius] = useState('lg');

  useEffect(() => {
    setThemeRadius(getThemeRadius());
  }, []);

  // Fetch quota data
  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('tenant.quotas.usage', tenantId));
      setQuotas(response.data.quotas || []);
    } catch (error) {
      console.error('Failed to fetch quota data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && !initialQuotas) {
      fetchQuotas();
    }
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchQuotas, 120000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const getQuotaColor = (percentage) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 90) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getQuotaStatus = (percentage) => {
    if (percentage >= 100) return { text: 'Exceeded', color: 'danger' };
    if (percentage >= 90) return { text: 'Critical', color: 'danger' };
    if (percentage >= 80) return { text: 'Warning', color: 'warning' };
    return { text: 'Healthy', color: 'success' };
  };

  const formatValue = (value, type) => {
    if (type === 'storage') {
      // Format storage in GB
      return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (type === 'api_calls') {
      // Format API calls with K/M suffixes
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const hasWarnings = quotas.some(q => (q.current / q.limit) * 100 >= 80);
  const hasCritical = quotas.some(q => (q.current / q.limit) * 100 >= 90);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER QUOTA ITEM
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderQuotaItem = (quota) => {
    const percentage = Math.min(100, Math.round((quota.current / quota.limit) * 100));
    const color = getQuotaColor(percentage);
    const status = getQuotaStatus(percentage);
    const Icon = quotaIcons[quota.type] || ServerIcon;

    return (
      <div key={quota.type} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-default-500" />
            <span className="text-sm font-medium capitalize">
              {quota.type.replace('_', ' ')}
            </span>
            {percentage >= 80 && (
              <Tooltip content={`${percentage}% used - ${status.text}`}>
                <ExclamationTriangleIcon 
                  className={`w-4 h-4 ${
                    color === 'danger' ? 'text-danger' : 'text-warning'
                  }`}
                />
              </Tooltip>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              {formatValue(quota.current, quota.type)} / {formatValue(quota.limit, quota.type)}
            </p>
            <Chip size="sm" color={status.color} variant="flat" className="mt-1">
              {percentage}%
            </Chip>
          </div>
        </div>

        <Progress
          value={percentage}
          color={color}
          size="md"
          radius={themeRadius}
          classNames={{
            track: "bg-default-200",
            indicator: `${
              color === 'danger' ? 'bg-danger' : 
              color === 'warning' ? 'bg-warning' : 
              'bg-success'
            }`,
          }}
        />

        {quota.grace_period_ends_at && percentage >= 100 && (
          <div className="flex items-start gap-2 p-2 rounded bg-danger/10 border border-danger/20">
            <ExclamationTriangleIcon className="w-4 h-4 text-danger mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-danger">Quota exceeded</p>
              <p className="text-default-600">
                Grace period ends: {new Date(quota.grace_period_ends_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  if (loading && !quotas.length) {
    return (
      <Card className="transition-all duration-200" style={getCardStyle()}>
        <CardBody className="p-4">
          <Skeleton className="h-32 rounded" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200" style={getCardStyle()}>
      <CardHeader className="flex justify-between items-center p-4 border-b border-divider">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Quota Usage</h3>
          {hasWarnings && (
            <Chip 
              size="sm" 
              color={hasCritical ? 'danger' : 'warning'} 
              variant="flat"
            >
              {hasCritical ? 'Critical' : 'Warning'}
            </Chip>
          )}
        </div>

        {collapsible && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </Button>
        )}
      </CardHeader>

      {!collapsed && (
        <CardBody className="p-4 space-y-4">
          {quotas.length === 0 ? (
            <div className="text-center py-6">
              <InformationCircleIcon className="w-12 h-12 text-default-300 mx-auto mb-2" />
              <p className="text-sm text-default-500">No quota information available</p>
            </div>
          ) : (
            <>
              {quotas.map(renderQuotaItem)}

              {hasWarnings && (
                <>
                  <Divider className="my-2" />
                  <div className="flex items-start gap-2 p-3 rounded bg-warning/10 border border-warning/20">
                    <InformationCircleIcon className="w-5 h-5 text-warning mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-warning mb-1">Quota Alert</p>
                      <p className="text-default-600">
                        You're approaching or exceeding quota limits. 
                        Consider upgrading your plan or reducing usage.
                      </p>
                      {quotas.some(q => q.grace_period_ends_at) && (
                        <p className="text-default-600 mt-1">
                          After the grace period ends, some features may be restricted.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="w-full"
                onPress={() => window.location.href = route('tenant.quotas.details')}
              >
                View Detailed Usage
              </Button>
            </>
          )}
        </CardBody>
      )}
    </Card>
  );
}
