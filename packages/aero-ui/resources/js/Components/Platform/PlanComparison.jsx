import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tabs, Tab, Chip, Card, CardBody } from '@heroui/react';
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/solid';
import { useTheme } from '@/Context/ThemeContext.jsx';

/**
 * Plan Comparison Component
 * 
 * Provides a side-by-side feature comparison table for all plans.
 * Helps users make informed decisions about which plan to choose.
 */
export default function PlanComparison({
  plans = [],
  features = [],
  selectedPlanId = null,
  onSelectPlan,
  className = '',
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'list'

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  // Generate feature list from plan module_codes if features not provided
  const featureList = useMemo(() => {
    if (features.length > 0) return features;

    // Default feature categories
    return [
      { id: 'users', name: 'Team Members', category: 'Limits' },
      { id: 'storage', name: 'Storage', category: 'Limits' },
      { id: 'hrm', name: 'HR Management', category: 'Core Modules' },
      { id: 'crm', name: 'CRM & Sales', category: 'Core Modules' },
      { id: 'finance', name: 'Finance & Accounting', category: 'Core Modules' },
      { id: 'project', name: 'Project Management', category: 'Core Modules' },
      { id: 'ims', name: 'Inventory Management', category: 'Operations' },
      { id: 'pos', name: 'Point of Sale', category: 'Operations' },
      { id: 'scm', name: 'Supply Chain', category: 'Operations' },
      { id: 'dms', name: 'Document Management', category: 'Productivity' },
      { id: 'quality', name: 'Quality Management', category: 'Compliance' },
      { id: 'compliance', name: 'Compliance & Audit', category: 'Compliance' },
      { id: 'api', name: 'API Access', category: 'Integration' },
      { id: 'sso', name: 'SSO / SAML', category: 'Security' },
      { id: 'support', name: 'Priority Support', category: 'Support' },
    ];
  }, [features]);

  // Group features by category
  const groupedFeatures = useMemo(() => {
    const groups = {};
    featureList.forEach((feature) => {
      const category = feature.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(feature);
    });
    return groups;
  }, [featureList]);

  // Check if a plan includes a feature
  const planHasFeature = (plan, featureId) => {
    if (!plan.module_codes && !plan.features) return false;
    const codes = plan.module_codes || plan.features || [];
    return codes.includes(featureId);
  };

  // Get feature value for a plan
  const getFeatureValue = (plan, featureId) => {
    // Handle special limit features
    if (featureId === 'users') {
      return plan.max_users === -1 ? 'Unlimited' : plan.max_users?.toString() || '5';
    }
    if (featureId === 'storage') {
      return plan.storage_gb ? `${plan.storage_gb} GB` : '10 GB';
    }
    if (featureId === 'support') {
      if (plan.name?.toLowerCase().includes('enterprise')) return '24/7';
      if (plan.name?.toLowerCase().includes('professional')) return 'Priority';
      return 'Standard';
    }
    
    // Boolean check for module inclusion
    return planHasFeature(plan, featureId);
  };

  const palette = {
    surface: isDarkMode ? 'bg-white/5' : 'bg-white',
    border: isDarkMode ? 'border-white/10' : 'border-slate-200',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    header: isDarkMode ? 'bg-slate-800' : 'bg-slate-50',
    selected: isDarkMode ? 'bg-primary/10 border-primary' : 'bg-primary/5 border-primary',
  };

  if (plans.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* View Mode Tabs - Hidden on mobile */}
      <div className="hidden sm:flex justify-end mb-4">
        <Tabs
          size="sm"
          selectedKey={viewMode}
          onSelectionChange={setViewMode}
          aria-label="Comparison view mode"
        >
          <Tab key="table" title="Table View" />
          <Tab key="list" title="List View" />
        </Tabs>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <Table
            aria-label="Plan comparison table"
            classNames={{
              wrapper: `${palette.surface} border ${palette.border} rounded-lg shadow-sm`,
              th: `${palette.header} ${palette.text} font-semibold`,
              td: `${palette.text}`,
            }}
          >
            <TableHeader>
              <TableColumn key="feature" className="min-w-[180px]">
                Feature
              </TableColumn>
              {plans.map((plan) => (
                <TableColumn
                  key={plan.id}
                  className={`text-center min-w-[120px] ${
                    selectedPlanId === plan.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">{plan.name}</span>
                    {plan.is_popular && (
                      <Chip size="sm" color="warning" variant="flat">
                        <StarIcon className="w-3 h-3 mr-1" />
                        Popular
                      </Chip>
                    )}
                  </div>
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {Object.entries(groupedFeatures).flatMap(([category, categoryFeatures]) => [
                // Category header row
                <TableRow key={`category-${category}`} className={palette.header}>
                  <TableCell className="font-semibold text-primary">
                    {category}
                  </TableCell>
                  {plans.map((plan) => (
                    <TableCell key={`${category}-${plan.id}`} />
                  ))}
                </TableRow>,
                // Feature rows
                ...categoryFeatures.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className={palette.muted}>
                      {feature.name}
                    </TableCell>
                    {plans.map((plan) => {
                      const value = getFeatureValue(plan, feature.id);
                      return (
                        <TableCell
                          key={`${feature.id}-${plan.id}`}
                          className={`text-center ${
                            selectedPlanId === plan.id ? 'bg-primary/5' : ''
                          }`}
                        >
                          {typeof value === 'boolean' ? (
                            value ? (
                              <CheckIcon className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XMarkIcon className="w-5 h-5 text-default-300 mx-auto" />
                            )
                          ) : (
                            <span className="font-medium">{value}</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )),
              ])}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* List View - Better for mobile */
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              isPressable
              onPress={() => onSelectPlan?.(plan.id)}
              className={`${palette.surface} border ${
                selectedPlanId === plan.id ? palette.selected : palette.border
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-semibold text-lg ${palette.text}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${palette.muted}`}>
                      ${plan.monthly_price}/month
                    </p>
                  </div>
                  {plan.is_popular && (
                    <Chip size="sm" color="warning" variant="flat">
                      Popular
                    </Chip>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {featureList.slice(0, 8).map((feature) => {
                    const value = getFeatureValue(plan, feature.id);
                    const included = typeof value === 'boolean' ? value : true;
                    
                    return (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-2 text-sm ${
                          included ? palette.text : palette.muted
                        }`}
                      >
                        {included ? (
                          <CheckIcon className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-default-300 shrink-0" />
                        )}
                        <span className="truncate">{feature.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
