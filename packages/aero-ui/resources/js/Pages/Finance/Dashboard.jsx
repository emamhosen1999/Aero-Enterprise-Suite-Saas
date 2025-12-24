import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Progress,
  Spinner,
  Tabs,
  Tab
} from "@heroui/react";

import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const FinanceDashboard = ({ 
    stats = {}, 
    recentTransactions = [], 
    pendingInvoices = [], 
    cashFlow = {},
    accountsReceivable = {},
    accountsPayable = {},
    auth 
}) => {
  // Responsive design hooks
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1025);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  // Theme helper function
  const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
  };

  // Helper function to check permissions
  const hasPermission = (permission) => {
    return auth.permissions && auth.permissions.includes(permission);
  };

  // Stats data for StatsCards component
  const dashboardStats = useMemo(() => [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: <CurrencyDollarIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: `${stats?.revenueGrowth >= 0 ? '+' : ''}${stats?.revenueGrowth || 0}% from last month`,
      trend: stats?.revenueGrowth >= 0 ? 'up' : 'down'
    },
    {
      title: "Total Expenses",
      value: `$${stats?.totalExpenses?.toLocaleString() || '0'}`,
      icon: <ShoppingCartIcon />,
      color: "text-red-400",
      iconBg: "bg-red-500/20",
      description: `${stats?.expensesGrowth >= 0 ? '+' : ''}${stats?.expensesGrowth || 0}% from last month`,
      trend: stats?.expensesGrowth >= 0 ? 'up' : 'down'
    },
    {
      title: "Net Profit",
      value: `$${stats?.netProfit?.toLocaleString() || '0'}`,
      icon: <ChartBarIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: `${stats?.profitMargin || 0}% profit margin`,
      trend: stats?.netProfit >= 0 ? 'up' : 'down'
    },
    {
      title: "Pending Invoices",
      value: stats?.pendingInvoicesCount || 0,
      icon: <DocumentTextIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: `$${stats?.pendingInvoicesAmount?.toLocaleString() || '0'} total value`
    }
  ], [stats]);

  const getCardStyle = () => ({
    border: `var(--borderWidth, 2px) solid transparent`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
    transform: `scale(var(--scale, 1))`,
    background: `linear-gradient(135deg, 
      var(--theme-content1, #FAFAFA) 20%, 
      var(--theme-content2, #F4F4F5) 10%, 
      var(--theme-content3, #F1F3F4) 20%)`,
  });

  const getCardHeaderStyle = () => ({
    borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
  });

  return (
    <App>
      <Head title="Finance Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white">
                Finance Dashboard
              </h1>
              <p className="mt-1 text-sm text-default-500">
                Overview of financial performance and key metrics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onClick={() => setSelectedPeriod(selectedPeriod === 'month' ? 'year' : 'month')}
              >
                {selectedPeriod === 'month' ? 'This Month' : 'This Year'}
              </Button>
              {hasPermission('finance.reports.view') && (
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => safeNavigate('finance.reports.index')}
                >
                  View Reports
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <StatsCards stats={dashboardStats} isLoading={loading} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cash Flow Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="transition-all duration-200" style={getCardStyle()}>
              <CardHeader style={getCardHeaderStyle()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Cash Flow</h3>
                  </div>
                  <Chip size="sm" variant="flat" color="primary">
                    {selectedPeriod === 'month' ? 'Monthly' : 'Yearly'}
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">Cash Inflow</span>
                    <span className="text-lg font-semibold text-success">
                      +${cashFlow?.inflow?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <Progress 
                    value={65} 
                    color="success"
                    size="sm"
                    className="max-w-full"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">Cash Outflow</span>
                    <span className="text-lg font-semibold text-danger">
                      -${cashFlow?.outflow?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <Progress 
                    value={35} 
                    color="danger"
                    size="sm"
                    className="max-w-full"
                  />
                  
                  <Divider className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Cash Flow</span>
                    <span className={`text-lg font-bold ${(cashFlow?.net || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {(cashFlow?.net || 0) >= 0 ? '+' : ''}${cashFlow?.net?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Accounts Receivable */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="transition-all duration-200" style={getCardStyle()}>
              <CardHeader style={getCardHeaderStyle()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
                    <h3 className="text-lg font-semibold">Accounts Receivable</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    onClick={() => safeNavigate('finance.receivables.index')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">Current (0-30 days)</span>
                    <span className="text-lg font-semibold">
                      ${accountsReceivable?.current?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">Overdue (31-60 days)</span>
                    <span className="text-lg font-semibold text-warning">
                      ${accountsReceivable?.overdue30?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">Overdue (60+ days)</span>
                    <span className="text-lg font-semibold text-danger">
                      ${accountsReceivable?.overdue60?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <Divider className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Receivable</span>
                    <span className="text-lg font-bold text-success">
                      ${accountsReceivable?.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="transition-all duration-200" style={getCardStyle()}>
            <CardHeader style={getCardHeaderStyle()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onClick={() => safeNavigate('finance.transactions.index')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div
                      key={transaction.id || index}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-success/20' : 'bg-danger/20'}`}>
                          {transaction.type === 'income' ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description || 'Transaction'}</p>
                          <p className="text-xs text-default-500">{transaction.date || 'Today'}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                  <p className="text-default-500">No recent transactions</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* Pending Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="transition-all duration-200" style={getCardStyle()}>
            <CardHeader style={getCardHeaderStyle()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-warning" />
                  <h3 className="text-lg font-semibold">Pending Invoices</h3>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onClick={() => safeNavigate('finance.invoices.index')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {pendingInvoices && pendingInvoices.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvoices.slice(0, 5).map((invoice, index) => (
                    <div
                      key={invoice.id || index}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/20">
                          <DocumentTextIcon className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invoice.client || 'Client Name'}</p>
                          <p className="text-xs text-default-500">
                            Due: {invoice.dueDate || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${invoice.amount?.toLocaleString() || '0'}</p>
                        <Chip size="sm" variant="flat" color="warning">
                          Pending
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-2" />
                  <p className="text-default-500">No pending invoices</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </App>
  );
};

export default FinanceDashboard;
