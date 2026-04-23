import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from "@inertiajs/react";
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  CardHeader,
  Pagination,
  Button,
  Tabs,
  Tab,
  Chip,
  Spinner,
  Skeleton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  InboxIcon,
  ArrowPathIcon,
  UserPlusIcon,
  UserMinusIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ShieldExclamationIcon,
  BanknotesIcon,
  HeartIcon,
  GiftIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StandardPageLayout from "@/Layouts/StandardPageLayout.jsx";
import StatsCards from "@/Components/UI/StatsCards";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';

const NotificationsIndex = () => {
  const { title } = usePage().props;
  const { hasAccess, canUpdate, canDelete, isSuperAdmin } = useHRMAC();

  // Permissions using HRMAC
  // TODO: Update with correct HRMAC path once module hierarchy is defined for Core
  const canViewNotifications = hasAccess("core.notifications") || isSuperAdmin();
  const canMarkAsRead = canUpdate("core.notifications") || isSuperAdmin();
  const canDeleteNotification = canDelete("core.notifications") || isSuperAdmin();
  const themeRadius = useThemeRadius();
  
  // Manual responsive state management (HRMAC pattern)
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/notifications/list', {
        params: {
          page,
          per_page: pagination.perPage,
          filter
        }
      });
      
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unread_count || 0);
      setPagination(prev => ({
        ...prev,
        currentPage: response.data.meta?.current_page || page,
        lastPage: response.data.meta?.last_page || 1,
        total: response.data.meta?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.perPage]);

  useEffect(() => {
    fetchNotifications(1);
  }, [filter]);

  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  const handleMarkAsRead = async (id) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`/notifications/${id}/read`);
        setUnreadCount(response.data.unread_count);
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
        resolve(['Notification marked as read']);
      } catch (error) {
        reject(['Failed to mark notification as read']);
      }
    });

    showToast.promise(promise, {
      loading: 'Marking as read...',
      success: (data) => data.join(', '),
      error: (data) => data.join(', ')
    });
  };

  const handleMarkAllAsRead = async () => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        await axios.post('/notifications/read-all');
        setUnreadCount(0);
        setNotifications(prev => 
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
        resolve(['All notifications marked as read']);
      } catch (error) {
        reject(['Failed to mark all as read']);
      }
    });

    showToast.promise(promise, {
      loading: 'Marking all as read...',
      success: (data) => data.join(', '),
      error: (data) => data.join(', ')
    });
  };

  const handleDelete = async (id) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`/notifications/${id}`);
        setNotifications(prev => prev.filter(n => n.id !== id));
        resolve(['Notification deleted']);
      } catch (error) {
        reject(['Failed to delete notification']);
      }
    });

    showToast.promise(promise, {
      loading: 'Deleting...',
      success: (data) => data.join(', '),
      error: (data) => data.join(', ')
    });
  };

  const getNotificationIcon = (notification) => {
    const type = notification.data?.type || notification.type || 'info';
    const event = notification.data?.event || notification.data?.category || '';
    
    // HRM-specific event icons
    if (event) {
      const eventLower = event.toLowerCase();
      
      // Employee events
      if (eventLower.includes('employee.created') || eventLower.includes('welcome')) {
        return UserPlusIcon;
      }
      if (eventLower.includes('employee.terminated') || eventLower.includes('resigned') || eventLower.includes('offboarding')) {
        return UserMinusIcon;
      }
      if (eventLower.includes('employee.promoted') || eventLower.includes('promotion')) {
        return ArrowTrendingUpIcon;
      }
      if (eventLower.includes('employee.transferred') || eventLower.includes('transfer')) {
        return BuildingOfficeIcon;
      }
      
      // Leave events
      if (eventLower.includes('leave.approved')) {
        return CheckCircleIcon;
      }
      if (eventLower.includes('leave.rejected')) {
        return ExclamationCircleIcon;
      }
      if (eventLower.includes('leave')) {
        return CalendarDaysIcon;
      }
      
      // Attendance events
      if (eventLower.includes('attendance') || eventLower.includes('late') || eventLower.includes('absent')) {
        return ClockIcon;
      }
      
      // Training events
      if (eventLower.includes('training')) {
        return AcademicCapIcon;
      }
      
      // Safety events
      if (eventLower.includes('safety') || eventLower.includes('incident')) {
        return ShieldExclamationIcon;
      }
      
      // Payroll events
      if (eventLower.includes('payroll') || eventLower.includes('payslip') || eventLower.includes('salary')) {
        return BanknotesIcon;
      }
      
      // Document events
      if (eventLower.includes('document') || eventLower.includes('contract')) {
        return DocumentTextIcon;
      }
      
      // Birthday/Anniversary events
      if (eventLower.includes('birthday')) {
        return GiftIcon;
      }
      if (eventLower.includes('anniversary')) {
        return HeartIcon;
      }
      
      // Onboarding events
      if (eventLower.includes('onboarding')) {
        return UserPlusIcon;
      }
    }
    
    // Fallback to default icon
    return BellIcon;
  };

  const getNotificationColor = (notification) => {
    const type = notification.data?.type || notification.type || 'info';
    const event = notification.data?.event || notification.data?.category || '';
    
    // Event-based colors
    if (event) {
      const eventLower = event.toLowerCase();
      
      if (eventLower.includes('approved') || eventLower.includes('success') || eventLower.includes('promoted') || eventLower.includes('payroll')) {
        return 'success';
      }
      if (eventLower.includes('rejected') || eventLower.includes('terminated') || eventLower.includes('resigned') || eventLower.includes('incident') || eventLower.includes('safety')) {
        return 'danger';
      }
      if (eventLower.includes('late') || eventLower.includes('absent') || eventLower.includes('warning') || eventLower.includes('reminder')) {
        return 'warning';
      }
    }
    
    // Type-based colors (fallback)
    const colors = {
      'success': 'success',
      'warning': 'warning',
      'error': 'danger',
      'danger': 'danger',
      'info': 'primary'
    };
    return colors[type] || 'default';
  };

  // Action buttons
  const actionButtons = [
    <Button
      key="refresh"
      variant="flat"
      startContent={<ArrowPathIcon className="w-4 h-4" />}
      onPress={() => fetchNotifications(pagination.currentPage)}
      isLoading={loading}
      size={isMobile ? "sm" : "md"}
    >
      Refresh
    </Button>
  ];

  if (unreadCount > 0) {
    actionButtons.push(
      <Button
        key="markall"
        variant="flat"
        color="primary"
        startContent={<CheckIcon className="w-4 h-4" />}
        onPress={handleMarkAllAsRead}
        size={isMobile ? "sm" : "md"}
      >
        Mark All Read
      </Button>
    );
  }

  const statsData = [
    {
      title: 'Total Notifications',
      value: pagination.total?.toString() || '0',
      icon: BellIcon,
      color: 'primary'
    },
    {
      title: 'Unread',
      value: unreadCount?.toString() || '0',
      icon: InboxIcon,
      color: 'warning'
    },
    {
      title: 'Read',
      value: ((pagination.total || 0) - (unreadCount || 0)).toString(),
      icon: CheckCircleIcon,
      color: 'success'
    }
  ];

  return (
    <>
      <Head title={title} />
      
      <StandardPageLayout
        ariaLabel="Notifications Management"
        title="Notifications"
        subtitle="View and manage your notifications"
        icon={BellIcon}
        actions={<div className="flex items-center gap-2">{actionButtons}</div>}
        stats={<StatsCards stats={statsData} isLoading={loading} />}
        filters={
          <Tabs 
            selectedKey={filter} 
            onSelectionChange={setFilter}
            variant="underlined"
            color="primary"
            size={isMobile ? "sm" : "md"}
          >
            <Tab key="all" title="All" />
            <Tab 
              key="unread" 
              title={
                <div className="flex items-center gap-2">
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <Chip size="sm" color="warning" variant="flat">
                      {unreadCount}
                    </Chip>
                  )}
                </div>
              }
            />
            <Tab key="read" title="Read" />
          </Tabs>
        }
      >
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border border-divider rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-default-400">
            <InboxIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">All notifications have been reviewed.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification);
                const colorClass = getNotificationColor(notification);
                const isUnread = !notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 p-4 border rounded-lg transition-colors ${
                      isUnread 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-divider bg-content1'
                    }`}
                  >
                    <div className={`shrink-0 p-2 rounded-full ${
                      isUnread ? `bg-${colorClass}/10` : 'bg-default-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isUnread ? `text-${colorClass}` : 'text-default-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                            {notification.data?.title || 'Notification'}
                          </p>
                          <p className="text-sm text-default-500 mt-1">
                            {notification.data?.message || notification.data?.body || ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-default-400 whitespace-nowrap">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Notification actions">
                              {isUnread && (
                                <DropdownItem
                                  key="read"
                                  startContent={<CheckIcon className="w-4 h-4" />}
                                  onPress={() => handleMarkAsRead(notification.id)}
                                >
                                  Mark as read
                                </DropdownItem>
                              )}
                              <DropdownItem
                                key="delete"
                                color="danger"
                                className="text-danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleDelete(notification.id)}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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

NotificationsIndex.layout = (page) => <App children={page} />;

export default NotificationsIndex;
