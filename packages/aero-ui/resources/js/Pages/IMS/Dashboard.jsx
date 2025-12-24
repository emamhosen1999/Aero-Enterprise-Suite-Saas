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
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ClockIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const InventoryDashboard = ({ 
    stats = {}, 
    lowStockItems = [], 
    recentMovements = [], 
    warehouseUsage = [],
    topProducts = {},
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
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: <CubeIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: `${stats?.activeItems || 0} active items`
    },
    {
      title: "Total Value",
      value: `$${stats?.totalValue?.toLocaleString() || '0'}`,
      icon: <BanknotesIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: `${stats?.valueGrowth >= 0 ? '+' : ''}${stats?.valueGrowth || 0}% from last month`,
      trend: stats?.valueGrowth >= 0 ? 'up' : 'down'
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount || 0,
      icon: <ExclamationTriangleIcon />,
      color: "text-warning-400",
      iconBg: "bg-warning-500/20",
      description: `${stats?.outOfStockCount || 0} out of stock`
    },
    {
      title: "Warehouses",
      value: stats?.totalWarehouses || 0,
      icon: <BuildingStorefrontIcon />,
      color: "text-purple-400",
      iconBg: "bg-purple-500/20",
      description: `${stats?.activeWarehouses || 0} active`
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
      <Head title="Inventory Dashboard" />

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
                Inventory Dashboard
              </h1>
              <p className="mt-1 text-sm text-default-500">
                Overview of inventory levels and warehouse performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={<ClockIcon className="w-4 h-4" />}
                onClick={() => setSelectedPeriod(selectedPeriod === 'month' ? 'year' : 'month')}
              >
                {selectedPeriod === 'month' ? 'This Month' : 'This Year'}
              </Button>
              {hasPermission('inventory.reports.view') && (
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => safeNavigate('inventory.reports.index')}
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
          {/* Low Stock Alert */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="transition-all duration-200" style={getCardStyle()}>
              <CardHeader style={getCardHeaderStyle()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                    <h3 className="text-lg font-semibold">Low Stock Alert</h3>
                  </div>
                  <Chip size="sm" variant="flat" color="warning">
                    {lowStockItems?.length || 0} Items
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                {lowStockItems && lowStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 5).map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning/20">
                            <CubeIcon className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name || 'Product Name'}</p>
                            <p className="text-xs text-default-500">
                              SKU: {item.sku || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-warning">{item.stock || 0} units</p>
                          <p className="text-xs text-default-500">Min: {item.minStock || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-2" />
                    <p className="text-default-500">All items are well stocked</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Warehouse Usage */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="transition-all duration-200" style={getCardStyle()}>
              <CardHeader style={getCardHeaderStyle()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BuildingStorefrontIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Warehouse Usage</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    onClick={() => safeNavigate('inventory.warehouses.index')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {warehouseUsage && warehouseUsage.length > 0 ? (
                    warehouseUsage.slice(0, 4).map((warehouse, index) => (
                      <div key={warehouse.id || index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{warehouse.name || `Warehouse ${index + 1}`}</span>
                          <span className="text-sm text-default-500">
                            {warehouse.usage || 0}% full
                          </span>
                        </div>
                        <Progress 
                          value={warehouse.usage || 0}
                          color={warehouse.usage >= 90 ? "danger" : warehouse.usage >= 70 ? "warning" : "success"}
                          size="sm"
                          className="max-w-full"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BuildingStorefrontIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                      <p className="text-default-500">No warehouse data available</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Recent Stock Movements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="transition-all duration-200" style={getCardStyle()}>
            <CardHeader style={getCardHeaderStyle()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Recent Stock Movements</h3>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onClick={() => safeNavigate('inventory.movements.index')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {recentMovements && recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {recentMovements.slice(0, 5).map((movement, index) => (
                    <div
                      key={movement.id || index}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          movement.type === 'in' ? 'bg-success/20' : 
                          movement.type === 'out' ? 'bg-danger/20' : 
                          'bg-primary/20'
                        }`}>
                          {movement.type === 'in' ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
                          ) : movement.type === 'out' ? (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
                          ) : (
                            <TruckIcon className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{movement.item || 'Item Name'}</p>
                          <p className="text-xs text-default-500">
                            {movement.warehouse || 'Warehouse'} • {movement.date || 'Today'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movement.type === 'in' ? 'text-success' : 
                          movement.type === 'out' ? 'text-danger' : 
                          'text-foreground'
                        }`}>
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}
                          {movement.quantity || 0}
                        </p>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={
                            movement.type === 'in' ? 'success' : 
                            movement.type === 'out' ? 'danger' : 
                            'primary'
                          }
                        >
                          {movement.type === 'in' ? 'Stock In' : 
                           movement.type === 'out' ? 'Stock Out' : 
                           'Transfer'}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TruckIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                  <p className="text-default-500">No recent movements</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* Top Products by Value */}
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
                  <ChartBarIcon className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-semibold">Top Products by Value</h3>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onClick={() => safeNavigate('inventory.items.index')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {topProducts?.items && topProducts.items.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.items.slice(0, 5).map((product, index) => (
                    <div
                      key={product.id || index}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/20 text-success font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name || 'Product Name'}</p>
                          <p className="text-xs text-default-500">
                            {product.stock || 0} units in stock
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          ${product.value?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-default-500">
                          ${product.unitPrice || 0}/unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ArchiveBoxIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                  <p className="text-default-500">No product data available</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </App>
  );
};

export default InventoryDashboard;
